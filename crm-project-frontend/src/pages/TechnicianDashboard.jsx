import React, { useState, useEffect, useMemo } from "react";
import { openServicePdf } from "../utils/servicePdfGenerator";
import { Link, useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { 
  MdBuild, 
  MdAssignment, 
  MdCheckCircle, 
  MdAccessTime, 
  MdLocationOn, 
  MdArrowForward,
  MdRefresh,
  MdPhone
} from "react-icons/md";
import Swal from "sweetalert2";

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      "",
    []
  );

  const [techData, setTechData] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskModal, setActiveTaskModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseApi}/api/services/service-requests/my-tasks/?type=pending`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTechData(data.technician || null);
        if (data.stats) {
          setStats(data.stats);
        } else {
          const pendingCount = (data.tasks || []).length;
          setStats({ total: pendingCount, pending: pendingCount, completed: 0 });
        }
        setRecentTasks((data.tasks || []).slice(0, 8));
      }
    } catch (err) {
      console.error("Error loading technician dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [baseApi, token]);

  const pieChartData = useMemo(() => {
    return [
      { name: "Completed Work", value: stats.completed, color: "#10b981" },
      { name: "Pending Work", value: stats.pending, color: "#f59e0b" },
    ].filter((item) => item.value >= 0);
  }, [stats]);

  const monthlyTrendData = useMemo(() => {
    if (stats.monthly_trend && Array.isArray(stats.monthly_trend) && stats.monthly_trend.length > 0) {
      return stats.monthly_trend;
    }
    const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    return months.map((m, idx) => ({
      month: m,
      completed: idx === 5 ? stats.completed : 0,
      allocated: idx === 5 ? stats.total : 0,
    }));
  }, [stats]);

  const handleMarkCompleted = async () => {
    if (!activeTaskModal) return;

    if (!beforePhoto) {
      Swal.fire({ icon: "warning", title: "Before Photo Required", text: "Please upload or take a Before Service photo." });
      return;
    }
    if (!afterPhoto) {
      Swal.fire({ icon: "warning", title: "After Photo Required", text: "Please upload or take an After Service photo." });
      return;
    }
    if (!signatureData) {
      Swal.fire({ icon: "warning", title: "Customer Signature Required", text: "Please get customer signature on screen." });
      return;
    }
    if (!customerApproved) {
      Swal.fire({ icon: "warning", title: "Customer Approval Required", text: "Please check the Customer Approval checkbox." });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(
        `${baseApi}/api/services/service-requests/${activeTaskModal.id}/update-status/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            status: "completed",
            resolution_notes: resolutionNotes,
            before_service_photo: beforePhoto,
            after_service_photo: afterPhoto,
            customer_signature: signatureData,
            customer_approval: customerApproved,
          }),
        }
      );

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Work Completed!",
          text: "Task completed with photos & customer approval signature.",
          timer: 1800,
          showConfirmButton: false,
        });
        setActiveTaskModal(null);
        resetVerificationForm();
        fetchDashboardData();
      } else {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({ icon: "error", title: "Failed", text: errData.error || "Could not update status" });
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const getCustomerName = (task) => {
    if (task.customer_details) {
      return (
        task.customer_details.name ||
        task.customer_details.company_name ||
        task.customer_details.poc_name ||
        "Customer #" + task.customer
      );
    }
    return task.customer_name || "N/A";
  };

  const getCustomerPhone = (task) => {
    if (task.customer_details) {
      return (
        task.customer_details.phone ||
        task.customer_details.contact_number ||
        task.customer_details.primary_contact ||
        "N/A"
      );
    }
    return task.customer_phone || "N/A";
  };

  const getCustomerAddress = (task) => {
    if (task.customer_details) {
      return task.customer_details.address || task.customer_details.city || "Pune, Maharashtra";
    }
    return task.address || "Pune, Maharashtra";
  };

  const getGpsLocationUrl = (task) => {
    const addr = getCustomerAddress(task);
    if (task.customer_details?.gps_location) {
      return task.customer_details.gps_location;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  };

  const todayDateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
              Welcome Back, {techData?.name || techData?.phone || "Technician"}!
            </h1>
            <p className="text-indigo-200 text-xs md:text-sm font-medium mt-1">
              Field Technician Dashboard — Access your assigned work calls & completed tasks.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-semibold border border-white/20 self-start md:self-auto">
            <span>📅 {todayDateStr}</span>
            <button
              onClick={fetchDashboardData}
              className="p-1 hover:bg-white/20 rounded transition"
              title="Refresh Data"
            >
              <MdRefresh className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Work Allocated
            </p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
              {stats.total}
            </h3>
            <span className="text-[11px] font-semibold text-blue-600">
              Assigned Field Tasks
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-xs">
            <MdBuild />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Work List
            </p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
              {stats.pending}
            </h3>
            <span className="text-[11px] font-semibold text-amber-600">
              Awaiting Completion
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-xs">
            <MdAccessTime />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completed Work
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {stats.completed}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600">
              Successfully Resolved
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shadow-xs">
            <MdCheckCircle />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div
          onClick={() => navigate("/technician-work-list")}
          className="bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-xl p-5 transition cursor-pointer flex items-center justify-between shadow-xs group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xl shadow-xs">
              <MdAssignment />
            </div>
            <div>
              <h4 className="text-base font-bold text-blue-900">Open Work List</h4>
              <p className="text-xs text-blue-700 font-medium">
                View & manage pending field service tasks ({stats.pending} items)
              </p>
            </div>
          </div>
          <MdArrowForward className="text-xl text-blue-600 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => navigate("/completed-work-list")}
          className="bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200 rounded-xl p-5 transition cursor-pointer flex items-center justify-between shadow-xs group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xl shadow-xs">
              <MdCheckCircle />
            </div>
            <div>
              <h4 className="text-base font-bold text-purple-900">Completed Work List</h4>
              <p className="text-xs text-purple-700 font-medium">
                View list of finished service calls ({stats.completed} items)
              </p>
            </div>
          </div>
          <MdArrowForward className="text-xl text-purple-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Analytics & Performance Charts (Pie Chart, Bar Chart & Line Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Pie Chart Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                🥧 Work Status Breakdown (Pie)
              </h3>
              <p className="text-[11px] text-slate-500">Task distribution ratio</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Total: {stats.total}
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px", border: "none" }}
                    formatter={(value, name) => [`${value} Work Calls`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 font-medium">No work allocated yet.</div>
            )}
          </div>

          {/* Clean Custom Legend Badges */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Completed: <strong>{stats.completed}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 bg-amber-50 rounded-lg border border-amber-100 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="truncate">Pending: <strong>{stats.pending}</strong></span>
            </div>
          </div>
        </div>

        {/* 2. Bar Chart Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                📊 Monthly Performance (Bar Chart)
              </h3>
              <p className="text-[11px] text-slate-500">Allocated vs Completed volume</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Monthly Stats
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px", border: "none" }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="allocated" name="Allocated Work" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed Work" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Line/Area Chart Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                📈 Work Completion Trend (Line Chart)
              </h3>
              <p className="text-[11px] text-slate-500">Resolution trajectory over time</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Trajectory
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAllocated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px", border: "none" }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="allocated" name="Allocated Work" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAllocated)" />
                <Area type="monotone" dataKey="completed" name="Completed Tasks" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Allocated Work Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Your Allocated Work List
            </h3>
            <p className="text-xs text-slate-500">
              Only work items specifically allocated to you are displayed here.
            </p>
          </div>
          <button
            onClick={() => navigate("/technician-work-list")}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
          >
            View All ({stats.pending}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="p-3 border-r border-slate-200 w-12 text-center">#</th>
                <th className="p-3 border-r border-slate-200 w-16">Work ID</th>
                <th className="p-3 border-r border-slate-200">Customer Name</th>
                <th className="p-3 border-r border-slate-200 w-28">Contact no.</th>
                <th className="p-3 border-r border-slate-200">Address</th>
                <th className="p-3 border-r border-slate-200">Work Description</th>
                <th className="p-3 border-r border-slate-200 w-24">GPS Location</th>
                <th className="p-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500 font-medium">
                    Loading your assigned tasks...
                  </td>
                </tr>
              ) : recentTasks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500 font-medium">
                    No pending tasks allocated to you right now.
                  </td>
                </tr>
              ) : (
                recentTasks.map((task, idx) => (
                  <tr
                    key={task.id}
                    className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100/50"}
                  >
                    <td className="p-3 border-r border-slate-200 text-center font-medium text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="p-3 border-r border-slate-200 font-semibold text-slate-800">
                      {task.service_id || ("SRV-" + task.id)}
                    </td>
                    <td className="p-3 border-r border-slate-200 font-semibold text-slate-800">
                      {getCustomerName(task)}
                    </td>
                    <td className="p-3 border-r border-slate-200 text-slate-700 font-medium">
                      {getCustomerPhone(task)}
                    </td>
                    <td className="p-3 border-r border-slate-200 text-slate-600 max-w-xs truncate" title={getCustomerAddress(task)}>
                      {getCustomerAddress(task)}
                    </td>
                    <td className="p-3 border-r border-slate-200 text-slate-700 font-medium max-w-xs truncate" title={task.description || task.title}>
                      {task.description || task.title || "Service call"}
                    </td>
                    <td className="p-3 border-r border-slate-200">
                      <a
                        href={getGpsLocationUrl(task)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                      >
                        <MdLocationOn className="text-red-500 text-sm" /> Location
                      </a>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setActiveTaskModal(task);
                          setResolutionNotes(task.resolution_notes || "");
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-xs transition"
                      >
                        View Work Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Modal */}
      {activeTaskModal && (
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">
                Work Details (ID #{activeTaskModal.id})
              </h3>
              <button
                onClick={() => setActiveTaskModal(null)}
                className="text-white hover:text-red-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
              <div>
                <span className="font-bold text-slate-900">Customer Name: </span>
                {getCustomerName(activeTaskModal)}
              </div>
              <div>
                <span className="font-bold text-slate-900">Contact Number: </span>
                {getCustomerPhone(activeTaskModal)}
              </div>
              <div>
                <span className="font-bold text-slate-900">Address: </span>
                {getCustomerAddress(activeTaskModal)}
              </div>
              <div>
                <span className="font-bold text-slate-900">Work Description: </span>
                <p className="mt-1 p-2 bg-slate-100 rounded text-slate-800">
                  {activeTaskModal.description || activeTaskModal.title || "No description"}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-900">Status: </span>
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                  {activeTaskModal.status_display || activeTaskModal.status}
                </span>
              </div>

              {/* Service Verification Form Section */}
              <div className="border-t border-indigo-100 pt-4 space-y-4 bg-slate-50/50 p-4 rounded-xl border">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  📷 Service Completion Verification Form
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadField
                    label="1. Before Service Photo"
                    imageState={beforePhoto}
                    setImageState={setBeforePhoto}
                  />
                  <ImageUploadField
                    label="2. After Service Photo"
                    imageState={afterPhoto}
                    setImageState={setAfterPhoto}
                  />
                </div>

                <SignatureCanvas
                  signatureData={signatureData}
                  setSignatureData={setSignatureData}
                />

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="custApproveCheckDash"
                    checked={customerApproved}
                    onChange={(e) => setCustomerApproved(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="custApproveCheckDash" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                    Customer has inspected the completed service work and provided approval. *
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Resolution / Completion Notes:
                  </label>
                  <textarea
                    rows="3"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter work summary & remarks..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
              <button
                onClick={() => openServicePdf(activeTaskModal)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md transition flex items-center gap-1"
              >
                📄 View PDF Report
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTaskModal(null);
                    resetVerificationForm();
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-md text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkCompleted}
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition flex items-center gap-1"
                >
                  {updating ? "Submitting..." : "Submit & Complete ✓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------
   Helper Components
   ---------------------- */
function ImageUploadField({ label, imageState, setImageState }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: "warning", title: "File Too Large", text: "Please select an image under 5MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageState(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        {label} *
      </label>
      <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition relative">
        {imageState ? (
          <div className="relative w-full flex flex-col items-center">
            <img src={imageState} alt={label} className="h-28 object-contain rounded-lg border border-slate-200" />
            <button
              type="button"
              onClick={() => setImageState("")}
              className="mt-1.5 text-xs text-red-600 font-bold hover:underline"
            >
              Remove Photo
            </button>
          </div>
        ) : (
          <label className="cursor-pointer w-full text-center py-3 flex flex-col items-center gap-1">
            <span className="text-xl">📷</span>
            <span className="text-xs font-semibold text-indigo-600">Upload / Take Photo</span>
            <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}

function SignatureCanvas({ signatureData, setSignatureData }) {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          3. Customer Signature *
        </label>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-red-600 hover:underline font-semibold"
        >
          Clear Signature
        </button>
      </div>
      <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={450}
          height={130}
          className="w-full h-28 cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      {signatureData ? (
        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
          ✓ Customer signature captured
        </p>
      ) : (
        <p className="text-[10px] text-slate-400">Sign inside the box above using mouse or touch.</p>
      )}
    </div>
  );
}
