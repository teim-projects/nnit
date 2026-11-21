// App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar        from "./components/Navbar";
import Login         from "./components/Login";
import Dashboard     from "./pages/Dashboard";
import Register      from "./components/Register";
import ProfileSection from "./components/ProfileSection";
import ForgotPassword from "./components/ForgotPassword";
import ResetPasswordConfirm from "./components/ResetPasswordConfirm";
import Sidebar       from "./components/Sidebar";
import Accounts      from "./pages/Accounts";
import Customer      from "./pages/Customer";
import Lead          from "./pages/Lead";
import Quotation     from "./pages/Quotation";
import Invoice       from "./pages/Invoice";
import AmcPage       from "./pages/Amc";
import ParkingProducts from './pages/ParkingProducts';
import TermsManagement from './pages/TermsManagement';
import FollowupManagement from './pages/FollowupManagement';
import RoleAccessManagement from './pages/RoleAccessManagement';
import ReportsAnalytics from './pages/ReportsAnalytics';
import DesignManagement from './pages/DesignManagement';
import DesignerQueue from './pages/DesignerQueue';
import DesignerSend from './pages/DesignerSend';
import TechnicianPage from './pages/TechnicianPage';
import ServicePage from './pages/ServicePage';
import TemplateManagement from './pages/TemplateManagement';
import TechnicianWorkList from './pages/TechnicianWorkList';
import CompletedWorkList from './pages/CompletedWorkList';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ChatbotWidget from './components/ChatbotWidget';

// ── Inventory ERP Module Pages ──
import InventoryDashboard from './pages/inventory/InventoryDashboard';
import InventoryMasters from './pages/inventory/InventoryMasters';
import InventoryProcurement from './pages/inventory/InventoryProcurement';
import InventoryMaterialMovement from './pages/inventory/InventoryMaterialMovement';
import StockSummaryPage from './pages/inventory/StockSummaryPage';
import StockRecordPage from './pages/inventory/StockRecordPage';
import BOMManagementPage from './pages/inventory/BOMManagementPage';
import InventoryReportsPage from './pages/inventory/InventoryReportsPage';

