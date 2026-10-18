const Utils = {
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const id = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning text-dark' : 'bg-info';

    const toastHtml = `
      <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(id);
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  },

  showLoading(show = true) {
    const loader = document.getElementById('globalLoader');
    if (loader) {
      loader.classList.toggle('d-none', !show);
    }
  },

  formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatDuration(minutes) {
    if (!minutes) return '0 min';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  },

  formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  redirectByRole(role) {
    if (role === 'admin') {
      window.location.href = 'admin/dashboard.html';
    } else {
      window.location.href = 'student/dashboard.html';
    }
  },

  requireAuth(callback) {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        const path = window.location.pathname;
        if (path.includes('/admin/')) {
          window.location.href = '../login.html';
        } else if (path.includes('/student/')) {
          window.location.href = '../login.html';
        }
        return;
      }

      try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists) {
          await auth.signOut();
          window.location.href = '../login.html';
          return;
        }
        const userData = { uid: user.uid, email: user.email, ...doc.data() };
        if (callback) callback(user, userData);
      } catch (error) {
        console.error(error);
        Utils.showToast('Authentication error', 'error');
      }
    });
  },

  requireAdmin(callback) {
    Utils.requireAuth((user, userData) => {
      if (userData.role !== 'admin') {
        Utils.showToast('Access denied. Admin only.', 'error');
        setTimeout(() => {
          window.location.href = '../student/dashboard.html';
        }, 1500);
        return;
      }
      if (callback) callback(user, userData);
    });
  },

  requireStudent(callback) {
    Utils.requireAuth((user, userData) => {
      if (userData.role === 'admin') {
        window.location.href = '../admin/dashboard.html';
        return;
      }
      if (callback) callback(user, userData);
    });
  },

  setActiveNav(pageId) {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach((link) => {
      link.classList.remove('active');
      if (link.dataset.page === pageId) {
        link.classList.add('active');
      }
    });
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  calculatePercentage(score, total) {
    if (!total || total === 0) return 0;
    return Math.round((score / total) * 100);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
