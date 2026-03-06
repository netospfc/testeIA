import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../api/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Reports.css';

export default function Reports() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);

    useEffect(() => {
        reportsApi.getFinancial().then(r => setData(r.data)).catch(() => { });
    }, []);

    if (!data) return <div className="text-center text-muted" style={{ padding: '4rem' }}>Loading...</div>;

    const pieData = [
        { name: t('material'), value: data.cost_distribution.material_pct, color: '#0f0fbd' },
        { name: t('energy'), value: data.cost_distribution.energy_pct, color: '#3b82f6' },
        { name: t('overhead'), value: data.cost_distribution.overhead_pct, color: '#9ca3af' },
    ];

    const barData = data.material_usage.map(m => ({
        name: m.name.length > 18 ? m.name.substring(0, 18) + '…' : m.name,
        kg: m.usage_kg,
        cost: m.cost,
        fill: m.color_hex,
    }));

    const formatHours = (h) => {
        const hrs = Math.floor(h);
        const mins = Math.round((h - hrs) * 60);
        return `${hrs}h ${mins}m`;
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>{t('reportsTitle')}</h1>
                        <p>{t('reportsSubtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        <select className="form-input" style={{ width: 180 }}>
                            <option>{t('last30Days')}</option>
                        </select>
                        <button className="btn-icon"><span className="material-icons-outlined">notifications_none</span></button>
                        <button className="btn-icon"><span className="material-icons-outlined">settings</span></button>
                    </div>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">{t('avgProfitPerPiece')}</div>
                    <div className="kpi-value">R$ {data.kpis.avg_profit_per_piece.toFixed(2)}</div>
                    <div className={`kpi-change ${data.kpis.avg_profit_change >= 0 ? 'up' : 'down'}`}>
                        <span className="material-icons-outlined" style={{ fontSize: 14 }}>
                            {data.kpis.avg_profit_change >= 0 ? 'trending_up' : 'trending_down'}
                        </span>
                        +{data.kpis.avg_profit_change}% {t('vsLastMonth')}
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">{t('energyCost')}</div>
                    <div className="kpi-value">R$ {data.kpis.energy_cost.toFixed(2)}</div>
                    <div className="kpi-change down">
                        <span className="material-icons-outlined" style={{ fontSize: 14 }}>trending_up</span>
                        +{data.kpis.energy_change}% • ~{data.kpis.total_kwh} kWh {t('total')}
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">{t('stockValue')}</div>
                    <div className="kpi-value">R$ {data.kpis.stock_value.toFixed(2)}</div>
                    <div className="kpi-change" style={{ color: 'var(--color-text-muted)' }}>
                        — 0% • {data.kpis.total_stock_kg}kg filament
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>{t('costDistributionChart')}</h3>
                    <div className="pie-container">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(v) => `${v}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pie-center">
                            <div className="pie-total-label">Total</div>
                            <div className="pie-total-value">R$ {data.cost_distribution.total}</div>
                        </div>
                    </div>
                    <div className="legend-items">
                        {pieData.map((item, i) => (
                            <div key={i} className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                                <span>{item.name}</span>
                                <span className="legend-pct">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>{t('materialUsage')}</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <XAxis type="number" tick={{ fontSize: 11 }} unit="kg" />
                            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v) => `${v} kg`} />
                            <Bar dataKey="kg" radius={[0, 4, 4, 0]}>
                                {barData.map((entry, i) => <Cell key={i} fill={entry.fill || '#0f0fbd'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card mt-6">
                <div className="flex-between mb-4">
                    <h3 style={{ fontWeight: 700 }}>{t('hardwareEfficiency')}</h3>
                    <button className="btn btn-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                        <span className="material-icons-outlined" style={{ fontSize: 14 }}>download</span>
                        {t('downloadCsv')}
                    </button>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('machineName')}</th>
                            <th>{t('status')}</th>
                            <th>{t('activeHours')}</th>
                            <th>{t('avgPower')}</th>
                            <th>{t('totalEnergyCost')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.hardware_efficiency.map((hw, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{hw.name}</td>
                                <td>
                                    <span className={`badge ${hw.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                        {hw.status === 'active' ? 'Active' : 'Idle'}
                                    </span>
                                </td>
                                <td>{formatHours(hw.active_hours)}</td>
                                <td className="text-primary" style={{ fontWeight: 600 }}>{hw.avg_power}W</td>
                                <td>R$ {hw.energy_cost.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
