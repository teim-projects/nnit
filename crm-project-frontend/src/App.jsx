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

function AppRoutes() {
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const noNavPaths = ["/login", "/register", "/forgot-password"];
  const isLoggedIn = !!localStorage.getItem("access");

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
          <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-full overflow-y-auto">
            <Sidebar />
          </aside>
        )}

        {/* Main content */}
        <main className={`flex-1 overflow-hidden ${hideNavbar ? "flex items-center justify-center" : ""}`}>
          <div className="w-full h-full overflow-auto">
            <Routes>
              <Route path="/"  element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
              <Route path="/login"    element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile"   element={<ProfileSection />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/password-reset-confirm/:uid/:token" element={<ResetPasswordConfirm />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/customer" element={<Customer />} />
              <Route path="/leads"    element={<Lead />} />
              <Route path="/quotation" element={<Quotation />} />
              <Route path="/invoice"   element={<Invoice />} />
              <Route path="/parking-products"  element={<ParkingProducts />} />
              <Route path="/terms-conditions"  element={<TermsManagement />} />
              <Route path="/amc"       element={<AmcPage />} />
              <Route path="/followup-management" element={<FollowupManagement />} />
            </Routes>
          </div>
        </main>
      </div>

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
