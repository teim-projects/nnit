import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  FileText,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:8000/api/quotation';

const TermsManagement = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sequence: 1,
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const token = localStorage.getItem('access'); // Changed from 'token' to 'access'
      const response = await axios.get(`${API_BASE_URL}/terms/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both array and paginated response
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setTerms(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching terms:', error);
      Swal.fire('Error', 'Failed to fetch terms. Please try logging in again.', 'error');
      setLoading(false);
    }
  };

  const handleOpenDialog = (term = null) => {
    if (term) {
      setEditingTerm(term);
      setFormData({
        title: term.title,
        content: term.content,
        sequence: term.sequence,
        is_active: term.is_active,
        is_default: term.is_default,
      });
    } else {
      setEditingTerm(null);
      const maxSequence = terms.length > 0 ? Math.max(...terms.map(t => t.sequence)) : 0;
      setFormData({
        title: '',
        content: '',
        sequence: maxSequence + 1,
        is_active: true,
        is_default: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTerm(null);
    setFormData({
      title: '',
      content: '',
      sequence: 1,
      is_active: true,
      is_default: false,
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Swal.fire('Validation Error', 'Title and Content are required', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('access'); // Changed from 'token' to 'access'
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingTerm) {
        await axios.patch(
          `${API_BASE_URL}/terms/${editingTerm.id}/`,
          formData,
          config
        );
        Swal.fire('Success', 'Term updated successfully', 'success');
      } else {
        await axios.post(
          `${API_BASE_URL}/terms/`,
          formData,
          config
        );
        Swal.fire('Success', 'Term created successfully', 'success');
      }

      fetchTerms();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving term:', error);
      Swal.fire('Error', 'Failed to save term', 'error');
    }
  };

  const handleDelete = async (termId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the term permanently',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('access'); // Changed from 'token' to 'access'
        await axios.delete(`${API_BASE_URL}/terms/${termId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Deleted!', 'Term has been deleted', 'success');
        fetchTerms();
      } catch (error) {
        console.error('Error deleting term:', error);
        Swal.fire('Error', 'Failed to delete term', 'error');
      }
    }
  };

  const handleToggleActive = async (term) => {
    try {
      const token = localStorage.getItem('access'); // Changed from 'token' to 'access'
      await axios.patch(
        `${API_BASE_URL}/terms/${term.id}/`,
        { is_active: !term.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTerms();
    } catch (error) {
      console.error('Error toggling active status:', error);
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  const handleToggleDefault = async (term) => {
    try {
      const token = localStorage.getItem('access'); // Changed from 'token' to 'access'
      await axios.patch(
        `${API_BASE_URL}/terms/${term.id}/`,
        { is_default: !term.is_default },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTerms();
    } catch (error) {
      console.error('Error toggling default status:', error);
      Swal.fire('Error', 'Failed to update default status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Terms & Conditions Management
          </h1>
          <p className="text-gray-600">
            Manage master terms & conditions for quotations
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add New Term
        </button>
      </div>

      {/* Stats Alert */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-blue-600 mt-0.5" size={20} />
        <div className="text-sm text-blue-800">
          <strong>Total:</strong> {Array.isArray(terms) ? terms.length : 0} terms | 
          <strong> Active:</strong> {Array.isArray(terms) ? terms.filter(t => t.is_active).length : 0} | 
          <strong> Default:</strong> {Array.isArray(terms) ? terms.filter(t => t.is_default).length : 0}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content Preview
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(terms) && terms.map((term) => (
              <tr key={term.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-gray-400 cursor-move" />
                    <span className="text-sm font-semibold text-gray-900">
                      {term.sequence}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {term.title}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 truncate max-w-md">
                    {term.content.substring(0, 100)}...
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleActive(term)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      term.is_active ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        term.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={term.is_default}
                    onChange={() => handleToggleDefault(term)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenDialog(term)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(term.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {openDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={handleCloseDialog}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingTerm ? 'Edit Term' : 'Add New Term'}
              </h2>

              <div className="space-y-4">
                {/* Sequence */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sequence Number
                  </label>
                  <input
                    type="number"
                    value={formData.sequence}
                    onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Switches */}
                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Include by Default in New Quotations
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseDialog}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Save size={18} />
                  {editingTerm ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsManagement;
