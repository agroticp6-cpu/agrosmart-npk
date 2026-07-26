import { useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Sprout, Settings, LogOut, Menu, X, Leaf } from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ParcelleListPage from "./pages/ParcelleListPage.jsx";
import ParcelleDetail from "./pages/ParcelleDetail.jsx";
import Parametres from "./pages/Parametres.jsx";
import CulturesPage from "./pages/CulturesPage.jsx";
import logoSite from "./assets/logo-site.png";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function NavItem({ to, icon, label, onNavigate }) {
  const location = useLocation();
  const actif = location.pathname === to;
  return (
    <Link to={to} className={`nav-item ${actif ? "nav-item-active" : ""}`} onClick={onNavigate}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const location = useLocation();

  function fermerMenu() {
    setMenuOuvert(false);
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <img src={logoSite} alt="AgroTIC Smart P6" className="mobile-header-logo" />
        <button className="mobile-menu-toggle" onClick={() => setMenuOuvert(!menuOuvert)}>
          {menuOuvert ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {menuOuvert && <div className="sidebar-overlay" onClick={fermerMenu} />}

      <aside className={`sidebar ${menuOuvert ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <img src={logoSite} alt="AgroTIC Smart P6" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Tableau de bord" onNavigate={fermerMenu} />
          <NavItem to="/parcelles" icon={<Sprout size={18} />} label="Mes parcelles" onNavigate={fermerMenu} />
          <NavItem to="/cultures" icon={<Leaf size={18} />} label="Cultures" onNavigate={fermerMenu} />
          <NavItem to="/parametres" icon={<Settings size={18} />} label="Paramètres" onNavigate={fermerMenu} />
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-user">{user.username}</div>
            <button
              className="sidebar-logout"
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        )}
      </aside>
      <div className="main-content" key={location.pathname}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parcelles"
        element={
          <ProtectedRoute>
            <Layout>
              <ParcelleListPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parcelles/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ParcelleDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cultures"
        element={
          <ProtectedRoute>
            <Layout>
              <CulturesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parametres"
        element={
          <ProtectedRoute>
            <Layout>
              <Parametres />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
