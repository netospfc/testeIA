const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { generateToken } = require('../middleware/auth');

function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, studio_name: user.studio_name, role: user.role }
    });
}

function register(req, res) {
    const { name, email, password, studio_name } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, studio_name) VALUES (?, ?, ?, ?)')
        .run(name, email, hashed, studio_name || '');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);
    res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, studio_name: user.studio_name, role: user.role }
    });
}

module.exports = { login, register };
