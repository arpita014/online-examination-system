let questions = [];
let editQuestionId = null;
let examsList = [];

document.addEventListener('DOMContentLoaded', () => {
  Utils.requireAdmin(async (user, userData) => {
    document.getElementById('adminName').textContent = userData.fullName;
    Utils.setActiveNav('manage-questions');
    await loadExamsDropdown();
    await loadQuestions();
  });

  document.getElementById('questionForm').addEventListener('submit', handleQuestionSubmit);
  document.getElementById('examFilter').addEventListener('change', loadQuestions);
  document.getElementById('questionModal').addEventListener('hidden.bs.modal', resetQuestionForm);
});

async function loadExamsDropdown() {
  const snap = await db.collection('exams').orderBy('title').get();
  examsList = [];
  snap.forEach((doc) => {
    examsList.push({ id: doc.id, ...doc.data() });
  });

  const selects = ['questionExamId', 'examFilter'];
  selects.forEach((selectId) => {
    const select = document.getElementById(selectId);
    const defaultOption = selectId === 'examFilter'
      ? '<option value="">All Exams</option>'
      : '<option value="">Select Exam</option>';

    select.innerHTML = defaultOption + examsList.map((e) =>
      `<option value="${e.id}">${Utils.escapeHtml(e.title)}</option>`
    ).join('');
  });
}

async function loadQuestions() {
  Utils.showLoading(true);

  try {
    const examFilter = document.getElementById('examFilter').value;
    let query = db.collection('questions');

    if (examFilter) {
      query = query.where('examId', '==', examFilter);
    }

    const snap = await query.get();
    questions = [];
    snap.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });

    renderQuestionsTable();
  } catch (error) {
    console.error(error);
    Utils.showToast('Failed to load questions', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

function renderQuestionsTable() {
  const tbody = document.getElementById('questionsTableBody');

  if (questions.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="text-center py-4">No questions found.</td></tr>
    `;
    return;
  }

  tbody.innerHTML = questions.map((q, idx) => {
    const exam = examsList.find((e) => e.id === q.examId);
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${Utils.escapeHtml(q.questionText.substring(0, 80))}${q.questionText.length > 80 ? '...' : ''}</td>
        <td>${Utils.escapeHtml(exam ? exam.title : 'Unknown')}</td>
        <td>${q.marks || 1}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="editQuestion('${q.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="deleteQuestion('${q.id}', '${q.examId}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateModal() {
  editQuestionId = null;
  document.getElementById('questionModalTitle').textContent = 'Add Question';
  document.getElementById('questionForm').reset();
  new bootstrap.Modal(document.getElementById('questionModal')).show();
}

function editQuestion(id) {
  const q = questions.find((item) => item.id === id);
  if (!q) return;

  editQuestionId = id;
  document.getElementById('questionModalTitle').textContent = 'Edit Question';
  document.getElementById('questionExamId').value = q.examId;
  document.getElementById('questionText').value = q.questionText;
  document.getElementById('optionA').value = q.options[0] || '';
  document.getElementById('optionB').value = q.options[1] || '';
  document.getElementById('optionC').value = q.options[2] || '';
  document.getElementById('optionD').value = q.options[3] || '';
  document.getElementById('correctAnswer').value = q.correctAnswer;
  document.getElementById('questionMarks').value = q.marks || 1;
  new bootstrap.Modal(document.getElementById('questionModal')).show();
}

async function handleQuestionSubmit(e) {
  e.preventDefault();
  Utils.showLoading(true);

  const examId = document.getElementById('questionExamId').value;
  const questionText = document.getElementById('questionText').value.trim();
  const options = [
    document.getElementById('optionA').value.trim(),
    document.getElementById('optionB').value.trim(),
    document.getElementById('optionC').value.trim(),
    document.getElementById('optionD').value.trim()
  ];
  const correctAnswer = parseInt(document.getElementById('correctAnswer').value);
  const marks = parseInt(document.getElementById('questionMarks').value) || 1;

  if (!examId || !questionText || options.some((o) => !o)) {
    Utils.showToast('All fields are required', 'error');
    Utils.showLoading(false);
    return;
  }

  const questionData = {
    examId,
    questionText,
    options,
    correctAnswer,
    marks,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (editQuestionId) {
      await db.collection('questions').doc(editQuestionId).update(questionData);
      Utils.showToast('Question updated', 'success');
    } else {
      questionData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('questions').add(questionData);
      Utils.showToast('Question added', 'success');
    }

    await updateExamStats(examId);
    bootstrap.Modal.getInstance(document.getElementById('questionModal')).hide();
    await loadQuestions();
  } catch (error) {
    console.error(error);
    Utils.showToast('Failed to save question', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

async function updateExamStats(examId) {
  const snap = await db.collection('questions').where('examId', '==', examId).get();
  let totalMarks = 0;
  snap.forEach((doc) => {
    totalMarks += doc.data().marks || 1;
  });

  await db.collection('exams').doc(examId).update({
    totalQuestions: snap.size,
    totalMarks
  });
}

async function deleteQuestion(id, examId) {
  if (!confirm('Delete this question?')) return;

  Utils.showLoading(true);
  try {
    await db.collection('questions').doc(id).delete();
    await updateExamStats(examId);
    Utils.showToast('Question deleted', 'success');
    await loadQuestions();
  } catch (error) {
    Utils.showToast('Failed to delete question', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

function resetQuestionForm() {
  editQuestionId = null;
  document.getElementById('questionForm').reset();
}
