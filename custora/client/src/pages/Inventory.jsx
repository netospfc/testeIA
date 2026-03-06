import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { filamentsApi, printersApi } from '../api/client';
import './Inventory.css';

export default function Inventory() {
    const { t } = useTranslation();
    const [tab, setTab] = useState('filaments');
    const [filaments, setFilaments] = useState([]);
    const [printers, setPrinters] = useState([]);
    const [filter, setFilter] = useState('all');
    const [editFilament, setEditFilament] = useState(null);
    const [editPrinter, setEditPrinter] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        filamentsApi.getAll().then(r => setFilaments(r.data)).catch(() => { });
        printersApi.getAll().then(r => setPrinters(r.data)).catch(() => { });
    };

    const types = ['all', 'PLA', 'PETG', 'ABS', 'TPU'];
    const filteredFilaments = filaments.filter(f => {
        if (filter !== 'all' && f.type !== filter) return false;
        if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const filteredPrinters = printers.filter(p => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.model.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const typeCounts = types.reduce((acc, type) => {
        acc[type] = type === 'all' ? filaments.length : filaments.filter(f => f.type === type).length;
        return acc;
    }, {});

    const handleSaveFilament = async () => {
        if (!editFilament) return;
        try {
            if (editFilament.id) {
                await filamentsApi.update(editFilament.id, editFilament);
            } else {
                await filamentsApi.create(editFilament);
            }
            loadData();
            setEditFilament(null);
        } catch (err) { console.error(err); }
    };

    const handleDeleteFilament = async (id) => {
        if (!window.confirm(t('confirmDelete'))) return;
        try {
            await filamentsApi.delete(id);
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleSavePrinter = async () => {
        if (!editPrinter) return;
        try {
            if (editPrinter.id) {
                await printersApi.update(editPrinter.id, editPrinter);
            } else {
                await printersApi.create(editPrinter);
            }
            loadData();
            setEditPrinter(null);
        } catch (err) { console.error(err); }
    };

    const handleDeletePrinter = async (id) => {
        if (!window.confirm(t('confirmDelete'))) return;
        try {
            await printersApi.delete(id);
            loadData();
        } catch (err) { console.error(err); }
    };

    return (
        <div>
            <div className="page-header">
                <h1>{t('inventoryTitle')}</h1>
            </div>

            <div className="tabs">
                <button className={`tab ${tab === 'filaments' ? 'active' : ''}`} onClick={() => setTab('filaments')}>
                    {t('filaments')}
                </button>
                <button className={`tab ${tab === 'printers' ? 'active' : ''}`} onClick={() => setTab('printers')}>
                    {t('printers')}
                </button>
            </div>

            <div className="inv-toolbar">
                {tab === 'filaments' ? (
                    <div className="filter-pills">
                        {types.map(type => (
                            <button key={type} className={`filter-pill ${filter === type ? 'active' : ''}`}
                                onClick={() => setFilter(type)}>
                                {type === 'all' ? t('all') : type} ({typeCounts[type]})
                            </button>
                        ))}
                    </div>
                ) : <div />}

                <div className="inv-toolbar-right">
                    <div className="navbar-search" style={{ width: 220 }}>
                        <span className="material-icons-outlined" style={{ fontSize: 16 }}>search</span>
                        <input type="text" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    {tab === 'filaments' ? (
                        <button className="btn btn-primary" onClick={() => setEditFilament({ name: '', manufacturer: '', type: 'PLA', color_hex: '#000000', initial_weight_g: 1000, price_paid: 0, purchase_date: '', notes: '' })}>
                            <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
                            {t('addFilament')}
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setEditPrinter({ name: '', model: '', status: 'idle', wattage: 200, purchase_price: 0, depreciation_months: 24, total_hours: 0 })}>
                            <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
                            {t('addPrinter') || 'Add Printer'}
                        </button>
                    )}
                </div>
            </div>

            {tab === 'filaments' ? (
                <div className="card mt-4">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('status')}</th>
                                <th>{t('materialColor')}</th>
                                <th>{t('manufacturer')}</th>
                                <th>{t('type')}</th>
                                <th>{t('remainingStock')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFilaments.map(f => (
                                <tr key={f.id}>
                                    <td><span className={`status-dot ${f.status}`}></span></td>
                                    <td>
                                        <div className="filament-cell">
                                            <span className="color-swatch" style={{ backgroundColor: f.color_hex }}></span>
                                            <div>
                                                <div className="filament-name">{f.name}</div>
                                                <div className="filament-sku text-muted">SKU-{String(f.id).padStart(3, '0')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{f.manufacturer}</td>
                                    <td><span className="badge badge-neutral">{f.type}</span></td>
                                    <td>
                                        <div className="stock-cell">
                                            <div className="progress-bar" style={{ width: 100 }}>
                                                <div className={`progress-bar-fill ${f.status === 'low' ? 'low' : f.status === 'critical' ? 'critical' : ''}`}
                                                    style={{ width: `${(f.remaining_weight_g / f.initial_weight_g) * 100}%` }}></div>
                                            </div>
                                            <span className="stock-grams">{f.remaining_weight_g}g</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn-icon" onClick={() => setEditFilament(f)}>
                                                <span className="material-icons-outlined">edit</span>
                                            </button>
                                            <button className="btn-icon text-error" onClick={() => handleDeleteFilament(f.id)}>
                                                <span className="material-icons-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card mt-4">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('status')}</th>
                                <th>{t('printerName') || 'Name'}</th>
                                <th>{t('model') || 'Model'}</th>
                                <th>{t('wattage') || 'Wattage'}</th>
                                <th>{t('activeHours') || 'Hours'}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPrinters.map(p => (
                                <tr key={p.id}>
                                    <td><span className={`status-dot ${p.status}`}></span></td>
                                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                                    <td>{p.model}</td>
                                    <td>{p.wattage}W</td>
                                    <td>{p.total_hours}h</td>
                                    <td>
                                        <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn-icon" onClick={() => setEditPrinter(p)}>
                                                <span className="material-icons-outlined">edit</span>
                                            </button>
                                            <button className="btn-icon text-error" onClick={() => handleDeletePrinter(p.id)}>
                                                <span className="material-icons-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Filament Side Panel */}
            {editFilament && (
                <div className="side-panel-overlay" onClick={() => setEditFilament(null)}>
                    <div className="side-panel slide-in" onClick={e => e.stopPropagation()}>
                        <div className="side-panel-header">
                            <h3>{editFilament.id ? t('editFilament') : t('addFilament')}</h3>
                            <button className="btn-icon" onClick={() => setEditFilament(null)}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        {editFilament.id && (
                            <div className="side-panel-kpis">
                                <div className="kpi-card">
                                    <div className="kpi-label">{t('totalCost')}</div>
                                    <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>R$ {editFilament.price_paid?.toFixed(2)}</div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-label">{t('costPerGram')}</div>
                                    <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>R$ {editFilament.cost_per_gram?.toFixed(3)}</div>
                                </div>
                            </div>
                        )}

                        <div className="side-panel-body">
                            <div className="form-group">
                                <label className="form-label">{t('materialName')}</label>
                                <input className="form-input" value={editFilament.name} onChange={e => setEditFilament({ ...editFilament, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('manufacturer')}</label>
                                <input className="form-input" value={editFilament.manufacturer} onChange={e => setEditFilament({ ...editFilament, manufacturer: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('type')}</label>
                                <select className="form-input" value={editFilament.type} onChange={e => setEditFilament({ ...editFilament, type: e.target.value })}>
                                    <option>PLA</option><option>PETG</option><option>ABS</option><option>TPU</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('colorHex')}</label>
                                <div className="color-input-row">
                                    <input type="color" value={editFilament.color_hex} onChange={e => setEditFilament({ ...editFilament, color_hex: e.target.value })} />
                                    <input className="form-input" value={editFilament.color_hex} onChange={e => setEditFilament({ ...editFilament, color_hex: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('initialWeight')}</label>
                                <input className="form-input" type="number" value={editFilament.initial_weight_g} onChange={e => setEditFilament({ ...editFilament, initial_weight_g: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('remainingStock')} (g)</label>
                                <input className="form-input" type="number" value={editFilament.remaining_weight_g} onChange={e => setEditFilament({ ...editFilament, remaining_weight_g: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('pricePaid')}</label>
                                <input className="form-input" type="number" step="0.01" value={editFilament.price_paid} onChange={e => setEditFilament({ ...editFilament, price_paid: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('purchaseDate')}</label>
                                <input className="form-input" type="date" value={editFilament.purchase_date} onChange={e => setEditFilament({ ...editFilament, purchase_date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('notes')}</label>
                                <textarea className="form-input" rows={3} value={editFilament.notes || ''} onChange={e => setEditFilament({ ...editFilament, notes: e.target.value })}></textarea>
                            </div>
                        </div>

                        <div className="side-panel-footer">
                            <button className="btn btn-secondary" onClick={() => setEditFilament(null)}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSaveFilament}>{t('saveChanges')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Printer Side Panel */}
            {editPrinter && (
                <div className="side-panel-overlay" onClick={() => setEditPrinter(null)}>
                    <div className="side-panel slide-in" onClick={e => e.stopPropagation()}>
                        <div className="side-panel-header">
                            <h3>{editPrinter.id ? (t('editPrinter') || 'Edit Printer') : (t('addPrinter') || 'Add Printer')}</h3>
                            <button className="btn-icon" onClick={() => setEditPrinter(null)}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        {editPrinter.id && (
                            <div className="side-panel-kpis">
                                <div className="kpi-card">
                                    <div className="kpi-label">{t('activeHours') || 'Hours'}</div>
                                    <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>{editPrinter.total_hours}h</div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-label">{t('status')}</div>
                                    <div className="kpi-value" style={{ fontSize: 'var(--font-size-sm)', textTransform: 'capitalize' }}>{editPrinter.status}</div>
                                </div>
                            </div>
                        )}

                        <div className="side-panel-body">
                            <div className="form-group">
                                <label className="form-label">{t('printerName') || 'Name'}</label>
                                <input className="form-input" value={editPrinter.name} onChange={e => setEditPrinter({ ...editPrinter, name: e.target.value })} placeholder="e.g. Voron 2.4" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('model') || 'Model'}</label>
                                <input className="form-input" value={editPrinter.model} onChange={e => setEditPrinter({ ...editPrinter, model: e.target.value })} placeholder="e.g. V2.4 350mm" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('status')}</label>
                                <select className="form-input" value={editPrinter.status} onChange={e => setEditPrinter({ ...editPrinter, status: e.target.value })}>
                                    <option value="idle">Idle</option>
                                    <option value="active">Active</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('wattage') || 'Wattage'} (W)</label>
                                <input className="form-input" type="number" value={editPrinter.wattage} onChange={e => setEditPrinter({ ...editPrinter, wattage: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('purchasePrice') || 'Purchase Price'}</label>
                                <input className="form-input" type="number" step="0.01" value={editPrinter.purchase_price} onChange={e => setEditPrinter({ ...editPrinter, purchase_price: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('depreciationMonths') || 'Depreciation (months)'}</label>
                                <input className="form-input" type="number" value={editPrinter.depreciation_months} onChange={e => setEditPrinter({ ...editPrinter, depreciation_months: parseInt(e.target.value) || 24 })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('activeHours') || 'Total Hours'}</label>
                                <input className="form-input" type="number" step="0.1" value={editPrinter.total_hours} onChange={e => setEditPrinter({ ...editPrinter, total_hours: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>

                        <div className="side-panel-footer">
                            <button className="btn btn-secondary" onClick={() => setEditPrinter(null)}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSavePrinter}>{t('saveChanges')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
