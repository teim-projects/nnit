from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings


class ProductCategory(models.Model):
    """Parking Product Categories (Type Master)"""
    
    CATEGORY_CHOICES = [
        ('stack_parking', 'Stack Parking'),
        ('puzzle_parking', 'Puzzle Parking'),
        ('tower_parking', 'Tower Parking'),
        ('pit_parking', 'Pit Parking'),
        ('cantilever', 'Cantilever Parking'),
    ]
    
    name = models.CharField(max_length=100, choices=CATEGORY_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Icon name or emoji")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_categories'
        verbose_name = 'Product Category'
        verbose_name_plural = 'Product Categories'
        ordering = ['display_name']
    
    def __str__(self):
        return self.display_name


class ParkingProduct(models.Model):
    """Parking Product Master"""
    
    OPERATION_TYPE_CHOICES = [
        ('hydraulic', 'Hydraulic'),
        ('mechanical', 'Mechanical'),
        ('hybrid', 'Hybrid'),
    ]
    
    AUTOMATION_TYPE_CHOICES = [
        ('fully_automatic', 'Fully Automatic'),
        ('semi_automatic', 'Semi Automatic'),
        ('manual', 'Manual'),
    ]
    
    # Basic Information
    product_name = models.CharField(max_length=200, unique=True, help_text="e.g., 2DP 101")
    product_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    category = models.ForeignKey(
        ProductCategory, 
        on_delete=models.PROTECT, 
        related_name='products'
    )
    description = models.TextField(blank=True, null=True)
    
    # Technical Specifications
    levels = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Number of levels"
    )
    operation_type = models.CharField(
        max_length=50, 
        choices=OPERATION_TYPE_CHOICES,
        default='hydraulic'
    )
    automation_type = models.CharField(
        max_length=50,
        choices=AUTOMATION_TYPE_CHOICES,
        default='semi_automatic'
    )
    pit_required = models.BooleanField(default=False)
    load_capacity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Load capacity in KG",
        validators=[MinValueValidator(0)]
    )
    
    # Configuration - Dimensions (in feet or meters)
    min_height = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Minimum height required (ft)",
        validators=[MinValueValidator(0)]
    )
    min_width = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Minimum width required (ft)",
        validators=[MinValueValidator(0)]
    )
    min_length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Minimum length required (ft)",
        validators=[MinValueValidator(0)]
    )
    
    # Capacity
    car_capacity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Total car capacity"
    )
    
    # Additional Features
    features = models.JSONField(
        default=list,
        blank=True,
        help_text="List of product features"
    )
    advantages = models.JSONField(
        default=list,
        blank=True,
        help_text="List of product advantages"
    )
    specifications = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional specifications"
    )
    
    # Pricing & Status
    base_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Base price (optional)"
    )
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Images
    image_url = models.URLField(blank=True, null=True, help_text="External image URL (optional)")
    brochure_url = models.URLField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_products'
    )
    
    class Meta:
        db_table = 'parking_products'
        verbose_name = 'Parking Product'
        verbose_name_plural = 'Parking Products'
        ordering = ['-is_featured', 'product_name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['product_name']),
        ]
    
    def __str__(self):
        return f"{self.product_name} ({self.category.display_name})"
    
    @property
    def total_space_required(self):
        """Calculate total space required in sq ft"""
        return float(self.min_width * self.min_length)
    
    def get_configuration_summary(self):
        """Get configuration as dict"""
        return {
            'min_height': float(self.min_height),
            'min_width': float(self.min_width),
            'min_length': float(self.min_length),
            'car_capacity': self.car_capacity,
            'levels': self.levels,
            'total_space': self.total_space_required,
        }


class ProductConfiguration(models.Model):
    """Additional product configurations/variants"""
    
    product = models.ForeignKey(
        ParkingProduct,
        on_delete=models.CASCADE,
        related_name='configurations'
    )
    variant_name = models.CharField(max_length=200)
    height = models.DecimalField(max_digits=10, decimal_places=2)
    width = models.DecimalField(max_digits=10, decimal_places=2)
    length = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField()
    levels = models.PositiveIntegerField()
    price_modifier = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Additional price for this configuration"
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'product_configurations'
        verbose_name = 'Product Configuration'
        verbose_name_plural = 'Product Configurations'
        unique_together = ['product', 'variant_name']
    
    def __str__(self):
        return f"{self.product.product_name} - {self.variant_name}"
