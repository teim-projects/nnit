from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status, filters
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from .models import Customer, lead_management, LeadFAQ, LeadFollowUp
from .serializers import CustomerSerializer, LeadSerializer, LeadFollowUpSerializer, LeadFAQSerializer
from django.db.models import Q, Case, When, Value, IntegerField
from django.utils import timezone
from .filters import LeadFilter
from rest_framework.decorators import action
from django.core.cache import cache


class CustomerViewsets(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-id')
    serializer_class = CustomerSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'name', '=email', 'secondary_email', 'contact_number',
        'poc_name', 'poc_contact_number', 'land_line_no',
        'city', 'state', 'site_city', 'site_state', 'pin_code'
    ]
    ordering_fields = ['name', 'city', 'created_at']
    ordering = ['-created_at']

    @action(detail=True, methods=['get'], url_path='leads')
    def customer_leads(self, request, pk=None):
        """Get all leads for a specific customer"""
        customer = self.get_object()
        leads = customer.leads.all().order_by('-date')
        serializer = LeadSerializer(leads, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='followup-history')
    def followup_history(self, request, pk=None):
        """Get complete followup history for all leads of this customer"""
        customer = self.get_object()
        from lead_management.models import LeadFollowUp
        followups = LeadFollowUp.objects.filter(
            lead__customer=customer
        ).select_related('lead', 'created_by').order_by('-followup_date')
        
        serializer = LeadFollowUpSerializer(followups, many=True, context={'request': request})
        return Response(serializer.data)


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_class = LeadFilter

    ordering_fields = [
        "date",
        "followup_date",
        "customer__name",
        "status",
    ]

    filterset_fields = ['assign_to', 'status', 'followup_date', 'date']
    search_fields = [
        'customer__id',
        'customer__name',
        'customer__contact_number',
        'customer__email',
        'project_name',
        'lead_source'
    ]

    def perform_create(self, serializer):
        user = self.request.user
        role_name = getattr(getattr(user, 'role', None), 'name', '').lower()

        data = {
            "creatd_by": user,
            'date': timezone.localdate()
        }

        if role_name == "sales":
            data["assign_to"] = user

        serializer.save(**data)

    def get_queryset(self):
        user = self.request.user
        today = timezone.localdate()

        queryset = (
            lead_management.objects
            .annotate(
                followup_priority=Case(
                    When(followup_date=today, then=Value(3)),
                    When(followup_date__gt=today, then=Value(2)),
                    When(followup_date__isnull=True, then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            )
            .order_by(
                "-followup_priority",
                "-followup_date",
                "-date"
            )
        )

        if getattr(user, 'role', None) and user.role.name.lower() == "sales":
            queryset = queryset.filter(assign_to=user)

        lead_source = self.request.query_params.get("lead_source")
        if lead_source:
            lead_source = lead_source.strip().lower()
            fixed_sources = self.get_serializer_class().FIXED_SOURCES

            if lead_source == "other":
                queryset = queryset.exclude(lead_source__in=fixed_sources)
            else:
                queryset = queryset.filter(lead_source=lead_source)

        return queryset

    @action(detail=False, methods=['get'], url_path='latest-lead-by-mobile')
    def latest_lead_by_mobile(self, request):
        mobile = request.query_params.get("mobile")

        if not mobile:
            return Response(
                {"error": "Mobile number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        lead = (
            lead_management.objects
            .select_related("customer")
            .filter(customer__contact_number=mobile)
            .order_by("-date", "-id")
            .first()
        )

        if not lead:
            return Response(
                {"message": "No lead found for this mobile number"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "project_name": lead.project_name,
            "address": lead.project_adderess if hasattr(lead.customer, "address") else None
        }, status=status.HTTP_200_OK)


class LeadFAQViewSet(viewsets.ModelViewSet):
    queryset = LeadFAQ.objects.all().order_by("sort_order", "id")
    serializer_class = LeadFAQSerializer
    permission_classes = [IsAuthenticated]


class LeadFollowUpViewSet(viewsets.ModelViewSet):
    """
    CRUD for follow-ups. Supports filtering by lead: ?lead=<lead_id>
    """
    serializer_class = LeadFollowUpSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lead', 'status', 'followup_date', 'created_by']
    search_fields = ['remarks', 'discussion_notes', 'lead__customer__name']
    ordering_fields = ['followup_date', 'created_at']
    ordering = ['-followup_date', '-created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = LeadFollowUp.objects.select_related(
            'lead', 'lead__customer', 'created_by'
        ).prefetch_related('faq_answers', 'faq_answers__faq')

        # Filter by user role
        if getattr(user, 'role', None) and user.role.name.lower() == "sales":
            queryset = queryset.filter(lead__assign_to=user)

        # Filter by lead if provided
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='timeline/(?P<lead_id>[^/.]+)')
    def timeline(self, request, lead_id=None):
        """Get followup timeline for a specific lead"""
        followups = self.get_queryset().filter(lead_id=lead_id).order_by('-followup_date')
        serializer = self.get_serializer(followups, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='recent')
    def recent_followups(self, request):
        """Get recent followups (last 7 days)"""
        from datetime import timedelta
        
        seven_days_ago = timezone.now().date() - timedelta(days=7)
        followups = self.get_queryset().filter(
            followup_date__gte=seven_days_ago
        ).order_by('-followup_date')[:50]
        
        serializer = self.get_serializer(followups, many=True)
        return Response(serializer.data)