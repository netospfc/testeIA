const { getDb } = require('../db/database');

function getAll(req, res) {
    const db = getDb();
    const filaments = db.prepare('SELECT * FROM filaments ORDER BY created_at DESC').all();
    res.json(filaments);
}

function getById(req, res) {
    const db = getDb();
    const filament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    if (!filament) return res.status(404).json({ error: 'Filament not found' });
    res.json(filament);
}

function create(req, res) {
    const db = getDb();
    const { name, manufacturer, type, color_hex, color_name, initial_weight_g, price_paid, purchase_date, notes } = req.body;
    const cost_per_gram = initial_weight_g > 0 ? price_paid / initial_weight_g : 0;
    const result = db.prepare(`
    INSERT INTO filaments (name, manufacturer, type, color_hex, color_name, initial_weight_g, remaining_weight_g, price_paid, cost_per_gram, purchase_date, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ok')
  `).run(name, manufacturer, type, color_hex || '#000000', color_name || '', initial_weight_g || 1000, initial_weight_g || 1000, price_paid || 0, cost_per_gram, purchase_date || '', notes || '');
    const filament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(filament);
}

function update(req, res) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Filament not found' });

    const { name, manufacturer, type, color_hex, color_name, initial_weight_g, remaining_weight_g, price_paid, purchase_date, notes, status } = req.body;
    const ig = initial_weight_g !== undefined ? initial_weight_g : existing.initial_weight_g;
    const pp = price_paid !== undefined ? price_paid : existing.price_paid;
    const cost_per_gram = ig > 0 ? pp / ig : 0;

    db.prepare(`
    UPDATE filaments SET name=?, manufacturer=?, type=?, color_hex=?, color_name=?, initial_weight_g=?, remaining_weight_g=?, price_paid=?, cost_per_gram=?, purchase_date=?, notes=?, status=?
    WHERE id=?
  `).run(
        name || existing.name, manufacturer || existing.manufacturer, type || existing.type,
        color_hex || existing.color_hex, color_name || existing.color_name,
        ig, remaining_weight_g !== undefined ? remaining_weight_g : existing.remaining_weight_g,
        pp, cost_per_gram, purchase_date || existing.purchase_date, notes !== undefined ? notes : existing.notes,
        status || existing.status, req.params.id
    );

    const filament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    res.json(filament);
}

function remove(req, res) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Filament not found' });
    db.prepare('DELETE FROM filaments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Filament deleted' });
}

module.exports = { getAll, getById, create, update, remove };
