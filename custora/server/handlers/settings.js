const { getDb } = require('../db/database');

function getSettings(req, res) {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    const packaging = db.prepare('SELECT * FROM packaging_options ORDER BY id').all();
    res.json({ ...settings, packaging });
}

function updateSettings(req, res) {
    const db = getDb();
    const { cost_per_kwh, depreciation_months, fail_rate_percent } = req.body;
    db.prepare(`
    UPDATE settings SET cost_per_kwh=?, depreciation_months=?, fail_rate_percent=?, updated_at=CURRENT_TIMESTAMP WHERE id=1
  `).run(
        cost_per_kwh !== undefined ? cost_per_kwh : 0.92,
        depreciation_months || 24,
        fail_rate_percent !== undefined ? fail_rate_percent : 5
    );
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    const packaging = db.prepare('SELECT * FROM packaging_options ORDER BY id').all();
    res.json({ ...settings, packaging });
}

function addPackaging(req, res) {
    const db = getDb();
    const { name, unit_cost } = req.body;
    const result = db.prepare('INSERT INTO packaging_options (name, unit_cost) VALUES (?, ?)').run(name, unit_cost || 0);
    res.status(201).json(db.prepare('SELECT * FROM packaging_options WHERE id = ?').get(result.lastInsertRowid));
}

function updatePackaging(req, res) {
    const db = getDb();
    const { name, unit_cost } = req.body;
    db.prepare('UPDATE packaging_options SET name=?, unit_cost=? WHERE id=?').run(name, unit_cost, req.params.id);
    res.json(db.prepare('SELECT * FROM packaging_options WHERE id = ?').get(req.params.id));
}

function deletePackaging(req, res) {
    const db = getDb();
    db.prepare('DELETE FROM packaging_options WHERE id = ?').run(req.params.id);
    res.json({ message: 'Packaging deleted' });
}

module.exports = { getSettings, updateSettings, addPackaging, updatePackaging, deletePackaging };
