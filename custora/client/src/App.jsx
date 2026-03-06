import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calculator from './pages/Calculator';
import Inventory from './pages/Inventory';
import ProductArchitect from './pages/ProductArchitect';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './i18n/i18n';

function ProtectedLayout() {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="text-center" style={{ padding: '4rem' }}>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Navbar />
                <div className="page-container fade-in">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<ProtectedLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/calculator" element={<Calculator />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/architect" element={<ProductArchitect />} />
                        <Route path="/maintenance" element={<Maintenance />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
