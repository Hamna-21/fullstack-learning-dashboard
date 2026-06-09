const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createUser, getUserByEmail, getUserById } = require('../models/User');

const authRoutes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'decodelabs-dev-secret-change-me';

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function getFrontendBaseUrl(req) {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  return `${req.protocol}://${req.get('host')}`;
}

function getProviderEmail(profile, provider) {
  if (profile && Array.isArray(profile.emails) && profile.emails[0] && profile.emails[0].value) {
    return String(profile.emails[0].value).trim().toLowerCase();
  }

  if (provider === 'github' && profile && profile.username) {
    return `${profile.username}@users.noreply.github.com`;
  }

  return null;
}

function getOrCreateOAuthUser(profile, provider) {
  const email = getProviderEmail(profile, provider);
  if (!email) {
    return null;
  }

  const existing = getUserByEmail(email);
  if (existing) {
    return existing;
  }

  return createUser({
    email: email,
    passwordHash: null,
    role: 'student',
    authProvider: provider,
    providerId: profile && profile.id ? String(profile.id) : null,
    displayName: profile && (profile.displayName || profile.username) ? String(profile.displayName || profile.username) : null
  });
}

function handleOAuthCallback(provider) {
  return function (req, res) {
    const frontendUrl = getFrontendBaseUrl(req);
    const oauthPayload = req.user || {};
    const profile = oauthPayload.profile;
    const user = getOrCreateOAuthUser(profile, provider);

    if (!user) {
      const errorParams = new URLSearchParams({ oauth: 'error', provider: provider, message: 'No email found from provider' });
      return res.redirect(`${frontendUrl}/#${errorParams.toString()}`);
    }

    const token = signToken(user);
    const params = new URLSearchParams({ oauth: 'success', provider: provider, token: token });
    return res.redirect(`${frontendUrl}/#${params.toString()}`);
  };
}

function ensureStrategyConfigured(providerName) {
  return function (req, res, next) {
    const strategy = passport._strategy(providerName);
    if (!strategy) {
      return res.status(500).json({
        message: `${providerName} OAuth is not configured. Add provider keys in .env first.`
      });
    }

    return next();
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

authRoutes.post('/register', async function (req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = String(req.body.role || 'student').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = createUser({ email, passwordHash, role: role === 'admin' ? 'admin' : 'student' });
    const token = signToken(user);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

authRoutes.post('/login', async function (req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: `This account uses ${user.authProvider || 'social'} sign-in. Use that provider button.`
      });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

authRoutes.get(
  '/google',
  ensureStrategyConfigured('google'),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

authRoutes.get(
  '/google/callback',
  ensureStrategyConfigured('google'),
  passport.authenticate('google', { session: false, failureRedirect: '/#oauth=error&provider=google&message=Google%20login%20failed' }),
  handleOAuthCallback('google')
);

authRoutes.get(
  '/github',
  ensureStrategyConfigured('github'),
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

authRoutes.get(
  '/github/callback',
  ensureStrategyConfigured('github'),
  passport.authenticate('github', { session: false, failureRedirect: '/#oauth=error&provider=github&message=GitHub%20login%20failed' }),
  handleOAuthCallback('github')
);

authRoutes.get('/me', authenticateToken, function (req, res) {
  const user = getUserById(req.user.sub);
  return res.json({
    user: sanitizeUser(user) || {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role
    }
  });
});

authRoutes.post('/logout', function (_req, res) {
  return res.json({ message: 'Logged out' });
});

module.exports = {
  authRoutes
};
