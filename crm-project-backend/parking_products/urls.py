from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductCategoryViewSet,
    ParkingProductViewSet,
    ProductConfigurationViewSet,
)

router = DefaultRouter()
router.register(r'categories', ProductCategoryViewSet, basename='category')
router.register(r'products', ParkingProductViewSet, basename='product')
router.register(r'configurations', ProductConfigurationViewSet, basename='configuration')

urlpatterns = [
    path("", include(router.urls)),
]