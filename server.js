require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const { authRoutes } = require('./backend/routes/auth');
const { authenticateToken, requireRole } = require('./backend/middleware/authMiddleware');
const { getUserById } = require('./backend/models/User');
const { configurePassport } = require('./backend/config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

configurePassport();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(express.static(__dirname));

app.get('/', function (_req, res) {
  res.sendFile(path.join(__dirname, 'decodelabs_v2.html'));
});

app.get('/api/health', function (_req, res) {
  res.json({ ok: true, service: 'DecodeLabs API' });
});

app.use('/api/auth', authRoutes);

app.get('/api/profile', authenticateToken, function (req, res) {
  res.json({
    user: {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role
    }
  });
});

app.get('/api/dashboard', authenticateToken, function (req, res) {
  const user = getUserById(req.user.sub);
  res.json({
    message: 'Protected dashboard data',
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      : {
          id: req.user.sub,
          email: req.user.email,
          role: req.user.role
        },
    stats: {
      progress: 70,
      streakDays: 14,
      xp: 4820,
      tasksDone: 23
    }
  });
});

app.get('/api/admin/stats', authenticateToken, requireRole('admin'), function (_req, res) {
  res.json({
    message: 'Admin-only data',
    users: 1,
    activeSessions: 1
  });
});

app.use(function (err, _req, res, _next) {
  if (err && err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, function () {
  console.log(`DecodeLabs server running on http://localhost:${PORT}`);
});
