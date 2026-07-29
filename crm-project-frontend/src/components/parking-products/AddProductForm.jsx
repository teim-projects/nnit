import React, { useState, useEffect } from 'react';
import { MdArrowBack } from 'react-icons/md';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function AddProductForm({ open, onClose, onSuccess, product, categories, baseApi, token }) {
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
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
    image_url: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        category_id: product.category || '',
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
        image_url: product.image_url || product.display_image || product.image || ''
      });
    } else {
      setFormData({
        product_name: '',
        category_id: '',
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
        image_url: ''
      });
    }
  }, [product, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image_url: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
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
    <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {product ? 'Edit Parking Product' : 'Add New Parking Product'}
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Fill in product specifications, capacity, pricing, and image details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">

          {/* Inner Scrollable Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">

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
                    <option value="">Select Category</option>

                    {Array.isArray(categories) && categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Technical Specifications</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Levels <span className="text-red-500">*</span>
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
                    Operation Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="operation_type"
                    value={formData.operation_type}
                    onChange={handleChange}
                    className="followup-form-select"
                  >
                    <option value="">Select Type</option>
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
                    <option value="">Select Automation</option>
                    <option value="semi_automatic">Semi Automatic</option>
                    <option value="fully_automatic">Fully Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Pit Required? <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="pit_required"
                    value={formData.pit_required}
                    onChange={handleChange}
                    className="followup-form-select"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="followup-form-field mb-0">
                  <label className="followup-form-label">
                    Load Capacity (KG) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="load_capacity"
                    value={formData.load_capacity}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="e.g., 2000"
                    step="0.01"
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
                    placeholder="e.g., 2"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Minimum Site Requirements */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Minimum Site Requirements</h3>
              
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

            {/* Price & Image */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              {/* Price */}
              <div className="followup-form-field">
                <label className="followup-form-label">
                  Price (₹)
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

              {/* Product Image Field */}
              <div className="followup-form-field">
                <label className="followup-form-label">
                  Product Image (Upload File or URL)
                </label>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer"
                    />
                  </div>
                  <div className="text-xs font-black text-gray-400 text-center uppercase tracking-widest">— OR PASTE IMAGE URL —</div>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="followup-form-input"
                    placeholder="Paste Image URL (https://... or data:image/...)"
                  />
                  {formData.image_url && (
                    <div className="mt-2 flex items-center gap-4">
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-blue-500 shadow-md">
                        <img
                          src={formData.image_url}
                          alt="Product Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-700 shadow"
                          title="Remove Image"
                        >
                          ✕
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">✓ Image Preview Loaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Modal Action Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold shadow-sm transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