function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("access"));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem("access"));
    };

    window.addEventListener("authChange", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const noNavPaths = ["/login", "/register", "/forgot-password"];

  const hideNavbar =
    !isLoggedIn ||
    noNavPaths.includes(location.pathname) ||
    location.pathname.startsWith("/password-reset-confirm/");

  // close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Fixed Navbar ── */}
      {!hideNavbar && (
        <header className="w-full shrink-0 fixed top-0 left-0 right-0 z-[1000]">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
        </header>
      )}

      {/* ── Body: sidebar + main ── */}
      <div className={`flex flex-1 overflow-hidden ${!hideNavbar ? "pt-[62px]" : ""}`}>

        {/* Desktop sidebar */}
        {!hideNavbar && (
          <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-full overflow-y-auto bg-white border-r border-slate-200/70">
            <Sidebar />
          </aside>
        )}

        {/* Main content */}
        <main className={`flex-1 overflow-hidden ${hideNavbar ? "flex items-center justify-center" : ""}`}>
          <div className="w-full h-full overflow-auto">
            <Routes>
              <Route path="/"  element={isLoggedIn ? (localStorage.getItem("user_role") === "technician" ? <Navigate to="/technician-dashboard" replace /> : <Navigate to="/dashboard" replace />) : <Navigate to="/login" replace />} />
              <Route path="/login"    element={isLoggedIn ? (localStorage.getItem("user_role") === "technician" ? <Navigate to="/technician-dashboard" replace /> : <Navigate to="/dashboard" replace />) : <Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/password-reset-confirm/:uid/:token" element={<ResetPasswordConfirm />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Dashboard /></ProtectedRoute>} />
              <Route path="/technician-dashboard" element={<ProtectedRoute isLoggedIn={isLoggedIn}><TechnicianDashboard /></ProtectedRoute>} />
              <Route path="/technician-work-list" element={<ProtectedRoute isLoggedIn={isLoggedIn}><TechnicianWorkList /></ProtectedRoute>} />
              <Route path="/work-list" element={<ProtectedRoute isLoggedIn={isLoggedIn}><TechnicianWorkList /></ProtectedRoute>} />
              <Route path="/completed-work-list" element={<ProtectedRoute isLoggedIn={isLoggedIn}><CompletedWorkList /></ProtectedRoute>} />
              <Route path="/reports"  element={<ProtectedRoute isLoggedIn={isLoggedIn}><ReportsAnalytics /></ProtectedRoute>} />
              <Route path="/reports-analytics" element={<ProtectedRoute isLoggedIn={isLoggedIn}><ReportsAnalytics /></ProtectedRoute>} />
              <Route path="/profile"   element={<ProtectedRoute isLoggedIn={isLoggedIn}><ProfileSection /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Accounts /></ProtectedRoute>} />
              <Route path="/customer" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Customer /></ProtectedRoute>} />
              <Route path="/leads"    element={<ProtectedRoute isLoggedIn={isLoggedIn}><Lead /></ProtectedRoute>} />
              <Route path="/quotation" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Quotation /></ProtectedRoute>} />
              <Route path="/invoice"   element={<ProtectedRoute isLoggedIn={isLoggedIn}><Invoice /></ProtectedRoute>} />
              <Route path="/parking-products"  element={<ProtectedRoute isLoggedIn={isLoggedIn}><ParkingProducts /></ProtectedRoute>} />
              <Route path="/terms-conditions"  element={<ProtectedRoute isLoggedIn={isLoggedIn}><TermsManagement /></ProtectedRoute>} />
              <Route path="/amc"       element={<ProtectedRoute isLoggedIn={isLoggedIn}><AmcPage /></ProtectedRoute>} />
              <Route path="/services"  element={<ProtectedRoute isLoggedIn={isLoggedIn}><ServicePage /></ProtectedRoute>} />
              <Route path="/technicians" element={<ProtectedRoute isLoggedIn={isLoggedIn}><TechnicianPage /></ProtectedRoute>} />
              <Route path="/followup-management" element={<ProtectedRoute isLoggedIn={isLoggedIn}><FollowupManagement /></ProtectedRoute>} />
              <Route path="/role-access" element={<ProtectedRoute isLoggedIn={isLoggedIn}><RoleAccessManagement /></ProtectedRoute>} />
              <Route path="/designer-send" element={<ProtectedRoute isLoggedIn={isLoggedIn}><DesignerSend /></ProtectedRoute>} />
              <Route path="/design-drawings" element={<ProtectedRoute isLoggedIn={isLoggedIn}><DesignManagement /></ProtectedRoute>} />
              <Route path="/designer-queue" element={<ProtectedRoute isLoggedIn={isLoggedIn}><DesignerQueue /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute isLoggedIn={isLoggedIn}><TemplateManagement /></ProtectedRoute>} />

              {/* ── Inventory ERP Module Routes ── */}
              <Route path="/inventory" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryDashboard /></ProtectedRoute>} />
              <Route path="/inventory/dashboard" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryDashboard /></ProtectedRoute>} />
              
              {/* Masters */}
              <Route path="/inventory/products" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMasters /></ProtectedRoute>} />
              <Route path="/inventory/categories" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMasters /></ProtectedRoute>} />
              <Route path="/inventory/sub-categories" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMasters /></ProtectedRoute>} />
              <Route path="/inventory/brands" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMasters /></ProtectedRoute>} />
              <Route path="/inventory/uom" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMasters /></ProtectedRoute>} />
              <Route path="/inventory/warehouses" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMasters /></ProtectedRoute>} />

              {/* Procurement */}
              <Route path="/inventory/vendors" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryProcurement /></ProtectedRoute>} />
              <Route path="/inventory/material-requisitions" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryProcurement /></ProtectedRoute>} />
              <Route path="/inventory/purchase-orders" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryProcurement /></ProtectedRoute>} />
              <Route path="/inventory/grn" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryProcurement /></ProtectedRoute>} />

              {/* Material Movement */}
              <Route path="/inventory/mtn" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMaterialMovement /></ProtectedRoute>} />
              <Route path="/inventory/delivery-challan" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMaterialMovement /></ProtectedRoute>} />
              <Route path="/inventory/material-return" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMaterialMovement /></ProtectedRoute>} />
              <Route path="/inventory/stock-transfer" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMaterialMovement /></ProtectedRoute>} />
              <Route path="/inventory/stock-adjustment" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryMaterialMovement /></ProtectedRoute>} />

              {/* Stock Summary & Records */}
              <Route path="/inventory/stock-summary" element={<ProtectedRoute isLoggedIn={isLoggedIn}><StockSummaryPage /></ProtectedRoute>} />
              <Route path="/inventory/stock-record" element={<ProtectedRoute isLoggedIn={isLoggedIn}><StockRecordPage /></ProtectedRoute>} />

              {/* BOM */}
              <Route path="/inventory/bom" element={<ProtectedRoute isLoggedIn={isLoggedIn}><BOMManagementPage /></ProtectedRoute>} />
              <Route path="/inventory/bom/create" element={<ProtectedRoute isLoggedIn={isLoggedIn}><BOMManagementPage /></ProtectedRoute>} />

              {/* Reports */}
              <Route path="/inventory/reports/*" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryReportsPage /></ProtectedRoute>} />
              <Route path="/inventory/reports/purchase-register" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryReportsPage /></ProtectedRoute>} />
              <Route path="/inventory/reports/product-purchase-history" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryReportsPage /></ProtectedRoute>} />
              <Route path="/inventory/reports/product-price-history" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryReportsPage /></ProtectedRoute>} />
              <Route path="/inventory/reports/vendor-purchase-history" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryReportsPage /></ProtectedRoute>} />
              <Route path="/inventory/reports/product-price-comparison" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryReportsPage /></ProtectedRoute>} />
              <Route path="/inventory/reports/low-stock" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryReportsPage /></ProtectedRoute>} />
              <Route path="/inventory/reports/valuation" element={<ProtectedRoute isLoggedIn={isLoggedIn}><InventoryReportsPage /></ProtectedRoute>} />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* ── System AI Chatbot Widget (Only when logged in) ── */}
      {!hideNavbar && <ChatbotWidget />}

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && !hideNavbar && (
        <div className="fixed inset-0 z-[1100] flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white h-full shadow-2xl overflow-y-auto pt-[62px] z-10">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
