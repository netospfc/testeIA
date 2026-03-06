const { getDb } = require('../db/database');

function getAll(req, res) {
    const db = getDb();
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    res.json(products);
}

function getById(req, res) {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const components = db.prepare(`
    SELECT pc.*, f.name as filament_name, f.color_hex as filament_color
    FROM product_components pc
    LEFT JOIN filaments f ON pc.filament_id = f.id
    WHERE pc.product_id = ?
  `).all(req.params.id);
    res.json({ ...product, components });
}

function create(req, res) {
    const db = getDb();
    const { name, sku, status, components, printer_id, packaging, profit_margin, assembly_labor, sanding_labor } = req.body;
    const result = db.prepare(`
    INSERT INTO products (name, sku, status, total_weight, est_time, base_cost, printer_id, packaging, profit_margin, assembly_labor, sanding_labor)
    VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?)
  `).run(name, sku, status || 'draft', printer_id || null, packaging || 'none', profit_margin || 45, assembly_labor ? 1 : 0, sanding_labor ? 1 : 0);

    const productId = result.lastInsertRowid;
    if (components && components.length > 0) {
        const insertComp = db.prepare(`
      INSERT INTO product_components (product_id, component_name, filament_id, weight_g, time_h, cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        let totalWeight = 0, totalTime = 0, totalCost = 0;
        for (const c of components) {
            insertComp.run(productId, c.component_name, c.filament_id || null, c.weight_g || 0, c.time_h || 0, c.cost || 0);
            totalWeight += c.weight_g || 0;
            totalTime += c.time_h || 0;
            totalCost += c.cost || 0;
        }
        db.prepare('UPDATE products SET total_weight=?, est_time=?, base_cost=? WHERE id=?')
            .run(totalWeight, totalTime, totalCost, productId);
    }

    res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(productId));
}

function update(req, res) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { name, sku, status, components, printer_id, packaging, profit_margin, assembly_labor, sanding_labor } = req.body;
    db.prepare('UPDATE products SET name=?, sku=?, status=?, printer_id=?, packaging=?, profit_margin=?, assembly_labor=?, sanding_labor=? WHERE id=?')
        .run(
            name || existing.name,
            sku || existing.sku,
            status || existing.status,
            printer_id !== undefined ? printer_id : existing.printer_id,
            packaging !== undefined ? packaging : existing.packaging,
            profit_margin !== undefined ? profit_margin : existing.profit_margin,
            assembly_labor !== undefined ? (assembly_labor ? 1 : 0) : existing.assembly_labor,
            sanding_labor !== undefined ? (sanding_labor ? 1 : 0) : existing.sanding_labor,
            req.params.id
        );

    if (components) {
        db.prepare('DELETE FROM product_components WHERE product_id = ?').run(req.params.id);
        const insertComp = db.prepare(`
      INSERT INTO product_components (product_id, component_name, filament_id, weight_g, time_h, cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        let totalWeight = 0, totalTime = 0, totalCost = 0;
        for (const c of components) {
            insertComp.run(req.params.id, c.component_name, c.filament_id || null, c.weight_g || 0, c.time_h || 0, c.cost || 0);
            totalWeight += c.weight_g || 0;
            totalTime += c.time_h || 0;
            totalCost += c.cost || 0;
        }
        db.prepare('UPDATE products SET total_weight=?, est_time=?, base_cost=?, last_saved=CURRENT_TIMESTAMP WHERE id=?')
            .run(totalWeight, totalTime, totalCost, req.params.id);
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    const comps = db.prepare('SELECT * FROM product_components WHERE product_id = ?').all(req.params.id);
    res.json({ ...product, components: comps });
}

function remove(req, res) {
    const db = getDb();
    if (!db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id))
        return res.status(404).json({ error: 'Product not found' });
    db.prepare('DELETE FROM product_components WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted' });
}

module.exports = { getAll, getById, create, update, remove };
