import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '../api/client';
import './Settings.css';

export default function Settings() {
    const { t } = useTranslation();
    const [settings, setSettings] = useState(null);
    const [packaging, setPackaging] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        settingsApi.get().then(r => {
            setSettings(r.data);
            setPackaging(r.data.packaging || []);
        }).catch(() => { });
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await settingsApi.update({
                cost_per_kwh: settings.cost_per_kwh,
                depreciation_months: settings.depreciation_months,
                fail_rate_percent: settings.fail_rate_percent,
            });
        } catch (err) { console.error(err); }
        setSaving(false);
    };

    if (!settings) return <div className="text-center text-muted" style={{ padding: '4rem' }}>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>{t('settingsTitle')}</h1>
                        <p>{t('settingsSubtitle')}</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? '...' : t('saveSettings')}
                    </button>
                </div>
            </div>

            {/* Electricity */}
            <div className="card settings-section">
                <div className="settings-section-header">
                    <span className="settings-icon">⚡</span>
                    <div>
                        <h3>{t('electricityCost')}</h3>
                        <p className="text-muted">{t('electricityDesc')}</p>
                    </div>
                </div>
                <div className="settings-field">
                    <label className="form-label">{t('costPerKwh')}</label>
                    <div className="settings-input-group">
                        <span className="settings-currency">R$</span>
                        <input className="form-input" type="number" step="0.01"
                            value={settings.cost_per_kwh}
                            onChange={e => setSettings({ ...settings, cost_per_kwh: parseFloat(e.target.value) || 0 })} />
                        <span className="settings-unit">/kWh</span>
                    </div>
                    <div className="settings-hint">
                        <span className="material-icons-outlined" style={{ fontSize: 14 }}>info</span>
                        {t('kwhHint')}
                    </div>
                </div>
            </div>

            {/* Fixed Costs */}
            <div className="card settings-section mt-6">
                <div className="settings-section-header">
                    <span className="settings-icon">🏛</span>
                    <div>
                        <h3>{t('fixedCostsDepreciation')}</h3>
                    </div>
                </div>
                <div className="grid-2">
                    <div className="settings-field">
                        <label className="form-label">{t('standardDepreciation')}</label>
                        <div className="settings-input-group">
                            <input className="form-input" type="number"
                                value={settings.depreciation_months}
                                onChange={e => setSettings({ ...settings, depreciation_months: parseInt(e.target.value) || 24 })} />
                            <span className="settings-unit">{t('months')}</span>
                        </div>
                    </div>
                    <div className="settings-field">
                        <label className="form-label">{t('failRateMargin')}</label>
                        <div className="settings-input-group">
                            <input className="form-input" type="number" step="0.5"
                                value={settings.fail_rate_percent}
                                onChange={e => setSettings({ ...settings, fail_rate_percent: parseFloat(e.target.value) || 5 })} />
                            <span className="settings-unit">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packaging */}
            <div className="card settings-section mt-6">
                <div className="settings-section-header">
                    <span className="settings-icon">📦</span>
                    <div>
                        <h3>{t('packagingSupplies')}</h3>
                    </div>
                    <button className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
                        <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
                        {t('addNew')}
                    </button>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Unit Cost</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {packaging.map(pkg => (
                            <tr key={pkg.id}>
                                <td style={{ fontWeight: 600 }}>{pkg.name}</td>
                                <td>R$ {pkg.unit_cost.toFixed(2)}</td>
                                <td>
                                    <button className="btn-icon"><span className="material-icons-outlined">edit</span></button>
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={3}>
                                <button className="btn btn-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: 14 }}>add</span>
                                    {t('addNewPackaging')}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="settings-footer mt-6">
                <a href="#">{t('documentation')}</a> • <a href="#">{t('support')}</a>
            </div>
        </div>
    );
}
