import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { db, initializeDatabase, runQuery, getQuery, allQuery } from './database.js';

dotenv.config();

const EMISSION_FACTOR = 1.5; // kg CO₂ per kg waste

const app = express();
const port = process.env.PORT || 3000;

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
    console.log('✅ Database initialization completed successfully');
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  });

// Email transporter configuration with detailed logging
let transporter;
try {
  console.log('🔧 Configuring email transporter...');
  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
  console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not found in environment variables');
    console.warn('⚠️ Email verification will be skipped');
  } else {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Test the email connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter verification failed:', error);
        transporter = null;
      } else {
        console.log('✅ Email transporter configured and verified successfully');
      }
    });
  }
} catch (error) {
  console.error('❌ Email transporter configuration failed:', error);
  transporter = null;
}

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
    message: 'AgriLoop Backend is running with SQLite',
    timestamp: new Date().toISOString(),
    database: 'SQLite'
  });
});

// Debug endpoint to check users table
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await allQuery('SELECT id, username, email, verified, created_at FROM users');
    res.json({
      message: 'Users table contents',
      count: users.length,
      users: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Signup with email verification
app.post('/api/signup', async (req, res) => {
  console.log('📝 Signup request received:', { ...req.body, password: '[HIDDEN]' });
  
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
    console.log('❌ Missing required fields');
    return res.status(400).json({ 
      error: 'Missing required fields: username, full_name, email, role, and password are required' 
    });
  }

  // Validate role
  if (!['Seller', 'Buyer'].includes(role)) {
    console.log('❌ Invalid role:', role);
    return res.status(400).json({ 
      error: 'Role must be either "Seller" or "Buyer"' 
    });
  }

  // Validate gender if provided
  if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
    console.log('❌ Invalid gender:', gender);
    return res.status(400).json({ 
      error: 'Gender must be "Male", "Female", or "Other"' 
    });
  }

  try {
    console.log('🔍 Checking if user already exists...');
    
    // Check if user already exists
    const existingUser = await getQuery(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🎫 Generating verification token...');
    const token = jwt.sign({ email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });

    console.log('💾 Inserting user into database...');
    // Insert user with all fields
    const result = await runQuery(
      `INSERT INTO users (username, full_name, email, gender, date_of_birth, city, role, password_hash, verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    console.log('✅ User created with ID:', result.id);

    // Send verification email if transporter is available
    if (transporter) {
      try {
        console.log('📧 Attempting to send verification email to:', email);
        const verificationLink = `http://localhost:3000/api/verify-email?token=${token}`;

        const mailOptions = {
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
        };

        console.log('📤 Sending email with options:', {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent successfully!');
        console.log('📧 Email info:', {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected
        });
      } catch (emailError) {
        console.error('❌ Failed to send verification email:');
        console.error('📧 Email error details:', emailError);
        console.error('📧 Error message:', emailError.message);
        console.error('📧 Error code:', emailError.code);
        
        // Log specific Gmail/SMTP errors
        if (emailError.code === 'EAUTH') {
          console.error('🔐 Authentication failed - check EMAIL_USER and EMAIL_PASS');
        } else if (emailError.code === 'ECONNECTION') {
          console.error('🌐 Connection failed - check internet connection');
        } else if (emailError.responseCode === 535) {
          console.error('🔑 Invalid credentials - check Gmail app password');
        }
        
        // Don't fail the signup if email fails, but log it
        console.log('⚠️ Continuing with signup despite email failure');
      }
    } else {
      console.log('⚠️ Email transporter not available, skipping email verification');
      console.log('🔧 To enable email verification:');
      console.log('   1. Set EMAIL_USER in .env file');
      console.log('   2. Set EMAIL_PASS in .env file (use Gmail App Password)');
      console.log('   3. Restart the server');
    }

    res.status(200).json({ 
      message: transporter ? 
        'Signup successful. Check your email to verify your account.' :
        'Signup successful. Email verification is currently disabled.',
      user: {
        id: result.id,
        username,
        full_name,
        email,
        role
      },
      emailSent: !!transporter
    });

  } catch (err) {
    console.error('❌ Signup error:', err);
    console.error('❌ Error details:', err.message);
    console.error('❌ Error stack:', err.stack);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userEmail = decoded.email;

    // Check if user exists
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [userEmail]);

    if (!user) {
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
    await runQuery('UPDATE users SET verified = ? WHERE email = ?', [1, userEmail]);

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
          <a href="http://localhost:5173/login" class="login-btn">
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
  console.log('🔐 Login attempt for:', email);

  try {
    // 1. Check if user exists
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ message: 'User not found.' });
    }

    // 2. Check if email is verified
    if (!user.verified) {
      console.log('❌ Email not verified for:', email);
      return res.status(403).json({ message: 'Email not verified. Please verify your email to log in.' });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.log('❌ Incorrect password for:', email);
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // 4. Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    console.log('✅ Login successful for:', email);

    // 5. Respond with token and user info
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
    console.error('❌ Login Error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Get user profile
app.get('/api/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await getQuery(
      'SELECT username, full_name, email, gender, date_of_birth, city, role FROM users WHERE id = ?', 
      [decoded.userId]
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
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
app.get('/api/seller/dashboard', authenticateToken, async (req, res) => {
  const sellerId = req.user.userId;

  try {
    const result = await getQuery(`
      SELECT 
        COALESCE(SUM(amount_paid), 0) as totalAmountSold,
        COALESCE(SUM(weight_kg), 0) as totalWeightSold,
        COALESCE(SUM(weight_kg * 0.85), 0) as totalEmissionsPrevented,
        COUNT(*) as totalTransactions,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pendingOrders,
        COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as completedOrders
      FROM orders 
      WHERE seller_id = ?
    `, [sellerId]);

    res.json(result || {
      totalAmountSold: 0,
      totalWeightSold: 0,
      totalEmissionsPrevented: 0,
      totalTransactions: 0,
      pendingOrders: 0,
      completedOrders: 0
    });
  } catch (err) {
    console.error('Error fetching seller dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get seller items
app.get('/api/seller/items', authenticateToken, async (req, res) => {
  const sellerId = req.user.userId;

  try {
    const items = await allQuery(
      'SELECT * FROM items WHERE seller_id = ? ORDER BY created_at DESC',
      [sellerId]
    );
    res.json(items || []);
  } catch (err) {
    console.error('Error fetching seller items:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Add new item
app.post('/api/items', authenticateToken, async (req, res) => {
  const { name, waste_type, weight_kg, price } = req.body;
  const sellerId = req.user.userId;

  if (!name || !waste_type || !weight_kg || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const emissions_prevented = weight_kg * 0.85;

  try {
    const result = await runQuery(`
      INSERT INTO items (seller_id, name, waste_type, weight_kg, price, emissions_prevented)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sellerId, name, waste_type, weight_kg, price, emissions_prevented]);

    // Return the created item
    const item = await getQuery('SELECT * FROM items WHERE id = ?', [result.id]);
    res.status(201).json(item);
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Delete item
app.delete('/api/seller/items/:id', authenticateToken, async (req, res) => {
  const itemId = req.params.id;
  const sellerId = req.user.userId;

  try {
    const result = await runQuery(
      'DELETE FROM items WHERE id = ? AND seller_id = ?',
      [itemId, sellerId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found or not authorized' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get seller orders
app.get('/api/seller/orders', authenticateToken, async (req, res) => {
  const sellerId = req.user.userId;

  try {
    const orders = await allQuery(`
      SELECT o.*, i.name as item_name, u.full_name as buyer_name, u.email as buyer_email
      FROM orders o 
      JOIN items i ON o.item_id = i.id 
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = ? 
      ORDER BY o.created_at DESC
    `, [sellerId]);

    res.json(orders || []);
  } catch (err) {
    console.error('Error fetching seller orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status
app.patch('/api/seller/orders/:id/status', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const sellerId = req.user.userId;

  if (!['Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await runQuery(
      'UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?',
      [status, orderId, sellerId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found or not authorized' });
    }
    
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ==================== BUYER ENDPOINTS ====================

// Get buyer dashboard KPIs
app.get('/api/buyer/dashboard', authenticateToken, async (req, res) => {
  const buyerId = req.user.userId;

  try {
    const result = await getQuery(`
      SELECT 
        COALESCE(SUM(amount_paid), 0) as totalAmountSpent,
        COALESCE(SUM(weight_kg), 0) as totalWeightPurchased,
        COALESCE(SUM(weight_kg * 0.85), 0) as totalEmissionsOffset,
        COUNT(*) as totalTransactions
      FROM orders 
      WHERE buyer_id = ?
    `, [buyerId]);

    res.json(result || {
      totalAmountSpent: 0,
      totalWeightPurchased: 0,
      totalEmissionsOffset: 0,
      totalTransactions: 0
    });
  } catch (err) {
    console.error('Error fetching buyer dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get buyer orders
app.get('/api/buyer/orders', authenticateToken, async (req, res) => {
  const buyerId = req.user.userId;

  try {
    const orders = await allQuery(`
      SELECT o.*, i.name as item_name, u.full_name as seller_name, u.email as seller_email
      FROM orders o 
      JOIN items i ON o.item_id = i.id 
      JOIN users u ON o.seller_id = u.id
      WHERE o.buyer_id = ? 
      ORDER BY o.created_at DESC
    `, [buyerId]);

    res.json(orders || []);
  } catch (err) {
    console.error('Error fetching buyer orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get marketplace items
app.get('/api/marketplace', authenticateToken, async (req, res) => {
  const buyerId = req.user.userId;

  try {
    const items = await allQuery(`
      SELECT i.*, u.full_name as seller_name, u.email as seller_email
      FROM items i 
      JOIN users u ON i.seller_id = u.id
      WHERE i.seller_id != ? 
      ORDER BY i.created_at DESC
    `, [buyerId]);

    res.json(items || []);
  } catch (err) {
    console.error('Error fetching marketplace items:', err);
    res.status(500).json({ error: 'Failed to fetch marketplace items' });
  }
});

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { item_id } = req.body;
  const buyerId = req.user.userId;

  if (!item_id) {
    return res.status(400).json({ error: 'Item ID is required' });
  }

  try {
    // First, get the item details
    const item = await getQuery('SELECT * FROM items WHERE id = ?', [item_id]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Create the order
    const result = await runQuery(`
      INSERT INTO orders (item_id, buyer_id, seller_id, amount_paid, weight_kg, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `, [item_id, buyerId, item.seller_id, item.price, item.weight_kg]);

    // Return the created order
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [result.id]);
    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Test Route
app.get('/', (req, res) => {
  res.send('AgriLoop Backend is running with SQLite');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 AgriLoop backend running on port ${port}`);
  console.log(`🏥 Health check available at: http://localhost:${port}/api/health`);
  console.log(`🔍 Debug users endpoint: http://localhost:${port}/api/debug/users`);
  console.log('💾 Using SQLite database for all data storage');
});