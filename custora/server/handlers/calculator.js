const { getDb } = require('../db/database');

function compute(req, res) {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    const { filament_id, printer_id, print_time_hours, net_weight_g, packaging_size, margin_percent } = req.body;

    const filament = filament_id ? db.prepare('SELECT * FROM filaments WHERE id = ?').get(filament_id) : null;
    const printer = printer_id ? db.prepare('SELECT * FROM printers WHERE id = ?').get(printer_id) : null;

    // Material cost
    const costPerGram = filament ? filament.cost_per_gram : 0.09;
    const materialCost = (net_weight_g || 0) * costPerGram;

    // Energy cost
    const wattage = printer ? printer.wattage : 350;
    const kwhUsed = (wattage / 1000) * (print_time_hours || 0);
    const energyCost = kwhUsed * (settings ? settings.cost_per_kwh : 0.92);

    // Machine depreciation
    const purchasePrice = printer ? printer.purchase_price : 6500;
    const depMonths = settings ? settings.depreciation_months : 24;
    const depPerHour = purchasePrice / (depMonths * 30 * 8);
    const depreciationCost = depPerHour * (print_time_hours || 0);

    // Fail rate buffer
    const failRate = settings ? settings.fail_rate_percent / 100 : 0.05;
    const subtotal = materialCost + energyCost + depreciationCost;
    const failBuffer = subtotal * failRate;

    // Packaging
    let packagingCost = 0;
    if (packaging_size && packaging_size !== 'none') {
        const packaging = db.prepare('SELECT * FROM packaging_options').all();
        if (packaging_size === 'S') packagingCost = packaging.reduce((s, p) => s + p.unit_cost, 0) * 0.5;
        else if (packaging_size === 'M') packagingCost = packaging.reduce((s, p) => s + p.unit_cost, 0);
        else if (packaging_size === 'L') packagingCost = packaging.reduce((s, p) => s + p.unit_cost, 0) * 1.5;
    }

    const totalCost = subtotal + failBuffer + packagingCost;
    const margin = (margin_percent || 45) / 100;
    const salePrice = totalCost * (1 + margin);
    const netProfit = salePrice - totalCost;
    const hourlyProfit = print_time_hours > 0 ? netProfit / print_time_hours : 0;

    res.json({
        breakdown: {
            material_cost: Math.round(materialCost * 100) / 100,
            energy_cost: Math.round(energyCost * 100) / 100,
            depreciation_cost: Math.round(depreciationCost * 100) / 100,
            fail_buffer: Math.round(failBuffer * 100) / 100,
            packaging_cost: Math.round(packagingCost * 100) / 100,
        },
        total_cost: Math.round(totalCost * 100) / 100,
        margin_percent: margin_percent || 45,
        sale_price: Math.round(salePrice * 100) / 100,
        net_profit: Math.round(netProfit * 100) / 100,
        hourly_profit: Math.round(hourlyProfit * 100) / 100,
        kwh_used: Math.round(kwhUsed * 100) / 100,
        filament_info: filament ? { name: filament.name, remaining: filament.remaining_weight_g } : null,
        printer_info: printer ? { name: printer.name, wattage: printer.wattage } : null,
    });
}

module.exports = { compute };
