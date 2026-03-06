const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, seedDemoData } = require('./db/database');
const { authMiddleware } = require('./middleware/auth');
const authHandlers = require('./handlers/auth');
const filamentHandlers = require('./handlers/filaments');
const printerHandlers = require('./handlers/printers');
const orderHandlers = require('./handlers/orders');
const productHandlers = require('./handlers/products');
const maintenanceHandlers = require('./handlers/maintenance');
const settingsHandlers = require('./handlers/settings');
const calculatorHandlers = require('./handlers/calculator');
const reportHandlers = require('./handlers/reports');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
console.log('📦 Initializing database...');
initDatabase();
seedDemoData();
console.log('✅ Database ready');

// --- Public routes ---
app.post('/api/auth/login', authHandlers.login);
app.post('/api/auth/register', authHandlers.register);

// --- Protected routes ---
app.use('/api/filaments', authMiddleware);
app.get('/api/filaments', filamentHandlers.getAll);
app.get('/api/filaments/:id', filamentHandlers.getById);
app.post('/api/filaments', filamentHandlers.create);
app.put('/api/filaments/:id', filamentHandlers.update);
app.delete('/api/filaments/:id', filamentHandlers.remove);

app.use('/api/printers', authMiddleware);
app.get('/api/printers', printerHandlers.getAll);
app.get('/api/printers/:id', printerHandlers.getById);
app.post('/api/printers', printerHandlers.create);
app.put('/api/printers/:id', printerHandlers.update);
app.delete('/api/printers/:id', printerHandlers.remove);

app.use('/api/orders', authMiddleware);
app.get('/api/orders', orderHandlers.getAll);
app.get('/api/orders/:id', orderHandlers.getById);
app.post('/api/orders', orderHandlers.create);
app.put('/api/orders/:id', orderHandlers.update);
app.delete('/api/orders/:id', orderHandlers.remove);

app.use('/api/products', authMiddleware);
app.get('/api/products', productHandlers.getAll);
app.get('/api/products/:id', productHandlers.getById);
app.post('/api/products', productHandlers.create);
app.put('/api/products/:id', productHandlers.update);
app.delete('/api/products/:id', productHandlers.remove);

app.use('/api/maintenance', authMiddleware);
app.get('/api/maintenance', maintenanceHandlers.getAll);
app.get('/api/maintenance/:id', maintenanceHandlers.getById);
app.post('/api/maintenance', maintenanceHandlers.create);
app.put('/api/maintenance/:id', maintenanceHandlers.update);
app.delete('/api/maintenance/:id', maintenanceHandlers.remove);

app.get('/api/settings', authMiddleware, settingsHandlers.getSettings);
app.put('/api/settings', authMiddleware, settingsHandlers.updateSettings);
app.post('/api/settings/packaging', authMiddleware, settingsHandlers.addPackaging);
app.put('/api/settings/packaging/:id', authMiddleware, settingsHandlers.updatePackaging);
app.delete('/api/settings/packaging/:id', authMiddleware, settingsHandlers.deletePackaging);

app.post('/api/calculator/compute', authMiddleware, calculatorHandlers.compute);

app.get('/api/reports/financial', authMiddleware, reportHandlers.getFinancialReports);

// --- Serve React static build ---
const clientPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientPath));
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Custora server running at http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`🔑 Demo login: admin@custora.com / admin123\n`);
});
