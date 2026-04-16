/**
 * dashboard.js — Sidebar build, view switching, modals, table filter.
 *
 * Depends on: auth.js (getSession, clearSession, requireAuth)
 */

/* ── Role → nav configuration ────────────────────────────────── */
const NAV_CONFIG = {
  ADMIN: {
    pillClass:  'blue',
    pillLabel:  'Mode: Admin',
    navItems: [
      { icon: 'layout-dashboard', label: 'Dashboard',      view: 'view-overview'   },
      { icon: 'file-text',        label: 'Kelola Dokumen',  view: 'view-documents'  },
      { icon: 'users',            label: 'Kelola Pengguna', view: 'view-users'      },
      { icon: 'settings',         label: 'Pengaturan',      view: 'view-settings'   },
    ],
  },
  KAPRODI: {
    pillClass:  'blue',
    pillLabel:  'Mode: Kaprodi',
    navItems: [
      { icon: 'layout-dashboard', label: 'Dashboard',       view: 'view-overview'  },
      { icon: 'file-text',        label: 'Review Dokumen',   view: 'view-documents' },
      { icon: 'bell',             label: 'Permintaan',       view: 'view-requests'  },
      { icon: 'settings',         label: 'Pengaturan',       view: 'view-settings'  },
    ],
  },
  KOORDINATOR: {
    pillClass:  'blue',
    pillLabel:  'Mode: Koordinator',
    navItems: [
      { icon: 'layout-dashboard', label: 'Dashboard',       view: 'view-overview'  },
      { icon: 'file-text',        label: 'Kelola Dokumen',   view: 'view-documents' },
      { icon: 'settings',         label: 'Pengaturan',       view: 'view-settings'  },
    ],
  },
  DOSEN: {
    pillClass:  'red',
    pillLabel:  'Mode: Dosen',
    navItems: [
      { icon: 'layout-dashboard', label: 'Dashboard',       view: 'view-overview'  },
      { icon: 'file-text',        label: 'Dokumen Saya',     view: 'view-documents' },
      { icon: 'settings',         label: 'Pengaturan',       view: 'view-settings'  },
    ],
  },
};

/* ── Boot ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();

  const session = getSession();
  if (!session) return;

  buildSidebar(session);
  lucide.createIcons();

  // Activate first view
  const config = NAV_CONFIG[session.role] || NAV_CONFIG.DOSEN;
  showView(config.navItems[0].view);
});

/* ── Sidebar builder ─────────────────────────────────────────── */
function buildSidebar(session) {
  const config = NAV_CONFIG[session.role] || NAV_CONFIG.DOSEN;

  // Role pill
  const pill = document.getElementById('role-pill');
  if (pill) {
    pill.className  = 'role-pill ' + config.pillClass;
    pill.textContent = config.pillLabel;
  }

  // User info
  const avatarEl = document.getElementById('user-avatar');
  const nameEl   = document.getElementById('user-name-display');
  const roleEl   = document.getElementById('user-role-display');
  if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();
  if (nameEl)   nameEl.textContent   = session.name;
  if (roleEl)   roleEl.textContent   = session.subtitle;

  // Nav items
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  nav.innerHTML = '';
  config.navItems.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.className    = 'nav-item' + (i === 0 ? ' active' : '');
    btn.dataset.view = item.view;
    btn.innerHTML    = `
      <span class="nav-icon">
        <i data-lucide="${item.icon}" width="18" height="18"></i>
      </span>
      <span>${item.label}</span>
    `;
    btn.addEventListener('click', () => showView(item.view));
    nav.appendChild(btn);
  });
}

/* ── View switching ──────────────────────────────────────────── */
function showView(viewId) {
  document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });

  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  // Close sidebar on mobile
  closeSidebar();
}

/* ── Logout ──────────────────────────────────────────────────── */
function handleLogout() {
  clearSession();
  window.location.href = 'index.html';
}

/* ── Mobile sidebar ──────────────────────────────────────────── */
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const isOpen   = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
}

/* ── Modals ──────────────────────────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// Close modal when clicking outside the card
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
      m.classList.add('hidden');
    });
  }
});

/* ── Table search / filter ───────────────────────────────────── */
function filterTable(input, tableId) {
  const query = input.value.toLowerCase();
  const table = document.getElementById(tableId);
  if (!table) return;

  table.querySelectorAll('tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });

  updateEmptyState(table);
}

function updateEmptyState(table) {
  const tbody   = table.querySelector('tbody');
  const visible = [...tbody.querySelectorAll('tr')].filter(r => r.style.display !== 'none');
  const existing = tbody.querySelector('.no-results-row');

  if (visible.length === 0 && !existing) {
    const cols = table.querySelectorAll('th').length;
    const row  = document.createElement('tr');
    row.className = 'no-results-row';
    row.innerHTML = `
      <td colspan="${cols}" style="text-align:center;padding:2.5rem 1rem;color:var(--text-muted)">
        Tidak ada data yang cocok.
      </td>
    `;
    tbody.appendChild(row);
  } else if (visible.length > 0 && existing) {
    existing.remove();
  }
}

/* ── File input trigger (upload zone) ────────────────────────── */
function triggerFileInput(inputId) {
  const el = document.getElementById(inputId);
  if (el) el.click();
}
