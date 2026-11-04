import { useState } from "react";
import { MdFileUpload, MdDownload, MdClose, MdCheckCircle, MdError, MdTableChart } from "react-icons/md";
import Swal from "sweetalert2";

export default function BulkImportModal({
  open,
  onClose,
  onSuccess,
  title = "Bulk Import Data",
  sampleCsvUrl,
  importEndpoint,
  token,
  type = "leads" // 'leads' or 'customers'
}) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!open) return null;

  // Simple CSV parser with BOM handling
  const parseCSV = (text) => {
    // Strip UTF-8 BOM (\uFEFF) if present at start of file
    const cleanText = text ? text.replace(/^\uFEFF/, "") : "";
    const lines = cleanText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line) => {
      const values = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };

    const rawHeaders = parseLine(lines[0]);
    const cleanHeaders = rawHeaders.map(h => h.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim());

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      if (vals.length > 0 && vals.some(v => v !== "")) {
        const rowObj = {};
        cleanHeaders.forEach((h, idx) => {
          rowObj[h] = vals[idx] ? vals[idx].replace(/^"|"$/g, '').trim() : "";
        });
        rows.push(rowObj);
      }
    }

    return { headers: cleanHeaders, rows };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      const { headers: h, rows: r } = parseCSV(content);
      setHeaders(h);
      setParsedData(r);
    };
    reader.readAsText(selectedFile);
  };

  const handleDownloadSample = async () => {
    if (!sampleCsvUrl) return;
    try {
      const res = await fetch(sampleCsvUrl, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = type === 'customers' ? 'customers_sample.csv' : 'leads_sample.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        window.open(sampleCsvUrl, '_blank');
      }
    } catch (e) {
      window.open(sampleCsvUrl, '_blank');
    }
  };

  const handleSubmitImport = async () => {
    if (parsedData.length === 0) {
      Swal.fire({ icon: "warning", title: "No Data", text: "Please upload a valid CSV file with data rows." });
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const res = await fetch(importEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ records: parsedData })
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(data);
        Swal.fire({
          icon: "success",
          title: "Import Completed",
          text: `Imported ${data.imported_count || 0} records successfully! ${data.updated_count ? `(${data.updated_count} updated)` : ''}`,
          timer: 2000,
          showConfirmButton: false
        });
        if (onSuccess) onSuccess();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || errData.detail || "Failed to import records.");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Import Error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MdFileUpload className="text-indigo-600 w-6 h-6" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload CSV or Excel exported file to bulk import records into the CRM
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Action Bar: Download Sample CSV */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div>
              <p className="text-xs font-bold text-indigo-900">Need a sample format?</p>
              <p className="text-xs text-indigo-700">Download sample CSV template with correct column headers.</p>
            </div>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition shrink-0"
            >
              <MdDownload className="w-4 h-4" />
              Download Sample CSV
            </button>
          </div>

          {/* File Picker Zone */}
          {!file ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition cursor-pointer relative">
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <MdFileUpload className="w-12 h-12 mx-auto text-indigo-500 mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-700">Click or Drag & Drop CSV file to upload</p>
              <p className="text-xs text-slate-400 mt-1">Supports `.csv` files</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2">
                <MdTableChart className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">{file.name}</span>
                <span className="text-xs text-emerald-700">({parsedData.length} records found)</span>
              </div>
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-red-600 underline"
              >
                Change File
              </button>
            </div>
          )}

          {/* Data Preview Table */}
          {parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Data Preview ({parsedData.length} rows ready)
                </h4>
              </div>
              <div className="overflow-x-auto max-h-60 border border-slate-200 rounded-xl bg-white shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2 px-3">#</th>
                      {headers.map((h, i) => (
                        <th key={i} className="py-2 px-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {parsedData.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-400">{idx + 1}</td>
                        {headers.map((h, i) => (
                          <td key={i} className="py-2 px-3 max-w-xs truncate text-slate-700">
                            {row[h] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 50 && (
                <p className="text-[11px] text-slate-400 mt-1.5 text-right">Showing first 50 rows of {parsedData.length} records...</p>
              )}
            </div>
          )}

          {/* Import Result Summary */}
          {importResult && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <MdCheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-slate-800">
                  Import Summary: {importResult.imported_count || 0} Imported, {importResult.updated_count || 0} Updated
                </span>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 space-y-1 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 max-h-32 overflow-y-auto">
                  <p className="font-bold flex items-center gap-1">
                    <MdError className="w-4 h-4" /> Skipped / Warnings ({importResult.errors.length}):
                  </p>
                  {importResult.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitImport}
            disabled={loading || parsedData.length === 0}
            className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2 ${
              (loading || parsedData.length === 0) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Importing Data..." : `Import ${parsedData.length} Records`}
          </button>
        </div>

      </div>
    </div>
  );
}
