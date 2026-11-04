import React, { useState, useRef, useEffect } from "react";
import api from "../utils/axios";
import { 
  Bot, 
  Send, 
  X, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  ChevronDown, 
  ShieldCheck, 
  HelpCircle,
  Minimize2,
  RefreshCw
} from "lucide-react";


export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const initialMessages = [
    {
      id: "welcome-1",
      sender: "bot",
      text: "Hello! 👋 I am your **Krishna Air Car Parking Systems AI Assistant**.\n\nI am specially configured to help you with:\n- 🚗 **Parking Products** (Stack, Puzzle, Tower, Pit Parking & Specs)\n- 📋 **Car Parking Leads** & Quotation Generation\n- 📅 **Parking System AMC Contracts** & Maintenance Calendars\n- 🛠️ **Technician Repair Servicing** & Work Lists\n- 📐 **Parking Design Drawings** & Engineering Specs\n\nHow can I help you with your Car Parking System today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("krishna_crm_chat_history");
      return saved ? JSON.parse(saved) : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  const chatEndRef = useRef(null);

  // Listen for navbar open request event
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("openCarParkingAIChat", handleOpenChat);
    return () => window.removeEventListener("openCarParkingAIChat", handleOpenChat);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, loading]);

  // Persist chat history
  useEffect(() => {
    try {
      localStorage.setItem("krishna_crm_chat_history", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  }, [messages]);

  const quickSuggestions = [
    "What Parking Products exist?",
    "How to create a Parking Lead?",
    "How to generate a Parking Quotation?",
    "What is the Parking AMC Calendar?",
    "Where to upload Parking Drawings?"
  ];


  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || message).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setMessage("");
    setLoading(true);

    try {
      // Pass previous history for context
      const historyPayload = messages
        .filter(m => m.id !== "welcome-1")
        .map(m => ({ sender: m.sender, text: m.text }));

      let response;
      try {
        response = await api.post("/api/chatbot/", {
          message: textToSend,
          history: historyPayload
        });
      } catch (err) {
        // Fallback to /auth/chatbot/ if /api/chatbot/ is not routed
        response = await api.post("/auth/chatbot/", {
          message: textToSend,
          history: historyPayload
        });
      }

      const botText = response.data?.answer || "I am unable to answer right now. Please try again.";


      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot API error:", error);
      const fallbackText = error.response?.data?.answer || 
        "⚠️ Sorry, I could not connect to the system server. Please check your network connection or try again shortly.";

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages(initialMessages);
    localStorage.removeItem("krishna_crm_chat_history");
  };

  // Helper to format bot markdown text simple rendering (bolding, lists, line breaks)
  const formatBotText = (text) => {
    if (!text) return "";
    
    // Split lines
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Handle Bold **text**
      let parts = line.split(/(\*\*.*?\*\*)/g);
      let formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Handle List item
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-800 my-0.5">
            {formattedLine}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-800 my-0.5">
            {formattedLine}
          </li>
        );
      }

      if (line.trim() === "---") {
        return <hr key={idx} className="my-2 border-slate-200" />;
      }

      return (
        <p key={idx} className={line.trim() === "" ? "h-2" : "my-1 text-slate-800"}>
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-[2000] font-sans antialiased">
      {/* ── Chat Container Window (Opened via Navbar button) ── */}
      {isOpen && (

        <div
          className={
            "bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 overflow-hidden " +
            (isMinimized
              ? "w-80 h-14"
              : "w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]")
          }
        >
          {/* ── Window Header ── */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
                <Bot className="w-5 h-5 text-indigo-200" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-indigo-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-tight text-white">
                    Car Parking AI
                  </h3>
                  <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-indigo-400/30">
                    Parking System Only
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/90 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                  Parking AI • Online
                </p>
              </div>
            </div>


            {/* Header controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-200 hover:text-white transition"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-200 hover:text-white transition"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <MessageSquare className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-200 hover:text-white transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Window Content Body (Hidden when minimized) ── */}
          {!isMinimized && (
            <>
              {/* ── Message Thread ── */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/70 space-y-3.5">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="text-slate-800 space-y-1">
                          {formatBotText(msg.text)}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-600 animate-spin" />
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-slate-500 font-medium ml-1">
                        Analyzing CRM System...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* ── Quick Suggestion Chips ── */}
              {messages.length < 4 && !loading && (
                <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 shrink-0">
                  <p className="text-[10px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <HelpCircle className="w-3 h-3 text-indigo-500" />
                    Quick Suggested Questions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="text-[11px] bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-indigo-200/70 hover:border-indigo-400 px-2.5 py-1 rounded-full font-medium transition-all shadow-2xs"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Input Bar ── */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about Parking Products, Leads, AMC, Servicing..."
                    disabled={loading}
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || loading}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shadow-md flex items-center justify-center shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Scope Notice */}
                <div className="flex items-center justify-between px-1 mt-1.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Restricted strictly to Car Parking System queries
                  </span>
                  <span>Press Enter to send</span>
                </div>

              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
