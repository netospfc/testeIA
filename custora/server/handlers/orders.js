const { getDb } = require('../db/database');

function getAll(req, res) {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all());
}

function getById(req, res) {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
}

function create(req, res) {
    const db = getDb();
    const { product_name, material, price, status, tag, printer_id } = req.body;
    const count = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
    const order_number = `ORD-${String(count + 1).padStart(3, '0')}`;
    const result = db.prepare(`
    INSERT INTO orders (order_number, product_name, material, price, status, tag, printer_id, progress, time_remaining)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, '')
  `).run(order_number, product_name, material || '', price || 0, status || 'queue', tag || '', printer_id || null);
    res.status(201).json(db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid));
}

function update(req, res) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const { product_name, material, price, status, tag, printer_id, progress, time_remaining } = req.body;
    db.prepare(`
    UPDATE orders SET product_name=?, material=?, price=?, status=?, tag=?, printer_id=?, progress=?, time_remaining=? WHERE id=?
  `).run(
        product_name || existing.product_name, material || existing.material,
        price !== undefined ? price : existing.price, status || existing.status,
        tag || existing.tag, printer_id !== undefined ? printer_id : existing.printer_id,
        progress !== undefined ? progress : existing.progress,
        time_remaining !== undefined ? time_remaining : existing.time_remaining,
        req.params.id
    );
    res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
}

function remove(req, res) {
    const db = getDb();
    if (!db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id))
        return res.status(404).json({ error: 'Order not found' });
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Order deleted' });
}

module.exports = { getAll, getById, create, update, remove };
