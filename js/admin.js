/**
 * Admin Dashboard — Supabase Auth + Realtime
 * Requires: @supabase/supabase-js CDN, js/supabase-config.js loaded first.
 *
 * Auth: email/password login via Supabase Auth
 * Data: live queries + realtime subscriptions on appointments, contact_messages
 * RLS: SELECT restricted to authenticated users
 */
(function () {
  let sb = null;
  let realtimeChannel = null;

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Supabase client
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      console.error('Supabase config not loaded');
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.error('Supabase JS library not loaded');
      return;
    }

    sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // Check existing session
    const { data: { session } } = await sb.auth.getSession();

    if (session) {
      onAuthenticated(session.user);
    } else {
      showLoginOverlay();
    }

    // Tab switching
    initTabSwitching();

    // Login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Logout
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', handleLogout);
    }

    // Search
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }
  });

  // ── Auth ────────────────────────────────────────────────────────────────────

  function showLoginOverlay() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'flex';
    const dashboard = document.querySelector('.admin-container');
    if (dashboard) dashboard.style.display = 'none';
  }

  function hideLoginOverlay() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'none';
    const dashboard = document.querySelector('.admin-container');
    if (dashboard) dashboard.style.display = 'flex';
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    btn.disabled = false;
    btn.textContent = 'Sign In';

    if (error) {
      errorEl.textContent = error.message;
      return;
    }

    onAuthenticated(data.user);
  }

  async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;

    // Unsubscribe from realtime
    if (realtimeChannel) {
      sb.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    await sb.auth.signOut();
    showLoginOverlay();
  }

  function onAuthenticated(user) {
    hideLoginOverlay();

    // Update admin name in header
    const adminName = document.querySelector('.admin-name');
    if (adminName) adminName.textContent = user.email.split('@')[0];

    // Load live data
    loadAppointments();
    loadContacts();
    loadDashboardStats();

    // Start realtime subscriptions
    subscribeToRealtime();
  }

  // ── Data Loading ───────────────────────────────────────────────────────────

  async function loadAppointments() {
    const { data, error } = await sb
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading appointments:', error);
      return;
    }

    renderAppointmentsTable(data || []);
    updateStatCard('appointments', (data || []).length);
  }

  async function loadContacts() {
    const { data, error } = await sb
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading contacts:', error);
      return;
    }

    renderContactsTable(data || []);
    updateStatCard('contacts', (data || []).length);
  }

  async function loadDashboardStats() {
    // Count appointments
    const { count: apptCount } = await sb
      .from('appointments')
      .select('id', { count: 'exact', head: true });

    // Count contacts
    const { count: contactCount } = await sb
      .from('contact_messages')
      .select('id', { count: 'exact', head: true });

    // Count community members
    const { count: memberCount } = await sb
      .from('community_members')
      .select('id', { count: 'exact', head: true });

    updateStatCard('appointments', apptCount || 0);
    updateStatCard('contacts', contactCount || 0);
    updateStatCard('community', memberCount || 0);

    // Update recent activity with latest records
    updateRecentActivity();
  }

  async function updateRecentActivity() {
    const { data: recentAppts } = await sb
      .from('appointments')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: recentContacts } = await sb
      .from('contact_messages')
      .select('name, type, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    const activities = [];

    (recentAppts || []).forEach(a => {
      activities.push({
        type: 'appointment',
        title: 'Appointment Request',
        description: `${a.name} requested an appointment`,
        time: timeAgo(a.created_at),
        timestamp: new Date(a.created_at)
      });
    });

    (recentContacts || []).forEach(c => {
      activities.push({
        type: c.type || 'contact',
        title: c.type === 'ngo' ? 'NGO Contact' : c.type === 'campaign' ? 'Campaign Submission' : 'Contact Message',
        description: `${c.name} sent a ${c.type || 'general'} message`,
        time: timeAgo(c.created_at),
        timestamp: new Date(c.created_at)
      });
    });

    // Sort by timestamp descending and take top 5
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const top5 = activities.slice(0, 5);

    const activityList = document.querySelector('.activity-list');
    if (activityList) {
      activityList.innerHTML = top5.map(activity => `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="fas fa-${getActivityIcon(activity.type)}"></i>
          </div>
          <div class="activity-details">
            <h4>${activity.title}</h4>
            <p>${activity.description}</p>
            <span class="time">${activity.time}</span>
          </div>
        </div>
      `).join('') || '<p style="color:#999;padding:1rem;">No recent activity</p>';
    }
  }

  // ── Realtime ───────────────────────────────────────────────────────────────

  function subscribeToRealtime() {
    if (realtimeChannel) {
      sb.removeChannel(realtimeChannel);
    }

    realtimeChannel = sb
      .channel('admin-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments'
      }, (payload) => {
        console.log('New appointment:', payload.new);
        prependAppointmentRow(payload.new);
        incrementStatCard('appointments');
        showNotification('New appointment from ' + (payload.new.name || 'Unknown'));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'contact_messages'
      }, (payload) => {
        console.log('New contact:', payload.new);
        prependContactRow(payload.new);
        incrementStatCard('contacts');
        showNotification('New message from ' + (payload.new.name || 'Unknown'));
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
  }

  // ── Render Tables ──────────────────────────────────────────────────────────

  function renderAppointmentsTable(appointments) {
    const tbody = document.querySelector('#appointments-content tbody');
    if (!tbody) return;

    tbody.innerHTML = appointments.map(a => `
      <tr data-id="${a.id}">
        <td title="${a.id}">#${a.id.slice(0, 6)}</td>
        <td>${escapeHtml(a.name)}</td>
        <td>${a.date || '—'}</td>
        <td>${a.time || '—'}</td>
        <td>${escapeHtml(a.hospital || '—')}</td>
        <td><span class="status ${a.status || 'pending'}">${capitalize(a.status || 'pending')}</span></td>
        <td>
          <button class="btn-action approve" onclick="adminActions.approve('${a.id}', this)"><i class="fas fa-check"></i></button>
          <button class="btn-action reject" onclick="adminActions.reject('${a.id}', this)"><i class="fas fa-times"></i></button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;color:#999;">No appointments yet</td></tr>';
  }

  function renderContactsTable(contacts) {
    const tbody = document.querySelector('#contacts-content tbody');
    if (!tbody) return;

    tbody.innerHTML = contacts.map(c => `
      <tr data-id="${c.id}">
        <td title="${c.id}">#${c.id.slice(0, 6)}</td>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.subject || c.type || 'General')}</td>
        <td>${formatDate(c.created_at)}</td>
        <td><span class="status new">${capitalize(c.type || 'general')}</span></td>
        <td>
          <button class="btn-action view" onclick="adminActions.viewContact('${c.id}', this)"><i class="fas fa-eye"></i></button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;color:#999;">No contact messages yet</td></tr>';
  }

  function prependAppointmentRow(a) {
    const tbody = document.querySelector('#appointments-content tbody');
    if (!tbody) return;

    // Remove "no data" placeholder if present
    const placeholder = tbody.querySelector('td[colspan]');
    if (placeholder) placeholder.closest('tr').remove();

    const tr = document.createElement('tr');
    tr.dataset.id = a.id;
    tr.innerHTML = `
      <td title="${a.id}">#${a.id.slice(0, 6)}</td>
      <td>${escapeHtml(a.name)}</td>
      <td>${a.date || '—'}</td>
      <td>${a.time || '—'}</td>
      <td>${escapeHtml(a.hospital || '—')}</td>
      <td><span class="status ${a.status || 'pending'}">${capitalize(a.status || 'pending')}</span></td>
      <td>
        <button class="btn-action approve" onclick="adminActions.approve('${a.id}', this)"><i class="fas fa-check"></i></button>
        <button class="btn-action reject" onclick="adminActions.reject('${a.id}', this)"><i class="fas fa-times"></i></button>
      </td>
    `;
    tr.style.animation = 'fadeIn 0.5s ease';
    tbody.prepend(tr);
  }

  function prependContactRow(c) {
    const tbody = document.querySelector('#contacts-content tbody');
    if (!tbody) return;

    const placeholder = tbody.querySelector('td[colspan]');
    if (placeholder) placeholder.closest('tr').remove();

    const tr = document.createElement('tr');
    tr.dataset.id = c.id;
    tr.innerHTML = `
      <td title="${c.id}">#${c.id.slice(0, 6)}</td>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.subject || c.type || 'General')}</td>
      <td>${formatDate(c.created_at)}</td>
      <td><span class="status new">${capitalize(c.type || 'general')}</span></td>
      <td>
        <button class="btn-action view" onclick="adminActions.viewContact('${c.id}', this)"><i class="fas fa-eye"></i></button>
      </td>
    `;
    tr.style.animation = 'fadeIn 0.5s ease';
    tbody.prepend(tr);
  }

  // ── Tab Switching ──────────────────────────────────────────────────────────

  function initTabSwitching() {
    const navLinks = document.querySelectorAll('.nav-links li[data-tab]');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        link.classList.add('active');
        const tabId = link.getAttribute('data-tab');
        const section = document.getElementById(`${tabId}-content`);
        if (section) section.classList.add('active');
      });
    });
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;

    const tableRows = activeSection.querySelectorAll('tbody tr');
    tableRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }

  // ── Stat Cards ─────────────────────────────────────────────────────────────

  function updateStatCard(type, count) {
    const cardMap = {
      appointments: 0,
      contacts: 1,
      community: 2,
      hospitals: 2,
      medicines: 3
    };
    const index = cardMap[type];
    if (index === undefined) return;

    const cards = document.querySelectorAll('.stats-cards .card .card-info p');
    if (cards[index]) cards[index].textContent = count;
  }

  function incrementStatCard(type) {
    const cardMap = { appointments: 0, contacts: 1 };
    const index = cardMap[type];
    if (index === undefined) return;

    const cards = document.querySelectorAll('.stats-cards .card .card-info p');
    if (cards[index]) {
      const current = parseInt(cards[index].textContent) || 0;
      cards[index].textContent = current + 1;
    }
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  function showNotification(message) {
    const badge = document.querySelector('.notifications .badge');
    if (badge) {
      const current = parseInt(badge.textContent) || 0;
      badge.textContent = current + 1;
    }

    // Brief visual flash on the notification bell
    const bell = document.querySelector('.notifications');
    if (bell) {
      bell.style.animation = 'none';
      void bell.offsetWidth;
      bell.style.animation = 'pulse 0.5s ease';
    }
  }

  // ── Admin Actions (exposed globally for onclick handlers) ──────────────────

  window.adminActions = {
    async approve(id, btn) {
      if (!confirm('Approve this appointment?')) return;
      const { error } = await sb
        .from('appointments')
        .update({ status: 'approved' })
        .eq('id', id);

      if (!error) {
        const row = btn.closest('tr');
        const statusEl = row.querySelector('.status');
        statusEl.className = 'status active';
        statusEl.textContent = 'Approved';
      }
    },

    async reject(id, btn) {
      if (!confirm('Reject this appointment?')) return;
      const { error } = await sb
        .from('appointments')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (!error) {
        const row = btn.closest('tr');
        const statusEl = row.querySelector('.status');
        statusEl.className = 'status rejected';
        statusEl.textContent = 'Rejected';
      }
    },

    async viewContact(id, btn) {
      const row = btn.closest('tr');
      const { data, error } = await sb
        .from('contact_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        alert('Could not load message details.');
        return;
      }

      alert(
        `From: ${data.name} (${data.email})\n` +
        `Type: ${data.type || 'general'}\n` +
        `Subject: ${data.subject || '—'}\n\n` +
        `Message:\n${data.message}`
      );
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  function formatDate(isoStr) {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return isoStr;
    }
  }

  function timeAgo(isoStr) {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function getActivityIcon(type) {
    const icons = {
      appointment: 'calendar-check',
      registration: 'user-plus',
      ngo: 'hands-helping',
      campaign: 'flag',
      contact: 'envelope',
      general: 'envelope',
      hospital: 'hospital'
    };
    return icons[type] || 'info-circle';
  }
})();