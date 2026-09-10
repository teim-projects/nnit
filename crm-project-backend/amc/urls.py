from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    AMCContractViewSet,
    AMCServiceScheduleViewSet,
    AMCServiceVisitViewSet,
    AMCRenewalViewSet,
    AMCDashboardView,
    AMCCalendarEventsView
)

router = DefaultRouter()
router.register(r'contracts', AMCContractViewSet, basename='amc-contract')
router.register(r'schedules', AMCServiceScheduleViewSet, basename='amc-schedule')
router.register(r'visits', AMCServiceVisitViewSet, basename='amc-visit')
router.register(r'renewals', AMCRenewalViewSet, basename='amc-renewal')
router.register(r'', AMCContractViewSet, basename='amc')

urlpatterns = [
    path('dashboard/', AMCDashboardView.as_view(), name='amc-dashboard'),
    path('calendar-events/', AMCCalendarEventsView.as_view(), name='amc-calendar-events'),
    path('calendar/', AMCCalendarEventsView.as_view(), name='amc-calendar'),  # Alias for backward compatibility
] + router.urls
