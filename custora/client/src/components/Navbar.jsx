import { useTranslation } from 'react-i18next';
import './Navbar.css';

export default function Navbar() {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    return (
        <header className="navbar">
            <div className="navbar-search">
                <span className="material-icons-outlined">search</span>
                <input type="text" placeholder={t('search')} />
            </div>
            <div className="navbar-actions">
                <div className="lang-toggle">
                    <button
                        className={`lang-btn ${currentLang === 'pt' ? 'active' : ''}`}
                        onClick={() => i18n.changeLanguage('pt')}
                    >
                        PT
                    </button>
                    <button
                        className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
                        onClick={() => i18n.changeLanguage('en')}
                    >
                        EN
                    </button>
                </div>
                <button className="btn-icon">
                    <span className="material-icons-outlined">notifications_none</span>
                </button>
            </div>
        </header>
    );
}
