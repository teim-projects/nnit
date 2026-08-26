import React, { useState, useEffect, useMemo } from "react";
import { openServicePdf } from "../utils/servicePdfGenerator";
import { Link, useNavigate } from "react-router-dom";
import { MdHome, MdClose, MdNorthEast } from "react-icons/md";
import Swal from "sweetalert2";

export default function CompletedWorkList() {
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

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskModal, setActiveTaskModal] = useState(null);

  const fetchCompletedTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseApi}/api/services/service-requests/my-tasks/?type=completed`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      } else {
        // Fallback fetch completed tasks
        const fallbackRes = await fetch(
          `${baseApi}/api/services/service-requests/?status=completed&include_all=true`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          setTasks(Array.isArray(fbData) ? fbData : fbData.results || []);
        }
      }
    } catch (err) {
      console.error("Error fetching completed work list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, [baseApi, token]);

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

  const formatCompletionDate = (isoStr) => {
    if (!isoStr) return "N/A";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} / ${hours}:${mins}`;
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Outer Card Container matching user's Image 2 */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-200">
          <button
            onClick={() => navigate("/technician-dashboard")}
            className="text-blue-600 hover:text-blue-800 text-2xl"
            title="Home"
          >
            <MdHome />
          </button>
          <h1 className="text-2xl font-serif text-indigo-600 font-semibold tracking-wide">
            Completed Work List tech
          </h1>
          <button
            onClick={() => navigate("/technician-dashboard")}
            className="text-red-500 hover:text-red-700 text-2xl font-bold"
            title="Close"
          >
            <MdClose />
          </button>
        </div>

        {/* Completed Work List Table */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200 w-28">Work ID</th>
                  <th className="p-3 border-r border-slate-200">Customer Name</th>
                  <th className="p-3 border-r border-slate-200 text-center w-56">Completion Date & Time</th>
                  <th className="p-3 text-center w-40">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-slate-500">
                      Loading completed tasks...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-slate-500 font-medium">
                      No completed work records found.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, idx) => (
                    <tr
                      key={task.id}
                      className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100/50"}
                    >
                      <td className="p-3.5 border-r border-slate-200 font-semibold text-slate-800">
                        {task.service_id || ("SRV-" + task.id)}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 font-semibold text-slate-800">
                        {getCustomerName(task)}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 text-center font-medium text-slate-700">
                        {formatCompletionDate(task.completion_date || task.updated_at)}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => setActiveTaskModal(task)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs transition"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => openServicePdf(task)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-xs transition flex items-center gap-1"
                          >
                            📄 View PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Back Button */}
          <div className="pt-6">
            <button
              onClick={() => navigate("/technician-dashboard")}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition"
            >
              Back to Work List <MdNorthEast className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* View Work Details Modal */}
      {activeTaskModal && (
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">
                Completed Task Details (ID #{activeTaskModal.id})
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
                {activeTaskModal.customer_details?.phone || activeTaskModal.customer_phone || "N/A"}
              </div>
              <div>
                <span className="font-bold text-slate-900">Completion Date & Time: </span>
                <span className="font-semibold text-emerald-700">
                  {formatCompletionDate(activeTaskModal.completion_date || activeTaskModal.updated_at)}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Work Description: </span>
                <p className="mt-1 p-2 bg-slate-100 rounded text-slate-800">
                  {activeTaskModal.description || activeTaskModal.title || "No description"}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-900">Completion Remarks / Resolution Notes: </span>
                <p className="mt-1 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 font-medium">
                  {activeTaskModal.resolution_notes || "Completed as per service schedule."}
                </p>
              </div>

              {/* Service Completion Proof Section */}
              <div className="border-t border-emerald-200 pt-4 space-y-4 bg-slate-50 p-4 rounded-xl border">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    📷 Service Completion Verification Proof
                  </h4>
                  {activeTaskModal.customer_approval && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Customer Approved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Before Service Photo:
                    </label>
                    {activeTaskModal.before_service_photo ? (
                      <img
                        src={activeTaskModal.before_service_photo}
                        alt="Before Service"
                        className="h-32 w-full object-contain rounded-lg border border-slate-200 bg-white"
                      />
                    ) : (
                      <div className="h-24 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 font-medium">
                        No Before Photo
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      After Service Photo:
                    </label>
                    {activeTaskModal.after_service_photo ? (
                      <img
                        src={activeTaskModal.after_service_photo}
                        alt="After Service"
                        className="h-32 w-full object-contain rounded-lg border border-slate-200 bg-white"
                      />
                    ) : (
                      <div className="h-24 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 font-medium">
                        No After Photo
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Signature:
                  </label>
                  {activeTaskModal.customer_signature ? (
                    <div className="border border-slate-200 rounded-lg p-2 bg-white flex justify-center">
                      <img
                        src={activeTaskModal.customer_signature}
                        alt="Customer Signature"
                        className="h-24 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 font-medium">
                      No Signature Recorded
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
              <button
                onClick={() => openServicePdf(activeTaskModal)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-xs shadow-md transition flex items-center gap-1.5"
              >
                📄 View PDF Report
              </button>
              <button
                onClick={() => setActiveTaskModal(null)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
