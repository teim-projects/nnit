import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// All options matching corporate brochure
const HEIGHT_AVAILABLE_OPTIONS = [4200, 4100, 4000, 3900, 3800, 3700, 3600, 3500, 3400, 6700];
const UPPER_CAR_HEIGHT_OPTIONS = [2000, 1900, 1800, 1700, 1600];
const GROUND_CAR_HEIGHT_OPTIONS = [2000, 1900, 1800, 1700, 1600];

const PLATFORM_WIDTH_OPTIONS = [2400, 2300, 2200, 2100, 2000];
const CAR_WIDTH_MIRROR_OPTIONS = [2200, 2100, 2000, 1900, 1800];
const TOTAL_WIDTH_OPTIONS = [2800, 2700, 2600, 2500, 2400];

const TOTAL_LENGTH_OPTIONS = [5100, 5000, 3800];
const PLATFORM_LENGTH_OPTIONS = [3800, 5000];
const CAR_LENGTH_OPTIONS = [5000, 3800];

const PIT_DEPTH_OPTIONS = [2000];
const PIT_CAR_HEIGHT_OPTIONS = [2000];
const PLATFORM_TOP_OPTIONS = [2400, 2300, 2200];
const PLATFORM_MIDDLE_OPTIONS = [2400, 2300, 2200];

