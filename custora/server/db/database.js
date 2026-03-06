const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'custora.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      studio_name TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS filaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      type TEXT NOT NULL,
      color_hex TEXT DEFAULT '#000000',
      color_name TEXT DEFAULT '',
      initial_weight_g REAL DEFAULT 1000,
      remaining_weight_g REAL DEFAULT 1000,
      price_paid REAL DEFAULT 0,
      cost_per_gram REAL DEFAULT 0,
      purchase_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'ok',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT DEFAULT '',
      status TEXT DEFAULT 'idle',
      wattage REAL DEFAULT 0,
      purchase_price REAL DEFAULT 0,
      depreciation_months INTEGER DEFAULT 24,
      total_hours REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      material TEXT DEFAULT '',
      price REAL DEFAULT 0,
      status TEXT DEFAULT 'queue',
      tag TEXT DEFAULT '',
      printer_id INTEGER,
      progress REAL DEFAULT 0,
      time_remaining TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (printer_id) REFERENCES printers(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'draft',
      total_weight REAL DEFAULT 0,
      est_time REAL DEFAULT 0,
      base_cost REAL DEFAULT 0,
      printer_id INTEGER,
      packaging TEXT DEFAULT 'none',
      profit_margin REAL DEFAULT 45,
      assembly_labor INTEGER DEFAULT 0,
      sanding_labor INTEGER DEFAULT 0,
      last_saved DATETIME DEFAULT CURRENT_TIMESTAMP,
      image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (printer_id) REFERENCES printers(id)
    );

    CREATE TABLE IF NOT EXISTS product_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      component_name TEXT NOT NULL,
      filament_id INTEGER,
      weight_g REAL DEFAULT 0,
      time_h REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (filament_id) REFERENCES filaments(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      printer_id INTEGER,
      task_type TEXT DEFAULT 'general',
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT DEFAULT '09:00',
      status TEXT DEFAULT 'pending',
      overdue_days INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (printer_id) REFERENCES printers(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cost_per_kwh REAL DEFAULT 0.92,
      depreciation_months INTEGER DEFAULT 24,
      fail_rate_percent REAL DEFAULT 5,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packaging_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

function seedDemoData() {
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  const hashedPassword = bcrypt.hashSync('admin123', 10);

  // Users
  db.prepare(`INSERT INTO users (name, email, password, studio_name, role) VALUES (?, ?, ?, ?, ?)`)
    .run('Alex Maker', 'admin@custora.com', hashedPassword, 'Custora', 'admin');

  // Filaments
  const insertFilament = db.prepare(`
    INSERT INTO filaments (name, manufacturer, type, color_hex, color_name, initial_weight_g, remaining_weight_g, price_paid, cost_per_gram, purchase_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFilament.run('PLA Matte Black', 'Esun', 'PLA', '#1a1a1a', 'Matte Black', 1000, 580, 89.90, 0.09, '2024-08-15', 'ok');
  insertFilament.run('Silk Gold PLA', 'Sunlu', 'PLA', '#d4a843', 'Silk Gold', 1000, 850, 95.00, 0.095, '2024-09-01', 'ok');
  insertFilament.run('PETG Translucent', 'Polymaker', 'PETG', '#88ccff', 'Translucent Blue', 1000, 320, 110.00, 0.11, '2024-07-20', 'low');
  insertFilament.run('ABS White', 'Esun', 'ABS', '#ffffff', 'White', 1000, 90, 78.50, 0.079, '2024-06-10', 'critical');
  insertFilament.run('TPU 95A Red', 'Sunlu', 'TPU', '#e53935', 'Red', 500, 440, 120.00, 0.24, '2024-09-10', 'ok');
  insertFilament.run('PLA+ Gray', 'Esun', 'PLA', '#9e9e9e', 'Gray', 1000, 710, 85.00, 0.085, '2024-08-25', 'ok');

  // Printers
  const insertPrinter = db.prepare(`
    INSERT INTO printers (name, model, status, wattage, purchase_price, depreciation_months, total_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertPrinter.run('Bambu Lab X1C #01', 'X1 Carbon', 'active', 350, 6500, 24, 142.5);
  insertPrinter.run('Prusa MK4 #03', 'MK4', 'active', 140, 4200, 24, 98.25);
  insertPrinter.run('Creality Ender 3 V2', 'Ender 3 V2', 'idle', 280, 1200, 24, 12);
  insertPrinter.run('Voron 2.4 - V012', 'Voron 2.4', 'active', 300, 3800, 24, 210);

  // Orders
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, product_name, material, price, status, tag, printer_id, progress, time_remaining)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run('ORD-001', 'Articulated Dragon v2', 'Silk Gold PLA', 85.00, 'printing', 'PROTOTYPE', 1, 67, '4h 12m');
  insertOrder.run('ORD-002', 'Phone Stand', 'PLA Matte Black', 35.00, 'queue', 'HIGH DETAIL', null, 0, '');
  insertOrder.run('ORD-003', 'Miniature Castle', 'PETG Translucent', 120.00, 'queue', 'PROTOTYPE', null, 0, '');
  insertOrder.run('ORD-004', 'Custom Vase', 'Silk Gold PLA', 55.00, 'post-processing', 'SANDING', null, 100, '');
  insertOrder.run('ORD-005', 'Gear Assembly', 'PLA+ Gray', 95.00, 'post-processing', 'HIGH DETAIL', null, 100, '');

  // Products
  const insertProduct = db.prepare(`
    INSERT INTO products (name, sku, status, total_weight, est_time, base_cost, printer_id, packaging, profit_margin, assembly_labor, sanding_labor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProduct.run('Articulated Dragon v2', 'DRG-002', 'draft', 180, 12.5, 42.50, 1, 'M', 50, 0, 1);
  insertProduct.run('Phone Stand Pro', 'PST-001', 'active', 65, 3.5, 15.20, 2, 'S', 45, 1, 0);
  insertProduct.run('Miniature Castle Set', 'CST-001', 'draft', 320, 22, 78.40, null, 'L', 30, 1, 1);

  // Product Components
  const insertComponent = db.prepare(`
    INSERT INTO product_components (product_id, component_name, filament_id, weight_g, time_h, cost)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertComponent.run(1, 'Body (Main)', 2, 95, 6.5, 9.03);
  insertComponent.run(1, 'Wings (x2)', 2, 45, 3.0, 4.28);
  insertComponent.run(1, 'Joints & Pins', 1, 20, 1.5, 1.80);
  insertComponent.run(1, 'Tail Section', 2, 20, 1.5, 1.90);

  // Maintenance Tasks
  const insertMaintenance = db.prepare(`
    INSERT INTO maintenance_tasks (title, description, printer_id, task_type, scheduled_date, scheduled_time, status, overdue_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMaintenance.run('Belt Tension Adjustment', 'Adjust X and Y belt tension', 4, 'mechanical', '2024-10-07', '10:00', 'overdue', 3);
  insertMaintenance.run('PID Tuning', 'Perform PID autotune on hotend', 1, 'calibration', '2024-10-09', '14:00', 'overdue', 1);
  insertMaintenance.run('Z-Axis Lubrication', 'Apply lubricant to Z-axis lead screws', 2, 'lubrication', '2024-10-10', '11:00', 'pending', 0);
  insertMaintenance.run('Clean Build Plate PEI', 'Clean PEI surface with IPA', null, 'cleaning', '2024-10-11', '09:30', 'pending', 0);
  insertMaintenance.run('Firmware Update', 'Update to latest firmware', 3, 'firmware', '2024-10-14', '10:00', 'pending', 0);
  insertMaintenance.run('Rod Lubrication', 'Lubricate linear rods', 2, 'lubrication', '2024-10-15', '09:00', 'pending', 0);
  insertMaintenance.run('Bed Leveling Check', 'Verify bed mesh leveling', 1, 'calibration', '2024-10-18', '10:00', 'pending', 0);

  // Settings
  db.prepare(`INSERT INTO settings (cost_per_kwh, depreciation_months, fail_rate_percent) VALUES (?, ?, ?)`)
    .run(0.92, 24, 5);

  // Packaging Options
  const insertPackaging = db.prepare(`INSERT INTO packaging_options (name, unit_cost) VALUES (?, ?)`);
  insertPackaging.run('Caixa P Correios', 2.50);
  insertPackaging.run('Plástico Bolha', 0.40);
  insertPackaging.run('Etiqueta Térmica', 0.08);

  console.log('✅ Demo data seeded successfully');
}

module.exports = { getDb, initDatabase, seedDemoData };
