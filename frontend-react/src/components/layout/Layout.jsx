import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Send, Activity, LogOut } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Webhook Platform</h3>
        </div>
        <nav className="sidebar-nav">
          <Link to="/endpoints" className={location.pathname.startsWith('/endpoints') ? 'active' : ''}>
            <LayoutDashboard size={20} />
            Endpoints
          </Link>
          <Link to="/deliveries" className={location.pathname.startsWith('/deliveries') ? 'active' : ''}>
            <Activity size={20} />
            Deliveries
          </Link>
          <Link to="/test-event" className={location.pathname.startsWith('/test-event') ? 'active' : ''}>
            <Send size={20} />
            Test Event
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
