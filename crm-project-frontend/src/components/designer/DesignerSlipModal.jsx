import React from "react";
import { MdClose } from "react-icons/md";
import { FiPrinter, FiDownload, FiPaperclip } from "react-icons/fi";

export default function DesignerSlipModal({ open, onClose, request }) {
  if (!open || !request) return null;

  const handlePrint = () => {
    window.print();
  };

  const clientName = request.clientCoName || request.customerName || request.company_name || request.customer_name || "—";
  const projectName = request.projectName || request.project_name || "—";
  const projectAdd = request.projectAddress || request.project_adderess || request.site_location || request.location || "—";
  const contactPerson = request.contactPerson || request.contact_person_name || "—";
  const contactNo = request.contactNumber || request.contact_person_number || request.customer_contact || "—";
  const requirements = request.requirements || request.requirements_details || request.site_requirement || "—";
  const quantity = request.quantity || "As per STD";
  const remark = request.remark || request.remarks || "-";
  const salesPerson = (request.salesPersonName && request.salesPersonName !== "Sales Person")
    ? request.salesPersonName
    : (localStorage.getItem("user_name") || "Sales Person");

  // Salutations
  const clientSalutation = request.salutation || (clientName.startsWith("M/s.") ? "M/s." : "");
  const contactSalutation = request.contactPersonSalutation || (contactPerson.startsWith("MS.") ? "MS." : contactPerson.startsWith("Mr.") ? "Mr." : "");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-100 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col my-auto print:shadow-none print:border-none print:w-full print:max-w-none print:bg-white">
        {/* Header - Sleek Dark Theme */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700 print:hidden text-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl text-indigo-300">
              📐
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Designer Send Slip</h2>
              <p className="text-xs text-slate-300">
                Request Ref: {request.id || request.reqNo || "DS-REQ"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              title="Print Slip"
            >
              <FiPrinter className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container with soft slate contrast background */}
        <div className="p-4 sm:p-6 md:p-8 bg-slate-100 overflow-y-auto max-h-[82vh] print:p-0 print:bg-white print:max-h-none">
          {/* Printable Sheet */}
          <div className="bg-white rounded-xl shadow-md border border-slate-300 p-6 sm:p-8 print:shadow-none print:border-none print:p-0">
            {/* Header Title on Slip */}
            <div className="border-b-2 border-slate-800 pb-3 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  NNIT CAR PARKING SYSTEMS
                </h1>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Drawing & Design Requirement Slip
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Date Sent</span>
                <span className="text-sm font-bold text-slate-800">
                  {request.sentDate || new Date().toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* EXACT TABLE FORMAT FROM USER'S IMAGE */}
            <div className="overflow-x-auto border-2 border-slate-700 rounded-lg">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {/* 1. Client/Co Name */}
                  <tr className="border-b border-slate-400 bg-white">
                    <td className="w-44 py-3 px-4 font-bold text-slate-900 border-r border-slate-400 bg-slate-100">
                      Client/Co Name
                    </td>
                    <td className="w-16 py-3 px-3 font-bold text-slate-800 border-r border-slate-400 text-center bg-slate-50">
                      {clientSalutation || "M/s."}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 bg-white">
                      {clientName.replace(/^M\/s\.\s*/i, "")}
                    </td>
                  </tr>

                  {/* 2. Project Name */}
                  <tr className="border-b border-slate-400 bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-400 bg-slate-100">
                      Project Name
                    </td>
                    <td className="py-3 px-3 border-r border-slate-400 bg-slate-50"></td>
                    <td className="py-3 px-4 text-slate-900 font-semibold bg-white">
                      {projectName}
                    </td>
                  </tr>

                  {/* 3. Project Add */}
                  <tr className="border-b border-slate-400 bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-400 bg-slate-100">
                      Project Add
                    </td>
                    <td className="py-3 px-3 border-r border-slate-400 bg-slate-50"></td>
                    <td className="py-3 px-4 text-slate-900 font-semibold bg-white">
                      {projectAdd}
                    </td>
                  </tr>

                  {/* 4. Contact Person */}
                  <tr className="border-b border-slate-400 bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-400 bg-slate-100">
                      Contact Person
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 border-r border-slate-400 text-center bg-slate-50">
                      {contactSalutation || "MS."}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 bg-white">
                      {contactPerson.replace(/^(MS\.|Mr\.|Mrs\.)\s*/i, "")}
                    </td>
                  </tr>

                  {/* 5. Contact No. */}
                  <tr className="border-b border-slate-400 bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-400 bg-slate-100">
                      Contact No.
                    </td>
                    <td className="py-3 px-3 border-r border-slate-400 bg-slate-50"></td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tracking-wide bg-white">
                      {contactNo}
                    </td>
                  </tr>

                  {/* 6. Requirements 's */}
                  <tr className="border-b border-slate-400 bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-400 bg-slate-100 align-top">
                      Requirements 's
                    </td>
                    <td className="py-3 px-3 border-r border-slate-400 bg-slate-50"></td>
                    <td className="py-3 px-4 text-indigo-950 font-bold tracking-wide whitespace-pre-wrap leading-relaxed bg-white">
                      {requirements}
                    </td>
                  </tr>

                  {/* 7. Quantity */}
                  <tr className="border-b border-slate-400 bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-400 bg-slate-100">
                      Quantity
                    </td>
                    <td className="py-3 px-3 border-r border-slate-400 bg-slate-50"></td>
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-white">
                      {quantity}
                    </td>
                  </tr>

                  {/* 8. Remark */}
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-400 bg-slate-100">
                      Remark
                    </td>
                    <td className="py-3 px-3 border-r border-slate-400 bg-slate-50"></td>
                    <td className="py-3 px-4 text-slate-800 font-medium bg-white">
                      {remark}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Attachments Section if any */}
            {(request.customerLayoutUrl || request.customerLayoutName || request.drawingUrl || request.cad_file) && (
              <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiPaperclip className="w-3.5 h-3.5" />
                  Attached Files & Drawings
                </h4>
                <div className="flex flex-wrap gap-3">
                  {(request.customerLayoutUrl || request.customerLayoutName) && (
                    <a
                      href={request.customerLayoutUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 hover:text-indigo-600 hover:border-indigo-400 transition shadow-xs"
                    >
                      📄 Customer Layout: {request.customerLayoutName || "View Layout"}
                    </a>
                  )}
                  {(request.drawingUrl || request.cad_file) && (
                    <a
                      href={request.drawingUrl || request.cad_file || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                    >
                      📐 Designer CAD: {request.drawingTitle || request.cad_file_name || "Completed CAD Drawing"}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Signature / Authorization footer */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 text-center text-xs text-slate-600">
              <div>
                <p className="font-bold text-slate-800">Sent By: {salesPerson}</p>
                <div className="h-10"></div>
                <p className="border-t border-slate-400 mx-10 pt-1 font-medium">{salesPerson} - Authorized Signature</p>
              </div>
              <div>
                <p className="font-bold text-slate-800">Received By: Design Department</p>
                <div className="h-10"></div>
                <p className="border-t border-slate-400 mx-10 pt-1 font-medium">Designer Signature & Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer - Not printed */}
        <div className="px-6 py-3.5 bg-slate-200/80 border-t border-slate-300 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <FiPrinter className="w-4 h-4" />
            Print Slip
          </button>
        </div>
      </div>
    </div>
  );
}
