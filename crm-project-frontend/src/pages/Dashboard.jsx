import React, { useEffect, useState } from "react";
import Base from "../components/Base";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { 
  FiUsers, 
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPackage,
  FiFileText,
  FiArrowUp,
  FiPhone,
} from "react-icons/fi";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  
  console.log("Dashboard BASE_API =", BASE_API);
  
  if (!BASE_API) {
    console.error("❌ VITE_BASE_API_URL is not defined in environment variables!");
  }
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalCustomers: 0,
    totalQuotations: 0,
    totalProducts: 0,
    openLeads: 0,
    closedLeads: 0,
    overdueFollowups: 0,
    todayFollowups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [leadStatusData, setLeadStatusData] = useState([]);
  const [sourceData, setSourceData] = useState([]);

  const token = localStorage.getItem("access") || localStorage.getItem("token") || "";

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        console.log('Fetching dashboard data...');
        console.log('BASE_API:', BASE_API);
        console.log('Token available:', !!token);

        // Fetch all stats in parallel (with error handling for each)
        const fetchWithErrorHandling = async (url, name) => {
          try {
            const res = await fetch(url, { headers });
            if (!res.ok) {
              console.warn(`${name} API returned ${res.status}`);
              return null;
            }
            return await res.json();
          } catch (err) {
            console.warn(`${name} API failed:`, err.message);
            return null;
          }
        };

        const [leads, customers, quotations, products] = await Promise.all([
          fetchWithErrorHandling(`${BASE_API}/lead/lead/?page_size=1000`, 'Leads'),
          fetchWithErrorHandling(`${BASE_API}/lead/customer/?page_size=1000`, 'Customers'),
          fetchWithErrorHandling(`${BASE_API}/api/quotation/quotation/?page_size=1000`, 'Quotations'),
          fetchWithErrorHandling(`${BASE_API}/parking/products/?page_size=100`, 'Products'),
        ]);

        console.log('Leads data:', leads);
        console.log('Customers data:', customers);
        console.log('Quotations data:', quotations);
        console.log('Products data:', products);

        const leadsArray = leads ? (Array.isArray(leads) ? leads : leads?.results || []) : [];
        const customersArray = customers ? (Array.isArray(customers) ? customers : customers?.results || []) : [];
        const quotationsArray = quotations ? (Array.isArray(quotations) ? quotations : quotations?.results || []) : [];
        const productsArray = products ? (Array.isArray(products) ? products : products?.results || []) : [];

        console.log('Parsed arrays:');
        console.log('- Leads:', leadsArray.length);
        console.log('- Customers:', customersArray.length);
        console.log('- Quotations:', quotationsArray.length);
        console.log('- Products:', productsArray.length);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const openLeads = leadsArray.filter(l => l.status === 'open').length;
        const closedLeads = leadsArray.filter(l => l.status === 'closed').length;
        const inProcessLeads = leadsArray.filter(l => l.status === 'in_process').length;
        
        const todayFollowups = leadsArray.filter(l => {
          if (!l.followup_date) return false;
          const followupDate = new Date(l.followup_date);
          followupDate.setHours(0, 0, 0, 0);
          return followupDate.getTime() === today.getTime();
        }).length;

        const overdueFollowups = leadsArray.filter(l => {
          if (!l.followup_date) return false;
          const followupDate = new Date(l.followup_date);
          followupDate.setHours(0, 0, 0, 0);
          return followupDate < today;
        }).length;

        // Calculate monthly data from real leads
        const monthlyStats = {};
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('en-IN', { month: 'short' });
          last6Months.push(monthKey);
          monthlyStats[monthKey] = { month: monthName, leads: 0, customers: 0, quotations: 0 };
        }

        // Count leads by month
        leadsArray.forEach(lead => {
          const leadDate = new Date(lead.date || lead.created_at);
          const monthKey = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyStats[monthKey]) {
            monthlyStats[monthKey].leads++;
          }
        });

        // Count customers by month
        customersArray.forEach(customer => {
          const customerDate = new Date(customer.created_at);
          const monthKey = `${customerDate.getFullYear()}-${String(customerDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyStats[monthKey]) {
            monthlyStats[monthKey].customers++;
          }
        });

        // Count quotations by month
        quotationsArray.forEach(quot => {
          const quotDate = new Date(quot.created_at);
          const monthKey = `${quotDate.getFullYear()}-${String(quotDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyStats[monthKey]) {
            monthlyStats[monthKey].quotations++;
          }
        });

        const realMonthlyData = last6Months.map(key => monthlyStats[key]);

        // Lead status distribution (real data)
        const realLeadStatusData = [
          { name: 'Open', value: openLeads },
          { name: 'In Process', value: inProcessLeads },
          { name: 'Closed', value: closedLeads },
        ];

        // Lead source distribution (real data)
        const sourceCount = {};
        leadsArray.forEach(lead => {
          const source = lead.lead_source || 'Unknown';
          sourceCount[source] = (sourceCount[source] || 0) + 1;
        });
        const realSourceData = Object.entries(sourceCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6); // Top 6 sources

        setStats({
          totalLeads: leadsArray.length,
          totalCustomers: customersArray.length,
          totalQuotations: quotationsArray.length,
          totalProducts: productsArray.length,
          openLeads,
          closedLeads,
          overdueFollowups,
          todayFollowups,
        });

        setMonthlyData(realMonthlyData);
        setLeadStatusData(realLeadStatusData);
        setSourceData(realSourceData);

        // Recent activity (last 5 leads)
        const recent = leadsArray
          .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
          .slice(0, 5)
          .map(l => ({
            id: l.id,
            name: l.customer_name,
            action: 'New Lead',
            date: l.date || l.created_at,
            status: l.status,
          }));
        setRecentActivity(recent);

      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        console.error("Error details:", error.message);
        console.error("Stack trace:", error.stack);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [BASE_API, token]);

  const conversionData = [
    { name: 'Leads', value: stats.totalLeads },
    { name: 'Customers', value: stats.totalCustomers },
    { name: 'Quotations', value: stats.totalQuotations },
  ];

  if (loading) {
    return (
      <Base title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 text-lg">Loading dashboard...</div>
        </div>
      </Base>
    );
  }

  return (
    <Base title="Dashboard">
      <div className="space-y-6 p-1">
        
        {/* Welcome Section */}
        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-800">Welcome Back! 👋</h1>
              <p className="text-gray-600 text-lg">Here's what's happening with your business today.</p>
            </div>
            <div className="bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-500">Today's Date</div>
              <div className="text-xl font-bold text-gray-800">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Leads Card */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-semibold">
                <FiArrowUp className="w-4 h-4" />
                <span>12%</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-gray-800">{stats.totalLeads}</div>
            <div className="text-gray-600 text-sm font-medium">Total Leads</div>
          </div>

          {/* Total Customers Card */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-md font-semibold">
                <FiArrowUp className="w-4 h-4" />
                <span>8%</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-gray-800">{stats.totalCustomers}</div>
            <div className="text-gray-600 text-sm font-medium">Active Customers</div>
          </div>

          {/* Total Quotations Card */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiFileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-semibold">
                <FiArrowUp className="w-4 h-4" />
                <span>15%</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-gray-800">{stats.totalQuotations}</div>
            <div className="text-gray-600 text-sm font-medium">Total Quotations</div>
          </div>

          {/* Total Products Card */}
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiPackage className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-semibold">
                <FiArrowUp className="w-4 h-4" />
                <span>5%</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-gray-800">{stats.totalProducts}</div>
            <div className="text-gray-600 text-sm font-medium">Total Products</div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Open Leads */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiPhone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.openLeads}</div>
                <div className="text-sm text-gray-500">Open Leads</div>
              </div>
            </div>
          </div>

          {/* Today's Follow-ups */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <FiClock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.todayFollowups}</div>
                <div className="text-sm text-gray-500">Today's Follow-ups</div>
              </div>
            </div>
          </div>

          {/* Overdue Follow-ups */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.overdueFollowups}</div>
                <div className="text-sm text-gray-500">Overdue Follow-ups</div>
              </div>
            </div>
          </div>

          {/* Closed Leads */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.closedLeads}</div>
                <div className="text-sm text-gray-500">Closed Leads</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Monthly Trends</h3>
              <p className="text-sm text-gray-500 mt-1">Leads, Customers & Quotations over time</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Leads" />
                  <Line type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="Customers" />
                  <Line type="monotone" dataKey="quotations" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} name="Quotations" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Status Pie Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Lead Source Distribution</h3>
              <p className="text-sm text-gray-500 mt-1">Top lead sources breakdown</p>
            </div>
            <div className="h-80 flex items-center justify-center">
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 text-sm">No data available</div>
              )}
            </div>
          </div>

          {/* Conversion Funnel Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Conversion Funnel</h3>
              <p className="text-sm text-gray-500 mt-1">Lead to customer conversion metrics</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500 mt-1">Latest updates and changes</p>
            </div>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FiClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div key={activity.id || idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      activity.status === 'open' ? 'bg-blue-100' :
                      activity.status === 'closed' ? 'bg-green-100' :
                      'bg-yellow-100'
                    }`}>
                      <FiUsers className={`w-4 h-4 ${
                        activity.status === 'open' ? 'text-blue-600' :
                        activity.status === 'closed' ? 'text-green-600' :
                        'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{activity.name}</p>
                      <p className="text-xs text-gray-500">{activity.action}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.date ? new Date(activity.date).toLocaleDateString('en-IN') : '—'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold shrink-0 ${
                      activity.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      activity.status === 'closed' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-indigo-50 rounded-xl p-8 border border-indigo-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-800">
                {stats.totalLeads > 0 && stats.totalCustomers > 0 ? Math.round((stats.totalCustomers / stats.totalLeads) * 100) : 0}%
              </div>
              <div className="text-gray-700 font-semibold">Conversion Rate</div>
              <div className="text-xs text-gray-500 mt-1">Leads to Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-800">
                {stats.totalLeads > 0 && stats.totalQuotations > 0 ? Math.round((stats.totalQuotations / stats.totalLeads) * 100) : 0}%
              </div>
              <div className="text-gray-700 font-semibold">Quote Rate</div>
              <div className="text-xs text-gray-500 mt-1">Leads to Quotations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-800">
                {stats.totalLeads > 0 && stats.closedLeads > 0 ? Math.round((stats.closedLeads / stats.totalLeads) * 100) : 0}%
              </div>
              <div className="text-gray-700 font-semibold">Close Rate</div>
              <div className="text-xs text-gray-500 mt-1">Successful Closures</div>
            </div>
          </div>
        </div>

      </div>
    </Base>
  );
}
