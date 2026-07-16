import React, { useState, useEffect } from 'react';
import { MdClose, MdArrowBack } from 'react-icons/md';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function AddProductForm({ open, onClose, onSuccess, product, categories, baseApi, token }) {
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    category_id: '',
    description: '',
    levels: '',
    operation_type: '',
    automation_type: '',
    pit_required: '',
    load_capacity: '',
    min_height: '',
    min_width: '',
    min_length: '',
    car_capacity: '',
    base_price: '',
    features: [],
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        product_code: product.product_code || '',
        // product.category is the category ID (read‑only PK)
        category_id: product.category || '',
        description: product.description || '',
        levels: product.levels || '',
        operation_type: product.operation_type || '',
        automation_type: product.automation_type || '',
        pit_required: product.pit_required ? 'yes' : 'no',
        load_capacity: product.load_capacity || '',
        min_height: product.min_height || '',
        min_width: product.min_width || '',
        min_length: product.min_length || '',
        car_capacity: product.car_capacity || '',
        base_price: product.base_price || '',
        features: product.features || [],
        is_active: product.is_active !== undefined ? product.is_active : true
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    const required = [
      'product_name', 'category_id', 'levels', 'operation_type',
      'automation_type', 'pit_required', 'load_capacity',
      'min_height', 'min_width', 'min_length', 'car_capacity'
    ];

    for (const field of required) {
      if (!formData[field] || formData[field] === '') {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: `Please fill in ${field.replace('_', ' ')}`
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      // Build payload – category_id is what the serializer expects (write‑only)
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        levels: parseInt(formData.levels),
        pit_required: formData.pit_required === 'yes',
        load_capacity: parseFloat(formData.load_capacity),
        min_height: parseFloat(formData.min_height),
        min_width: parseFloat(formData.min_width),
        min_length: parseFloat(formData.min_length),
        car_capacity: parseInt(formData.car_capacity),
        base_price: formData.base_price ? parseFloat(formData.base_price) : null
      };

      const url = product
        ? `${baseApi}/parking/products/${product.id}/`
        : `${baseApi}/parking/products/`;
      
      const method = product ? 'put' : 'post';

      const response = await axios[method](url, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: product ? 'Product updated successfully' : 'Product added successfully',
        timer: 1500,
        showConfirmButton: false
      });

      onSuccess(response.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save product'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MdArrowBack className="w-5 h-5" />
              <span className="font-medium">Back to Products</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {product ? 'Edit Parking Product' : 'Add New Parking Product'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="e.g., 2DP 101"
                  />
                </div>

                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="followup-form-select"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Number of Levels <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="levels"
                    value={formData.levels}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="e.g., 2"
                    min="1"
                  />
                </div>

                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Car Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="car_capacity"
                    value={formData.car_capacity}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="e.g., 4"
                    min="1"
                  />
                </div>

                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Load Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="load_capacity"
                    value={formData.load_capacity}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="e.g., 2000 kg"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Operation Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="operation_type"
                    value={formData.operation_type}
                    onChange={handleChange}
                    className="followup-form-select"
                  >
                    <option value="">Select type</option>
                    <option value="hydraulic">Hydraulic</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Automation Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="automation_type"
                    value={formData.automation_type}
                    onChange={handleChange}
                    className="followup-form-select"
                  >
                    <option value="">Select type</option>
                    <option value="fully_automatic">Fully Automatic</option>
                    <option value="semi_automatic">Semi Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="followup-form-field mb-0">
                <label className="followup-form-label">
                  Pit Required <span className="text-red-500">*</span>
                </label>
                <select
                  name="pit_required"
                  value={formData.pit_required}
                  onChange={handleChange}
                  className="followup-form-select"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Minimum Site Requirements */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Minimum Site Requirements</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Min. Length <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="min_length"
                    value={formData.min_length}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="e.g., 5.5 m"
                    step="0.01"
                  />
                </div>

                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Min. Width <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="min_width"
                    value={formData.min_width}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="e.g., 2.5 m"
                    step="0.01"
                  />
                </div>

                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Min. Height <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="min_height"
                    value={formData.min_height}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="e.g., 3.5 m"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="followup-form-field mb-0">
              <label className="followup-form-label">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                className="followup-form-input"
                placeholder="e.g., 350000"
                step="0.01"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-8"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-8"
                disabled={loading}
              >
                {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}