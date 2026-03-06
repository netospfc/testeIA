import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: 'dashboard', label: t('dashboard') },
        { path: '/inventory', icon: 'inventory_2', label: t('inventory') },
        { path: '/architect', icon: 'architecture', label: t('productArchitect') },
        { path: '/calculator', icon: 'calculate', label: t('calculator') },
        { path: '/maintenance', icon: 'build', label: t('maintenance') },
        { path: '/reports', icon: 'query_stats', label: t('reports') },
        { path: '/settings', icon: 'settings', label: t('settings') },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <span className="material-icons-outlined">view_in_ar</span>
                    </div>
                    <div>
                        <div className="logo-title">Custora</div>
                        <span className="badge badge-primary">{t('proWorkspace')}</span>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.slice(0, 4).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <span className="material-icons-outlined">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <div className="sidebar-section-label">Management</div>

                {navItems.slice(4).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <span className="material-icons-outlined">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <NavLink to="#" className="sidebar-link">
                    <span className="material-icons-outlined">help_outline</span>
                    <span>{t('helpSupport')}</span>
                </NavLink>

                <div className="sidebar-user">
                    <div className="user-avatar">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.name || 'Alex Maker'}</div>
                        <div className="user-role">{user?.role || 'Pro Plan'}</div>
                    </div>
                    <button className="btn-icon" onClick={handleLogout} title={t('logout')}>
                        <span className="material-icons-outlined">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
