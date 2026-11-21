from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class SubCategory(models.Model):
    category = models.ForeignKey(Category, related_name='subcategories', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('category', 'code')

    def __str__(self):
        return f"{self.name} - {self.category.name}"


class Brand(models.Model):
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=50, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='India')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class UnitOfMeasure(models.Model):
    name = models.CharField(max_length=50, unique=True)  # Pieces, Sets, Meters, Kilograms
    code = models.CharField(max_length=20, unique=True)  # PCS, SET, MTR, KG
    precision = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Warehouse(models.Model):
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='Maharashtra')
    manager_name = models.CharField(max_length=100, blank=True, default='')
    manager_phone = models.CharField(max_length=25, blank=True, default='')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} [{self.code}]"


class InventoryProduct(models.Model):
    ITEM_TYPES = [
        ('finished_product', 'Finished Parking Product'),
        ('component', 'Component'),
        ('spare_part', 'Spare Part'),
        ('consumable', 'Consumable'),
    ]

    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    item_type = models.CharField(max_length=30, choices=ITEM_TYPES, default='component')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    uom = models.ForeignKey(UnitOfMeasure, on_delete=models.SET_NULL, null=True, blank=True)

    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    min_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)
    reorder_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    barcode = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sku} - {self.name}"


class WarehouseStock(models.Model):
    product = models.ForeignKey(InventoryProduct, on_delete=models.CASCADE, related_name='warehouse_stocks')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stocks')
    on_hand_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    allocated_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    available_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'warehouse')

    def save(self, *args, **kwargs):
        self.available_quantity = max(0, float(self.on_hand_quantity) - float(self.allocated_quantity))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} @ {self.warehouse.name}: {self.available_quantity}"


class Vendor(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    gstin = models.CharField(max_length=20, blank=True, default='')
    contact_person = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    payment_terms = models.CharField(max_length=100, blank=True, default='Net 30 Days')
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent to Vendor'),
        ('partially_received', 'Partially Received'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    po_number = models.CharField(max_length=60, unique=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    order_date = models.DateField(default=timezone.now)
    expected_delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.po_number} - {self.vendor.name}"


class PurchaseOrderItem(models.Model):
    po = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(InventoryProduct, on_delete=models.PROTECT)
    ordered_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    received_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    total_price = models.DecimalField(max_digits=14, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.ordered_quantity}"


class GoodsReceiptNote(models.Model):
    grn_number = models.CharField(max_length=60, unique=True)
    po = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='grns')
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    received_date = models.DateField(default=timezone.now)
    invoice_challan_no = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    received_by = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=30, default='verified')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.grn_number} ({self.warehouse.name})"


class GoodsReceiptNoteItem(models.Model):
    grn = models.ForeignKey(GoodsReceiptNote, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(InventoryProduct, on_delete=models.PROTECT)
    received_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    accepted_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    rejected_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    remarks = models.CharField(max_length=255, blank=True, default='')


class MaterialRequisition(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('fulfilled', 'Fulfilled'),
    ]

    mr_number = models.CharField(max_length=60, unique=True)
    requested_by = models.CharField(max_length=120)
    department_project = models.CharField(max_length=150)
    request_date = models.DateField(default=timezone.now)
    required_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    purpose = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.mr_number} - {self.department_project}"


class MaterialRequisitionItem(models.Model):
    mr = models.ForeignKey(MaterialRequisition, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(InventoryProduct, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.CharField(max_length=255, blank=True, default='')


class MaterialTransferNote(models.Model):
    mtn_number = models.CharField(max_length=60, unique=True)
    date = models.DateField(default=timezone.now)
    source_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='transfers_out')
    destination_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='transfers_in')
    purpose = models.CharField(max_length=200, blank=True, default='')
    approved_by = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=30, default='in_transit')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.mtn_number} ({self.source_warehouse} -> {self.destination_warehouse})"


class MaterialTransferNoteItem(models.Model):
    mtn = models.ForeignKey(MaterialTransferNote, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(InventoryProduct, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)


class DeliveryChallan(models.Model):
    dc_number = models.CharField(max_length=60, unique=True)
    dispatch_date = models.DateField(default=timezone.now)
    customer_name = models.CharField(max_length=200)
    site_name = models.CharField(max_length=200)
    dispatch_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    vehicle_number = models.CharField(max_length=50, blank=True, default='')
    transporter = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=30, default='dispatched')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.dc_number} - {self.customer_name}"


class DeliveryChallanItem(models.Model):
    dc = models.ForeignKey(DeliveryChallan, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(InventoryProduct, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)


class MaterialReturn(models.Model):
    return_number = models.CharField(max_length=60, unique=True)
    return_date = models.DateField(default=timezone.now)
    source_description = models.CharField(max_length=200)  # e.g., Site Name or Project
    receiving_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    reason = models.CharField(max_length=200)
    status = models.CharField(max_length=30, default='received')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.return_number} - {self.reason}"


class MaterialReturnItem(models.Model):
    material_return = models.ForeignKey(MaterialReturn, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(InventoryProduct, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)


class StockAdjustment(models.Model):
    ADJUSTMENT_TYPES = [
        ('damage', 'Damaged Goods'),
        ('theft', 'Shortage / Loss'),
        ('audit', 'Physical Audit Reconciliation'),
        ('scrap', 'Scrapped / Obsolescence'),
        ('surplus', 'Surplus Found'),
    ]

    adjustment_number = models.CharField(max_length=60, unique=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    date = models.DateField(default=timezone.now)
    adjustment_type = models.CharField(max_length=30, choices=ADJUSTMENT_TYPES, default='audit')
    reason = models.TextField()
    adjusted_by = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.adjustment_number} ({self.adjustment_type})"


class StockAdjustmentItem(models.Model):
    adjustment = models.ForeignKey(StockAdjustment, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(InventoryProduct, on_delete=models.PROTECT)
    system_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    physical_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    difference_quantity = models.DecimalField(max_digits=10, decimal_places=2)


class BillOfMaterials(models.Model):
    bom_number = models.CharField(max_length=60, unique=True)
    finished_product = models.ForeignKey(InventoryProduct, on_delete=models.CASCADE, related_name='boms')
    name = models.CharField(max_length=255)
    version = models.CharField(max_length=20, default='v1.0')
    notes = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.bom_number} - {self.finished_product.name} ({self.version})"


class BOMComponent(models.Model):
    bom = models.ForeignKey(BillOfMaterials, on_delete=models.CASCADE, related_name='components')
    component_product = models.ForeignKey(InventoryProduct, on_delete=models.PROTECT, related_name='used_in_boms')
    required_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    uom = models.ForeignKey(UnitOfMeasure, on_delete=models.SET_NULL, null=True, blank=True)
    scrap_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    notes = models.CharField(max_length=255, blank=True, default='')

    def __str__(self):
        return f"{self.component_product.name} x {self.required_quantity} for {self.bom.name}"
