from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date
from .models import AMCContract, AMCStatus, AMCCycle
from .serializers import AMCContractSerializer


class AMCContractViewSet(viewsets.ModelViewSet):
    queryset = AMCContract.objects.all().order_by('-updated_at', '-created_at')
    serializer_class = AMCContractSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = ['customer', 'support_coordinator', 'status', 'amc_type', 'payment_frequency']
    search_fields = ['contract_id', 'customer__company_name', 'customer__name', 'product', 'project_name']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'annual_value', 'status']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        for amc in queryset[:50]:
            amc.sync_active_cycle_data()
            if amc.service_requests.count() == 0:
                amc.generate_schedule()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.sync_active_cycle_data()
        if instance.service_requests.count() == 0:
            instance.generate_schedule()
            instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        amc = self.get_object()
        if amc.status == AMCStatus.INACTIVE:
            amc.status = AMCStatus.ACTIVE
            for c in amc.cycles.all():
                if c.status == AMCStatus.INACTIVE:
                    c.status = AMCStatus.ACTIVE
                    c.save(update_fields=['status'])
        else:
            amc.status = AMCStatus.INACTIVE
            for c in amc.cycles.all():
                c.status = AMCStatus.INACTIVE
                c.save(update_fields=['status'])
        amc.save()
        amc.sync_active_cycle_data()
        serializer = self.get_serializer(amc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='renew')
    def renew_contract(self, request, pk=None):
        amc = self.get_object()
        new_start_date = request.data.get("new_start_date")
        new_end_date = request.data.get("new_end_date")
        new_annual_value = request.data.get("new_annual_value", amc.annual_value)
        payment_frequency = request.data.get("payment_frequency", amc.payment_frequency)
        remarks = request.data.get("remarks", "")

        if not new_start_date or not new_end_date:
            return Response(
                {"error": "Both new_start_date and new_end_date are required for renewal."},
                status=status.HTTP_400_BAD_REQUEST
            )

        start_date_obj = parse_date(str(new_start_date)) if isinstance(new_start_date, str) else new_start_date
        end_date_obj = parse_date(str(new_end_date)) if isinstance(new_end_date, str) else new_end_date

        if not start_date_obj or not end_date_obj:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        today = timezone.now().date()
        if start_date_obj > today:
            cycle_status = AMCStatus.SCHEDULED
        elif (end_date_obj - today).days <= 30 and end_date_obj >= today:
            cycle_status = AMCStatus.EXPIRING_SOON
        elif end_date_obj < today:
            cycle_status = AMCStatus.EXPIRED
        else:
            cycle_status = AMCStatus.ACTIVE

        with transaction.atomic():
            last_cycle = amc.cycles.order_by('-cycle_number').first()
            next_cycle_num = (last_cycle.cycle_number + 1) if last_cycle else 1

            AMCCycle.objects.create(
                amc_contract=amc,
                cycle_number=next_cycle_num,
                start_date=start_date_obj,
                end_date=end_date_obj,
                annual_value=new_annual_value,
                payment_frequency=payment_frequency,
                status=cycle_status,
                remarks=remarks,
                created_by=request.user if request.user.is_authenticated else None
            )

            amc.sync_active_cycle_data()

        serializer = self.get_serializer(amc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='assign-technician')
    def assign_technician(self, request, pk=None):
        amc = self.get_object()
        technician_id = request.data.get("technician_id")
        if technician_id is None:
            amc.assigned_technician = None
        else:
            from service_management.models import Technician
            try:
                tech = Technician.objects.get(pk=technician_id)
                amc.assigned_technician = tech
            except Technician.DoesNotExist:
                return Response({"error": "Technician not found"}, status=status.HTTP_404_NOT_FOUND)

        amc.save(update_fields=['assigned_technician', 'updated_at'])
        serializer = self.get_serializer(amc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='generate-warranty-services')
    def generate_warranty_services_action(self, request, pk=None):
        amc = self.get_object()
        services = amc.generate_warranty_services()
        from service_management.serializers import ServiceRequestSerializer
        return Response({
            "message": f"Generated {len(services)} quarterly warranty services.",
            "services": ServiceRequestSerializer(services, many=True).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='assign-defaults')
    def assign_defaults(self, request, pk=None):
        amc = self.get_object()
        technician_id = request.data.get("technician_id")
        contact = request.data.get("default_customer_contact", amc.default_customer_contact)
        address = request.data.get("default_customer_address", amc.default_customer_address)
        gps = request.data.get("default_gps_location", amc.default_gps_location)
        work_desc = request.data.get("default_work_description", amc.default_work_description)

        if technician_id is not None:
            if technician_id == "" or technician_id is None:
                amc.assigned_technician = None
            else:
                from service_management.models import Technician
                try:
                    tech = Technician.objects.get(pk=technician_id)
                    amc.assigned_technician = tech
                except Technician.DoesNotExist:
                    return Response({"error": "Technician not found"}, status=status.HTTP_404_NOT_FOUND)

        amc.default_customer_contact = contact
        amc.default_customer_address = address
        amc.default_gps_location = gps
        amc.default_work_description = work_desc
        amc.save()

        # Sync default assigned technician & work description to unallocated service visits
        pending_services = amc.service_requests.filter(is_allocated=False)
        for srv in pending_services:
            srv.assigned_technician = amc.assigned_technician
            if work_desc:
                srv.description = work_desc
            srv.save()

        serializer = self.get_serializer(amc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='generate-schedule')
    def generate_schedule_action(self, request, pk=None):
        amc = self.get_object()
        services = amc.generate_schedule()
        from service_management.serializers import ServiceRequestSerializer
        return Response({
            "message": f"Generated/Synced {len(services)} service visits.",
            "services": ServiceRequestSerializer(services, many=True).data,
            "per_visit_amount": float(amc.per_visit_amount)
        }, status=status.HTTP_200_OK)





# ============================================================================
# NEW VIEWSETS FOR SERVICE SCHEDULES, VISITS, AND RENEWALS
# ============================================================================

from .models import AMCServiceSchedule, AMCServiceVisit, AMCRenewal
from .serializers import (
    AMCServiceScheduleSerializer,
    AMCServiceVisitSerializer,
    AMCRenewalSerializer,
    AMCDashboardStatsSerializer,
    CalendarEventSerializer
)
from datetime import timedelta


class AMCServiceScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for AMC Service Schedules (planned dates)"""
    queryset = AMCServiceSchedule.objects.all().select_related('amc_contract', 'approved_by')
    serializer_class = AMCServiceScheduleSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = ['amc_contract', 'is_completed', 'is_approved', 'reminder_sent']
    search_fields = ['amc_contract__contract_id']
    ordering_fields = ['service_date', 'created_at']
    ordering = ['service_date']
    
    @action(detail=True, methods=['post'], url_path='approve')
    def approve_schedule(self, request, pk=None):
        """Approve a scheduled service"""
        schedule = self.get_object()
        schedule.is_approved = True
        schedule.approved_at = timezone.now()
        schedule.approved_by = request.user
        schedule.save()
        
        serializer = self.get_serializer(schedule)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AMCServiceVisitViewSet(viewsets.ModelViewSet):
    """ViewSet for AMC Service Visits (actual visits with allocation)"""
    queryset = AMCServiceVisit.objects.all().select_related(
        'amc_contract', 'product', 'crm_service'
    ).prefetch_related('technicians')
    serializer_class = AMCServiceVisitSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = ['amc_contract', 'allocation_status', 'product', 'auto_allocation_done']
    search_fields = ['amc_contract__contract_id', 'product__name']
    ordering_fields = ['service_date', 'created_at']
    ordering = ['-service_date']
    
    @action(detail=True, methods=['post'], url_path='allocate-work')
    def allocate_work(self, request, pk=None):
        """
        Allocate service visit to technicians and create CRM service request.
        Similar to old code's "Allocate Work" button functionality.
        """
        visit = self.get_object()
        amc = visit.amc_contract
        
        # Check if already allocated
        if visit.allocation_status == 'ALLOCATED':
            return Response(
                {'error': 'Work already allocated for this visit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if schedule is approved
        schedule = AMCServiceSchedule.objects.filter(
            amc_contract=amc,
            service_date=visit.service_date
        ).first()
        
        if schedule and not schedule.is_approved:
            return Response(
                {'error': 'Service schedule not yet approved by admin'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check technicians assigned
        if not visit.technicians.exists():
            return Response(
                {'error': 'Please assign technicians before allocating work'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create CRM Service Request
        from service_management.models import ServiceRequest, ServiceType, ServiceStatus, ServicePriority
        
        service = ServiceRequest.objects.create(
            service_type=ServiceType.AMC,
            amc_contract=amc,
            customer=amc.customer,
            product_name=visit.product.name if visit.product else amc.product,
            title=f"AMC Visit - {visit.service_date}",
            description=amc.default_work_description or f"Scheduled AMC service visit under contract {amc.contract_id}",
            priority=ServicePriority.MEDIUM,
            status=ServiceStatus.ASSIGNED,
            scheduled_date=visit.service_date,
            service_cost=amc.per_visit_amount,
            created_by=request.user,
            is_allocated=True
        )
        
        # Assign technicians to service
        service.assigned_technicians.set(visit.technicians.all())
        
        # Update visit
        visit.crm_service = service
        visit.crm_service_created_at = timezone.now()
        visit.allocation_status = 'ALLOCATED'
        visit.save()
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='reschedule')
    def reschedule_visit(self, request, pk=None):
        """Reschedule a service visit"""
        visit = self.get_object()
        new_date = request.data.get('new_date')
        reason = request.data.get('reason', '')
        
        if not new_date:
            return Response(
                {'error': 'new_date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_date = visit.service_date
        visit.rescheduled_from = old_date
        visit.service_date = new_date
        visit.reschedule_reason = reason
        
        # Reset allocation if already allocated
        if visit.crm_service:
            visit.crm_service = None
            visit.crm_service_created_at = None
            visit.allocation_status = 'PENDING'
        
        visit.save()
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='assign-technicians')
    def assign_technicians(self, request, pk=None):
        """Assign technicians to a visit"""
        visit = self.get_object()
        technician_ids = request.data.get('technician_ids', [])
        
        if not technician_ids:
            return Response(
                {'error': 'technician_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from service_management.models import Technician
        technicians = Technician.objects.filter(id__in=technician_ids)
        visit.technicians.set(technicians)
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AMCRenewalViewSet(viewsets.ModelViewSet):
    """ViewSet for AMC Renewal Requests"""
    queryset = AMCRenewal.objects.all().select_related(
        'amc_contract', 'admin_action_by', 'new_cycle'
    )
    serializer_class = AMCRenewalSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = ['amc_contract', 'status']
    search_fields = ['amc_contract__contract_id']
    ordering_fields = ['created_at', 'customer_requested_at']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'], url_path='approve')
    def approve_renewal(self, request, pk=None):
        """Approve renewal request and create new cycle"""
        renewal = self.get_object()
        amc = renewal.amc_contract
        
        if renewal.status == 'APPROVED':
            return Response(
                {'error': 'Renewal already approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get renewal details from request
        new_start_date = request.data.get('new_start_date', amc.end_date + timedelta(days=1))
        new_end_date = request.data.get('new_end_date')
        new_annual_value = request.data.get('new_annual_value', amc.annual_value)
        payment_frequency = request.data.get('payment_frequency', amc.payment_frequency)
        admin_notes = request.data.get('admin_notes', '')
        
        if not new_end_date:
            # Default: 1 year from start
            new_end_date = new_start_date + timedelta(days=365)
        
        # Create new cycle
        last_cycle = amc.cycles.order_by('-cycle_number').first()
        next_cycle_num = (last_cycle.cycle_number + 1) if last_cycle else 1
        
        new_cycle = AMCCycle.objects.create(
            amc_contract=amc,
            cycle_number=next_cycle_num,
            start_date=new_start_date,
            end_date=new_end_date,
            annual_value=new_annual_value,
            payment_frequency=payment_frequency,
            status='SCHEDULED',
            remarks=f'Renewed from Cycle #{last_cycle.cycle_number if last_cycle else 0}',
            created_by=request.user
        )
        
        # Update renewal record
        renewal.status = 'APPROVED'
        renewal.admin_action_by = request.user
        renewal.admin_action_at = timezone.now()
        renewal.admin_notes = admin_notes
        renewal.new_cycle = new_cycle
        renewal.save()
        
        # Sync contract data
        amc.sync_active_cycle_data()
        amc.generate_schedule()
        
        serializer = self.get_serializer(renewal)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='reject')
    def reject_renewal(self, request, pk=None):
        """Reject renewal request"""
        renewal = self.get_object()
        admin_notes = request.data.get('admin_notes', '')
        
        renewal.status = 'REJECTED'
        renewal.admin_action_by = request.user
        renewal.admin_action_at = timezone.now()
        renewal.admin_notes = admin_notes
        renewal.save()
        
        serializer = self.get_serializer(renewal)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================================
# DASHBOARD & ANALYTICS
# ============================================================================

from rest_framework.views import APIView


class AMCDashboardView(APIView):
    """Dashboard statistics for AMC management"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        next_15_days = today + timedelta(days=15)
        week_from_now = today + timedelta(days=7)

        # Contract stats
        total_contracts = AMCContract.objects.count()
        active_contracts = AMCContract.objects.filter(status='active').count()

        expiring_soon = AMCContract.objects.filter(
            end_date__lte=next_15_days,
            end_date__gte=today
        ).count()

        expired_contracts = AMCContract.objects.filter(status='expired').count()

        # Renewal stats
        from .models import AMCRenewal
        renewal_requests_pending = AMCContract.objects.filter(
            renewal_status__in=['requested', 'pending']
        ).count() + AMCRenewal.objects.filter(status='REQUESTED').count()

        # Visit stats from ServiceRequest & AMCServiceVisit
        from service_management.models import ServiceRequest
        from .models import AMCServiceVisit

        upcoming_sr = ServiceRequest.objects.filter(
            amc_contract__isnull=False,
            scheduled_date__range=(today, next_15_days),
            is_allocated=False
        ).count()
        upcoming_sv = AMCServiceVisit.objects.filter(
            service_date__range=(today, next_15_days),
            allocation_status='PENDING'
        ).count()
        upcoming_visits_count = upcoming_sr + upcoming_sv

        sr_today = ServiceRequest.objects.filter(amc_contract__isnull=False, scheduled_date=today).count()
        sv_today = AMCServiceVisit.objects.filter(service_date=today).count()
        visits_today = sr_today + sv_today

        sr_week = ServiceRequest.objects.filter(
            amc_contract__isnull=False,
            scheduled_date__range=(today, week_from_now)
        ).count()
        sv_week = AMCServiceVisit.objects.filter(
            service_date__range=(today, week_from_now)
        ).count()
        visits_this_week = sr_week + sv_week

        stats = {
            'total_contracts': total_contracts,
            'active_contracts': active_contracts,
            'expiring_soon': expiring_soon,
            'expired_contracts': expired_contracts,
            'renewal_requests_pending': renewal_requests_pending,
            'upcoming_visits_count': upcoming_visits_count,
            'visits_today': visits_today,
            'visits_this_week': visits_this_week,
        }

        serializer = AMCDashboardStatsSerializer(stats)
        return Response(serializer.data)


class AMCCalendarEventsView(APIView):
    """Calendar events for AMC system"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        def get_cust_name(cust):
            if not cust:
                return "Customer"
            return getattr(cust, 'name', None) or getattr(cust, 'company_name', None) or "Customer"

        events = []
        try:
            from service_management.models import ServiceRequest
            from .models import AMCServiceVisit

            # 1. Scheduled service visits & allocated visits from ServiceRequest
            srs = ServiceRequest.objects.filter(amc_contract__isnull=False).select_related('amc_contract', 'amc_contract__customer', 'customer')
            for sr in srs:
                if sr.scheduled_date:
                    cust_name = get_cust_name(sr.customer or (sr.amc_contract.customer if sr.amc_contract else None))
                    contract_code = sr.amc_contract.contract_id if sr.amc_contract else "AMC-000"
                    product = sr.product_name or (sr.amc_contract.product if sr.amc_contract else "Service")

                    if sr.is_allocated:
                        color = '#10b981'  # Emerald Green for allocated visit
                        type_title = f"Service Visit | {cust_name}"
                        type_str = "Service Visit"
                    else:
                        color = '#3b82f6'  # Blue for scheduled visit
                        type_title = f"Scheduled Service | {cust_name}"
                        type_str = "Scheduled Service"

                    events.append({
                        'title': type_title,
                        'start': sr.scheduled_date.isoformat(),
                        'backgroundColor': color,
                        'borderColor': color,
                        'extendedProps': {
                            'type': type_str,
                            'contract': contract_code,
                            'contract_id_pk': sr.amc_contract.id if sr.amc_contract else None,
                            'customer': cust_name,
                            'product': product,
                            'status': sr.status,
                            'service_id': sr.id,
                        }
                    })

            # 2. AMC Service Visits from AMCServiceVisit (if any)
            visits = AMCServiceVisit.objects.select_related('amc_contract', 'amc_contract__customer', 'product').all()
            for visit in visits:
                cust_name = get_cust_name(visit.amc_contract.customer if visit.amc_contract else None)
                product = visit.product.name if visit.product else (visit.amc_contract.product if visit.amc_contract else "Service")

                color = '#3b82f6'  # Default blue
                if visit.allocation_status == 'ALLOCATED':
                    color = '#10b981'  # Green
                elif visit.allocation_status == 'COMPLETED':
                    color = '#6c757d'  # Gray
                elif visit.allocation_status == 'CANCELLED':
                    color = '#ef4444'  # Red
                elif visit.allocation_status == 'IN_PROGRESS':
                    color = '#f59e0b'  # Amber

                events.append({
                    'title': f"Service Visit | {cust_name}",
                    'start': visit.service_date.isoformat(),
                    'backgroundColor': color,
                    'borderColor': color,
                    'extendedProps': {
                        'type': 'Service Visit',
                        'contract': visit.amc_contract.contract_id if visit.amc_contract else "AMC-000",
                        'contract_id_pk': visit.amc_contract.id if visit.amc_contract else None,
                        'customer': cust_name,
                        'product': product,
                        'status': visit.allocation_status,
                        'visit_id': visit.id,
                    }
                })

            # 3. AMC Expiry Dates from AMCContract
            active_amcs = AMCContract.objects.select_related('customer').filter(end_date__isnull=False)
            for amc in active_amcs:
                cust_name = get_cust_name(amc.customer)
                events.append({
                    'title': f"Contract Expiry | {cust_name}",
                    'start': amc.end_date.isoformat(),
                    'backgroundColor': '#ef4444',
                    'borderColor': '#ef4444',
                    'extendedProps': {
                        'type': 'Contract Expiry',
                        'contract': amc.contract_id or "AMC-000",
                        'contract_id_pk': amc.id,
                        'customer': cust_name,
                        'product': amc.product,
                        'status': amc.status,
                        'annual_value': float(amc.annual_value) if amc.annual_value else 0,
                    }
                })

            # 4. Renewal Due dates (30 days before expiry)
            from datetime import timedelta
            today = timezone.now().date()
            expiring_soon = AMCContract.objects.select_related('customer').filter(
                end_date__gte=today,
                end_date__lte=today + timedelta(days=30),
                status__in=['active', 'expiring_soon']
            )
            for amc in expiring_soon:
                renewal_date = amc.end_date - timedelta(days=30)
                if renewal_date >= today:
                    cust_name = get_cust_name(amc.customer)
                    events.append({
                        'title': f"Renewal Due | {cust_name}",
                        'start': renewal_date.isoformat(),
                        'backgroundColor': '#f59e0b',  # Amber
                        'borderColor': '#f59e0b',
                        'extendedProps': {
                            'type': 'Renewal Due',
                            'contract': amc.contract_id or "AMC-000",
                            'contract_id_pk': amc.id,
                            'customer': cust_name,
                            'product': amc.product,
                            'status': 'renewal_due',
                            'expiry_date': amc.end_date.isoformat(),
                        }
                    })
        except Exception as e:
            print("Error generating AMC calendar events:", e)

        return Response(events)
