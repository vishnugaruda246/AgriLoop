import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SQLite database connection with verbose mode for debugging
const dbPath = join(__dirname, 'agri.db');
console.log('SQLite database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database successfully');
  }
});

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create items table
      db.run(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          seller_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          waste_type TEXT NOT NULL,
          weight_kg REAL NOT NULL,
          price REAL NOT NULL,
          emissions_prevented REAL NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating items table:', err);
          reject(err);
          return;
        }
        console.log('Items table created/verified successfully');
      });

      // Create orders table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          buyer_id INTEGER NOT NULL,
          seller_id INTEGER NOT NULL,
          amount_paid REAL NOT NULL,
          weight_kg REAL NOT NULL,
          status TEXT CHECK(status IN ('Pending', 'Accepted', 'Rejected')) DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating orders table:', err);
          reject(err);
          return;
        }
        console.log('Orders table created/verified successfully');
        console.log('SQLite database initialized successfully');
        resolve();
      });
    });
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

export { db, initializeDatabase };