from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Technician, ServiceRequest, ServiceStatus, TechnicianStatus
from .serializers import TechnicianSerializer, ServiceRequestSerializer


class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all().order_by('-created_at')
    serializer_class = TechnicianSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'specialization']
    search_fields = ['technician_id', 'name', 'phone', 'email', 'specialization', 'address']
    ordering_fields = ['created_at', 'name', 'experience_years', 'status']

    @action(detail=True, methods=['get'], url_path='assigned-tasks')
    def assigned_tasks(self, request, pk=None):
        technician = self.get_object()
        services = technician.assigned_services.all().order_by('-updated_at')
        amcs = technician.assigned_amcs.all().order_by('-updated_at')
        
        service_serializer = ServiceRequestSerializer(services, many=True)
        
        amc_data = []
        for amc in amcs:
            amc_data.append({
                "id": amc.id,
                "contract_id": amc.contract_id,
                "customer_name": getattr(amc.customer, 'company_name', None) or getattr(amc.customer, 'name', None) or str(amc.customer),
                "product": amc.product,
                "amc_type": amc.get_amc_type_display(),
                "status": amc.status,
                "status_display": amc.get_status_display(),
                "end_date": amc.end_date,
            })

        return Response({
            "technician": TechnicianSerializer(technician).data,
            "services": service_serializer.data,
            "amc_contracts": amc_data,
        })


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all().order_by('-updated_at', '-created_at')
    serializer_class = ServiceRequestSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = ['service_type', 'status', 'priority', 'customer', 'amc_contract', 'assigned_technician']
    search_fields = ['service_id', 'title', 'description', 'customer__name', 'customer__company_name', 'assigned_technician__name']
    ordering_fields = ['created_at', 'scheduled_date', 'priority', 'status', 'service_cost']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Allow detail lookups (like /4/allocate/, /4/assign/, /4/) to find any service request
        if getattr(self, 'action', None) in ['retrieve', 'update', 'partial_update', 'destroy', 'assign_technician', 'allocate_work', 'update_status']:
            return queryset

        amc_contract_id = self.request.query_params.get('amc_contract')
        include_all = self.request.query_params.get('include_all')

        if amc_contract_id or include_all == 'true':
            return queryset

        # Main Services page list & standalone lookup: show service calls created directly in Service Management (amc_contract is null)
        return queryset.filter(amc_contract__isnull=True)

    @action(detail=True, methods=['post'], url_path='assign')
    def assign_technician(self, request, pk=None):
        service = self.get_object()
        technician_id = request.data.get("technician_id")

        if technician_id is None:
            service.assigned_technician = None
            service.status = ServiceStatus.UNASSIGNED
            service.assigned_at = None
        else:
            try:
                tech = Technician.objects.get(pk=technician_id)
                service.assigned_technician = tech
                service.status = ServiceStatus.ASSIGNED
                service.assigned_at = timezone.now()
                service.is_allocated = True
            except Technician.DoesNotExist:
                return Response({"error": "Technician not found"}, status=status.HTTP_404_NOT_FOUND)

        service.save()
        serializer = self.get_serializer(service)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='allocate')
    def allocate_work(self, request, pk=None):
        service = self.get_object()
        if service.is_allocated and service.status != ServiceStatus.UNASSIGNED:
            return Response(
                {"message": "Work already allocated.", "service": self.get_serializer(service).data},
                status=status.HTTP_200_OK
            )

        technician_id = request.data.get("technician_id")
        if not technician_id:
            if service.assigned_technician_id:
                technician_id = service.assigned_technician_id
            elif service.amc_contract and service.amc_contract.assigned_technician_id:
                technician_id = service.amc_contract.assigned_technician_id

        service.is_allocated = True
        if technician_id:
            try:
                tech = Technician.objects.get(pk=technician_id)
                service.assigned_technician = tech
                service.status = ServiceStatus.ASSIGNED
                service.assigned_at = timezone.now()
            except Technician.DoesNotExist:
                pass
        else:
            if service.status == ServiceStatus.UNASSIGNED:
                service.status = ServiceStatus.ASSIGNED

        if service.amc_contract:
            if service.amc_contract.default_work_description and not service.description:
                service.description = service.amc_contract.default_work_description

        service.save()
        serializer = self.get_serializer(service)
        return Response({
            "message": "Work allocated successfully.",
            "service": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        service = self.get_object()
        new_status = request.data.get("status")
        resolution_notes = request.data.get("resolution_notes", service.resolution_notes)
        before_photo = request.data.get("before_service_photo", service.before_service_photo)
        after_photo = request.data.get("after_service_photo", service.after_service_photo)
        signature = request.data.get("customer_signature", service.customer_signature)
        approval = request.data.get("customer_approval", True)

        if not new_status or new_status not in [c[0] for c in ServiceStatus.choices]:
            return Response({"error": "Invalid status value provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Require completion verification details when status is completed
        if new_status == ServiceStatus.COMPLETED:
            if not before_photo:
                return Response({"error": "Before Service Photo is required to complete work."}, status=status.HTTP_400_BAD_REQUEST)
            if not after_photo:
                return Response({"error": "After Service Photo is required to complete work."}, status=status.HTTP_400_BAD_REQUEST)
            if not signature:
                return Response({"error": "Customer Signature & Approval is required."}, status=status.HTTP_400_BAD_REQUEST)

        service.status = new_status
        service.resolution_notes = resolution_notes
        service.before_service_photo = before_photo
        service.after_service_photo = after_photo
        service.customer_signature = signature
        service.customer_approval = bool(approval)

        if new_status == ServiceStatus.COMPLETED and not service.completion_date:
            service.completion_date = timezone.now()

        service.save()
        serializer = self.get_serializer(service)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='my-tasks')
    def my_tasks(self, request):
        from django.db.models import Q
        user = request.user
        search_phone = request.query_params.get('search_phone') or request.query_params.get('search')
        tech_id_param = request.query_params.get('technician_id') or request.query_params.get('tech_id')
        task_type = request.query_params.get('type')  # 'pending' or 'completed'

        phone = getattr(user, 'mobile_no', None) or user.username or ''
        email = user.email or ''
        phone_digits = ''.join(filter(str.isdigit, str(phone)))[-10:] if phone else ''

        tech = None
        if tech_id_param:
            tech = Technician.objects.filter(id=tech_id_param).first()

        if not tech:
            query = Q()
            if phone_digits:
                query |= Q(phone__icontains=phone_digits)
            if phone:
                query |= Q(phone=phone)
            if email:
                query |= Q(email=email)
            if user.username:
                query |= Q(phone=user.username) | Q(name__icontains=user.username)

            if query:
                tech = Technician.objects.filter(query).first()

        base_qs = ServiceRequest.objects.all().select_related('customer', 'assigned_technician', 'amc_contract').order_by('-updated_at', '-id')

        # STRICT TASK FILTERING
        role_name = getattr(getattr(user, 'role', None), 'name', '').lower()
        if tech:
            queryset = base_qs.filter(assigned_technician=tech)
        elif role_name == 'technician':
            tech_query = Q()
            if phone_digits:
                tech_query |= Q(assigned_technician__phone__icontains=phone_digits)
            if phone:
                tech_query |= Q(assigned_technician__phone=phone)
            if email:
                tech_query |= Q(assigned_technician__email=email)
            if user.username:
                tech_query |= Q(assigned_technician__name__icontains=user.username)
            queryset = base_qs.filter(tech_query) if tech_query else base_qs.none()
        elif user.is_superuser or role_name == 'admin':
            queryset = base_qs
        else:
            queryset = base_qs.none()

        # Real Summary Stats & Monthly Aggregation
        total_count = queryset.count()
        completed_count = queryset.filter(status=ServiceStatus.COMPLETED).count()
        pending_count = queryset.exclude(status=ServiceStatus.COMPLETED).count()

        from django.utils import timezone
        now = timezone.now()
        monthly_trend = []
        for i in range(5, -1, -1):
            m_date = now - timezone.timedelta(days=i * 30)
            month_name = m_date.strftime("%b")
            alloc_cnt = queryset.filter(created_at__month=m_date.month, created_at__year=m_date.year).count()
            comp_cnt = queryset.filter(status=ServiceStatus.COMPLETED, updated_at__month=m_date.month, updated_at__year=m_date.year).count()
            monthly_trend.append({
                "month": month_name,
                "allocated": alloc_cnt,
                "completed": comp_cnt
            })

        if search_phone:
            queryset = queryset.filter(
                Q(customer__phone__icontains=search_phone) |
                Q(customer__contact_number__icontains=search_phone) |
                Q(customer__primary_contact__icontains=search_phone) |
                Q(customer__name__icontains=search_phone) |
                Q(customer__company_name__icontains=search_phone)
            )

        if task_type == 'completed':
            queryset = queryset.filter(status=ServiceStatus.COMPLETED)
        elif task_type == 'pending':
            queryset = queryset.exclude(status=ServiceStatus.COMPLETED)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "technician": TechnicianSerializer(tech).data if tech else {
                "name": user.get_full_name() or user.username,
                "phone": phone,
                "email": email
            },
            "stats": {
                "total": total_count,
                "pending": pending_count,
                "completed": completed_count,
                "monthly_trend": monthly_trend
            },
            "tasks": serializer.data
        })

    @action(detail=False, methods=['get'], url_path='products-lookup')
    def products_lookup(self, request):
        products = []
        seen_names = set()

        # 1. Parking Products
        try:
            from parking_products.models import ParkingProduct
            for p in ParkingProduct.objects.all():
                p_name = getattr(p, 'product_name', None) or getattr(p, 'name', None) or str(p)
                # Filter out invalid/test data
                if p_name and p_name not in seen_names and len(p_name) > 2 and not p_name.startswith('ZDP') and not p_name.startswith('ZIP'):
                    seen_names.add(p_name)
                    
                    # Get category display name safely
                    category_name = 'Parking System'
                    if hasattr(p, 'category') and p.category:
                        category_name = getattr(p.category, 'display_name', None) or getattr(p.category, 'name', None) or 'Parking System'
                    
                    products.append({
                        "id": f"parking_{p.id}",
                        "name": p_name,
                        "display_name": p_name,
                        "code": getattr(p, 'product_code', '') or getattr(p, 'code', '') or '',
                        "category": category_name
                    })
        except Exception as e:
            print(f"Error loading parking products: {e}")
            pass

        # 2. Generic Product Master
        try:
            from product_management.models import Product
            for p in Product.objects.all():
                p_name = getattr(p, 'name', None) or getattr(p, 'product_name', None) or str(p)
                # Filter out invalid/test data
                if p_name and p_name not in seen_names and len(p_name) > 2:
                    seen_names.add(p_name)
                    
                    # Get category safely
                    category_val = getattr(p, 'category', 'General Product')
                    if hasattr(category_val, 'name'):
                        category_val = category_val.name
                    
                    products.append({
                        "id": f"generic_{p.id}",
                        "name": p_name,
                        "display_name": p_name,
                        "code": getattr(p, 'sku', '') or getattr(p, 'code', '') or '',
                        "category": str(category_val) if category_val else 'General Product'
                    })
        except Exception as e:
            print(f"Error loading generic products: {e}")
            pass

        # Sort products alphabetically
        products.sort(key=lambda x: x['name'].lower())
        
        return Response(products)

    @action(detail=False, methods=['get'], url_path='customers-lookup')
    def customers_lookup(self, request):
        try:
            from lead_management.models import Customer
            customers = []
            
            # Fetch ONLY real converted customers (is_lead_only=False), identical to Customers page
            for c in Customer.objects.filter(is_lead_only=False).order_by('-id'):
                # Get the best available name
                c_name = c.name or getattr(c, 'company_name', None) or getattr(c, 'poc_name', None) or f"Customer #{c.id}"
                
                # Get contact number safely
                contact = getattr(c, 'contact_number', None) or getattr(c, 'phone', None) or getattr(c, 'primary_contact', None) or ''
                
                # Get email safely
                email = getattr(c, 'email', None) or getattr(c, 'primary_email', None) or ''
                
                customers.append({
                    "id": c.id,
                    "name": c_name,
                    "company_name": getattr(c, 'company_name', None) or '',
                    "poc_name": getattr(c, 'poc_name', None) or '',
                    "phone": contact,
                    "contact_number": contact,
                    "email": email,
                    "is_lead_only": False
                })
            
            return Response(customers)
        except Exception as e:
            print(f"Error in customers lookup: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

