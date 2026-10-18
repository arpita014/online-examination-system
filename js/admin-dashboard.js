let adminUser = null;

document.addEventListener('DOMContentLoaded', () => {
  Utils.requireAdmin(async (user, userData) => {
    adminUser = userData;
    Utils.setActiveNav('dashboard');

    document.getElementById('adminName').textContent = userData.fullName;
    document.getElementById('adminAvatar').textContent = userData.fullName.charAt(0).toUpperCase();

    await loadAdminDashboard();
  });
});

async function loadAdminDashboard() {
  Utils.showLoading(true);

  try {
    const [studentsSnap, examsSnap, questionsSnap, resultsSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('exams').get(),
      db.collection('questions').get(),
      db.collection('results').get()
    ]);

    document.getElementById('totalStudents').textContent = studentsSnap.size;
    document.getElementById('totalExams').textContent = examsSnap.size;
    document.getElementById('totalQuestions').textContent = questionsSnap.size;
    document.getElementById('totalAttempts').textContent = resultsSnap.size;

    let avgScore = 0;
    if (resultsSnap.size > 0) {
      let total = 0;
      resultsSnap.forEach((doc) => { total += doc.data().percentage || 0; });
      avgScore = Math.round(total / resultsSnap.size);
    }
    document.getElementById('avgScore').textContent = avgScore + '%';

    renderScoreChart(resultsSnap);
    renderExamChart(examsSnap, resultsSnap);
    renderRecentActivity(resultsSnap);
  } catch (error) {
    console.error(error);
    Utils.showToast('Failed to load dashboard', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

function renderScoreChart(resultsSnap) {
  const ctx = document.getElementById('scoreDistributionChart');
  if (!ctx) return;

  const ranges = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };

  resultsSnap.forEach((doc) => {
    const pct = doc.data().percentage || 0;
    if (pct <= 25) ranges['0-25']++;
    else if (pct <= 50) ranges['26-50']++;
    else if (pct <= 75) ranges['51-75']++;
    else ranges['76-100']++;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(ranges),
      datasets: [{
        label: 'Students',
        data: Object.values(ranges),
        backgroundColor: ['#ef476f', '#ffd166', '#4cc9f0', '#06d6a0'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderExamChart(examsSnap, resultsSnap) {
  const ctx = document.getElementById('examAttemptsChart');
  if (!ctx) return;

  const examCounts = {};
  examsSnap.forEach((doc) => {
    examCounts[doc.data().title] = 0;
  });

  resultsSnap.forEach((doc) => {
    const title = doc.data().examTitle;
    if (title && examCounts[title] !== undefined) {
      examCounts[title]++;
    }
  });

  const labels = Object.keys(examCounts).slice(0, 6);
  const data = labels.map((l) => examCounts[l]);

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#4361ee', '#7209b7', '#06d6a0', '#ffd166', '#ef476f', '#4cc9f0']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderRecentActivity(resultsSnap) {
  const container = document.getElementById('recentActivityList');
  const results = [];

  resultsSnap.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() });
  });

  results.sort((a, b) => {
    const aTime = a.submittedAt?.toMillis?.() || 0;
    const bTime = b.submittedAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  const recent = results.slice(0, 8);

  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state py-4"><p>No activity yet</p></div>';
    return;
  }

  container.innerHTML = recent.map((r) => `
    <div class="activity-item">
      <div class="activity-icon primary"><i class="fas fa-user-graduate"></i></div>
      <div class="flex-grow-1">
        <strong>${Utils.escapeHtml(r.studentName || 'Student')}</strong>
        <div class="text-muted small">Completed ${Utils.escapeHtml(r.examTitle || 'Exam')} - ${r.percentage}%</div>
      </div>
      <small class="text-muted">${Utils.formatDate(r.submittedAt)}</small>
    </div>
  `).join('');
}
