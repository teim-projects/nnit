import React, { useState, useEffect, useMemo } from "react";
import { openServicePdf } from "../utils/servicePdfGenerator";
import { Link, useNavigate } from "react-router-dom";
import { MdHome, MdClose, MdSearch, MdLocationOn } from "react-icons/md";
import Swal from "sweetalert2";

export default function TechnicianWorkList() {
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
  const [technicianInfo, setTechnicianInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [activeTaskModal, setActiveTaskModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [beforePhoto, setBeforePhoto] = useState("");
  const [afterPhoto, setAfterPhoto] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [customerApproved, setCustomerApproved] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTasks = async (search = "") => {
    setLoading(true);
    try {
      let url = `${baseApi}/api/services/service-requests/my-tasks/?type=pending`;
      if (search) {
        url += `&search_phone=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        if (data.technician) {
          setTechnicianInfo(data.technician);
        }
      } else {
        const fallbackRes = await fetch(`${baseApi}/api/services/service-requests/?include_all=true`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const list = Array.isArray(fbData) ? fbData : fbData.results || [];
          setTasks(list.filter((t) => t.status !== "completed"));
        }
      }
    } catch (err) {
      console.error("Error fetching technician work list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [baseApi, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks(phoneSearch);
  };

  const resetVerificationForm = () => {
    setResolutionNotes("");
    setBeforePhoto("");
    setAfterPhoto("");
    setSignatureData("");
    setCustomerApproved(false);
  };

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
          text: "Service task marked as completed with photos & customer approval.",
          timer: 1800,
          showConfirmButton: false,
        });
        setActiveTaskModal(null);
        resetVerificationForm();
        fetchTasks(phoneSearch);
      } else {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: errData.error || "Could not update work status",
        });
      }
    } catch (err) {
      console.error("Error marking work completed:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Network error occurred." });
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

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Outer Card Container matching user's Image 3 */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
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
            Technician Work List
          </h1>
          <button
            onClick={() => navigate("/technician-dashboard")}
            className="text-red-500 hover:text-red-700 text-2xl font-bold"
            title="Close"
          >
            <MdClose />
          </button>
        </div>

        {/* Top Search Bar & Greeting Section */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-xl">
            <span className="text-pink-500 font-bold">📞</span>
            <input
              type="text"
              placeholder="Phone number / Search customer..."
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-md transition shadow-xs"
            >
              Search
            </button>
          </form>

          <div className="text-lg font-serif text-blue-600 font-bold">
            Welcome, {technicianInfo?.name || technicianInfo?.phone || "Technician"}!
          </div>

          {/* Work List Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200 w-12 text-center">Sr.No</th>
                  <th className="p-3 border-r border-slate-200 w-24">Work ID</th>
                  <th className="p-3 border-r border-slate-200 w-28">Work Status</th>
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
                    <td colSpan="9" className="p-6 text-center text-slate-500">
                      Loading work list...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-slate-500 font-medium">
                      No pending work items assigned.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, idx) => (
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
                      <td className="p-3 border-r border-slate-200">
                        <div className="inline-flex flex-col">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700 w-fit">
                            Pending
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            Waiting Approval
                          </span>
                        </div>
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
                        {task.description || task.title || "Service maintenance call"}
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
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveTaskModal(task);
                              setResolutionNotes(task.resolution_notes || "");
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-xs transition"
                          >
                            Details
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

      {/* View Work Details Modal */}
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
                    id="custApproveCheck"
                    checked={customerApproved}
                    onChange={(e) => setCustomerApproved(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="custApproveCheck" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
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
