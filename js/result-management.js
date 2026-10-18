let results = [];

document.addEventListener('DOMContentLoaded', () => {
  Utils.requireAdmin(async (user, userData) => {
    document.getElementById('adminName').textContent = userData.fullName;
    Utils.setActiveNav('manage-results');
    await loadResults();
  });

  document.getElementById('resultFilter').addEventListener('change', filterResults);
  document.getElementById('resultSearch').addEventListener('input', filterResults);
});

async function loadResults() {
  Utils.showLoading(true);

  try {
    const snap = await db.collection('results').get();
    results = [];
    snap.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });

    results.sort((a, b) => {
      const aTime = a.submittedAt?.toMillis?.() || 0;
      const bTime = b.submittedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    populateExamFilter();
    renderResultsTable(results);
    renderAnalyticsCharts(results);
  } catch (error) {
    console.error(error);
    Utils.showToast('Failed to load results', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

function populateExamFilter() {
  const exams = [...new Set(results.map((r) => r.examTitle))].filter(Boolean);
  const select = document.getElementById('resultFilter');
  select.innerHTML = '<option value="">All Exams</option>' +
    exams.map((e) => `<option value="${Utils.escapeHtml(e)}">${Utils.escapeHtml(e)}</option>`).join('');
}

function filterResults() {
  const examFilter = document.getElementById('resultFilter').value;
  const search = document.getElementById('resultSearch').value.toLowerCase().trim();

  let filtered = [...results];

  if (examFilter) {
    filtered = filtered.filter((r) => r.examTitle === examFilter);
  }

  if (search) {
    filtered = filtered.filter((r) =>
      (r.studentName || '').toLowerCase().includes(search) ||
      (r.examTitle || '').toLowerCase().includes(search)
    );
  }

  renderResultsTable(filtered);
}

function renderResultsTable(list) {
  const tbody = document.getElementById('resultsTableBody');

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center py-4">No results found.</td></tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${Utils.escapeHtml(r.studentName || 'Unknown')}</td>
      <td>${Utils.escapeHtml(r.examTitle)}</td>
      <td>${r.score}/${r.totalMarks}</td>
      <td>
        <span class="badge ${r.percentage >= 50 ? 'bg-success' : 'bg-danger'}">${r.percentage}%</span>
      </td>
      <td>${r.correctAnswers}/${r.totalQuestions}</td>
      <td>${Utils.formatDate(r.submittedAt)}</td>
    </tr>
  `).join('');
}

function renderAnalyticsCharts(list) {
  renderPerformanceChart(list);
  renderPassFailChart(list);
}

function renderPerformanceChart(list) {
  const ctx = document.getElementById('performanceChart');
  if (!ctx) return;

  const examScores = {};
  list.forEach((r) => {
    if (!examScores[r.examTitle]) {
      examScores[r.examTitle] = { total: 0, count: 0 };
    }
    examScores[r.examTitle].total += r.percentage;
    examScores[r.examTitle].count++;
  });

  const labels = Object.keys(examScores).slice(0, 8);
  const data = labels.map((l) => Math.round(examScores[l].total / examScores[l].count));

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Average Score %',
        data,
        backgroundColor: '#4361ee',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

function renderPassFailChart(list) {
  const ctx = document.getElementById('passFailChart');
  if (!ctx) return;

  let pass = 0;
  let fail = 0;
  list.forEach((r) => {
    if (r.percentage >= 50) pass++;
    else fail++;
  });

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Pass (≥50%)', 'Fail (<50%)'],
      datasets: [{
        data: [pass, fail],
        backgroundColor: ['#06d6a0', '#ef476f']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}
