from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F, Q
from .models import (
    Category, SubCategory, Brand, UnitOfMeasure, Warehouse,
    InventoryProduct, WarehouseStock, Vendor,
    PurchaseOrder, PurchaseOrderItem,
    GoodsReceiptNote, GoodsReceiptNoteItem,
    MaterialRequisition, MaterialTransferNote,
    DeliveryChallan, MaterialReturn, StockAdjustment,
    BillOfMaterials, BOMComponent
)
from .serializers import (
    CategorySerializer, SubCategorySerializer, BrandSerializer, UnitOfMeasureSerializer,
    WarehouseSerializer, WarehouseStockSerializer, InventoryProductSerializer,
    VendorSerializer, PurchaseOrderSerializer, GoodsReceiptNoteSerializer,
    MaterialRequisitionSerializer, MaterialTransferNoteSerializer,
    DeliveryChallanSerializer, MaterialReturnSerializer, StockAdjustmentSerializer,
    BillOfMaterialsSerializer
)


class BaseInventoryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]


class CategoryViewSet(BaseInventoryViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    search_fields = ['name', 'code']


class SubCategoryViewSet(BaseInventoryViewSet):
    queryset = SubCategory.objects.all().order_by('name')
    serializer_class = SubCategorySerializer
    filterset_fields = ['category']


class BrandViewSet(BaseInventoryViewSet):
    queryset = Brand.objects.all().order_by('name')
    serializer_class = BrandSerializer


class UnitOfMeasureViewSet(BaseInventoryViewSet):
    queryset = UnitOfMeasure.objects.all().order_by('name')
    serializer_class = UnitOfMeasureSerializer


class WarehouseViewSet(BaseInventoryViewSet):
    queryset = Warehouse.objects.all().order_by('name')
    serializer_class = WarehouseSerializer


class InventoryProductViewSet(BaseInventoryViewSet):
    queryset = InventoryProduct.objects.all().select_related('category', 'sub_category', 'brand', 'uom').order_by('name')
    serializer_class = InventoryProductSerializer
    search_fields = ['sku', 'name', 'barcode']
    filterset_fields = ['item_type', 'category', 'brand', 'is_active']


class WarehouseStockViewSet(BaseInventoryViewSet):
    queryset = WarehouseStock.objects.all().select_related('product', 'warehouse')
    serializer_class = WarehouseStockSerializer
    filterset_fields = ['product', 'warehouse']


class VendorViewSet(BaseInventoryViewSet):
    queryset = Vendor.objects.all().order_by('name')
    serializer_class = VendorSerializer
    search_fields = ['name', 'code', 'gstin', 'contact_person']


class PurchaseOrderViewSet(BaseInventoryViewSet):
    queryset = PurchaseOrder.objects.all().select_related('vendor', 'warehouse').prefetch_related('items').order_by('-created_at')
    serializer_class = PurchaseOrderSerializer
    filterset_fields = ['status', 'vendor', 'warehouse']


class GoodsReceiptNoteViewSet(BaseInventoryViewSet):
    queryset = GoodsReceiptNote.objects.all().select_related('po', 'vendor', 'warehouse').prefetch_related('items').order_by('-created_at')
    serializer_class = GoodsReceiptNoteSerializer


class MaterialRequisitionViewSet(BaseInventoryViewSet):
    queryset = MaterialRequisition.objects.all().prefetch_related('items').order_by('-created_at')
    serializer_class = MaterialRequisitionSerializer
    filterset_fields = ['status', 'priority']


class MaterialTransferNoteViewSet(BaseInventoryViewSet):
    queryset = MaterialTransferNote.objects.all().select_related('source_warehouse', 'destination_warehouse').prefetch_related('items').order_by('-created_at')
    serializer_class = MaterialTransferNoteSerializer


class DeliveryChallanViewSet(BaseInventoryViewSet):
    queryset = DeliveryChallan.objects.all().select_related('dispatch_warehouse').prefetch_related('items').order_by('-created_at')
    serializer_class = DeliveryChallanSerializer


class MaterialReturnViewSet(BaseInventoryViewSet):
    queryset = MaterialReturn.objects.all().select_related('receiving_warehouse').prefetch_related('items').order_by('-created_at')
    serializer_class = MaterialReturnSerializer


class StockAdjustmentViewSet(BaseInventoryViewSet):
    queryset = StockAdjustment.objects.all().select_related('warehouse').prefetch_related('items').order_by('-created_at')
    serializer_class = StockAdjustmentSerializer


class BillOfMaterialsViewSet(BaseInventoryViewSet):
    queryset = BillOfMaterials.objects.all().select_related('finished_product').prefetch_related('components').order_by('-created_at')
    serializer_class = BillOfMaterialsSerializer

    @action(detail=True, methods=['post'], url_path='check-availability')
    def check_availability(self, request, pk=None):
        bom = self.get_object()
        units_to_produce = float(request.data.get('units', 1))
        warehouse_id = request.data.get('warehouse_id', None)

        report = []
        has_shortage = False

        for comp in bom.components.all():
            required_qty = float(comp.required_quantity) * units_to_produce
            stocks = WarehouseStock.objects.filter(product=comp.component_product)
            if warehouse_id:
                stocks = stocks.filter(warehouse_id=warehouse_id)
            
            available_qty = sum([float(s.available_quantity) for s in stocks])
            shortage_qty = max(0.0, required_qty - available_qty)
            if shortage_qty > 0:
                has_shortage = True

            report.append({
                'component_id': comp.component_product.id,
                'component_sku': comp.component_product.sku,
                'component_name': comp.component_product.name,
                'uom': comp.uom.code if comp.uom else 'PCS',
                'required_qty': required_qty,
                'available_qty': available_qty,
                'shortage_qty': shortage_qty,
                'status': 'shortage' if shortage_qty > 0 else 'available'
            })

        return Response({
            'bom_id': bom.id,
            'bom_name': bom.name,
            'finished_product': bom.finished_product.name,
            'units_requested': units_to_produce,
            'can_produce': not has_shortage,
            'components': report
        })