export default function ProductRequirementForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    category_id: '',
    product_id: '',
    
    // Minimum Site Requirements (mm)
    min_height: '',
    min_width: '',
    min_length: '',

    // Detailed Specifications (mm)
    upper_car_height: '',
    ground_car_height: '',
    pit_depth_available: '',
    pit_car_height: '',
    car_width_mirror_open: '',
    total_width_required: '',
    platform_length: '',
    car_length: '',
    platform_width_top: '',
    platform_width_middle: '',

    price: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const getToken = () => 
    localStorage.getItem('access') || 
    localStorage.getItem('access_token') || 
    localStorage.getItem('token') || 
    localStorage.getItem('authToken');

  useEffect(() => {
    fetchCategories();
    fetchParkingProducts();
    if (isEditMode) {
      fetchRequirement();
    }
  }, [id]);

  useEffect(() => {
    // Filter products when category changes
    if (formData.category_id) {
      const catId = parseInt(formData.category_id);
      const selectedCat = categories.find(c => c.id === catId);
      const filtered = products.filter(p => {
        const pCatId = typeof p.category === 'object' ? p.category?.id : p.category;
        if (pCatId !== undefined && pCatId !== null) {
          return parseInt(pCatId) === catId;
        }
        if (p.category_id !== undefined && p.category_id !== null) {
          return parseInt(p.category_id) === catId;
        }
        if (p.category_name && selectedCat) {
          const pName = p.category_name.trim().toLowerCase();
          return pName === (selectedCat.display_name || '').trim().toLowerCase() ||
                 pName === (selectedCat.name || '').trim().toLowerCase();
        }
        return false;
      });
      setFilteredProducts(filtered);
      // Reset product selection when category changes
      if (formData.product_id && !filtered.find(p => p.id === parseInt(formData.product_id))) {
        setFormData(prev => ({ ...prev, product_id: '' }));
      }
    } else {
      setFilteredProducts([]);
    }
  }, [formData.category_id, products, categories]);

  // Auto-fill default site requirements from product master if blank
  useEffect(() => {
    if (formData.product_id && !isEditMode) {
      const prod = products.find(p => p.id === parseInt(formData.product_id));
      if (prod) {
        setFormData(prev => ({
          ...prev,
          min_length: prev.min_length || prod.min_length || '',
          min_width: prev.min_width || prod.min_width || '',
          min_height: prev.min_height || prod.min_height || '',
          price: prev.price || prod.base_price || ''
        }));
      }
    }
  }, [formData.product_id, products]);

  const fetchCategories = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${baseApi}/parking/categories/?is_active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cats = response.data.results || response.data;
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchParkingProducts = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${baseApi}/parking/products/?is_active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prods = response.data.results || response.data;
      setProducts(prods);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchRequirement = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${baseApi}/parking/requirements/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      setFormData({
        category_id: data.category || '',
        product_id: data.product || '',

        min_height: data.height_available ?? data.height ?? '',
        min_width: data.platform_width ?? data.width ?? '',
        min_length: data.total_available_length ?? data.length ?? '',

        upper_car_height: data.upper_car_height ?? '',
        ground_car_height: data.ground_car_height ?? '',
        pit_depth_available: data.pit_depth_available ?? '',
        pit_car_height: data.pit_car_height ?? '',
        car_width_mirror_open: data.car_width_mirror_open ?? '',
        total_width_required: data.total_width_required ?? '',
        platform_length: data.platform_length ?? '',
        car_length: data.car_length ?? '',
        platform_width_top: data.platform_width_top ?? '',
        platform_width_middle: data.platform_width_middle ?? '',

        price: data.price ?? ''
      });
    } catch (error) {
      console.error('Error fetching requirement:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.product_id) newErrors.product_id = 'Product is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    const submitData = {
      category_id: parseInt(formData.category_id),
      product_id: parseInt(formData.product_id),

      height: formData.min_height ? parseFloat(formData.min_height) : null,
      width: formData.min_width ? parseFloat(formData.min_width) : null,
      length: formData.min_length ? parseFloat(formData.min_length) : null,

      height_available: formData.min_height ? parseFloat(formData.min_height) : null,
      platform_width: formData.min_width ? parseFloat(formData.min_width) : null,
      total_available_length: formData.min_length ? parseFloat(formData.min_length) : null,

      upper_car_height: formData.upper_car_height ? parseFloat(formData.upper_car_height) : null,
      ground_car_height: formData.ground_car_height ? parseFloat(formData.ground_car_height) : null,
      pit_depth_available: formData.pit_depth_available ? parseFloat(formData.pit_depth_available) : null,
      pit_car_height: formData.pit_car_height ? parseFloat(formData.pit_car_height) : null,
      car_width_mirror_open: formData.car_width_mirror_open ? parseFloat(formData.car_width_mirror_open) : null,
      total_width_required: formData.total_width_required ? parseFloat(formData.total_width_required) : null,
      platform_length: formData.platform_length ? parseFloat(formData.platform_length) : null,
      car_length: formData.car_length ? parseFloat(formData.car_length) : null,
      platform_width_top: formData.platform_width_top ? parseFloat(formData.platform_width_top) : null,
      platform_width_middle: formData.platform_width_middle ? parseFloat(formData.platform_width_middle) : null,

      price: formData.price ? parseFloat(formData.price) : null
    };

    try {
      const token = getToken();
      if (isEditMode) {
        await axios.put(`${baseApi}/parking/requirements/${id}/`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        alert('Product requirement updated successfully!');
      } else {
        await axios.post(`${baseApi}/parking/requirements/`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        alert('Product requirement added successfully!');
      }
      navigate('/product-requirements');
    } catch (error) {
      console.error('Error saving product:', error);
      alert(`Failed to save: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit' : 'Add'} Product Requirement
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Select category, product name, and choose standard brochure specifications or enter custom values
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Category & Product Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white transition-all ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.display_name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  disabled={!formData.category_id}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white transition-all ${
                    errors.product_id ? 'border-red-500' : 'border-gray-300'
                  } ${!formData.category_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {formData.category_id ? 'Select Product' : 'Select Category First'}
                  </option>
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
                {errors.product_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>
                )}
              </div>
            </div>

            {/* Minimum Site Requirements (Brochure Options + Custom Input) */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Minimum Site Requirements
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Min Height / Height Available (H) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Min. Height (H) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="min_height"
                    value={formData.min_height}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm mb-2"
                  >
                    <option value="">Select Height (H)</option>
                    {HEIGHT_AVAILABLE_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="min_height"
                    value={formData.min_height}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="Or type custom mm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                {/* Min Width / Platform Width (W) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Min. Width (W) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="min_width"
                    value={formData.min_width}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm mb-2"
                  >
                    <option value="">Select Width (W)</option>
                    {PLATFORM_WIDTH_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="min_width"
                    value={formData.min_width}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="Or type custom mm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                {/* Min Length / Total Available Length */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Min. Length <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="min_length"
                    value={formData.min_length}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm mb-2"
                  >
                    <option value="">Select Length</option>
                    {TOTAL_LENGTH_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="min_length"
                    value={formData.min_length}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="Or type custom mm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

              </div>
            </div>

            {/* Complete Brochure Specification Options */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">
                Detailed Brochure Specification Options
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                
                {/* Upper Car Height (G+1) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Upper Car Height (G+1)
                  </label>
                  <select
                    name="upper_car_height"
                    value={formData.upper_car_height}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Upper Car Height</option>
                    {UPPER_CAR_HEIGHT_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="upper_car_height"
                    value={formData.upper_car_height}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Ground Car Height */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ground Car Height
                  </label>
                  <select
                    name="ground_car_height"
                    value={formData.ground_car_height}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Ground Car Height</option>
                    {GROUND_CAR_HEIGHT_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="ground_car_height"
                    value={formData.ground_car_height}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Car Width (Mirror Open) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Car Width (Mirror Open)
                  </label>
                  <select
                    name="car_width_mirror_open"
                    value={formData.car_width_mirror_open}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Car Width</option>
                    {CAR_WIDTH_MIRROR_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="car_width_mirror_open"
                    value={formData.car_width_mirror_open}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Total Width Required */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Total Width Required
                  </label>
                  <select
                    name="total_width_required"
                    value={formData.total_width_required}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Total Width</option>
                    {TOTAL_WIDTH_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="total_width_required"
                    value={formData.total_width_required}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Platform Length */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Platform Length
                  </label>
                  <select
                    name="platform_length"
                    value={formData.platform_length}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Platform Length</option>
                    {PLATFORM_LENGTH_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="platform_length"
                    value={formData.platform_length}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Car Length */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Car Length
                  </label>
                  <select
                    name="car_length"
                    value={formData.car_length}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Car Length</option>
                    {CAR_LENGTH_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="car_length"
                    value={formData.car_length}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Pit Depth Available (P1) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pit Depth Available (P1)
                  </label>
                  <select
                    name="pit_depth_available"
                    value={formData.pit_depth_available}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Pit Depth (P1)</option>
                    {PIT_DEPTH_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="pit_depth_available"
                    value={formData.pit_depth_available}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Pit Car Height (P2) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pit Car Height (P2)
                  </label>
                  <select
                    name="pit_car_height"
                    value={formData.pit_car_height}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Pit Car Height (P2)</option>
                    {PIT_CAR_HEIGHT_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="pit_car_height"
                    value={formData.pit_car_height}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Platform Width (TOP P) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Platform Width (TOP P)
                  </label>
                  <select
                    name="platform_width_top"
                    value={formData.platform_width_top}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-1"
                  >
                    <option value="">Select Platform Width (TOP P)</option>
                    {PLATFORM_TOP_OPTIONS.map((val) => (
                      <option key={val} value={val}>{val} mm</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="platform_width_top"
                    value={formData.platform_width_top}
                    onChange={handleChange}
                    placeholder="Or custom mm"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

              </div>
            </div>

            {/* Pricing Section */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (₹)
              </label>
              <div className="relative max-w-md">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="Enter price"
                  className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <span className="text-gray-400 text-sm">₹ INR</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? 'Saving...' : isEditMode ? 'Update Requirement' : 'Add Requirement'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/product-requirements')}
                className="px-8 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
