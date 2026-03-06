import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/client';
import './Login.css';

export default function Login() {
    const { t, i18n } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', studio_name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = isRegister
                ? await authApi.register(form)
                : await authApi.login({ email: form.email, password: form.password });
            login(res.data.user, res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-pattern"></div>
            <div className="login-card fade-in">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="material-icons-outlined">view_in_ar</span>
                    </div>
                    <h1>{t('loginTitle')}</h1>
                    <p>{t('loginSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <div className="form-group">
                                <label className="form-label">{t('nameLabel')}</label>
                                <div className="form-input-icon">
                                    <span className="material-icons-outlined">person</span>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('studioNameLabel')}</label>
                                <div className="form-input-icon">
                                    <span className="material-icons-outlined">store</span>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={form.studio_name}
                                        onChange={(e) => setForm({ ...form, studio_name: e.target.value })}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">{t('emailLabel')}</label>
                        <div className="form-input-icon">
                            <span className="material-icons-outlined">email</span>
                            <input
                                className="form-input"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('passwordLabel')}</label>
                        <div className="form-input-icon">
                            <span className="material-icons-outlined">lock</span>
                            <input
                                className="form-input"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button className="btn btn-primary btn-full login-btn" type="submit" disabled={loading}>
                        {loading ? '...' : isRegister ? t('registerButton') : t('loginButton')}
                    </button>
                </form>

                <div className="login-footer-link">
                    {isRegister ? (
                        <button onClick={() => setIsRegister(false)}>← {t('backToLogin')}</button>
                    ) : (
                        <span>
                            {t('noAccess')}{' '}
                            <button onClick={() => setIsRegister(true)}>{t('requestAccess')}</button>
                        </span>
                    )}
                </div>

                <div className="login-version">
                    <span>v2.4.0 • Build 8921</span>
                </div>
                <div className="login-sys">
                    <span className="material-icons-outlined" style={{ fontSize: 12 }}>grid_view</span>
                    SYS.READY
                </div>

                <div className="login-lang-toggle">
                    <button className={i18n.language === 'pt' ? 'active' : ''} onClick={() => i18n.changeLanguage('pt')}>PT</button>
                    <button className={i18n.language === 'en' ? 'active' : ''} onClick={() => i18n.changeLanguage('en')}>EN</button>
                </div>
            </div>
        </div>
    );
}
