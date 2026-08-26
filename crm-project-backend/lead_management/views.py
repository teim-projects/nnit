from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.permissions import HasModulePermission
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
    module_key = 'customers'
    serializer_class = CustomerSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasModulePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'name', '=email', 'secondary_email', 'contact_number',
        'poc_name', 'poc_contact_number', 'land_line_no',
        'city', 'state', 'site_city', 'site_state', 'pin_code'
    ]
    ordering_fields = ['name', 'city', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Only return real converted customers (is_lead_only=False), identical to Customers page.
        """
        if self.action in ('retrieve', 'update', 'partial_update', 'destroy', 'customer_leads', 'followup_history'):
            return Customer.objects.all().order_by('-id')
        return Customer.objects.filter(is_lead_only=False).order_by('-id')

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request):
        """
        Search ALL customers including lead-only ones for dropdown lookups.
        """
        search = request.query_params.get('search', '').strip()
        from django.db.models import Q
        if not search:
            qs = Customer.objects.all().order_by('-id')[:100]
        else:
            qs = Customer.objects.filter(
                Q(contact_number__icontains=search) |
                Q(name__icontains=search) |
                Q(email__icontains=search)
            ).order_by('-id')[:100]

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

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

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='sample-csv')
    def sample_csv(self, request):
        from django.http import HttpResponse
        csv_content = (
            "Name,Contact Number,Email,Site Name,POC Name,POC Contact Number,City,State,Address,Pin Code\n"
            "Rajesh Kumar,9876543210,rajesh@example.com,ABC Tower Site,Suresh,9876543211,Mumbai,Maharashtra,MG Road,400001\n"
            "Priya Sharma,9123456789,priya@example.com,XYZ Complex Site,Amit,9123456780,Pune,Maharashtra,FC Road,411005\n"
        )
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="customers_sample.csv"'
        return response

    @action(detail=False, methods=['post'], url_path='import-bulk')
    def import_bulk(self, request):
        records = request.data.get('records', [])
        if not isinstance(records, list) or len(records) == 0:
            return Response({"error": "No records provided for import."}, status=status.HTTP_400_BAD_REQUEST)

        imported_count = 0
        updated_count = 0
        errors = []

        import re

        def normalize_phone(val):
            if not val:
                return ''
            s = str(val).strip()
            if s.endswith('.0'):
                s = s[:-2]
            digits = re.sub(r'[^\d]', '', s)
            if len(digits) == 12 and digits.startswith('91'):
                return digits[2:]
            return digits if digits else s

        for idx, row in enumerate(records):
            # Clean keys to remove UTF-8 BOM (\ufeff) and lower/strip whitespace
            row_map = {str(k).lstrip('\ufeff').strip().lower(): str(v).strip() for k, v in row.items() if v is not None}

            def gval(keys, default=''):
                for k in keys:
                    if k.lower() in row_map and row_map[k.lower()]:
                        return row_map[k.lower()]
                return default

            name = gval([
                'name', 'customer_name', 'customer name', 'full name', 'full_name',
                'client name', 'client_name', 'client', 'customer', 'party name',
                'party_name', 'firm_name', 'firm name', 'company', 'company_name',
                'company name', 'contact person', 'contact_person'
            ])
            raw_phone = gval([
                'contact_number', 'contact number', 'contact_no', 'contact no',
                'contact', 'phone', 'mobile', 'mobile_no', 'mobile no',
                'mobile_number', 'phone_number', 'cell', 'tel'
            ])
            phone = normalize_phone(raw_phone)
            email = gval(['email', 'email_address', 'email address', 'email_id', 'email id', 'mail'])
            site_name = gval([
                'site_name', 'site name', 'company_name', 'company name',
                'project_name', 'project name', 'site', 'location', 'site address', 'site_address'
            ])

            poc_name = gval(['poc_name', 'poc name', 'poc', 'contact_person', 'contact person'])
            name = name or site_name or poc_name or (f"Customer {phone}" if phone else "") or (f"Customer {email}" if email else "")

            if not name:
                errors.append(f"Row {idx + 1}: Row has no Name, Site Name, POC Name, Contact Number, or Email.")
                continue

            try:
                cust = None
                if phone:
                    cust = Customer.objects.filter(contact_number=phone).first()

                if not cust and email:
                    cust = Customer.objects.filter(email__iexact=email).first()

                if cust:
                    # Update existing customer record without overwriting name if set
                    if not cust.name and name: cust.name = name
                    if phone: cust.contact_number = phone
                    if email: cust.email = email
                    if site_name and not cust.site_address: cust.site_address = site_name
                    cust.poc_name = gval(['poc_name', 'poc name', 'poc', 'contact_person', 'contact person']) or cust.poc_name or None
                    cust.city = gval(['city', 'site_city', 'site city', 'town']) or cust.city or ''
                    cust.state = gval(['state', 'site_state', 'site state']) or cust.state or ''
                    cust.is_lead_only = False
                    cust.save()
                    updated_count += 1
                else:
                    # Create new Customer (contact_number is None if empty to allow SQL NULL in unique constraint)
                    Customer.objects.create(
                        name=name or site_name,
                        contact_number=phone if phone else None,
                        email=email or None,
                        site_address=site_name or None,
                        poc_name=gval(['poc_name', 'poc name', 'poc', 'contact_person', 'contact person']) or None,
                        poc_contact_number=normalize_phone(gval(['poc_contact_number', 'poc contact number', 'poc contact', 'poc_phone', 'poc mobile'])) or None,
                        city=gval(['city', 'site_city', 'site city', 'town']),
                        state=gval(['state', 'site_state', 'site state']),
                        address=gval(['address', 'site address', 'street', 'billing address']),
                        pin_code=gval(['pin_code', 'pin code', 'pincode', 'zip', 'zip_code', 'zip code']) or None,
                        is_lead_only=False
                    )
                    imported_count += 1
            except Exception as e:
                errors.append(f"Row {idx + 1} ({name or site_name}): {str(e)}")

        return Response({
            "imported_count": imported_count,
            "updated_count": updated_count,
            "error_count": len(errors),
            "errors": errors
        }, status=status.HTTP_200_OK)



from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


class LeadViewSet(viewsets.ModelViewSet):
    module_key = 'leads'
    serializer_class = LeadSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasModulePermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
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

    def perform_update(self, serializer):
        """
        Explicit partial update — passes partial=True so missing fields
        are not treated as required. Also catches Django ValidationError
        from model.clean() and converts it to a DRF-friendly 400 response.
        """
        from django.core.exceptions import ValidationError as DjangoValidationError
        from rest_framework.exceptions import ValidationError as DRFValidationError
        try:
            serializer.save()
        except DjangoValidationError as exc:
            raise DRFValidationError(detail=exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete lead and return 204."""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch', 'post'], url_path='upload-cad')
    def upload_cad(self, request, pk=None):
        lead = self.get_object()
        cad_file = request.FILES.get('cad_file')
        if not cad_file:
            return Response({'error': 'No file provided under key "cad_file"'}, status=status.HTTP_400_BAD_REQUEST)
        
        lead.cad_file = cad_file
        lead.cad_file_name = cad_file.name
        lead.save()

        serializer = self.get_serializer(lead, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['patch', 'post'], url_path='send-to-designer')
    def send_to_designer(self, request, pk=None):
        lead = self.get_object()
        data = request.data

        project_name = data.get('project_name') or data.get('projectName')
        site_location = data.get('site_location') or data.get('location') or data.get('project_adderess')
        site_requirement = data.get('site_requirement') or data.get('requirements_details') or data.get('requirements')
        customer_layout_url = data.get('customer_layout_url') or data.get('customerLayoutUrl') or data.get('drawingUrl')
        customer_layout_name = data.get('customer_layout_name') or data.get('customerLayoutName') or data.get('fileName')

        if request.FILES.get('customer_layout'):
            layout_file = request.FILES.get('customer_layout')
            lead.customer_layout = layout_file
            lead.customer_layout_name = layout_file.name
        elif request.FILES.get('layout_file'):
            layout_file = request.FILES.get('layout_file')
            lead.customer_layout = layout_file
            lead.customer_layout_name = layout_file.name

        if project_name:
            lead.project_name = project_name
        if site_location:
            lead.site_location = site_location
            lead.project_adderess = site_location
        if site_requirement:
            lead.site_requirement = site_requirement
            lead.requirements_details = site_requirement
        if customer_layout_url:
            lead.customer_layout_url = customer_layout_url
        if customer_layout_name:
            lead.customer_layout_name = customer_layout_name

        lead.is_sent = True
        lead.save()

        serializer = self.get_serializer(lead, context={'request': request})
        return Response(serializer.data)

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

        role_name = getattr(getattr(user, 'role', None), 'name', '').lower()
        if role_name == "sales":
            queryset = queryset.filter(assign_to=user)
        elif role_name == "designer":
            queryset = queryset.filter(
                Q(is_sent=True) |
                Q(requirements_details__isnull=False) |
                Q(company_name__isnull=False)
            )

        lead_source = self.request.query_params.get("lead_source")
        if lead_source:
            lead_source = lead_source.strip().lower()
            fixed_sources = self.get_serializer_class().FIXED_SOURCES

            if lead_source == "other":
                queryset = queryset.exclude(lead_source__in=fixed_sources)
            else:
                queryset = queryset.filter(lead_source=lead_source)

        return queryset

    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        from quotation.models import Quotation
        from parking_products.models import ParkingProduct
        from django.db.models import Count
        import calendar

        user = request.user
        role_name = getattr(getattr(user, 'role', None), 'name', '').lower()

        leads_qs = lead_management.objects.all()
        if role_name == "sales":
            leads_qs = leads_qs.filter(assign_to=user)

        today = timezone.localdate()
        total_leads = leads_qs.count()
        total_customers = Customer.objects.filter(is_lead_only=False).count()
        total_quotations = Quotation.objects.count()
        
        try:
            total_products = ParkingProduct.objects.count()
        except Exception:
            total_products = 0

        open_leads = leads_qs.filter(status='open').count()
        win_leads = leads_qs.filter(status__in=['close_win', 'closed_win', 'closed']).count()
        loss_leads = leads_qs.filter(status__in=['close_loss', 'closed_loss']).count()
        in_process_leads = leads_qs.filter(status='in_process').count()

        today_followups = leads_qs.filter(followup_date=today).exclude(status__in=['close_win', 'closed_win', 'closed', 'close_loss', 'closed_loss']).count()
        overdue_followups = leads_qs.filter(followup_date__lt=today).exclude(status__in=['close_win', 'closed_win', 'closed', 'close_loss', 'closed_loss']).count()

        # Monthly breakdown for last 6 months
        monthly = []
        for i in range(5, -1, -1):
            # calculate target month & year
            month_calc = today.month - i
            target_year = today.year
            if month_calc <= 0:
                month_calc += 12
                target_year -= 1
            
            l_count = leads_qs.filter(created_at__year=target_year, created_at__month=month_calc).count()
            c_count = Customer.objects.filter(is_lead_only=False, created_at__year=target_year, created_at__month=month_calc).count()
            q_count = Quotation.objects.filter(created_at__year=target_year, created_at__month=month_calc).count()
            
            monthly.append({
                "month": calendar.month_abbr[month_calc],
                "leads": l_count,
                "customers": c_count,
                "quotations": q_count
            })

        # Lead source breakdown
        sources_qs = leads_qs.values('lead_source').annotate(count=Count('id')).order_by('-count')[:6]
        src_data = [{"name": (item['lead_source'] or "Unknown").replace("_", " ").title(), "value": item['count']} for item in sources_qs]

        # Recent leads
        recent_qs = leads_qs.select_related('customer').order_by('-created_at')[:6]
        recent_leads = [
            {
                "id": l.id,
                "name": l.customer.name if l.customer else "Unknown",
                "date": l.created_at.strftime("%Y-%m-%d") if l.created_at else None,
                "status": l.status,
                "src": l.lead_source
            }
            for l in recent_qs
        ]

        # Avg response days
        rt = leads_qs.filter(followup_date__isnull=False, created_at__isnull=False).values('followup_date', 'created_at')
        days_list = [max(0, (item['followup_date'] - item['created_at'].date()).days) for item in rt]
        avg_response_days = round(sum(days_list) / len(days_list)) if days_list else 0

        return Response({
            "totalLeads": total_leads,
            "totalCustomers": total_customers,
            "totalQuotations": total_quotations,
            "totalProducts": total_products,
            "openLeads": open_leads,
            "closedLeads": win_leads,
            "inProcessLeads": in_process_leads,
            "lossLeads": loss_leads,
            "todayFollowups": today_followups,
            "overdueFollowups": overdue_followups,
            "avgResponseDays": avg_response_days,
            "monthly": monthly,
            "srcData": src_data,
            "recent": recent_leads
        })

    @action(detail=True, methods=['post'], url_path='convert-to-customer')
    def convert_to_customer(self, request, pk=None):
        """
        Convert a lead to a customer:
        - Sets customer.is_lead_only = False  → NOW visible in Customers page
        - Sets lead.is_converted = True
        - Sets lead.status = 'closed'
        - Sets lead.converted_at = now
        """
        lead = self.get_object()

        if lead.is_converted:
            return Response(
                {
                    "detail": "This lead is already converted to customer.",
                    "customer_id": lead.customer.id,
                    "customer_name": lead.customer.name,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        customer = lead.customer

        # Mark customer as a real customer (visible in Customers page)
        customer.is_lead_only = False
        Customer.objects.filter(pk=customer.pk).update(is_lead_only=False)

        # Mark lead as converted
        lead_management.objects.filter(pk=lead.pk).update(
            is_converted=True,
            converted_at=timezone.now(),
            status='close_win',
        )
        lead.refresh_from_db()

        return Response(
            {
                "detail": "Lead successfully converted to customer.",
                "lead_id": lead.id,
                "is_converted": lead.is_converted,
                "converted_at": lead.converted_at,
                "customer": {
                    "id": customer.id,
                    "name": customer.name,
                    "contact_number": customer.contact_number,
                    "email": customer.email,
                    "city": customer.city,
                    "state": customer.state,
                }
            },
            status=status.HTTP_200_OK
        )

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

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='sample-csv')
    def sample_csv(self, request):
        from django.http import HttpResponse
        csv_content = (
            "Customer Name,Contact Number,Email,Site Name,Lead Source,Status,Assign To,Project Name,Requirements,City,State\n"
            "Amit Patel,9823012345,amit@example.com,Patel Site Tower A,website,open,admin,Tower A Stacker Parking,Need 4 levels stacker parking,Mumbai,Maharashtra\n"
            "Sneha Deshmukh,9890123456,sneha@example.com,Deshmukh Heights Site,call,in_process,sales,Commercial VRF AC,Requires 50HP VRF AC system,Pune,Maharashtra\n"
        )
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads_sample.csv"'
        return response

    @action(detail=False, methods=['post'], url_path='import-bulk')
    def import_bulk(self, request):
        records = request.data.get('records', [])
        if not isinstance(records, list) or len(records) == 0:
            return Response({"error": "No records provided for import."}, status=status.HTTP_400_BAD_REQUEST)

        imported_count = 0
        updated_count = 0
        errors = []

        status_map = {
            'new': 'open',
            'open': 'open',
            'in_progress': 'in_process',
            'in_process': 'in_process',
            'close_win': 'close_win',
            'won': 'close_win',
            'close_loss': 'close_loss',
            'close_lost': 'close_loss',
            'lost': 'close_loss',
            'closed': 'closed'
        }

        import re

        def normalize_phone(val):
            if not val:
                return ''
            s = str(val).strip()
            if s.endswith('.0'):
                s = s[:-2]
            digits = re.sub(r'[^\d]', '', s)
            if len(digits) == 12 and digits.startswith('91'):
                return digits[2:]
            return digits if digits else s

        for idx, row in enumerate(records):
            # Clean keys to remove UTF-8 BOM (\ufeff) and lower/strip whitespace
            row_map = {str(k).lstrip('\ufeff').strip().lower(): str(v).strip() for k, v in row.items() if v is not None}

            def gval(keys, default=''):
                for k in keys:
                    if k.lower() in row_map and row_map[k.lower()]:
                        return row_map[k.lower()]
                return default

            cust_name = gval([
                'customer_name', 'customer name', 'name', 'full name', 'full_name',
                'client name', 'client_name', 'client', 'customer', 'party name',
                'party_name', 'firm_name', 'firm name', 'company', 'company_name',
                'company name', 'contact person', 'contact_person'
            ])
            raw_phone = gval([
                'contact_number', 'contact number', 'contact_no', 'contact no',
                'contact', 'phone', 'mobile', 'mobile_no', 'mobile no',
                'mobile_number', 'phone_number', 'cell', 'tel'
            ])
            phone = normalize_phone(raw_phone)
            email = gval(['email', 'email_address', 'email address', 'email_id', 'email id', 'mail'])
            site_name = gval([
                'site_name', 'site name', 'company_name', 'company name',
                'project_name', 'project name', 'site', 'location', 'site address', 'site_address'
            ])
            lead_source = gval(['lead_source', 'lead source', 'source'], 'other').lower()
            raw_status = gval(['status', 'lead status', 'stage'], 'open').lower()
            final_status = status_map.get(raw_status, 'open')
            raw_assign = gval(['assign_to', 'assign to', 'assigned_to', 'assigned to', 'sales person', 'staff'])
            project_name = gval(['project_name', 'project name', 'site_name', 'site name'])
            requirements = gval(['requirements', 'requirement', 'requirements_details', 'requirements details', 'details', 'remarks'])
            city = gval(['city', 'site_city', 'site city', 'town'])
            state = gval(['state', 'site_state', 'site state'])

            poc_name = gval(['poc_name', 'poc name', 'poc', 'contact_person', 'contact person'])
            cust_name = cust_name or site_name or poc_name or (f"Customer {phone}" if phone else "") or (f"Customer {email}" if email else "")

            if not cust_name:
                errors.append(f"Row {idx + 1}: Customer Name, Site Name, Contact Number, or Email is required.")
                continue

            try:
                # Resolve assigned user (specified in CSV or default to current importing user)
                assigned_user = request.user
                if raw_assign:
                    from django.contrib.auth import get_user_model
                    from django.db.models import Q
                    User = get_user_model()
                    found = User.objects.filter(
                        Q(email__iexact=raw_assign) |
                        Q(first_name__iexact=raw_assign) |
                        Q(last_name__iexact=raw_assign) |
                        Q(mobile_no__icontains=raw_assign)
                    ).first()
                    if found:
                        assigned_user = found

                # Find or create customer
                cust = None
                if phone:
                    cust = Customer.objects.filter(contact_number=phone).first()
                if not cust and email:
                    cust = Customer.objects.filter(email__iexact=email).first()

                if not cust:
                    cust = Customer.objects.create(
                        name=cust_name or site_name,
                        contact_number=phone if phone else None,
                        email=email or None,
                        site_address=site_name or None,
                        city=city or '',
                        state=state or '',
                        is_lead_only=True
                    )
                else:
                    # Update existing customer details if changed without overwriting existing name
                    if not cust.name and cust_name: cust.name = cust_name
                    if site_name and not cust.site_address: cust.site_address = site_name
                    if city and not cust.city: cust.city = city
                    if state and not cust.state: cust.state = state
                    cust.save()

                # Check if a lead already exists for this customer to prevent duplicate creation
                existing_lead = lead_management.objects.filter(customer=cust).order_by('-id').first()
                if existing_lead:
                    if site_name: existing_lead.company_name = site_name
                    if project_name or site_name: existing_lead.project_name = project_name or site_name
                    if requirements: existing_lead.requirements_details = requirements
                    if lead_source: existing_lead.lead_source = lead_source
                    if final_status: existing_lead.status = final_status
                    if assigned_user: existing_lead.assign_to = assigned_user
                    existing_lead.save()
                    updated_count += 1
                else:
                    # Create new lead
                    lead_management.objects.create(
                        customer=cust,
                        creatd_by=request.user,
                        assign_to=assigned_user,
                        date=timezone.localdate(),
                        company_name=site_name or '',
                        lead_source=lead_source or 'other',
                        status=final_status,
                        project_name=project_name or site_name or '',
                        requirements_details=requirements or ''
                    )
                    imported_count += 1
            except Exception as e:
                errors.append(f"Row {idx + 1} ({cust_name or site_name}): {str(e)}")

        return Response({
            "imported_count": imported_count,
            "updated_count": updated_count,
            "error_count": len(errors),
            "errors": errors
        }, status=status.HTTP_200_OK)



class LeadFAQViewSet(viewsets.ModelViewSet):
    queryset = LeadFAQ.objects.all().order_by("sort_order", "id")
    serializer_class = LeadFAQSerializer
    permission_classes = [IsAuthenticated]


class LeadFollowUpViewSet(viewsets.ModelViewSet):
    """
    CRUD for follow-ups. Supports filtering by lead: ?lead=<lead_id>
    """
    module_key = 'followups'
    serializer_class = LeadFollowUpSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasModulePermission]
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


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

import os
import re

@api_view(['POST'])
@permission_classes([AllowAny])
def send_template_email(request):
    recipient_email = request.data.get('recipient_email')
    subject = request.data.get('subject', 'Notice from NNIT Car Parking Systems')
    html_content = request.data.get('html_content', '')
    text_content = request.data.get('text_content', '')

    if not recipient_email:
        return Response({"error": "Recipient email is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'connectteim@gmail.com')
        print(f"[EMAIL DEBUG] Host: {getattr(settings, 'EMAIL_HOST', None)}, User: {getattr(settings, 'EMAIL_HOST_USER', None)}, From: {from_email}")

        final_html = html_content
        HEADER_IMAGE_URL = "https://files.catbox.moe/4i67y4.jpg"

        if not final_html or '<body' not in final_html:
            final_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{HEADER_IMAGE_URL}" alt="NNIT Car Parking Systems Header" style="width:100%; display:block; margin:0; padding:0; border:0;" />
    <div style="padding:25px; line-height:1.6; white-space:pre-wrap;">{text_content or html_content}</div>
  </div>
</body>
</html>'''

        msg = EmailMultiAlternatives(subject, text_content or "Notice from NNIT Car Parking Systems", from_email, [recipient_email])
        msg.attach_alternative(final_html, "text/html")

        sent_count = msg.send(fail_silently=False)
        print(f"[EMAIL SUCCESS] Sent to {recipient_email}, count: {sent_count}")
        return Response({"message": f"Email successfully sent to {recipient_email}"}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"[EMAIL FAILURE] Failed sending to {recipient_email}: {str(e)}")
        return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)