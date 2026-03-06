const { getDb } = require('../db/database');

function getAll(req, res) {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM printers ORDER BY created_at DESC').all());
}

function getById(req, res) {
    const db = getDb();
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!printer) return res.status(404).json({ error: 'Printer not found' });
    res.json(printer);
}

function create(req, res) {
    const db = getDb();
    const { name, model, status, wattage, purchase_price, depreciation_months } = req.body;
    const result = db.prepare(`
    INSERT INTO printers (name, model, status, wattage, purchase_price, depreciation_months, total_hours)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(name, model || '', status || 'idle', wattage || 0, purchase_price || 0, depreciation_months || 24);
    res.status(201).json(db.prepare('SELECT * FROM printers WHERE id = ?').get(result.lastInsertRowid));
}

function update(req, res) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Printer not found' });

    const { name, model, status, wattage, purchase_price, depreciation_months, total_hours } = req.body;
    db.prepare(`
    UPDATE printers SET name=?, model=?, status=?, wattage=?, purchase_price=?, depreciation_months=?, total_hours=? WHERE id=?
  `).run(
        name || existing.name, model || existing.model, status || existing.status,
        wattage !== undefined ? wattage : existing.wattage,
        purchase_price !== undefined ? purchase_price : existing.purchase_price,
        depreciation_months || existing.depreciation_months,
        total_hours !== undefined ? total_hours : existing.total_hours,
        req.params.id
    );
    res.json(db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id));
}

function remove(req, res) {
    const db = getDb();
    if (!db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id))
        return res.status(404).json({ error: 'Printer not found' });
    db.prepare('DELETE FROM printers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Printer deleted' });
}

module.exports = { getAll, getById, create, update, remove };
