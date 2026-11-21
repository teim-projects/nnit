from rest_framework import serializers
from .models import (
    Category, SubCategory, Brand, UnitOfMeasure, Warehouse,
    InventoryProduct, WarehouseStock, Vendor,
    PurchaseOrder, PurchaseOrderItem,
    GoodsReceiptNote, GoodsReceiptNoteItem,
    MaterialRequisition, MaterialRequisitionItem,
    MaterialTransferNote, MaterialTransferNoteItem,
    DeliveryChallan, DeliveryChallanItem,
    MaterialReturn, MaterialReturnItem,
    StockAdjustment, StockAdjustmentItem,
    BillOfMaterials, BOMComponent
)


class CategorySerializer(serializers.ModelSerializer):
    subcategories_count = serializers.IntegerField(source='subcategories.count', read_only=True)
    class Meta:
        model = Category
        fields = '__all__'


class SubCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = SubCategory
        fields = '__all__'


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'


class UnitOfMeasureSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOfMeasure
        fields = '__all__'


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'


class WarehouseStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    class Meta:
        model = WarehouseStock
        fields = '__all__'


class InventoryProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    sub_category_name = serializers.CharField(source='sub_category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    uom_code = serializers.CharField(source='uom.code', read_only=True)
    warehouse_stocks = WarehouseStockSerializer(many=True, read_only=True)
    total_available_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryProduct
        fields = '__all__'

    def get_total_available_stock(self, obj):
        return sum([s.available_quantity for s in obj.warehouse_stocks.all()])


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class GoodsReceiptNoteItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = GoodsReceiptNoteItem
        fields = '__all__'


class GoodsReceiptNoteSerializer(serializers.ModelSerializer):
    items = GoodsReceiptNoteItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = GoodsReceiptNote
        fields = '__all__'


class MaterialRequisitionItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = MaterialRequisitionItem
        fields = '__all__'


class MaterialRequisitionSerializer(serializers.ModelSerializer):
    items = MaterialRequisitionItemSerializer(many=True, read_only=True)
    class Meta:
        model = MaterialRequisition
        fields = '__all__'


class MaterialTransferNoteItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = MaterialTransferNoteItem
        fields = '__all__'


class MaterialTransferNoteSerializer(serializers.ModelSerializer):
    items = MaterialTransferNoteItemSerializer(many=True, read_only=True)
    source_warehouse_name = serializers.CharField(source='source_warehouse.name', read_only=True)
    destination_warehouse_name = serializers.CharField(source='destination_warehouse.name', read_only=True)
    class Meta:
        model = MaterialTransferNote
        fields = '__all__'


class DeliveryChallanItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = DeliveryChallanItem
        fields = '__all__'


class DeliveryChallanSerializer(serializers.ModelSerializer):
    items = DeliveryChallanItemSerializer(many=True, read_only=True)
    dispatch_warehouse_name = serializers.CharField(source='dispatch_warehouse.name', read_only=True)
    class Meta:
        model = DeliveryChallan
        fields = '__all__'


class MaterialReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = MaterialReturnItem
        fields = '__all__'


class MaterialReturnSerializer(serializers.ModelSerializer):
    items = MaterialReturnItemSerializer(many=True, read_only=True)
    receiving_warehouse_name = serializers.CharField(source='receiving_warehouse.name', read_only=True)
    class Meta:
        model = MaterialReturn
        fields = '__all__'


class StockAdjustmentItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = StockAdjustmentItem
        fields = '__all__'


class StockAdjustmentSerializer(serializers.ModelSerializer):
    items = StockAdjustmentItemSerializer(many=True, read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    class Meta:
        model = StockAdjustment
        fields = '__all__'


class BOMComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component_product.name', read_only=True)
    component_sku = serializers.CharField(source='component_product.sku', read_only=True)
    uom_code = serializers.CharField(source='uom.code', read_only=True)
    class Meta:
        model = BOMComponent
        fields = '__all__'


class BillOfMaterialsSerializer(serializers.ModelSerializer):
    components = BOMComponentSerializer(many=True, read_only=True)
    finished_product_name = serializers.CharField(source='finished_product.name', read_only=True)
    components_count = serializers.IntegerField(source='components.count', read_only=True)

    class Meta:
        model = BillOfMaterials
        fields = '__all__'
