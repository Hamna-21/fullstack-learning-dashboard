const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataFile = path.join(__dirname, '..', 'data', 'users.json');

function readUsersFile() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeUsersFile(users) {
  fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getAllUsers() {
  return readUsersFile();
}

function getUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return getAllUsers().find(function (user) {
    return user.email === normalized;
  });
}

function getUserById(id) {
  return getAllUsers().find(function (user) {
    return user.id === id;
  });
}

function createUser({ email, passwordHash, role, authProvider, providerId, displayName }) {
  const users = getAllUsers();
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    email: normalizeEmail(email),
    passwordHash: passwordHash || null,
    role: role || 'student',
    authProvider: authProvider || 'local',
    providerId: providerId || null,
    displayName: displayName || null,
    createdAt: now,
    updatedAt: now
  };

  users.push(user);
  writeUsersFile(users);
  return user;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getAllUsers
};
