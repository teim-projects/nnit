import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function AddCategoryModal({ open, onClose, onSuccess, baseApi, token }) {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    icon: '🏗️'
  });
  const [loading, setLoading] = useState(false);

  const categoryOptions = [
    { value: 'stack_parking', label: 'Stack Parking', icon: '🏗️' },
    { value: 'puzzle_parking', label: 'Puzzle Parking', icon: '🧩' },
    { value: 'tower_parking', label: 'Tower Parking', icon: '🏢' },
    { value: 'pit_parking', label: 'Pit Parking', icon: '⬇️' },
    { value: 'cantilever', label: 'Cantilever Parking', icon: '🔧' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select a category'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${baseApi}/parking/categories/`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Category added successfully',
        timer: 1500,
        showConfirmButton: false
      });
      
      onSuccess(response.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to add category'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (option) => {
    setFormData({
      ...formData,
      name: option.value,
      display_name: option.label,
      icon: option.icon
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1050] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Category</h2>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleCategorySelect(option)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.name === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className={`font-medium ${
                    formData.name === option.value ? 'text-primary-700' : 'text-gray-700'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="followup-form-textarea"
              rows={3}
              placeholder="Describe this category..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
