import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { db, initializeDatabase } from './database.js';

const { Pool } = pkg;
dotenv.config();

const EMISSION_FACTOR = 1.5; // kg CO₂ per kg waste

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(express.json());

// Initialize SQLite database with error handling
initializeDatabase()
  .then(() => {
    console.log('Database initialization completed successfully');
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AgriLoop Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Signup with email verification
app.post('/api/signup', async (req, res) => {
  const { 
    username, 
    full_name, 
    email, 
    gender, 
    date_of_birth, 
    city, 
    role, 
    password 
  } = req.body;

  // Validate required fields
  if (!username || !full_name || !email || !role || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields: username, full_name, email, role, and password are required' 
    });
  }

  // Validate role
  if (!['Seller', 'Buyer'].includes(role)) {
    return res.status(400).json({ 
      error: 'Role must be either "Seller" or "Buyer"' 
    });
  }

  // Validate gender if provided
  if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
    return res.status(400).json({ 
      error: 'Gender must be "Male", "Female", or "Other"' 
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Insert user with all fields
    await pool.query(
      `INSERT INTO users (username, full_name, email, gender, date_of_birth, city, role, password_hash, verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        username, 
        full_name, 
        email, 
        gender || null, 
        date_of_birth || null, 
        city || null, 
        role, 
        hashedPassword, 
        false
      ]
    );

    const verificationLink = `http://localhost:3000/api/verify-email?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email - AgriLoop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to AgriLoop, ${full_name}!</h2>
          <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
          <p>
            <a href="${verificationLink}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>If the button doesn't work, you can also click this link:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ 
      message: 'Signup successful. Check your email to verify your account.',
      user: {
        username,
        full_name,
        email,
        role
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    
    // Handle specific database errors
    if (err.code === '23505') { // PostgreSQL unique violation
      if (err.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      if (err.constraint === 'users_username_key') {
        return res.status(409).json({ error: 'Username already exists' });
      }
    }
    
    res.status(500).json({ error: 'Error during signup. Please try again.' });
  }
});

// Verify email
app.get('/api/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          .error-icon {
            color: #ef4444;
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 16px;
            font-size: 24px;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">⚠️</div>
          <h1>Verification Failed</h1>
          <p>Verification token is missing. Please check your email for the correct verification link.</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decoded.email;

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);

    if (userResult.rows.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
              width: 100%;
            }
            .error-icon {
              color: #ef4444;
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 16px;
              font-size: 24px;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>User Not Found</h1>
            <p>The user associated with this verification token could not be found.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Update verified status
    await pool.query('UPDATE users SET verified = true WHERE email = $1', [userEmail]);

    // Return success HTML page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification Successful</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
            animation: slideIn 0.5s ease-out;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .success-icon {
            color: #10b981;
            font-size: 48px;
            margin-bottom: 20px;
            animation: bounce 0.6s ease-in-out;
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
          h1 {
            color: #1f2937;
            margin-bottom: 16px;
            font-size: 24px;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .login-btn {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
          }
          .login-btn:hover {
            background: #059669;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
          }
          .login-btn:active {
            transform: translateY(0);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Your mail has been successfully verified</h1>
          <p>Great! Your email address has been verified. You can now access all features of your account.</p>
          <a href="https://hackathon-agri-loop.vercel.app/login" class="login-btn">
            Continue to Login
          </a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          .error-icon {
            color: #ef4444;
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 16px;
            font-size: 24px;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">⚠️</div>
          <h1>Verification Failed</h1>
          <p>Invalid or expired token. Please request a new verification email.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = result.rows[0];

    // 2. Check if email is verified
    if (!user.verified) {
      return res.status(403).json({ message: 'Email not verified. Please verify your email to log in.' });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // 4. Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 5. Respond with token and user info (optional)
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Test Route
app.get('/', (req, res) => {
  res.send('AgriLoop Backend is running');
});

app.get('/api/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT username, full_name, email, gender, date_of_birth, city, role FROM users WHERE id = $1', [decoded.userId]);

    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(403).json({ message: 'Invalid token' });
  }
});

app.post('/api/logout', (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' });
});

// ==================== SELLER ENDPOINTS ====================

// Get seller dashboard KPIs
app.get('/api/seller/dashboard', authenticateToken, (req, res) => {
  const sellerId = req.user.userId;

  const query = `
    SELECT 
      COALESCE(SUM(amount_paid), 0) as totalAmountSold,
      COALESCE(SUM(weight_kg), 0) as totalWeightSold,
      COALESCE(SUM(weight_kg * 0.85), 0) as totalEmissionsPrevented,
      COUNT(*) as totalTransactions,
      COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pendingOrders,
      COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as completedOrders
    FROM orders 
    WHERE seller_id = ?
  `;

  db.get(query, [sellerId], (err, row) => {
    if (err) {
      console.error('Error fetching seller dashboard:', err);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
    res.json(row || {
      totalAmountSold: 0,
      totalWeightSold: 0,
      totalEmissionsPrevented: 0,
      totalTransactions: 0,
      pendingOrders: 0,
      completedOrders: 0
    });
  });
});

// Get seller items
app.get('/api/seller/items', authenticateToken, (req, res) => {
  const sellerId = req.user.userId;

  db.all(
    'SELECT * FROM items WHERE seller_id = ? ORDER BY created_at DESC',
    [sellerId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching seller items:', err);
        return res.status(500).json({ error: 'Failed to fetch items' });
      }
      res.json(rows || []);
    }
  );
});

// Add new item
app.post('/api/items', authenticateToken, (req, res) => {
  const { name, waste_type, weight_kg, price } = req.body;
  const sellerId = req.user.userId;

  if (!name || !waste_type || !weight_kg || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const emissions_prevented = weight_kg * 0.85;

  const query = `
    INSERT INTO items (seller_id, name, waste_type, weight_kg, price, emissions_prevented)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [sellerId, name, waste_type, weight_kg, price, emissions_prevented], function(err) {
    if (err) {
      console.error('Error adding item:', err);
      return res.status(500).json({ error: 'Failed to add item' });
    }

    // Return the created item
    db.get('SELECT * FROM items WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching created item:', err);
        return res.status(500).json({ error: 'Item created but failed to fetch' });
      }
      res.status(201).json(row);
    });
  });
});

// Delete item
app.delete('/api/seller/items/:id', authenticateToken, (req, res) => {
  const itemId = req.params.id;
  const sellerId = req.user.userId;

  db.run(
    'DELETE FROM items WHERE id = ? AND seller_id = ?',
    [itemId, sellerId],
    function(err) {
      if (err) {
        console.error('Error deleting item:', err);
        return res.status(500).json({ error: 'Failed to delete item' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item not found or not authorized' });
      }
      
      res.json({ message: 'Item deleted successfully' });
    }
  );
});

// Get seller orders
app.get('/api/seller/orders', authenticateToken, (req, res) => {
  const sellerId = req.user.userId;

  db.all(
    'SELECT o.*, i.name as item_name FROM orders o JOIN items i ON o.item_id = i.id WHERE o.seller_id = ? ORDER BY o.created_at DESC',
    [sellerId],
    async (err, orders) => {
      if (err) {
        console.error('Error fetching seller orders:', err);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }

      // Fetch buyer details from PostgreSQL for each order
      try {
        const ordersWithBuyers = await Promise.all(
          orders.map(async (order) => {
            try {
              const userResult = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [order.buyer_id]);
              const buyer = userResult.rows[0];
              return {
                ...order,
                buyer_name: buyer ? buyer.full_name : 'Unknown',
                buyer_email: buyer ? buyer.email : 'Unknown'
              };
            } catch (error) {
              console.error('Error fetching buyer details for order:', order.id, error);
              return {
                ...order,
                buyer_name: 'Unknown',
                buyer_email: 'Unknown'
              };
            }
          })
        );
        res.json(ordersWithBuyers);
      } catch (error) {
        console.error('Error fetching buyer details:', error);
        res.json(orders.map(order => ({ ...order, buyer_name: 'Unknown', buyer_email: 'Unknown' })));
      }
    }
  );
});

// Update order status
app.patch('/api/seller/orders/:id/status', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const sellerId = req.user.userId;

  if (!['Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?',
    [status, orderId, sellerId],
    function(err) {
      if (err) {
        console.error('Error updating order status:', err);
        return res.status(500).json({ error: 'Failed to update order status' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found or not authorized' });
      }
      
      res.json({ message: 'Order status updated successfully' });
    }
  );
});

// ==================== BUYER ENDPOINTS ====================

// Get buyer dashboard KPIs
app.get('/api/buyer/dashboard', authenticateToken, (req, res) => {
  const buyerId = req.user.userId;

  const query = `
    SELECT 
      COALESCE(SUM(amount_paid), 0) as totalAmountSpent,
      COALESCE(SUM(weight_kg), 0) as totalWeightPurchased,
      COALESCE(SUM(weight_kg * 0.85), 0) as totalEmissionsOffset,
      COUNT(*) as totalTransactions
    FROM orders 
    WHERE buyer_id = ?
  `;

  db.get(query, [buyerId], (err, row) => {
    if (err) {
      console.error('Error fetching buyer dashboard:', err);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
    res.json(row || {
      totalAmountSpent: 0,
      totalWeightPurchased: 0,
      totalEmissionsOffset: 0,
      totalTransactions: 0
    });
  });
});

// Get buyer orders
app.get('/api/buyer/orders', authenticateToken, (req, res) => {
  const buyerId = req.user.userId;

  db.all(
    'SELECT o.*, i.name as item_name FROM orders o JOIN items i ON o.item_id = i.id WHERE o.buyer_id = ? ORDER BY o.created_at DESC',
    [buyerId],
    async (err, orders) => {
      if (err) {
        console.error('Error fetching buyer orders:', err);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }

      // Fetch seller details from PostgreSQL for each order
      try {
        const ordersWithSellers = await Promise.all(
          orders.map(async (order) => {
            try {
              const userResult = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [order.seller_id]);
              const seller = userResult.rows[0];
              return {
                ...order,
                seller_name: seller ? seller.full_name : 'Unknown',
                seller_email: seller ? seller.email : 'Unknown'
              };
            } catch (error) {
              console.error('Error fetching seller details for order:', order.id, error);
              return {
                ...order,
                seller_name: 'Unknown',
                seller_email: 'Unknown'
              };
            }
          })
        );
        res.json(ordersWithSellers);
      } catch (error) {
        console.error('Error fetching seller details:', error);
        res.json(orders.map(order => ({ ...order, seller_name: 'Unknown', seller_email: 'Unknown' })));
      }
    }
  );
});

// Get marketplace items
app.get('/api/marketplace', authenticateToken, (req, res) => {
  const buyerId = req.user.userId;

  // Get all items except those from the current buyer (if they're also a seller)
  db.all(
    'SELECT * FROM items WHERE seller_id != ? ORDER BY created_at DESC',
    [buyerId],
    async (err, items) => {
      if (err) {
        console.error('Error fetching marketplace items:', err);
        return res.status(500).json({ error: 'Failed to fetch marketplace items' });
      }

      // Fetch seller details from PostgreSQL for each item
      try {
        const itemsWithSellers = await Promise.all(
          items.map(async (item) => {
            try {
              const userResult = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [item.seller_id]);
              const seller = userResult.rows[0];
              return {
                ...item,
                seller_name: seller ? seller.full_name : 'Unknown',
                seller_email: seller ? seller.email : 'Unknown'
              };
            } catch (error) {
              console.error('Error fetching seller details for item:', item.id, error);
              return {
                ...item,
                seller_name: 'Unknown',
                seller_email: 'Unknown'
              };
            }
          })
        );
        res.json(itemsWithSellers);
      } catch (error) {
        console.error('Error fetching seller details:', error);
        res.json(items.map(item => ({ ...item, seller_name: 'Unknown', seller_email: 'Unknown' })));
      }
    }
  );
});

// Create order
app.post('/api/orders', authenticateToken, (req, res) => {
  const { item_id } = req.body;
  const buyerId = req.user.userId;

  if (!item_id) {
    return res.status(400).json({ error: 'Item ID is required' });
  }

  // First, get the item details
  db.get('SELECT * FROM items WHERE id = ?', [item_id], (err, item) => {
    if (err) {
      console.error('Error fetching item:', err);
      return res.status(500).json({ error: 'Failed to fetch item' });
    }

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Create the order
    const query = `
      INSERT INTO orders (item_id, buyer_id, seller_id, amount_paid, weight_kg, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `;

    db.run(query, [item_id, buyerId, item.seller_id, item.price, item.weight_kg], function(err) {
      if (err) {
        console.error('Error creating order:', err);
        return res.status(500).json({ error: 'Failed to create order' });
      }

      // Return the created order
      db.get('SELECT * FROM orders WHERE id = ?', [this.lastID], (err, order) => {
        if (err) {
          console.error('Error fetching created order:', err);
          return res.status(500).json({ error: 'Order created but failed to fetch' });
        }
        res.status(201).json(order);
      });
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`AgriLoop backend running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/api/health`);
});