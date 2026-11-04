from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TechnicianViewSet, ServiceRequestViewSet

router = DefaultRouter()
router.register(r'technicians', TechnicianViewSet, basename='technician')
router.register(r'service-requests', ServiceRequestViewSet, basename='servicerequest')

urlpatterns = [
    path('', include(router.urls)),
]
