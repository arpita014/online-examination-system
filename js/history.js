let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  Utils.requireStudent(async (user, userData) => {
    currentUser = userData;
    Utils.setActiveNav('history');
    document.getElementById('userName').textContent = userData.fullName;
    document.getElementById('userAvatar').textContent = userData.fullName.charAt(0).toUpperCase();
    await loadHistory();
  });
});

async function loadHistory() {
  Utils.showLoading(true);

  try {
    const snap = await db.collection('results')
      .where('userId', '==', currentUser.uid)
      .get();

    const results = [];
    snap.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });

    results.sort((a, b) => {
      const aTime = a.submittedAt?.toMillis?.() || 0;
      const bTime = b.submittedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    renderHistoryTable(results);
    renderHistoryChart(results);
  } catch (error) {
    console.error(error);
    Utils.showToast('Failed to load history', 'error');
  } finally {
    Utils.showLoading(false);
  }
}

function renderHistoryTable(results) {
  const tbody = document.getElementById('historyTableBody');

  if (results.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5">
          <div class="empty-state">
            <i class="fas fa-history"></i>
            <p>No exam history found</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = results.map((r) => `
    <tr>
      <td>${Utils.escapeHtml(r.examTitle)}</td>
      <td>${r.score}/${r.totalMarks}</td>
      <td>
        <span class="badge ${r.percentage >= 50 ? 'bg-success' : 'bg-danger'}">${r.percentage}%</span>
      </td>
      <td><span class="text-success">${r.correctAnswers}</span> / <span class="text-danger">${r.wrongAnswers}</span></td>
      <td>${Utils.formatDate(r.submittedAt)}</td>
      <td>
        <a href="result.html?resultId=${r.id}" class="btn btn-sm btn-outline-primary">
          <i class="fas fa-eye"></i> View
        </a>
      </td>
    </tr>
  `).join('');
}

function renderHistoryChart(results) {
  const ctx = document.getElementById('historyChart');
  if (!ctx || results.length === 0) return;

  const recent = results.slice(0, 10).reverse();

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: recent.map((r) => {
        const title = r.examTitle || 'Exam';
        return title.length > 15 ? title.substring(0, 15) + '...' : title;
      }),
      datasets: [{
        label: 'Score %',
        data: recent.map((r) => r.percentage),
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}
