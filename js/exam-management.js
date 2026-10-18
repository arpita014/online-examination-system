let exams = [];
let editExamId = null;

document.addEventListener('DOMContentLoaded', () => {
  Utils.requireAdmin(async (user, userData) => {
    document.getElementById('adminName').textContent = userData.fullName;
    Utils.setActiveNav('manage-exams');
    await loadExams();
  });

  document.getElementById('examForm').addEventListener('submit', handleExamSubmit);
  document.getElementById('examModal').addEventListener('hidden.bs.modal', resetExamForm);
});

async function loadExams() {
  Utils.showLoading(true);

  try {
    const snap = await db.collection('exams').orderBy('createdAt', 'desc').get();
    exams = [];
    snap.forEach((doc) => {
      exams.push({ id: doc.id, ...doc.data() });
    });
    renderExamsTable();
  } catch (error) {
    console.error(error);
    Utils.showToast('Failed to load exams', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

function renderExamsTable() {
  const tbody = document.getElementById('examsTableBody');

  if (exams.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center py-4">No exams found. Create your first exam.</td></tr>
    `;
    return;
  }

  tbody.innerHTML = exams.map((exam) => `
    <tr>
      <td>${Utils.escapeHtml(exam.title)}</td>
      <td>${Utils.formatDuration(exam.duration)}</td>
      <td>${exam.totalQuestions || 0}</td>
      <td>${exam.totalMarks || 0}</td>
      <td>
        <span class="badge ${exam.isActive ? 'badge-active' : 'badge-inactive'}">
          ${exam.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>${Utils.formatDate(exam.createdAt)}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="editExam('${exam.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline-${exam.isActive ? 'warning' : 'success'}"
            onclick="toggleExamStatus('${exam.id}', ${!exam.isActive})" title="${exam.isActive ? 'Deactivate' : 'Activate'}">
            <i class="fas fa-${exam.isActive ? 'pause' : 'play'}"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteExam('${exam.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCreateModal() {
  editExamId = null;
  document.getElementById('examModalTitle').textContent = 'Create Exam';
  document.getElementById('examForm').reset();
  new bootstrap.Modal(document.getElementById('examModal')).show();
}

function editExam(id) {
  const exam = exams.find((e) => e.id === id);
  if (!exam) return;

  editExamId = id;
  document.getElementById('examModalTitle').textContent = 'Edit Exam';
  document.getElementById('examTitle').value = exam.title;
  document.getElementById('examDescription').value = exam.description || '';
  document.getElementById('examDuration').value = exam.duration;
  document.getElementById('examActive').checked = exam.isActive;
  new bootstrap.Modal(document.getElementById('examModal')).show();
}

async function handleExamSubmit(e) {
  e.preventDefault();
  Utils.showLoading(true);

  const title = document.getElementById('examTitle').value.trim();
  const description = document.getElementById('examDescription').value.trim();
  const duration = parseInt(document.getElementById('examDuration').value);
  const isActive = document.getElementById('examActive').checked;

  try {
    if (editExamId) {
      await db.collection('exams').doc(editExamId).update({
        title,
        description,
        duration,
        isActive,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Utils.showToast('Exam updated successfully', 'success');
    } else {
      await db.collection('exams').add({
        title,
        description,
        duration,
        isActive,
        totalQuestions: 0,
        totalMarks: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Utils.showToast('Exam created successfully', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('examModal')).hide();
    await loadExams();
  } catch (error) {
    console.error(error);
    Utils.showToast('Failed to save exam', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

async function toggleExamStatus(id, newStatus) {
  Utils.showLoading(true);
  try {
    await db.collection('exams').doc(id).update({
      isActive: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    Utils.showToast(`Exam ${newStatus ? 'activated' : 'deactivated'}`, 'success');
    await loadExams();
  } catch (error) {
    Utils.showToast('Failed to update status', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

async function deleteExam(id) {
  if (!confirm('Are you sure you want to delete this exam? All related questions will remain.')) return;

  Utils.showLoading(true);
  try {
    await db.collection('exams').doc(id).delete();
    Utils.showToast('Exam deleted', 'success');
    await loadExams();
  } catch (error) {
    Utils.showToast('Failed to delete exam', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

function resetExamForm() {
  editExamId = null;
  document.getElementById('examForm').reset();
}
