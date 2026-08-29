from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.permissions import HasModulePermission
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from .filters import QuotationFilter
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
import logging
from decimal import Decimal
from .models import Quotation, QuotationVersion, QuotationHighSideItem, QuotationLowSideItem
from .serializers import QuotationSerializer
from .utils.pdf_generator import generate_quotation_pdf as build_quotation_pdf, generate_quotation_print_pdf

from .models import ServiceMaster, QuotationServiceItem
from .serializers import (
    ServiceMasterSerializer, 
    QuotationServiceItemSerializer,
    QuotationServiceItemCreateSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)


def quotation_pdf_token_view(request, quotation_id):
    """
    GET /quotation/quotation/<id>/view-pdf/?token=<jwt>
    Opens PDF directly in browser — accepts JWT as query param so it can be
    used as a plain <a href> or window.open() without fetch+blob dance.
    """
    token_str = request.GET.get("token", "")
    if not token_str:
        return HttpResponse("Missing token", status=401)
    try:
        token = AccessToken(token_str)
        user_id = token["user_id"]
        User.objects.get(pk=user_id)
    except (TokenError, User.DoesNotExist, KeyError):
        return HttpResponse("Invalid or expired token", status=401)

    quotation = get_object_or_404(
        Quotation.objects.select_related("customer", "site"), pk=quotation_id
    )
    version = QuotationVersion.objects.filter(
        quotation=quotation, is_active=True
    ).prefetch_related("high_side_items", "low_side_items").first()

    if not version:
        return HttpResponse("No active version found", status=404)

    try:
        pdf_content = build_quotation_pdf(
            quotation, version, base_url=request.build_absolute_uri("/")
        )
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        return HttpResponse(f"Error generating PDF: {str(e)}", status=500)

    response = HttpResponse(pdf_content, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="quotation_{quotation.quotation_no}.pdf"'
    return response


def quotation_pdf_view(request, quotation_id):
    """Legacy URL: Generate Quotation PDF using WeasyPrint."""
    try:
        quotation = Quotation.objects.select_related('customer', 'site').get(id=quotation_id)
    except Quotation.DoesNotExist:
        return HttpResponse("Quotation not found", status=404)

    version = QuotationVersion.objects.filter(
        quotation=quotation, is_active=True
    ).first()
    if not version:
        return HttpResponse("No active version found", status=404)

    try:
        pdf_content = build_quotation_pdf(
            quotation,
            version,
            base_url=request.build_absolute_uri('/'),
        )
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        return HttpResponse(f"Error generating PDF: {str(e)}", status=500)

    filename = f"{quotation.quotation_no}.pdf"
    response = HttpResponse(pdf_content, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@api_view(['GET'])
def thank_you_suggestions(request):
    search = request.GET.get('search', '')
    
    if len(search) < 2:
        return Response([])
    
    notes = Quotation.objects.filter(
        thank_you_note__icontains=search,
        thank_you_note__isnull=False
    ).exclude(thank_you_note='').values_list('thank_you_note', flat=True).distinct()[:10]
    
    return Response([{'id': i, 'text': note} for i, note in enumerate(notes)])


@api_view(['GET'])
def subject_suggestions(request):
    search = request.GET.get('search', '').strip()
    
    if not search or len(search) < 2:
        return Response([])
    
    quotations = Quotation.objects.filter(
        subject__icontains=search
    ).values('id', 'subject').distinct()[:10]
    
    return Response([{'id': q['id'], 'text': q['subject']} for q in quotations])


class QuotationViewSet(viewsets.ModelViewSet):
    serializer_class = QuotationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = QuotationFilter

    search_fields = [
        "quotation_no",
        "customer__name",
        "customer__contact_number",
        "subject",
        "site_name",
    ]

    def get_queryset(self):
        """Simplified queryset - let the serializer handle nested relations"""
        try:
            # Just get quotations with customer, let serializer handle the rest
            return Quotation.objects.all().select_related("customer").order_by("-id")
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            return Quotation.objects.none()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], url_path='send-email')
    def send_email(self, request, pk=None):
        """Send quotation via email with branded HTML template and PDF attachment"""
        from django.core.mail import EmailMultiAlternatives
        from django.conf import settings

        quotation = self.get_object()
        email = request.data.get('email') or request.data.get('recipient_email', '')
        note = request.data.get('note') or request.data.get('text_content', '')
        html_content = request.data.get('html_content', '')
        subject = request.data.get('subject') or f"Quotation {quotation.quotation_no} - NNIT Car Parking Systems"
        version_id = request.data.get('version_id')

        if not email:
            return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        version = None
        if version_id:
            version = QuotationVersion.objects.filter(pk=version_id, quotation=quotation).first()
        if not version:
            version = QuotationVersion.objects.filter(quotation=quotation, is_active=True).first()

        try:
            cust_name = quotation.customer.name if (quotation.customer and quotation.customer.name) else "Valued Customer"
            ver_name = version.version_no if version else ""
            tot_amt = f"₹{version.grand_total:,.2f}" if (version and version.grand_total) else ""

            # Prepare text body cleanly without duplication
            text_body = str(note).strip() if note else ""
            if not text_body:
                text_body = f"Dear {cust_name},\n\nPlease find attached Quotation {quotation.quotation_no}"
                if ver_name:
                    text_body += f" ({ver_name})"
                if tot_amt:
                    text_body += f"\nTotal Amount: {tot_amt}"
                text_body += "\n\nThank you for choosing NNIT Car Parking Systems.\n\nBest Regards,\nNNIT Car Parking Systems Team"

            HEADER_IMAGE_URL = "https://files.catbox.moe/4i67y4.jpg"
            final_html = html_content

            if not final_html or '<body' not in final_html:
                final_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{HEADER_IMAGE_URL}" alt="NNIT Car Parking Systems Header" style="width:100%; display:block; margin:0; padding:0; border:0;" />
    <div style="padding:25px; line-height:1.6; white-space:pre-wrap;">{text_body}</div>
  </div>
