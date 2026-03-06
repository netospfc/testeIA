const { getDb } = require('../db/database');

function getAll(req, res) {
    const db = getDb();
    const tasks = db.prepare(`
    SELECT mt.*, p.name as printer_name
    FROM maintenance_tasks mt
    LEFT JOIN printers p ON mt.printer_id = p.id
    ORDER BY mt.scheduled_date ASC
  `).all();
    res.json(tasks);
}

function getById(req, res) {
    const db = getDb();
    const task = db.prepare(`
    SELECT mt.*, p.name as printer_name
    FROM maintenance_tasks mt
    LEFT JOIN printers p ON mt.printer_id = p.id
    WHERE mt.id = ?
  `).get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
}

function create(req, res) {
    const db = getDb();
    const { title, description, printer_id, task_type, scheduled_date, scheduled_time, status } = req.body;
    const result = db.prepare(`
    INSERT INTO maintenance_tasks (title, description, printer_id, task_type, scheduled_date, scheduled_time, status, overdue_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).run(title, description || '', printer_id || null, task_type || 'general', scheduled_date, scheduled_time || '09:00', status || 'pending');
    res.status(201).json(db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(result.lastInsertRowid));
}

function update(req, res) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const { title, description, printer_id, task_type, scheduled_date, scheduled_time, status, overdue_days } = req.body;
    db.prepare(`
    UPDATE maintenance_tasks SET title=?, description=?, printer_id=?, task_type=?, scheduled_date=?, scheduled_time=?, status=?, overdue_days=?
    WHERE id=?
  `).run(
        title || existing.title, description !== undefined ? description : existing.description,
        printer_id !== undefined ? printer_id : existing.printer_id,
        task_type || existing.task_type, scheduled_date || existing.scheduled_date,
        scheduled_time || existing.scheduled_time, status || existing.status,
        overdue_days !== undefined ? overdue_days : existing.overdue_days, req.params.id
    );
    res.json(db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(req.params.id));
}

function remove(req, res) {
    const db = getDb();
    if (!db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(req.params.id))
        return res.status(404).json({ error: 'Task not found' });
    db.prepare('DELETE FROM maintenance_tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
}

module.exports = { getAll, getById, create, update, remove };
