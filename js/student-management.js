let students = [];

document.addEventListener('DOMContentLoaded', () => {
  Utils.requireAdmin(async (user, userData) => {
    document.getElementById('adminName').textContent = userData.fullName;
    Utils.setActiveNav('manage-students');
    await loadStudents();
  });

  document.getElementById('searchInput').addEventListener('input', filterStudents);
});

async function loadStudents() {
  Utils.showLoading(true);

  try {
    const snap = await db.collection('users').where('role', '==', 'student').get();
    students = [];
    snap.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });

    students.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    renderStudentsTable(students);
  } catch (error) {
    console.error(error);
    Utils.showToast('Failed to load students', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

function filterStudents() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();

  if (!query) {
    renderStudentsTable(students);
    return;
  }

  const filtered = students.filter((s) =>
    (s.fullName || '').toLowerCase().includes(query) ||
    (s.email || '').toLowerCase().includes(query) ||
    (s.course || '').toLowerCase().includes(query) ||
    (s.college || '').toLowerCase().includes(query)
  );

  renderStudentsTable(filtered);
}

function renderStudentsTable(list) {
  const tbody = document.getElementById('studentsTableBody');

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center py-4">No students found.</td></tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((s, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${Utils.escapeHtml(s.fullName)}</td>
      <td>${Utils.escapeHtml(s.email)}</td>
      <td>${Utils.escapeHtml(s.course)}</td>
      <td>${Utils.escapeHtml(s.college)}</td>
      <td>
        <span class="badge ${s.status === 'active' ? 'badge-active' : 'badge-inactive'}">
          ${s.status || 'active'}
        </span>
      </td>
      <td>${Utils.formatDate(s.createdAt)}</td>
    </tr>
  `).join('');
}
