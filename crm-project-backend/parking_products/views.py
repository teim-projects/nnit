from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasModulePermission
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import ProductCategory, ParkingProduct, ProductConfiguration
from .serializers import (
    ProductCategorySerializer,
    ParkingProductSerializer,
    ParkingProductListSerializer,
    ProductConfigurationSerializer,
    ProductRecommendationSerializer,
    RecommendedProductSerializer
)


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class ParkingProductViewSet(viewsets.ModelViewSet):
    queryset = ParkingProduct.objects.select_related('category').prefetch_related('configurations')
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ParkingProductListSerializer
        return ParkingProductSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(product_name__icontains=search) |
                Q(product_code__icontains=search) |
                Q(description__icontains=search)
            )
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__name=category)
        
        operation_type = self.request.query_params.get('operation_type')
        if operation_type:
            queryset = queryset.filter(operation_type=operation_type)
        
        automation_type = self.request.query_params.get('automation_type')
        if automation_type:
            queryset = queryset.filter(automation_type=automation_type)
        
        pit_required = self.request.query_params.get('pit_required')
        if pit_required is not None:
            queryset = queryset.filter(pit_required=pit_required.lower() == 'true')
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        else:
            queryset = queryset.filter(is_active=True)
        
        is_featured = self.request.query_params.get('is_featured')
        if is_featured is not None:
            queryset = queryset.filter(is_featured=is_featured.lower() == 'true')
        
        min_capacity = self.request.query_params.get('min_capacity')
        if min_capacity:
            queryset = queryset.filter(car_capacity__gte=int(min_capacity))
        
        max_capacity = self.request.query_params.get('max_capacity')
        if max_capacity:
            queryset = queryset.filter(car_capacity__lte=int(max_capacity))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='recommend')
    def recommend_products(self, request):
        serializer = ProductRecommendationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        requirements = serializer.validated_data
        products = ParkingProduct.objects.filter(is_active=True).select_related('category')
        
        recommended = []
        
        for product in products:
            match_score = 0
            match_reasons = []
            
            if product.car_capacity >= requirements.get('cars_required', 0):
                match_score += 30
                match_reasons.append(f"Can accommodate {product.car_capacity} cars")
            
            pit_possible = requirements.get('pit_possible', False)
            if product.pit_required and not pit_possible:
                continue
            elif not product.pit_required and not pit_possible:
                match_score += 20
                match_reasons.append("No pit required")
            
            available_height = requirements.get('available_height')
            available_width = requirements.get('available_width')
            available_length = requirements.get('available_length')
            
            space_fits = True
            if available_height and product.min_height > float(available_height):
                space_fits = False
            if available_width and product.min_width > float(available_width):
                space_fits = False
            if available_length and product.min_length > float(available_length):
                space_fits = False
            
            if not space_fits:
                continue
            elif all([available_height, available_width, available_length]):
                match_score += 25
                match_reasons.append("Fits within available space")
            
            basement_available = requirements.get('basement_available', False)
            if basement_available and product.category.name in ['pit_parking', 'stack_parking']:
                match_score += 15
                match_reasons.append("Ideal for basement installation")
            
            if product.operation_type == 'hydraulic':
                match_score += 10
                match_reasons.append("Hydraulic operation for smooth performance")
            
            product.match_score = match_score
            product.match_reasons = match_reasons
            
            if match_score > 0:
                recommended.append(product)
        
        recommended.sort(key=lambda x: x.match_score, reverse=True)
        recommended = recommended[:10]
        
        serializer = RecommendedProductSerializer(recommended, many=True)
        return Response({
            'count': len(recommended),
            'requirements': requirements,
            'recommendations': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def configurations(self, request, pk=None):
        product = self.get_object()
        configurations = product.configurations.filter(is_active=True)
        serializer = ProductConfigurationSerializer(configurations, many=True)
        return Response(serializer.data)


class ProductConfigurationViewSet(viewsets.ModelViewSet):
    queryset = ProductConfiguration.objects.select_related('product')
    serializer_class = ProductConfigurationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset
