import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderLock,
  ShieldCheck,
  Bell,
  LogOut,
  GitBranch,
  ScrollText,
  Activity,
  UserCheck,
  Binary,
  Sliders,
} from 'lucide-react';
import './MainLayout.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = (): NavItem[] => {
    const role = user?.role;
    const items: NavItem[] = [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    ];

    if (role === 'CITIZEN' || !role) {
      items.push(
        { to: '/applications', label: 'My Applications', icon: <FileText size={18} /> },
        { to: '/applications/new', label: 'New Service', icon: <PlusCircle size={18} /> },
        { to: '/documents', label: 'Documents Vault', icon: <FolderLock size={18} /> },
        { to: '/consents', label: 'Consent Center', icon: <ShieldCheck size={18} /> },
        { to: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
      );
    }

    if (role === 'DEPT_OFFICER' || role === 'DEPT_ADMIN') {
      items.push(
        { to: '/officer/queue', label: 'Officer Adjudication', icon: <UserCheck size={18} /> },
        { to: '/applications', label: 'Applications Worklist', icon: <FileText size={18} /> },
        { to: '/audit', label: 'Audit Trail', icon: <ScrollText size={18} /> },
        { to: '/notifications', label: 'Department Alerts', icon: <Bell size={18} /> },
      );
    }

    if (role === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN') {
      items.push(
        { to: '/officer/queue', label: 'Officer Worklist', icon: <UserCheck size={18} /> },
        { to: '/applications', label: 'All Applications', icon: <FileText size={18} /> },
        { to: '/connectors', label: 'Connectors & Breakers', icon: <GitBranch size={18} /> },
        { to: '/schema-mappings', label: 'Schema Mappings', icon: <Binary size={18} /> },
        { to: '/audit', label: 'Audit Ledger', icon: <ScrollText size={18} /> },
        { to: '/monitoring', label: 'Telemetry & SLA', icon: <Activity size={18} /> },
        { to: '/demo-controls', label: 'Fault Injection (Demo)', icon: <Sliders size={18} /> },
      );
    }

    return items;
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'GC';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="gov-layout">
      {/* ─── Left Institutional Sidebar ────────────────────── */}
      <aside className="gov-sidebar">
        <div>
          <div className="gov-sidebar__header">
            <div className="gov-sidebar__logo-icon">🏛️</div>
            <div className="gov-sidebar__brand-text">
              <span className="gov-sidebar__brand-name">GovConnect</span>
              <span className="gov-sidebar__brand-sub">National Interop Portal</span>
            </div>
          </div>

          <div className="gov-sidebar__nav-section">
            {user?.role === 'CITIZEN' ? 'Citizen Services' : 'Administrative Operations'}
          </div>

          <nav className="gov-sidebar__nav">
            {getNavItems().map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `gov-sidebar__link ${isActive ? 'gov-sidebar__link--active' : ''}`
                }
              >
                <span className="gov-sidebar__link-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="gov-sidebar__link-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="gov-sidebar__footer">
          <div className="gov-sidebar__status-pill">
            <span className="gov-sidebar__status-dot"></span>
            <span>e-ID Verified Active</span>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Shell ────────────────────────────── */}
      <div className="gov-main-wrapper">
        <header className="gov-header">
          <div className="gov-header__left">
            <div className="gov-header__sync-badge">
              <span className="gov-header__sync-pulse"></span>
              <span>6 Federated Ministries Synced</span>
            </div>
          </div>

          <div className="gov-header__right">
            <div className="gov-header__user-block">
              <div className="gov-header__avatar">{getUserInitials(user?.name)}</div>
              <div className="gov-header__user-info">
                <span className="gov-header__user-name">{user?.name || 'Authorized User'}</span>
                <span className="gov-header__user-role">
                  {user?.role ? user.role.replace('_', ' ') : 'Citizen Tier 3'}
                </span>
              </div>
            </div>

            <button className="gov-header__logout-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="gov-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
