from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QuotationViewSet, 
    thank_you_suggestions, 
    subject_suggestions,
    ServiceMasterViewSet,
    ServiceMasterCreateViewSet, 
    QuotationServiceItemViewSet,
    QuotationCustomerViewSet,
    quotation_pdf_view,
    quotation_pdf_token_view,
    simple_quotation_create,
    simple_quotation_detail,
    simple_quotation_update,
    fetch_lead_by_mobile,
    TermsMasterViewSet,
    QuotationTermsViewSet,
)

router = DefaultRouter()

router.register(r'quotation', QuotationViewSet, basename='quotation')
router.register(r'service-masters', ServiceMasterViewSet, basename='service-masters')
router.register(r'service-masters-create', ServiceMasterCreateViewSet, basename='service-masters-create')
router.register(r'quotation-service-items', QuotationServiceItemViewSet, basename='quotation-service-items')
router.register(r'customer', QuotationCustomerViewSet, basename='quotation-customer')
router.register(r'terms', TermsMasterViewSet, basename='terms')
router.register(r'quotation-terms', QuotationTermsViewSet, basename='quotation-terms')

urlpatterns = [
    path('fetch-lead-by-mobile/', fetch_lead_by_mobile, name='fetch-lead-by-mobile'),
    path('thank-you-suggestions/', thank_you_suggestions, name='thank_you_suggestions'),
    path('subject-suggestions/', subject_suggestions, name='subject_suggestions'),
    path('quotations/<int:quotation_id>/pdf/', quotation_pdf_view, name='quotation-pdf'),
    path('quotation/<int:quotation_id>/view-pdf/', quotation_pdf_token_view, name='quotation-view-pdf'),
    path('simple-quotation/', simple_quotation_create, name='simple-quotation-create'),
    path('simple-quotation/<int:pk>/', simple_quotation_detail, name='simple-quotation-detail'),
    path('simple-quotation/<int:pk>/update/', simple_quotation_update, name='simple-quotation-update'),
]

urlpatterns += router.urls
