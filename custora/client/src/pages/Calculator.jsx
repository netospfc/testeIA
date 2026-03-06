import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { filamentsApi, printersApi, productsApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import './Calculator.css';

export default function Calculator() {
    const { t } = useTranslation();
    const [filaments, setFilaments] = useState([]);
    const [printers, setPrinters] = useState([]);
    const [products, setProducts] = useState([]);

    const [params, setParams] = useState({
        productId: '',
        filamentId: '',
        printerId: '',
        printTime: 0,
        netWeight: 0,
        packaging: 'none',
        margin: 45,
        assembly: false,
        sanding: false,
    });

    useEffect(() => {
        filamentsApi.getAll().then(r => setFilaments(r.data)).catch(() => { });
        printersApi.getAll().then(r => setPrinters(r.data)).catch(() => { });
        productsApi.getAll().then(r => setProducts(r.data)).catch(() => { });
    }, []);

    // Real-time calculation on frontend
    const calculate = useCallback(() => {
        const filament = filaments.find(f => f.id === Number(params.filamentId));
        const printer = printers.find(p => p.id === Number(params.printerId));
        const costPerGram = filament ? filament.cost_per_gram : 0.09;
        const materialCost = params.netWeight * costPerGram;
        const wattage = printer ? printer.wattage : 350;
        const kwhUsed = (wattage / 1000) * params.printTime;
        const energyCost = kwhUsed * 0.92;
        const purchasePrice = printer ? printer.purchase_price : 6500;
        const depPerHour = purchasePrice / (24 * 30 * 8);
        const depreciationCost = depPerHour * params.printTime;

        const laborCost = (params.assembly ? 5 : 0) + (params.sanding ? 10 : 0);
        const subtotal = materialCost + energyCost + depreciationCost + laborCost;
        const failBuffer = subtotal * 0.05;

        let packagingCost = 0;
        if (params.packaging === 'S') packagingCost = 1.49;
        else if (params.packaging === 'M') packagingCost = 2.98;
        else if (params.packaging === 'L') packagingCost = 4.47;

        const totalCost = subtotal + failBuffer + packagingCost;
        const margin = params.margin / 100;
        const salePrice = totalCost * (1 + margin);
        const netProfit = salePrice - totalCost;
        const hourlyProfit = params.printTime > 0 ? netProfit / params.printTime : 0;

        return {
            materialCost: materialCost.toFixed(2),
            energyCost: energyCost.toFixed(2),
            depreciationCost: depreciationCost.toFixed(2),
            laborCost: laborCost.toFixed(2),
            failBuffer: failBuffer.toFixed(2),
            packagingCost: packagingCost.toFixed(2),
            totalCost: totalCost.toFixed(2),
            salePrice: salePrice.toFixed(2),
            netProfit: netProfit.toFixed(2),
            hourlyProfit: hourlyProfit.toFixed(2),
            filamentRemaining: filament ? filament.remaining_weight_g : null,
        };
    }, [params, filaments, printers]);

    const result = calculate();

    const chartData = [
        { name: t('material'), value: parseFloat(result.materialCost), fill: '#0f0fbd' },
        { name: t('energy'), value: parseFloat(result.energyCost), fill: '#2233dd' },
        { name: 'Machine', value: parseFloat(result.depreciationCost), fill: '#9ca3af' },
    ];

    const selectedFilament = filaments.find(f => f.id === Number(params.filamentId));

    const pricingTip = params.margin < 30 && params.printTime > 10
        ? t('pricingTip') || "Based on your printer's depreciation, a margin below 30% is not recommended for prints over 10 hours."
        : params.margin > 40
            ? "Margins over 40% are healthy for prototype work."
            : "Consider adjusting your margin based on market demand and print complexity.";

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>{t('calculatorTitle')}</h1>
                        <p>{t('costModelingSubtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={() => setParams({ ...params, printTime: 12.5, netWeight: 180, margin: 45 })}>
                            <span className="material-icons-outlined" style={{ fontSize: 16 }}>refresh</span>
                            {t('reset')}
                        </button>
                        <button className="btn btn-primary">{t('newCalculation')}</button>
                    </div>
                </div>
            </div>

            <div className="calc-grid">
                {/* Left — Input Parameters */}
                <div className="card calc-panel">
                    <h3 className="calc-panel-title">{t('inputParameters')}</h3>

                    <div className="form-group">
                        <label className="form-label">{t('productPreset')}</label>
                        <select className="form-input" value={params.productId} onChange={async e => {
                            const val = e.target.value;
                            if (val) {
                                try {
                                    const res = await productsApi.getById(val);
                                    const p = res.data;
                                    setParams({
                                        ...params,
                                        productId: val,
                                        printTime: p.est_time,
                                        netWeight: p.total_weight,
                                        margin: p.profit_margin || 45,
                                        packaging: p.packaging || 'none',
                                        assembly: !!p.assembly_labor,
                                        sanding: !!p.sanding_labor,
                                        printerId: p.printer_id || params.printerId
                                    });
                                } catch (err) { console.error(err); }
                            } else {
                                setParams({ ...params, productId: '' });
                            }
                        }}>
                            <option value="">— Select —</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('filament')}</label>
                        <select className="form-input" value={params.filamentId} onChange={e => setParams({ ...params, filamentId: e.target.value })}>
                            <option value="">— Select —</option>
                            {filaments.map(f => <option key={f.id} value={f.id}>{f.name} ({f.manufacturer})</option>)}
                        </select>
                        {selectedFilament && (
                            <div className="stock-info">
                                <span className="material-icons-outlined" style={{ fontSize: 14 }}>inventory</span>
                                {t('stock')}: {selectedFilament.remaining_weight_g}g {t('remaining')}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('printer')}</label>
                        <select className="form-input" value={params.printerId} onChange={e => setParams({ ...params, printerId: e.target.value })}>
                            <option value="">— Select —</option>
                            {printers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.wattage}W)</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('printTime')}</label>
                        <input className="form-input" type="number" step="0.5" min="0" value={params.printTime}
                            onChange={e => setParams({ ...params, printTime: parseFloat(e.target.value) || 0 })} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('netWeight')}</label>
                        <input className="form-input" type="number" min="0" value={params.netWeight}
                            onChange={e => setParams({ ...params, netWeight: parseFloat(e.target.value) || 0 })} />
                    </div>
                </div>

                {/* Center — Cost Breakdown */}
                <div className="card calc-panel">
                    <h3 className="calc-panel-title">{t('costBreakdown')}</h3>

                    <div className="cost-lines">
                        <div className="cost-line">
                            <span>{t('materialCost')}</span>
                            <span>R$ {result.materialCost}</span>
                        </div>
                        <div className="cost-line">
                            <span>{t('energyConsumption')}</span>
                            <span>R$ {result.energyCost}</span>
                        </div>
                        <div className="cost-line">
                            <span>{t('machineDepreciation')}</span>
                            <span>R$ {result.depreciationCost}</span>
                        </div>
                        <div className="cost-line">
                            <span>{t('failRateBuffer')} (5%) <span className="material-icons-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>info</span></span>
                            <span>R$ {result.failBuffer}</span>
                        </div>
                    </div>

                    <div className="form-group mt-4">
                        <label className="form-label">{t('packaging')}</label>
                        <div className="packaging-btns">
                            {['S', 'M', 'L', 'none'].map(size => (
                                <button key={size} className={`pkg-btn ${params.packaging === size ? 'active' : ''}`}
                                    onClick={() => setParams({ ...params, packaging: size })}>
                                    {size === 'none' ? 'None' : size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="cost-total">
                        <span>{t('operationalCost')}</span>
                        <span className="cost-total-value">R$ {result.totalCost}</span>
                    </div>

                    <div className="mt-6">
                        <h4 className="calc-panel-subtitle">{t('costDistribution')}</h4>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => `R$ ${v.toFixed(2)}`} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right — Price Strategy */}
                <div className="card calc-panel">
                    <h3 className="calc-panel-title">{t('priceStrategy')}</h3>

                    <div className="cost-base">
                        <span className="cost-base-label">{t('totalCostBase')}</span>
                        <span className="cost-base-value">R$ {result.totalCost}</span>
                    </div>

                    <div className="form-group mt-6">
                        <label className="form-label">{t('profitMargin')}</label>
                        <div className="slider-container">
                            <input type="range" className="slider" min="0" max="200" value={params.margin}
                                onChange={e => setParams({ ...params, margin: parseInt(e.target.value) })} />
                            <span className="badge badge-primary">{params.margin}%</span>
                        </div>
                    </div>

                    <div className="strategy-result">
                        <div className="strategy-item">
                            <span className="strategy-label">{t('recommendedSalePrice')}</span>
                            <span className="strategy-value sale-price">
                                R$ {result.salePrice}
                                <span className="material-icons-outlined text-success" style={{ fontSize: 18 }}>trending_up</span>
                            </span>
                        </div>
                        <div className="strategy-item">
                            <span className="strategy-label">{t('netProfit')}</span>
                            <span className="strategy-value text-success">+R$ {result.netProfit}</span>
                        </div>
                        <div className="strategy-item">
                            <span className="strategy-label">{t('hourlyProfit')}</span>
                            <span className="strategy-value">R$ {result.hourlyProfit}/h</span>
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full mt-6">
                        <span className="material-icons-outlined" style={{ fontSize: 16 }}>bookmark</span>
                        {t('saveToPortfolio')}
                    </button>

                    <div className="pricing-tip mt-6">
                        <div className="tip-header">
                            <span className="material-icons-outlined">lightbulb</span>
                            <span>{t('pricingTip')}</span>
                        </div>
                        <p>{pricingTip}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
