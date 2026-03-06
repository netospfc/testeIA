import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productsApi, filamentsApi, settingsApi, printersApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './ProductArchitect.css';

export default function ProductArchitect() {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [filaments, setFilaments] = useState([]);
    const [selected, setSelected] = useState(null);
    const [product, setProduct] = useState(null);
    const [search, setSearch] = useState('');
    const [assembly, setAssembly] = useState(false);
    const [sanding, setSanding] = useState(false);
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [showNewProduct, setShowNewProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', sku: '' });
    const [editingComponents, setEditingComponents] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [packaging, setPackaging] = useState('none');
    const [margin, setMargin] = useState(45);
    const [settings, setSettings] = useState({ cost_per_kwh: 0.92 });

    useEffect(() => {
        loadAllProducts();
        filamentsApi.getAll().then(r => setFilaments(r.data)).catch(() => { });
        printersApi.getAll().then(r => setPrinters(r.data)).catch(() => { });
        settingsApi.get().then(r => { if (r.data) setSettings(r.data); }).catch(() => { });
    }, []);

    // Sync printer selection when printers list or current product changes
    useEffect(() => {
        if (product && printers.length > 0 && !selectedPrinter) {
            const p = printers.find(pr => pr.id === product.printer_id);
            if (p) setSelectedPrinter(p);
        }
    }, [product, printers, selectedPrinter]);

    const loadAllProducts = async () => {
        try {
            const r = await productsApi.getAll();
            setProducts(r.data);
            if (r.data.length > 0 && !selected) {
                loadProduct(r.data[0].id);
            }
        } catch (err) { console.error(err); }
    };

    const loadProduct = async (id) => {
        setSelected(id);
        setHasChanges(false);
        try {
            const res = await productsApi.getById(id);
            setProduct(res.data);
            setEditingComponents(res.data.components || []);
            setAssembly(!!res.data.assembly_labor);
            setSanding(!!res.data.sanding_labor);
            setPackaging(res.data.packaging || 'none');
            setMargin(res.data.profit_margin || 45);
            // Selection is now handled by useEffect for better sync with async list loading
            setSelectedPrinter(null);
        } catch (err) { console.error(err); }
    };

    // --- New Product Blueprint ---
    const handleCreateProduct = async () => {
        if (!newProduct.name.trim()) return;
        const sku = newProduct.sku.trim() || `PRD-${String(Date.now()).slice(-4)}`;
        try {
            const res = await productsApi.create({
                name: newProduct.name.trim(),
                sku,
                status: 'draft',
                components: [],
            });
            setShowNewProduct(false);
            setNewProduct({ name: '', sku: '' });
            await loadAllProducts();
            loadProduct(res.data.id);
        } catch (err) {
            console.error(err);
            alert('Error creating product: ' + (err.response?.data?.error || err.message));
        }
    };

    // --- Add Component ---
    const handleAddComponent = () => {
        const newComp = {
            id: `new-${Date.now()}`,
            component_name: '',
            filament_id: filaments.length > 0 ? filaments[0].id : null,
            filament_name: filaments.length > 0 ? filaments[0].name : '',
            filament_color: filaments.length > 0 ? filaments[0].color_hex : '#ccc',
            weight_g: 0,
            time_h: 0,
            cost: 0,
            isNew: true,
            isEditing: true,
        };
        setEditingComponents([...editingComponents, newComp]);
        setHasChanges(true);
    };

    // --- Update Component Field ---
    const updateComponent = (index, field, value) => {
        const updated = [...editingComponents];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-calculate cost when weight, filament or time changes
        if (field === 'weight_g' || field === 'filament_id' || field === 'time_h' || field === '_recalc') {
            const fil = filaments.find(f => f.id === Number(updated[index].filament_id));
            if (fil) {
                const weight = parseFloat(updated[index].weight_g) || 0;
                const time = parseFloat(updated[index].time_h) || 0;

                // Material Cost
                const matCost = weight * fil.cost_per_gram;

                // Energy Cost (Using selected printer wattage or default 200W)
                const wattage = selectedPrinter ? selectedPrinter.wattage : 200;
                const energyWattageKw = wattage / 1000;
                const energyCost = time * energyWattageKw * (settings.cost_per_kwh || 0.92);

                updated[index].cost = matCost + energyCost;
                updated[index].filament_name = fil.name;
                updated[index].filament_color = fil.color_hex;
            }
        }
        setEditingComponents(updated);
        setHasChanges(true);
    };

    // --- Handle Printer Change ---
    const handlePrinterChange = (printerId) => {
        const printer = printers.find(p => p.id === Number(printerId)) || null;
        setSelectedPrinter(printer);

        // Trigger re-calculation for all components with the new wattage
        const updated = [...editingComponents];
        updated.forEach((_, i) => {
            const fil = filaments.find(f => f.id === Number(updated[i].filament_id));
            if (fil) {
                const weight = parseFloat(updated[i].weight_g) || 0;
                const time = parseFloat(updated[i].time_h) || 0;
                const matCost = weight * fil.cost_per_gram;
                const wattage = printer ? printer.wattage : 200;
                const energyWattageKw = wattage / 1000;
                const energyCost = time * energyWattageKw * (settings.cost_per_kwh || 0.92);
                updated[i].cost = matCost + energyCost;
            }
        });
        setEditingComponents(updated);
        setHasChanges(true);
    };

    // --- Remove Component ---
    const removeComponent = (index) => {
        const updated = editingComponents.filter((_, i) => i !== index);
        setEditingComponents(updated);
        setHasChanges(true);
    };

    // --- Save Blueprint ---
    const handleSaveBlueprint = async () => {
        if (!product) return;
        const components = editingComponents.map(c => ({
            component_name: c.component_name || 'Unnamed Component',
            filament_id: c.filament_id ? Number(c.filament_id) : null,
            weight_g: parseFloat(c.weight_g) || 0,
            time_h: parseFloat(c.time_h) || 0,
            cost: parseFloat(c.cost) || 0,
        }));

        try {
            await productsApi.update(product.id, {
                name: product.name,
                sku: product.sku,
                status: product.status,
                printer_id: selectedPrinter?.id || null,
                packaging,
                profit_margin: margin,
                assembly_labor: assembly,
                sanding_labor: sanding,
                components,
            });
            await loadProduct(product.id);
            await loadAllProducts();
            setHasChanges(false);
        } catch (err) {
            console.error(err);
            alert('Error saving: ' + (err.response?.data?.error || err.message));
        }
    };

    // --- Discard Changes ---
    const handleDiscard = () => {
        if (product) loadProduct(product.id);
    };

    // --- Export CSV ---
    const handleExportCsv = () => {
        if (!editingComponents.length) return;
        const header = '#,Component Name,Filament,Weight (g),Time (h),Cost (R$)\n';
        const rows = editingComponents.map((c, i) =>
            `${i + 1},"${c.component_name}","${c.filament_name || '—'}",${c.weight_g},${c.time_h},${(c.cost || 0).toFixed(2)}`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${product?.sku || 'blueprint'}_bom.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const matSubtotal = editingComponents.reduce((s, c) => {
        const fil = filaments.find(f => f.id === Number(c.filament_id));
        return s + (fil ? (parseFloat(c.weight_g) || 0) * fil.cost_per_gram : 0);
    }, 0);

    const energySubtotal = editingComponents.reduce((s, c) => {
        const wattage = selectedPrinter ? selectedPrinter.wattage : 200;
        const energyWattageKw = wattage / 1000;
        return s + ((parseFloat(c.time_h) || 0) * energyWattageKw * (settings.cost_per_kwh || 0.92));
    }, 0);

    const totalTime = editingComponents.reduce((s, c) => s + (parseFloat(c.time_h) || 0), 0);
    const machinePrice = selectedPrinter ? selectedPrinter.purchase_price : 6500;
    const depPerHour = machinePrice / (24 * 30 * 8); // Matching Calculator logic
    const machineDepreciation = depPerHour * totalTime;

    const laborCost = (assembly ? 5 : 0) + (sanding ? 10 : 0);
    const subtotal = matSubtotal + energySubtotal + machineDepreciation + laborCost;
    const failBuffer = subtotal * 0.05;

    let packagingCost = 0;
    if (packaging === 'S') packagingCost = 1.49;
    else if (packaging === 'M') packagingCost = 2.98;
    else if (packaging === 'L') packagingCost = 4.47;

    const finalTotalCost = subtotal + failBuffer + packagingCost;
    const salePrice = finalTotalCost * (1 + (margin / 100));
    const netProfit = salePrice - finalTotalCost;
    const hourlyProfit = totalTime > 0 ? netProfit / totalTime : 0;

    const chartData = [
        { name: t('material'), value: matSubtotal, fill: 'var(--color-primary)' },
        { name: t('energyConsumption'), value: energySubtotal, fill: '#2233dd' },
        { name: t('machineDepreciation'), value: machineDepreciation, fill: '#64748b' },
        { name: t('postProcessingLabor'), value: laborCost, fill: '#16a34a' },
    ].filter(d => d.value > 0);

    const pricingTip = margin < 30 && totalTime > 10
        ? "Uma margem abaixo de 30% não é recomendada para impressões acima de 10 horas."
        : margin > 40
            ? "Margens acima de 40% são ideais para garantir a saúde do negócio."
            : "Considere ajustar a margem baseada na complexidade e demanda de mercado.";

    const filteredProducts = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="architect-layout">
            {/* Left sidebar — Product list */}
            <div className="architect-sidebar">
                <div className="architect-sidebar-header">
                    <div className="navbar-search" style={{ width: '100%' }}>
                        <span className="material-icons-outlined" style={{ fontSize: 16 }}>search</span>
                        <input type="text" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-full mt-4" onClick={() => setShowNewProduct(true)}>
                        <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
                        {t('newProductBlueprint')}
                    </button>
                </div>
                <div className="architect-product-list">
                    {filteredProducts.map(p => (
                        <div key={p.id} className={`architect-product-item ${selected === p.id ? 'active' : ''}`}
                            onClick={() => loadProduct(p.id)}>
                            <div className="product-thumb">
                                <span className="material-icons-outlined">view_in_ar</span>
                            </div>
                            <div>
                                <div className="product-item-name">{p.name}</div>
                                <div className="product-item-sku text-muted">{p.sku}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main area */}
            <div className="architect-main">
                {product ? (
                    <>
                        <div className="architect-header">
                            <div>
                                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                    <h1 style={{ fontSize: 'var(--font-size-xl)' }}>{product.name}</h1>
                                    <span className="badge badge-warning">{t('draft')}</span>
                                    {hasChanges && <span className="badge badge-error">Unsaved</span>}
                                </div>
                                <div className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginTop: 4 }}>
                                    {t('lastSaved')}: {new Date(product.last_saved).toLocaleString()} • {product.sku}
                                </div>
                            </div>
                            <div className="architect-chips">
                                <div className="architect-chip">
                                    <span className="architect-chip-label">{t('totalWeight')}</span>
                                    <span className="architect-chip-value">{editingComponents.reduce((s, c) => s + (parseFloat(c.weight_g) || 0), 0)}g</span>
                                </div>
                                <div className="architect-chip">
                                    <span className="architect-chip-label">{t('estTime')}</span>
                                    <span className="architect-chip-value">{editingComponents.reduce((s, c) => s + (parseFloat(c.time_h) || 0), 0)}h</span>
                                </div>
                                <div className="architect-chip">
                                    <span className="architect-chip-label">{t('baseCost')}</span>
                                    <span className="architect-chip-value">R$ {finalTotalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="card mt-6">
                            <div className="form-group mb-0">
                                <label className="form-label">{t('printer')} (Referência para Consumo)</label>
                                <select
                                    className="form-input"
                                    style={{ maxWidth: 300 }}
                                    value={selectedPrinter?.id || ''}
                                    onChange={e => handlePrinterChange(e.target.value)}
                                >
                                    <option value="">— {t('select')} —</option>
                                    {printers.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.wattage}W)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="card mt-6">
                            <div className="flex-between mb-4">
                                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>{t('components')}</h3>
                                <button className="btn btn-secondary" style={{ fontSize: 'var(--font-size-xs)' }} onClick={handleExportCsv}>
                                    <span className="material-icons-outlined" style={{ fontSize: 14 }}>download</span>
                                    {t('exportCsv')}
                                </button>
                            </div>

                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('componentName')}</th>
                                        <th>{t('filament')}</th>
                                        <th>{t('weight')}</th>
                                        <th>{t('time')}</th>
                                        <th>{t('cost')}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editingComponents.map((c, i) => (
                                        <tr key={c.id || i}>
                                            <td>{i + 1}</td>
                                            <td>
                                                <input
                                                    className="form-input"
                                                    style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }}
                                                    value={c.component_name}
                                                    onChange={e => updateComponent(i, 'component_name', e.target.value)}
                                                    placeholder="Component name..."
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    className="form-input"
                                                    style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)', minWidth: 140 }}
                                                    value={c.filament_id || ''}
                                                    onChange={e => updateComponent(i, 'filament_id', e.target.value)}
                                                >
                                                    <option value="">—</option>
                                                    {filaments.map(f => (
                                                        <option key={f.id} value={f.id}>{f.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    className="form-input"
                                                    style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)', width: 70 }}
                                                    type="number"
                                                    min="0"
                                                    value={c.weight_g}
                                                    onChange={e => updateComponent(i, 'weight_g', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="form-input"
                                                    style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)', width: 60 }}
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    value={c.time_h}
                                                    onChange={e => updateComponent(i, 'time_h', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ fontWeight: 600 }}>R$ {(parseFloat(c.cost) || 0).toFixed(2)}</td>
                                            <td>
                                                <button className="btn-icon" onClick={() => removeComponent(i)} title="Remove">
                                                    <span className="material-icons-outlined" style={{ fontSize: 16, color: 'var(--color-error)' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan={7}>
                                            <button className="btn btn-secondary" style={{ fontSize: 'var(--font-size-xs)' }} onClick={handleAddComponent}>
                                                <span className="material-icons-outlined" style={{ fontSize: 14 }}>add</span>
                                                {t('addComponent')}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="subtotal-row">
                                        <td colSpan={5} style={{ fontWeight: 700, textAlign: 'right' }}>{t('subtotalMaterials')}</td>
                                        <td style={{ fontWeight: 700 }} colSpan={2}>R$ {matSubtotal.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="card mt-6">
                            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                                {t('postProcessingLabor')}
                            </h3>
                            <div className="labor-cards">
                                <div className={`labor-card ${assembly ? 'checked' : ''}`} onClick={() => { setAssembly(!assembly); setHasChanges(true); }}>
                                    <div className="labor-checkbox">
                                        <span className="material-icons-outlined">{assembly ? 'check_box' : 'check_box_outline_blank'}</span>
                                    </div>
                                    <div>
                                        <div className="labor-title">{t('manualAssembly')}</div>
                                        <div className="labor-desc text-muted">Montagem manual e encaixes</div>
                                    </div>
                                    <div className="labor-cost">R$ 5.00</div>
                                </div>
                                <div className={`labor-card ${sanding ? 'checked' : ''}`} onClick={() => { setSanding(!sanding); setHasChanges(true); }}>
                                    <div className="labor-checkbox">
                                        <span className="material-icons-outlined">{sanding ? 'check_box' : 'check_box_outline_blank'}</span>
                                    </div>
                                    <div>
                                        <div className="labor-title">{t('surfaceSanding')}</div>
                                        <div className="labor-desc text-muted">Acabamento superficial e lixamento</div>
                                    </div>
                                    <div className="labor-cost">R$ 10.00</div>
                                </div>
                            </div>
                        </div>

                        <div className="architect-grid mt-6">
                            <div className="card">
                                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                                    {t('operationalCost')}
                                </h3>

                                
                                <div className="cost-lines">
                                    <div className="cost-line">
                                        <span>{t('materialCost')}</span>
                                        <span>R$ {matSubtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="cost-line">
                                        <span>{t('energyConsumption')}</span>
                                        <span>R$ {energySubtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="cost-line">
                                        <span>{t('machineDepreciation')}</span>
                                        <span>R$ {machineDepreciation.toFixed(2)}</span>
                                    </div>
                                    {laborCost > 0 && (
                                        <div className="cost-line">
                                            <span>Mão de Obra (Adicional)</span>
                                            <span>R$ {laborCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="cost-line">
                                        <span>Margem de Falha (5%)</span>
                                        <span>R$ {failBuffer.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="form-group mt-4">
                                    <label className="form-label">{t('packaging')}</label>
                                    <div className="packaging-btns">
                                        {['S', 'M', 'L', 'none'].map(size => (
                                            <button key={size} className={`pkg-btn ${packaging === size ? 'active' : ''}`}
                                                onClick={() => { setPackaging(size); setHasChanges(true); }}>
                                                {size === 'none' ? 'None' : size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="cost-total mt-4" style={{ padding: '12px 0', borderTop: '1px dashed var(--color-border)' }}>
                                    <span style={{ fontWeight: 600 }}>Custo Total Base</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>R$ {finalTotalCost.toFixed(2)}</span>
                                </div>

                                <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                    <h4 className="calc-panel-subtitle" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="material-icons-outlined" style={{ fontSize: 16 }}>analytics</span>
                                        {t('costDistribution')}
                                    </h4>
                                    <div style={{ background: 'var(--color-surface-hover)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border-light)' }}>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" horizontal={false} />
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
                                                <Tooltip
                                                    formatter={(v) => `R$ ${v.toFixed(2)}`}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                                    {t('priceStrategy')}
                                </h3>
                                <div className="form-group">
                                    <label className="form-label">Margem de Lucro</label>
                                    <div className="flex gap-4" style={{ alignItems: 'center' }}>
                                        <input type="range" className="slider" style={{ flex: 1 }} min="0" max="200" value={margin}
                                            onChange={e => { setMargin(parseInt(e.target.value)); setHasChanges(true); }} />
                                        <span className="badge badge-primary">{margin}%</span>
                                    </div>
                                </div>
                                <div className="strategy-result" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                                    <div className="flex-between mb-2">
                                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Preço Recomendado</span>
                                        <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.2rem' }}>R$ {salePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex-between mb-2">
                                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Lucro Líquido</span>
                                        <span style={{ fontWeight: 600 }}>+R$ {netProfit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex-between">
                                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Lucro/Hora</span>
                                        <span style={{ fontWeight: 600 }}>R$ {hourlyProfit.toFixed(2)}/h</span>
                                    </div>
                                </div>
                                <div className="pricing-tip mt-4" style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#64748b', background: '#f0f9ff', padding: '10px', borderRadius: '6px' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: 16 }}>lightbulb</span>
                                    <p style={{ margin: 0 }}>{pricingTip}</p>
                                </div>
                            </div>
                        </div>

                        <div className="architect-footer card mt-6">
                            <div className="footer-total">
                                <div>
                                    <span className="footer-total-label">Preço Sugerido (Venda)</span>
                                    <span className="footer-total-value" style={{ color: '#16a34a' }}>R$ {salePrice.toFixed(2)}</span>
                                </div>
                                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                                    Custo Base R$ {subtotal.toFixed(2)} + Op R$ {(failBuffer + packagingCost).toFixed(2)}
                                </span>
                            </div>
                            <div className="footer-actions">
                                <button className="btn btn-secondary" onClick={handleDiscard} disabled={!hasChanges}>{t('discardChanges')}</button>
                                <button className="btn btn-primary" onClick={handleSaveBlueprint} disabled={!hasChanges}>
                                    <span className="material-icons-outlined" style={{ fontSize: 16 }}>save</span>
                                    {t('saveBlueprint')}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-muted" style={{ padding: '4rem' }}>Select a product to view</div>
                )}
            </div>

            {/* New Product Modal */}
            {
                showNewProduct && (
                    <div className="side-panel-overlay" onClick={() => setShowNewProduct(false)}>
                        <div className="new-product-modal card slide-in" onClick={e => e.stopPropagation()}>
                            <h3 style={{ marginBottom: 'var(--space-5)' }}>{t('newProductBlueprint')}</h3>
                            <div className="form-group">
                                <label className="form-label">Product Name *</label>
                                <input
                                    className="form-input"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="e.g. Articulated Dragon v3"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">SKU</label>
                                <input
                                    className="form-input"
                                    value={newProduct.sku}
                                    onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                                    placeholder="Auto-generated if empty"
                                />
                            </div>
                            <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
                                <button className="btn btn-secondary" onClick={() => setShowNewProduct(false)}>{t('cancel')}</button>
                                <button className="btn btn-primary" onClick={handleCreateProduct} disabled={!newProduct.name.trim()}>
                                    <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
                                    Create Blueprint
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
