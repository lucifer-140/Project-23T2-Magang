/**
 * auth.js — Handles login, signup, and forgot-password form logic.
 *
 * Demo user store: replace with real API calls in production.
 * Session is stored in sessionStorage under the key "session".
 */

/* ── Demo user store ─────────────────────────────────────────── */
const USERS = [
  {
    email:    'admin@test.com',
    password: 'admin123',
    name:     'Admin User',
    role:     'ADMIN',
    subtitle: 'Administrator',
  },
  {
    email:    'kaprodi@test.com',
    password: 'kaprodi123',
    name:     'Dr. Kaprodi',
    role:     'KAPRODI',
    subtitle: 'Kepala Program Studi',
  },
  {
    email:    'koordinator@test.com',
    password: 'koordinator123',
    name:     'Dr. Koordinator',
    role:     'KOORDINATOR',
    subtitle: 'Koordinator',
  },
  {
    email:    'dosen@test.com',
    password: 'dosen123',
    name:     'Dr. Dosen',
    role:     'DOSEN',
    subtitle: 'Dosen',
  },
];

/* ── Session helpers ─────────────────────────────────────────── */
function saveSession(user) {
  sessionStorage.setItem('session', JSON.stringify({
    name:     user.name,
    role:     user.role,
    subtitle: user.subtitle,
    email:    user.email,
  }));
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem('session') || 'null');
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem('session');
}

/* ── Alert helpers ───────────────────────────────────────────── */
function showAlert(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

function hideAlert(el) {
  if (!el) return;
  el.classList.add('hidden');
}

/* ── Login ───────────────────────────────────────────────────── */
function handleLogin(event) {
  event.preventDefault();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const alert    = document.getElementById('login-alert');

  hideAlert(alert);

  const user = USERS.find(u => u.email === email && u.password === password);

  if (!user) {
    showAlert(alert, 'Email atau password salah.');
    return;
  }

  saveSession(user);
  window.location.href = 'dashboard.html';
}

/* ── Demo quick-fill ─────────────────────────────────────────── */
function fillLogin(email, password) {
  const emailEl = document.getElementById('login-email');
  const passEl  = document.getElementById('login-password');
  if (emailEl) emailEl.value = email;
  if (passEl)  passEl.value  = password;
}

/* ── Sign up ─────────────────────────────────────────────────── */
function handleSignup(event) {
  event.preventDefault();

  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const alert    = document.getElementById('signup-alert');

  hideAlert(alert);

  if (password !== confirm) {
    showAlert(alert, 'Password tidak cocok. Silakan coba lagi.');
    return;
  }

  if (password.length < 8) {
    showAlert(alert, 'Password minimal 8 karakter.');
    return;
  }

  // In production: POST to your API, then redirect on success.
  window.location.href = 'lobby.html';
}

/* ── Forgot password ─────────────────────────────────────────── */
function handleForgot(event) {
  event.preventDefault();

  const successEl = document.getElementById('forgot-success');
  const formEl    = document.getElementById('forgot-form');

  if (successEl) successEl.classList.remove('hidden');
  if (formEl)    formEl.reset();
}

/* ── Guard: redirect to login if no session ──────────────────── */
function requireAuth() {
  if (!getSession()) {
    window.location.href = 'index.html';
  }
}
