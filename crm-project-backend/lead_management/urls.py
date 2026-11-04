
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CustomerViewsets , LeadViewSet, LeadFollowUpViewSet, LeadFAQViewSet, send_template_email

router = DefaultRouter()
router.register(r'customer', CustomerViewsets, basename='customer')
router.register(r'lead', LeadViewSet, basename='lead')
router.register(r'lead-followups', LeadFollowUpViewSet, basename='lead-followup')
router.register(r'lead-faqs', LeadFAQViewSet, basename='lead-faq')

urlpatterns = [
    path('send-email/', send_template_email, name='send-template-email'),
]

urlpatterns += router.urls