from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, SubCategoryViewSet, BrandViewSet, UnitOfMeasureViewSet,
    WarehouseViewSet, InventoryProductViewSet, WarehouseStockViewSet,
    VendorViewSet, PurchaseOrderViewSet, GoodsReceiptNoteViewSet,
    MaterialRequisitionViewSet, MaterialTransferNoteViewSet,
    DeliveryChallanViewSet, MaterialReturnViewSet, StockAdjustmentViewSet,
    BillOfMaterialsViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'sub-categories', SubCategoryViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'uom', UnitOfMeasureViewSet)
router.register(r'warehouses', WarehouseViewSet)
router.register(r'products', InventoryProductViewSet)
router.register(r'stock', WarehouseStockViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'grn', GoodsReceiptNoteViewSet)
router.register(r'material-requisitions', MaterialRequisitionViewSet)
router.register(r'mtn', MaterialTransferNoteViewSet)
router.register(r'delivery-challans', DeliveryChallanViewSet)
router.register(r'material-returns', MaterialReturnViewSet)
router.register(r'stock-adjustments', StockAdjustmentViewSet)
router.register(r'bom', BillOfMaterialsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
