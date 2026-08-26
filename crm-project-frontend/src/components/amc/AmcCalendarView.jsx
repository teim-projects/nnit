import React, { useState, useEffect } from "react";
import {
  MdCalendarMonth,
  MdRefresh,
  MdChevronLeft,
  MdChevronRight,
  MdToday,
  MdRemoveRedEye,
  MdClose,
  MdPerson,
  MdAssignment
} from "react-icons/md";

export default function AmcCalendarView({ baseApi, token, onViewContract }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Default August 2026 or today
  const [viewMode, setViewMode] = useState("month"); // "month" | "week" | "list"
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseApi}/amc/calendar-events/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load AMC Calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [baseApi, token]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  // Generate Month Days Grid (35 or 42 cells)
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Previous month overflow days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const d = new Date(year, month - 1, dayNum);
    const dateStr = d.toISOString().split("T")[0];
    calendarCells.push({ date: d, dateStr, dayNum, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const yearStr = dateObj.getFullYear();
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
    calendarCells.push({ date: dateObj, dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Next month overflow days to make grid multiple of 7
  const remainingCells = 7 - (calendarCells.length % 7);
  if (remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      const dateObj = new Date(year, month + 1, i);
      const dateStr = dateObj.toISOString().split("T")[0];
      calendarCells.push({ date: dateObj, dateStr, dayNum: i, isCurrentMonth: false });
    }
  }

  // Map events to date cells
  const getEventsForDate = (dateStr) => {
    return events.filter((evt) => {
      const evtStart = evt.start ? evt.start.split("T")[0] : "";
      return evtStart === dateStr;
    });
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <MdCalendarMonth size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">AMC Service Calendar</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Live interactive monthly schedule for service visits and contract expiries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchCalendarEvents}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <MdRefresh size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* Calendar Control Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
            >
              <MdChevronLeft size={18} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
            >
              <MdChevronRight size={18} />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <MdToday size={14} /> Today
            </button>
          </div>

          {/* Month Title */}
          <h2 className="text-xl font-black text-indigo-700 tracking-tight">
            {monthNames[month]} <span className="text-indigo-400 font-bold">{year}</span>
          </h2>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === "month" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === "week" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === "list" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">
            <div className="inline-block w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading Calendar Schedule...</p>
          </div>
        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-2 max-h-[500px] overflow-y-auto p-1">
            {events.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No scheduled events found.</p>
            ) : (
              events.map((evt, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedEvent(evt)}
                  className="p-3 bg-slate-50 border-l-4 border-indigo-600 rounded-lg flex items-center justify-between hover:bg-slate-100 transition cursor-pointer"
                  style={{ borderLeftColor: evt.backgroundColor || "#3b82f6" }}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      📅 {formatDisplayDate(evt.start)}
                    </span>
                    <h4 className="text-xs font-black text-slate-800">{evt.title}</h4>
                    <p className="text-[11px] text-slate-500">Customer: {evt.extendedProps?.customer || "—"}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white"
                    style={{ backgroundColor: evt.backgroundColor || "#3b82f6" }}
                  >
                    {evt.extendedProps?.type || "Visit"}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Month Grid View */
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-slate-100/80 border-b border-slate-200 text-center text-xs font-extrabold text-slate-700 py-2.5">
              {daysOfWeek.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Grid Date Cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-50/30 text-xs">
              {calendarCells.map((cell, idx) => {
                const dayEvents = getEventsForDate(cell.dateStr);
                const isTodayCell =
                  cell.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`min-h-[95px] p-1.5 flex flex-col justify-between transition ${
                      !cell.isCurrentMonth
                        ? "bg-slate-100/40 text-slate-400"
                        : isTodayCell
                        ? "bg-blue-50/40 font-bold"
                        : "bg-white text-slate-800"
                    }`}
                  >
                    <div className="flex justify-end mb-1">
                      <span
                        className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          isTodayCell
                            ? "bg-indigo-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                    </div>

                    {/* Events Container */}
                    <div className="space-y-1 overflow-y-auto max-h-[70px]">
                      {dayEvents.map((evt, eIdx) => {
                        const bg = evt.backgroundColor || "#3b82f6";
                        return (
                          <div
                            key={eIdx}
                            onClick={() => setSelectedEvent(evt)}
                            className="px-2 py-1 rounded text-[10px] font-extrabold text-white truncate shadow-2xs cursor-pointer hover:opacity-90 transition"
                            style={{ backgroundColor: bg }}
                            title={evt.title}
                          >
                            {evt.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold pt-2 border-t border-slate-100 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span> Scheduled Service
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span> Service Visit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span> Contract Expiry
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span> Renewal Due
          </span>
        </div>
      </div>

      {/* Event Details Popup Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <MdCalendarMonth className="text-indigo-600" /> Event Details
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Event Title</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedEvent.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Event Date</span>
                <p className="font-bold text-indigo-700">📅 {formatDisplayDate(selectedEvent.start)}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                <p className="font-semibold text-slate-800">{selectedEvent.extendedProps?.customer || "—"}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract ID</span>
                <p className="font-bold text-slate-800">{selectedEvent.extendedProps?.contract || "—"}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
              {selectedEvent.extendedProps?.contract_id_pk && (
                <button
                  onClick={() => {
                    const cId = selectedEvent.extendedProps.contract_id_pk;
                    setSelectedEvent(null);
                    onViewContract?.(cId);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  <MdRemoveRedEye size={14} /> View AMC
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
