import React, { useState, useEffect, useMemo } from 'react';
import { MdAdd, MdCategory } from 'react-icons/md';
import axios from 'axios';
import Swal from 'sweetalert2';
import Base from '../components/Base';
import AddCategoryModal from '../components/parking-products/AddCategoryModal';
import AddProductForm from '../components/parking-products/AddProductForm';

export default function ParkingProducts() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";
  
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

  // ✅ FIXED: handle paginated response
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_API}/parking/categories/`, { headers });
      console.log("Categories API:", response.data); // debug log

      // If response.data is an array, use it directly; otherwise extract results
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // fallback to empty array
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
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Parking Products</h2>
              <p className="text-sm text-gray-600 mt-1">Manage parking solution catalog</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <MdCategory className="w-4 h-4" />
                Add Category
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <MdAdd className="w-5 h-5" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Category Cards – now safe even if categories is not an array */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category.id}
                className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-2xl">{category.icon || '🏗️'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {category.display_name}
                    </h3>
                    <p className="text-2xl font-bold text-primary-600 mt-1">
                      {getCategoryCount(category.display_name)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-6 text-gray-500">
              No categories found. Add a category to get started.
            </div>
          )}
        </div>

        {/* Product Catalog Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Product Catalog</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Levels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Automation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Pit Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Min. Dimensions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                      No products found. Add your first parking product!
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                        {product.product_code && (
                          <div className="text-xs text-gray-500">{product.product_code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.category_name === 'Stack Parking' ? 'bg-blue-100 text-blue-700' :
                          product.category_name === 'Puzzle Parking' ? 'bg-purple-100 text-purple-700' :
                          product.category_name === 'Tower Parking' ? 'bg-green-100 text-green-700' :
                          product.category_name === 'Pit Parking' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {product.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="flex items-center gap-1">
                          🚗 {product.car_capacity} cars
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {product.levels}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                        {product.operation_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                        {product.automation_type?.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          product.pit_required
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {product.pit_required ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {product.min_length}m × {product.min_width}m × {product.min_height}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.base_price ? `₹${Number(product.base_price).toLocaleString('en-IN')}L` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
          categories={categories} // now always an array
          baseApi={BASE_API}
          token={token}
        />
      )}
    </Base>
  );
}