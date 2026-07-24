import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/quotation';

const QuotationTermsSelector = ({ quotationId, onTermsChange }) => {
  const [masterTerms, setMasterTerms] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState([]);
  const [quotationTerms, setQuotationTerms] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTerm, setEditingTerm] = useState(null);
  const [customTerm, setCustomTerm] = useState({ title: '', content: '', sequence: 1 });

  useEffect(() => {
    fetchMasterTerms();
    if (quotationId) {
      fetchQuotationTerms();
    }
  }, [quotationId]);

  const fetchMasterTerms = async () => {
    try {
      const token = localStorage.getItem('access');
      const response = await axios.get(`${API_BASE_URL}/terms/?is_active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both array and paginated response
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setMasterTerms(data);
      
      if (!quotationId) {
        const defaults = data.filter(t => t.is_default).map(t => t.id);
        setSelectedTerms(defaults);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching master terms:', error);
      setLoading(false);
    }
  };

  const fetchQuotationTerms = async () => {
    try {
      const token = localStorage.getItem('access');
      const response = await axios.get(
        `${API_BASE_URL}/quotation-terms/?quotation=${quotationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Handle both array and paginated response
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setQuotationTerms(data);
      setSelectedTerms(data.filter(t => t.master_term).map(t => t.master_term));
    } catch (error) {
      console.error('Error fetching quotation terms:', error);
    }
  };

  const handleToggleTerm = (termId) => {
    setSelectedTerms(prev =>
      prev.includes(termId)
        ? prev.filter(id => id !== termId)
        : [...prev, termId]
    );
  };

  const handleApplyDefaults = async () => {
    if (!quotationId) {
      const defaults = masterTerms.filter(t => t.is_default).map(t => t.id);
      setSelectedTerms(defaults);
      return;
    }

    try {
      const token = localStorage.getItem('access');
      await axios.post(
        `${API_BASE_URL}/quotation-terms/apply-defaults/`,
        { quotation: quotationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQuotationTerms();
      alert('Default terms applied successfully!');
    } catch (error) {
      console.error('Error applying defaults:', error);
      alert('Error applying default terms');
    }
  };

  const handleSaveTerms = async () => {
    if (!quotationId) {
      if (onTermsChange) {
        onTermsChange(selectedTerms);
      }
      return;
    }

    try {
      const token = localStorage.getItem('access');
      const termsToCreate = selectedTerms.map((termId, index) => ({
        master_term: termId,
        sequence: index + 1
      }));

      await axios.post(
        `${API_BASE_URL}/quotation-terms/bulk-create/`,
        {
          quotation: quotationId,
          terms: termsToCreate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchQuotationTerms();
      alert('Terms saved successfully!');
    } catch (error) {
      console.error('Error saving terms:', error);
      alert('Error saving terms');
    }
  };

  const handleDeleteQuotationTerm = async (termId) => {
    if (!window.confirm('Remove this term from quotation?')) return;

    try {
      const token = localStorage.getItem('access');
      await axios.delete(`${API_BASE_URL}/quotation-terms/${termId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuotationTerms();
      alert('Term removed successfully!');
    } catch (error) {
      console.error('Error deleting term:', error);
      alert('Error removing term');
    }
  };

  const handleEditTerm = (term) => {
    setEditingTerm(term);
    setCustomTerm({
      title: term.title,
      content: term.content,
      sequence: term.sequence
    });
  };

  const handleUpdateTerm = async () => {
    if (!editingTerm) return;

    try {
      const token = localStorage.getItem('access');
      await axios.patch(
        `${API_BASE_URL}/quotation-terms/${editingTerm.id}/`,
        {
          ...customTerm,
          is_customized: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingTerm(null);
      setCustomTerm({ title: '', content: '', sequence: 1 });
      fetchQuotationTerms();
      alert('Term updated successfully!');
    } catch (error) {
      console.error('Error updating term:', error);
      alert('Error updating term');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Terms & Conditions</h3>
          {quotationTerms.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {quotationTerms.length} terms
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyDefaults}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Apply Defaults
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t pt-4">
          {quotationId && quotationTerms.length > 0 ? (
            <div>
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
                <AlertCircle className="text-blue-600 mt-0.5" size={18} />
                <p className="text-sm text-blue-800">
                  {quotationTerms.length} terms are currently attached to this quotation.
                </p>
              </div>
              
              <div className="space-y-2">
                {quotationTerms.map((term) => (
                  <div key={term.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {term.sequence}. {term.title}
                          {term.is_customized && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                              Customized
                            </span>
                          )}
                        </h4>
                        
                        {editingTerm?.id === term.id ? (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              value={customTerm.title}
                              onChange={(e) => setCustomTerm({ ...customTerm, title: e.target.value })}
                              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Title"
                            />
                            <textarea
                              value={customTerm.content}
                              onChange={(e) => setCustomTerm({ ...customTerm, content: e.target.value })}
                              rows={4}
                              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Content"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpdateTerm}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                <Check size={16} />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingTerm(null)}
                                className="px-3 py-1.5 border rounded hover:bg-gray-50 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">
                            {term.content.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                      
                      {!editingTerm && (
                        <div className="flex gap-1 ml-4">
                          <button
                            onClick={() => handleEditTerm(term)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuotationTerm(term.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
                <AlertCircle className="text-blue-600 mt-0.5" size={18} />
                <p className="text-sm text-blue-800">
                  Select terms to include in this quotation. Default terms are pre-selected.
                </p>
              </div>
              
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {masterTerms.map((term) => (
                  <label
                    key={term.id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTerms.includes(term.id)}
                      onChange={() => handleToggleTerm(term.id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {term.sequence}. {term.title}
                        </span>
                        {term.is_default && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {term.content.substring(0, 100)}...
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {selectedTerms.length} of {masterTerms.length} terms selected
                </span>
                {quotationId && (
                  <button
                    onClick={handleSaveTerms}
                    disabled={selectedTerms.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Save Selected Terms
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuotationTermsSelector;