</body>
</html>'''

            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'connectteim@gmail.com')

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=from_email,
                to=[email],
            )
            msg.attach_alternative(final_html, "text/html")

            # Generate and attach Quotation PDF
            if version:
                try:
                    pdf_bytes = build_quotation_pdf(
                        quotation,
                        version,
                        base_url=request.build_absolute_uri('/')
                    )
                    clean_no = str(quotation.quotation_no).replace('/', '_').replace('\\', '_')
                    filename = f"Quotation_{clean_no}_v{ver_name}.pdf"
                    msg.attach(filename, pdf_bytes, 'application/pdf')
                except Exception as pdf_err:
                    logger.error(f"Could not generate PDF attachment for email: {str(pdf_err)}")

            msg.send(fail_silently=False)
            return Response({"detail": "Email sent successfully with PDF attachment"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error sending quotation email: {str(e)}")
            return Response({"detail": f"Email failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["get"], url_path="latest-version")
    def latest_version(self, request, pk=None):
        quotation = self.get_object()
        version = quotation.versions.filter(is_active=True).first()

        if not version:
            return Response(
                {"message": "No active version found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(quotation)
        return Response(serializer.data)

    # PDF ACTIONS
    @action(detail=True, methods=['get'], url_path='pdf')
    def download_pdf(self, request, pk=None):
        try:
            quotation = Quotation.objects.select_related('customer', 'site').get(pk=pk)

            version = QuotationVersion.objects.filter(
                quotation=quotation,
                is_active=True
            ).prefetch_related(
                'high_side_items',
                'low_side_items',
                'service_items'
            ).first()

            if not version:
                return HttpResponse("No active version found", status=404)

            pdf_content = build_quotation_pdf(
                quotation,
                version,
                base_url=request.build_absolute_uri('/'),
            )

            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="quotation_{quotation.quotation_no}_v{version.version_no}.pdf"'

            return response

        except Exception as e:
            logger.error(f"PDF generation error: {str(e)}")
            return HttpResponse(f"Error generating PDF: {str(e)}", status=500)
        
    @action(detail=True, methods=['get'], url_path='version/(?P<version_id>[^/.]+)/pdf')
    def download_version_pdf(self, request, pk=None, version_id=None):
        """Generate PDF for specific version"""
        try:
            quotation = self.get_object()
            version = get_object_or_404(
                QuotationVersion.objects.prefetch_related(
                    'high_side_items',
                    'low_side_items',
                    'service_items'
                ), 
                pk=version_id, 
                quotation=quotation
            )
            
            pdf_content = build_quotation_pdf(
                quotation,
                version,
                base_url=request.build_absolute_uri('/'),
            )
            
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="quotation_{quotation.quotation_no}_v{version.version_no}.pdf"'
            
            return response
        except Exception as e:
            logger.error(f"Version PDF generation error: {str(e)}")
            return HttpResponse(
                f"Error generating PDF: {str(e)}",
                status=500
            )

    @action(detail=True, methods=['get'], url_path='print-pdf')
    def download_print_pdf(self, request, pk=None):
        """New WeasyPrint quotation PDF (invoice-style, dummy table for design stage)."""
        try:
            quotation = self.get_object()
            version = QuotationVersion.objects.filter(
                quotation=quotation,
                is_active=True
            ).first()

            if not version:
                return HttpResponse("No active version found", status=404)

            pdf_content = generate_quotation_print_pdf(
                quotation,
                version,
                base_url=request.build_absolute_uri('/'),
            )

            response = HttpResponse(pdf_content, content_type='application/pdf')
            filename = f"quotation_{quotation.quotation_no}_v{version.version_no}_print.pdf"
            if request.GET.get('download'):
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
            else:
                response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response

        except Exception as e:
            logger.error(f"Print PDF generation error: {str(e)}")
            return HttpResponse(f"Error generating PDF: {str(e)}", status=500)

    @action(detail=True, methods=['get'], url_path='version/(?P<version_id>[^/.]+)/print-pdf')
    def download_version_print_pdf(self, request, pk=None, version_id=None):
        """New WeasyPrint PDF for a specific quotation version."""
        try:
            quotation = self.get_object()
            version = get_object_or_404(
                QuotationVersion,
                pk=version_id,
                quotation=quotation,
            )

            pdf_content = generate_quotation_print_pdf(
                quotation,
                version,
                base_url=request.build_absolute_uri('/'),
            )

            response = HttpResponse(pdf_content, content_type='application/pdf')
            filename = f"quotation_{quotation.quotation_no}_v{version.version_no}_print.pdf"
            if request.GET.get('download'):
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
            else:
                response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response

        except Exception as e:
            logger.error(f"Version print PDF error: {str(e)}")
            return HttpResponse(f"Error generating PDF: {str(e)}", status=500)

    @action(detail=True, methods=["delete"], url_path="version/(?P<version_id>[^/.]+)/delete")
    def delete_version(self, request, pk=None, version_id=None):
        quotation = self.get_object()
        version = get_object_or_404(
            QuotationVersion,
            pk=version_id,
            quotation=quotation
        )
    
        was_active = version.is_active
        version.delete()
    
        remaining_versions = quotation.versions.order_by("-created_at")
    
        if not remaining_versions.exists():
            quotation.delete()
            return Response({"message": "Quotation deleted (last version removed)"})
    
        if was_active:
            latest = remaining_versions.first()
            latest.is_active = True
            latest.save(update_fields=["is_active"])
    
        return Response({"message": "Version deleted"})


class ServiceMasterViewSet(viewsets.ModelViewSet):
    queryset = ServiceMaster.objects.all()
    serializer_class = ServiceMasterSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['service_type', 'is_active']
    search_fields = ['name', 'category', 'subcategory']
    permission_classes = [IsAuthenticated]


class ServiceMasterCreateViewSet(viewsets.ModelViewSet):
    queryset = ServiceMaster.objects.all().prefetch_related('items')
    serializer_class = ServiceMasterSerializer
    pagination_class = None
    permission_classes = [IsAuthenticated]


class QuotationServiceItemViewSet(viewsets.ModelViewSet):
    queryset = QuotationServiceItem.objects.all().select_related(
        'service__category', 'service__subcategory', 'quotation_version'
    ).prefetch_related('service__items')
    serializer_class = QuotationServiceItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quotation_version']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return QuotationServiceItemCreateSerializer
        return QuotationServiceItemSerializer
    
    @action(detail=False, methods=['get'])
    def by_quotation_version(self, request):
        version_id = request.query_params.get('version_id')
        if not version_id:
            return Response({'error': 'version_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        items = self.queryset.filter(quotation_version_id=version_id)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class QuotationCustomerViewSet(viewsets.ReadOnlyModelViewSet):
    from lead_management.models import Customer
    from lead_management.serializers import CustomerSerializer
    queryset = Customer.objects.filter(quotations__isnull=False).distinct().order_by('id')
    serializer_class = CustomerSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    pagination_class = None


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def fetch_lead_by_mobile(request):
    """
    GET /api/quotation/fetch-lead-by-mobile/?mobile=<number>
    Searches Customer and lead_management by mobile number.
    Returns complete lead & customer details for auto-filling Quotation form.
    """
    raw_mobile = request.query_params.get("mobile", "").strip()
    if not raw_mobile:
        return Response({"found": False, "detail": "Mobile number is required"}, status=status.HTTP_400_BAD_REQUEST)

    import re
    cleaned_mobile = re.sub(r'[^\d]', '', raw_mobile)
    if cleaned_mobile.startswith('91') and len(cleaned_mobile) == 12:
        cleaned_mobile = cleaned_mobile[2:]

    from lead_management.models import Customer, lead_management
    from django.db.models import Q

    customer = Customer.objects.filter(
        Q(contact_number__icontains=cleaned_mobile) |
        Q(secondary_contact_number__icontains=cleaned_mobile)
    ).first()

    lead = None
    if customer:
        lead = customer.leads.order_by('-created_at', '-id').first()
    else:
        lead = lead_management.objects.filter(
            Q(contact_person_number__icontains=cleaned_mobile) |
            Q(customer__contact_number__icontains=cleaned_mobile)
        ).select_related('customer', 'assign_to').order_by('-created_at', '-id').first()

        if lead:
            customer = lead.customer

    if not customer and not lead:
        return Response({"found": False, "detail": "No lead or customer found for this mobile number"}, status=status.HTTP_200_OK)

    cust_id = customer.id if customer else None
    cust_name = customer.name if customer else (lead.contact_person_name if lead else "")
    contact_no = customer.contact_number if customer else (lead.contact_person_number if lead else cleaned_mobile)
    company_name = (lead.company_name if lead else "") or getattr(customer, 'company_name', '') or cust_name
    contact_person = (lead.contact_person_name if lead else "") or customer.poc_name or cust_name
    email = customer.email if customer else ""
    state = customer.state if customer else ""
    city = customer.city if customer else ""
    address = customer.address if customer else (lead.project_adderess if lead else "")

    sp_id = lead.assign_to_id if (lead and lead.assign_to) else None
    sp_name = f"{lead.assign_to.first_name or ''} {lead.assign_to.last_name or ''}".strip() if (lead and lead.assign_to) else ""
    sp_phone = getattr(lead.assign_to, 'mobile_no', '') or getattr(lead.assign_to, 'phone', '') if (lead and lead.assign_to) else ""

    return Response({
        "found": True,
        "customer_id": cust_id,
        "customer_name": cust_name,
        "contact_number": contact_no,
        "company_name": company_name,
        "contact_person": contact_person,
        "email": email,
        "state": state,
        "city": city,
        "address": address,
        "sales_person_id": sp_id,
        "sales_person_name": sp_name,
        "sales_person_phone": sp_phone,
        "project_name": lead.project_name if lead else ""
    }, status=status.HTTP_200_OK)


# =====================================================
# SIMPLE QUOTATION VIEW
# POST /quotation/simple-quotation/
# =====================================================
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def simple_quotation_create(request):
    """
    Simple quotation creation: customer + parking product + qty + price.
    Used by the basic Create Quotation form.
    """
    from .serializers import SimpleQuotationSerializer
    serializer = SimpleQuotationSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        quotation = serializer.create(serializer.validated_data)
        return Response(
            {"id": quotation.id, "quotation_no": quotation.quotation_no},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def simple_quotation_detail(request, pk):
    """
    GET /quotation/simple-quotation/<pk>/
    Returns simple-form-friendly data for editing (including multiple items).
    """
    quotation = get_object_or_404(Quotation, pk=pk)
    version = quotation.versions.filter(is_active=True).first()
    
    items_list = []
    first_item = None
    if version:
        high_items = list(version.high_side_items.all())
        first_item = high_items[0] if high_items else None
        for h_item in high_items:
            p_id = h_item.product_data.get("id") if h_item.product_data else None
            p_name = h_item.product_data.get("name") if h_item.product_data else ""
            qty = h_item.quantity or 1
            inst_rate = (float(h_item.mathadi_charges) / qty) if (h_item.mathadi_charges and qty > 0) else 0.0
            items_list.append({
                "id": h_item.id,
                "parking_product_id": p_id,
                "parking_product_name": p_name,
                "quantity": qty,
                "unit_price": float(h_item.unit_price or 0),
                "installation_charges": inst_rate,
                "description": h_item.description or "",
                "line_total": float(h_item.base_amount or 0)
            })

    data = {
        "id": quotation.id,
        "quotation_no": quotation.quotation_no,
        "customer": quotation.customer_id,
        "customer_name": quotation.customer.name if quotation.customer else "",
        "sales_person": quotation.sales_person_id,
        "sales_person_name": quotation.sales_person_name or "",
        "sales_person_phone": quotation.sales_person_phone or "",
        "subject": quotation.subject,
        "quantity": first_item.quantity if first_item else 1,
        "unit_price": float(first_item.unit_price) if first_item else 0,
        "gst_percent": float(first_item.gst_percent) if first_item else 18,
        "parking_product_id": first_item.product_data.get("id") if first_item and first_item.product_data else None,
        "parking_product_name": first_item.product_data.get("name") if first_item and first_item.product_data else "",
        "subtotal": float(version.subtotal) if version else 0,
        "gst_amount": float(version.gst_amount) if version else 0,
        "transportation_charges": float(getattr(version, "transportation_charges", 0) or 0) if version else 0,
        "packing_forwarding_charges": float(getattr(version, "packing_forwarding_charges", 0) or 0) if version else 0,
        "loading_unloading_charges": float(getattr(version, "loading_unloading_charges", 0) or 0) if version else 0,
        "insurance_charges": float(getattr(version, "insurance_charges", 0) or 0) if version else 0,
        "miscellaneous_charges": float(getattr(version, "miscellaneous_charges", 0) or 0) if version else 0,
        "transportation_charges_type": getattr(version, "transportation_charges_type", "custom") if version else "custom",
        "packing_forwarding_charges_type": getattr(version, "packing_forwarding_charges_type", "custom") if version else "custom",
        "loading_unloading_charges_type": getattr(version, "loading_unloading_charges_type", "custom") if version else "custom",
        "insurance_charges_type": getattr(version, "insurance_charges_type", "custom") if version else "custom",
        "miscellaneous_charges_type": getattr(version, "miscellaneous_charges_type", "custom") if version else "custom",
        "grand_total": float(version.grand_total) if version else 0,
        "items": items_list
    }
    return Response(data)


@api_view(["PUT"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def simple_quotation_update(request, pk):
    """
    PUT /quotation/simple-quotation/<pk>/
    Creates a new version with updated products/prices list.
    """
    from parking_products.models import ParkingProduct
    from django.contrib.auth import get_user_model
    User = get_user_model()

    quotation = get_object_or_404(Quotation, pk=pk)
    data = request.data
    gst_percent = float(data.get("gst_percent", 18))

    sp_id = data.get("sales_person")
    if sp_id:
        sp_obj = User.objects.filter(pk=sp_id).first()
        quotation.sales_person = sp_obj

    if "sales_person_name" in data:
        quotation.sales_person_name = data.get("sales_person_name") or ""
    if "sales_person_phone" in data:
        quotation.sales_person_phone = data.get("sales_person_phone") or ""

    trans_chg = float(data.get("transportation_charges") or data.get("transport_charges") or 0)
    pack_chg = float(data.get("packing_forwarding_charges") or data.get("packing_charges") or 0)
    load_chg = float(data.get("loading_unloading_charges") or data.get("loading_charges") or 0)
    ins_chg = float(data.get("insurance_charges") or data.get("insurance") or 0)
    misc_chg = float(data.get("miscellaneous_charges") or data.get("miscellaneous") or 0)

    trans_type = data.get("transportation_charges_type") or "custom"
    pack_type = data.get("packing_forwarding_charges_type") or "custom"
    load_type = data.get("loading_unloading_charges_type") or "custom"
    ins_type = data.get("insurance_charges_type") or "custom"
    misc_type = data.get("miscellaneous_charges_type") or "custom"

    raw_items = data.get("items")
    if not raw_items or not isinstance(raw_items, list) or len(raw_items) == 0:
        p_id = data.get("parking_product_id")
        if p_id:
            raw_items = [{
                "parking_product_id": p_id,
                "quantity": data.get("quantity", 1),
                "unit_price": data.get("unit_price", 0),
                "description": "",
                "installation_charges": 0
            }]
        else:
            return Response({"detail": "At least one product item is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Fetch first product to build subject if needed
    first_product_id = raw_items[0].get("parking_product_id")
    first_product = ParkingProduct.objects.filter(pk=first_product_id).first() if first_product_id else None

    if first_product:
        quotation.subject = f"{first_product.product_name} - {first_product.category.display_name}"
    
    quotation.save()

    # Deactivate old version
    old_version = quotation.versions.filter(is_active=True).first()
    next_r = 1
    if old_version:
        old_version.is_active = False
        old_version.save()
        try:
            next_r = int(old_version.version_no.split("-R")[-1]) + 1
        except Exception:
            next_r = 2

    new_version_no = f"{quotation.quotation_no}-R{next_r}"
    version = QuotationVersion.objects.create(
        quotation=quotation,
        version_no=new_version_no,
        is_active=True,
        gst_type="CGST_SGST",
        created_by=request.user,
        transportation_charges=trans_chg,
        packing_forwarding_charges=pack_chg,
        loading_unloading_charges=load_chg,
        insurance_charges=ins_chg,
        miscellaneous_charges=misc_chg,
        transportation_charges_type=trans_type,
        packing_forwarding_charges_type=pack_type,
        loading_unloading_charges_type=load_type,
        insurance_charges_type=ins_type,
        miscellaneous_charges_type=misc_type,
    )

    total_subtotal = 0.0
    total_gst_amount = 0.0

    for item_data in raw_items:
        p_id = item_data.get("parking_product_id")
        product = ParkingProduct.objects.filter(pk=p_id).first() if p_id else None
        qty = int(item_data.get("quantity", 1))
        u_price = float(item_data.get("unit_price", 0))
        inst_charges = float(item_data.get("installation_charges", 0))
        desc = item_data.get("description") or (f"{product.product_name} ({product.category.display_name})" if product else "Parking System")

        product_data_snapshot = {
            "id": product.id if product else None,
            "name": product.product_name if product else "Parking System",
            "sku": (product.product_code or product.product_name) if product else "PKG",
            "category": product.category.display_name if (product and product.category) else "",
            "car_capacity": getattr(product, 'car_capacity', 2) or 2,
            "load_capacity": float(getattr(product, 'load_capacity', 0) or 0) if product else 0,
        }

        base_amount = qty * u_price
        line_subtotal = base_amount + (qty * inst_charges)
        gst_value = (line_subtotal * gst_percent) / 100
        total_with_gst = line_subtotal + gst_value

        QuotationHighSideItem.objects.create(
            quotation_version=version,
            product_data=product_data_snapshot,
            quantity=qty,
            unit_price=u_price,
            unit="NOS",
            gst_percent=gst_percent,
            mathadi_charges=inst_charges * qty,
            transportation_charges=0,
            description=desc,
            hsn_sac="",
            base_amount=line_subtotal,
            gst_amount=gst_value,
            total_with_gst=total_with_gst,
        )

        total_subtotal += line_subtotal
        total_gst_amount += gst_value

    half_gst = total_gst_amount / 2.0
    version.subtotal = total_subtotal
    version.gst_amount = total_gst_amount
    version.cgst_amount = half_gst
    version.sgst_amount = half_gst
    version.igst_amount = 0
    version.total_amount = total_subtotal + total_gst_amount
    add_charges = trans_chg + pack_chg + load_chg + ins_chg + misc_chg
    version.grand_total = total_subtotal + total_gst_amount + add_charges
    version.save()

    return Response({"id": quotation.id, "quotation_no": quotation.quotation_no, "version": new_version_no})



# =====================================================
# TERMS & CONDITIONS VIEWSETS
# =====================================================
from .terms_models import TermsMaster, QuotationTerms
from .serializers import (
    TermsMasterSerializer,
    QuotationTermsSerializer,
    QuotationTermsBulkCreateSerializer
)


class TermsMasterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing master Terms & Conditions templates
    """
    module_key = 'terms'
    queryset = TermsMaster.objects.all()
    serializer_class = TermsMasterSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasModulePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_default']
    search_fields = ['title', 'content']
    ordering_fields = ['sequence', 'created_at']
    ordering = ['sequence']
    pagination_class = None  # Disable pagination to show all terms

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """
        Reorder terms by providing a list of IDs in desired order
        POST /api/quotation/terms/reorder/
        {"term_ids": [3, 1, 5, 2, ...]}
        """
        term_ids = request.data.get('term_ids', [])
        for index, term_id in enumerate(term_ids, start=1):
            TermsMaster.objects.filter(pk=term_id).update(sequence=index)
        return Response({"message": "Terms reordered successfully"})


class QuotationTermsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing terms attached to specific quotations
    """
    queryset = QuotationTerms.objects.all()
    serializer_class = QuotationTermsSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['quotation', 'is_customized']
    ordering = ['sequence']
    pagination_class = None  # Disable pagination to show all quotation terms

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """
        Bulk create/replace terms for a quotation
        POST /api/quotation/quotation-terms/bulk-create/
        {
            "quotation": 1,
            "terms": [
                {"master_term": 1, "sequence": 1},
                {"master_term": 3, "sequence": 2},
                ...
            ]
        }
        """
        serializer = QuotationTermsBulkCreateSerializer(data=request.data)
        if serializer.is_valid():
            terms = serializer.create(serializer.validated_data)
            result_serializer = QuotationTermsSerializer(terms, many=True)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='apply-defaults')
    def apply_defaults(self, request):
        """
        Apply all default terms to a quotation
        POST /api/quotation/quotation-terms/apply-defaults/
        {"quotation": 1}
        """
        quotation_id = request.data.get('quotation')
        if not quotation_id:
            return Response(
                {"error": "quotation field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        quotation = get_object_or_404(Quotation, pk=quotation_id)
        
        # Delete existing terms
        QuotationTerms.objects.filter(quotation=quotation).delete()

        # Get all default terms
        default_terms = TermsMaster.objects.filter(is_active=True, is_default=True).order_by('sequence')

        # Create quotation terms from defaults
        created_terms = []
        for term in default_terms:
            qt = QuotationTerms.objects.create(
                quotation=quotation,
                master_term=term,
                title=term.title,
                content=term.content,
                sequence=term.sequence,
                is_customized=False
            )
            created_terms.append(qt)

        serializer = QuotationTermsSerializer(created_terms, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
