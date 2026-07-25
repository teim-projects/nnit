import React, { useState, useEffect, useMemo } from 'react';
import { MdAdd, MdCategory, MdSearch, MdEdit, MdDelete } from 'react-icons/md';
import axios from 'axios';
import Swal from 'sweetalert2';
import Base from '../components/Base';
import AddCategoryModal from '../components/parking-products/AddCategoryModal';
import AddProductForm from '../components/parking-products/AddProductForm';

export default function ParkingProducts() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  console.log("ParkingProducts BASE_API =", BASE_API);

  if (!BASE_API) {
    console.error("ParkingProducts: VITE_BASE_API_URL is not defined!");
  }
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_API}/parking/categories/`, { headers });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_API}/parking/products/`, { headers });
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load products'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryCount = (categoryName) => {
    return products.filter(p => p.category_name === categoryName).length;
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${BASE_API}/parking/products/${productId}/`, { headers });
        Swal.fire({
          icon: 'success',
          text: 'Product deleted successfully',
          timer: 1500,
          showConfirmButton: false
        });
        fetchProducts();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete product'
        });
      }
    }
  };

  return (
    <Base title="Parking Products">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Parking Products</h2>
              <p className="text-sm font-semibold text-gray-500 mt-1">Manage parking solution catalog</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="btn-secondary flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold text-sm transition"
              >
                <MdCategory className="w-5 h-5" />
                Add Category
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition shadow-sm"
              >
                <MdAdd className="w-5 h-5" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category.id}
                className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-2xl">{category.icon || '🏗️'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {category.display_name}
                    </h3>
                    <p className="text-2xl font-black text-blue-600 mt-0.5">
                      {getCategoryCount(category.display_name)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-6 text-gray-500 bg-white rounded-xl border border-gray-200 font-medium">
              No categories found. Add a category to get started.
            </div>
          )}
        </div>

        {/* Product Catalog - Enhanced Larger & Bold Cards */}
        <div>
          <div className="mb-5">
            <h3 className="text-xl font-bold text-gray-900">Product Catalog</h3>
          </div>

          {loading ? (
            <div className="bg-white p-12 text-center text-gray-500 rounded-2xl shadow-sm border border-gray-100 font-semibold">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-500 rounded-2xl shadow-sm border border-gray-100 font-semibold">
              No products found. Add your first parking product!
            </div>
          ) : (
            /* Reduced to maximum 2 columns on extra-large screens to increase card size */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Section with Larger Padding */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Enlarged Image / Thumbnail Placeholder */}
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 shadow-inner">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl">🚗</span>
                          )}
                        </div>

                        {/* Title & Code */}
                        <div className="space-y-1">
                          <h4 className="font-black text-gray-900 text-lg leading-snug">
                            {product.product_name}
                          </h4>
                          <p className="text-xs font-extrabold text-blue-600 uppercase tracking-wide">
                            CODE: {product.product_code || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Status & Category Badges */}
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className="px-3 py-1 text-[11px] font-black tracking-wider text-emerald-700 bg-emerald-100/80 rounded-full uppercase">
                          ACTIVE
                        </span>
                        {product.category_name && (
                          <span className="px-3 py-1 text-[11px] font-black tracking-wider text-blue-700 bg-blue-100/80 rounded-full">
                            {product.category_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bold & Detailed Specification Text */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {product.description ? (
                        <p className="text-sm font-semibold text-gray-700 leading-relaxed line-clamp-3">
                          {product.description}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                          <span className="font-bold text-gray-900">Capacity:</span> <strong className="text-blue-700">{product.car_capacity} cars</strong> | 
                          <span className="font-bold text-gray-900"> Levels:</span> <strong className="text-gray-900">{product.levels}</strong> | 
                          <span className="font-bold text-gray-900"> Operation:</span> <strong className="text-gray-900">{product.operation_type}</strong> | 
                          <span className="font-bold text-gray-900"> Pit Required:</span> <strong className="text-gray-900">{product.pit_required ? 'Yes' : 'No'}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats & Action Bar */}
                  <div className="py-4 px-6 border-t border-gray-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      {/* Base Price */}
                      <div>
                        <span className="block text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          PRICE
                        </span>
                        <span className="text-base font-black text-gray-900">
                          {product.base_price
                            ? `₹${parseFloat(product.base_price).toFixed(2)}L`
                            : '—'}
                        </span>
                      </div>

                      {/* Capacity */}
                      <div>
                        <span className="block text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          CAPACITY
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          {product.car_capacity} Cars
                        </span>
                      </div>

                      {/* Dimensions */}
                      <div>
                        <span className="block text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          MIN. DIM (LxWxH)
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          {product.min_length && product.min_width && product.min_height
                            ? `${product.min_length}x${product.min_width}x${product.min_height}m`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 text-gray-500">
                      <button
                        onClick={() => handleEditProduct(product)}
                        title="View Details"
                        className="hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <MdSearch className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        title="Edit Product"
                        className="hover:text-slate-900 p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <MdEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete Product"
                        className="hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <AddCategoryModal
          open={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => {
            fetchCategories();
            setShowCategoryModal(false);
          }}
          baseApi={BASE_API}
          token={token}
        />
      )}

      {/* Add/Edit Product Form */}
      {showProductForm && (
        <AddProductForm
          open={showProductForm}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            fetchProducts();
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          categories={categories}
          baseApi={BASE_API}
          token={token}
        />
      )}
    </Base>
  );
}