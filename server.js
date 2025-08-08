const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // set your MySQL password if any
  database: 'hospital_scheduler'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

// Signup route
app.post('/signup', (req, res) => {
  const {
    role,
    firstName,
    lastName,
    address,
    mobile,
    email,
    username,
    password,
    authId,
    specialty,
    workStart,
    workEnd
  } = req.body;

  console.log("Signup Received:", req.body);

  const sql = `
    INSERT INTO users 
      (role, first_name, last_name, address, mobile, email, username, password, auth_id, specialty, work_start, work_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    role,
    firstName,
    lastName,
    address,
    mobile,
    email,
    username,
    password,
    authId || null,
    specialty || null,
    workStart || null,
    workEnd || null
  ], (err, result) => {
    if (err) {
      console.error('MySQL insert error:', err);
      return res.status(500).send('Database error');
    }
    res.send("Signup successful!");
  });
});

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt with:', email, password);

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('Login SQL error:', err);
      return res.status(500).send('Server error');
    }

    if (results.length > 0) {
      console.log('Login successful for:', results[0].email);
      res.status(200).json({ message: 'Login successful', role: results[0].role });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

// Fetch user details by email (trimming and lowercase)
app.get('/user', (req, res) => {
  let email = req.query.email;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  email = email.trim().toLowerCase();

  const sql = `
    SELECT first_name, last_name, address, mobile, email, username, role, auth_id, specialty, work_start, work_end
    FROM users
    WHERE LOWER(TRIM(email)) = ?
  `;

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(results[0]);
  });
});

// Change password
app.post('/changePassword', (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  // Verify old password
  const checkSql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(checkSql, [email, oldPassword], (err, results) => {
    if (err) {
      console.error('Password check error:', err);
      return res.status(500).send('Server error');
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    // Update password
    const updateSql = 'UPDATE users SET password = ? WHERE email = ?';
    db.query(updateSql, [newPassword, email], (err, updateResults) => {
      if (err) {
        console.error('Password update error:', err);
        return res.status(500).send('Server error');
      }
      res.json({ message: 'Password changed successfully' });
    });
  });
});

// Get user profile by email (alternative route)
app.get('/users/:email', (req, res) => {
  const email = req.params.email.trim().toLowerCase();
  const query = 'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(results[0]);
    res.json(results[0]);
  });
});

// Serve login page by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
