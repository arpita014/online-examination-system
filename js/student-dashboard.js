let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  Utils.requireStudent(async (user, userData) => {
    currentUser = userData;
    Utils.setActiveNav('dashboard');

    document.getElementById('userName').textContent = userData.fullName;
    document.getElementById('userCourse').textContent = userData.course;
    document.getElementById('welcomeName').textContent = userData.fullName;
    document.getElementById('userAvatar').textContent = userData.fullName.charAt(0).toUpperCase();

    await loadDashboardData();
  });
});

async function loadDashboardData() {
    Utils.showLoading(true);

    try {

        const examsSnap = await db
            .collection('exams')
            .where('status', '==', 'active')
            .get();

        const resultsSnap = await db
            .collection('results')
            .where('userId', '==', firebase.auth().currentUser.uid)
            .get();

        const attemptsSnap = await db
            .collection('examAttempts')
            .where('userId', '==', currentUser.uid)
            .get();


        // SHOW ALL ACTIVE EXAMS
        const availableExams = [];

        examsSnap.forEach((doc) => {

            const exam = {
                id: doc.id,
                ...doc.data()
            };

            availableExams.push(exam);

        });


        console.log("TOTAL EXAMS:", examsSnap.size);
        console.log("ALL EXAMS:", availableExams);
        console.log("AVAILABLE EXAMS:", availableExams);


        // Statistics
        document.getElementById('availableExamsCount').textContent =
            availableExams.length;

        document.getElementById('completedExamsCount').textContent =
            resultsSnap.size;

        document.getElementById('totalAttemptsCount').textContent =
            attemptsSnap.size;


        // Average score
        let avgScore = 0;

        if (resultsSnap.size > 0) {

            let total = 0;

            resultsSnap.forEach((doc) => {

                total += doc.data().percentage || 0;

            });

            avgScore = Math.round(total / resultsSnap.size);
        }

        document.getElementById('avgScoreCount').textContent =
            avgScore + '%';


        // Display exams
        renderAvailableExams(availableExams);

        renderRecentResults(resultsSnap);


    } catch (error) {

        console.error(error);

        Utils.showToast(
            'Failed to load dashboard data',
            'error'
        );

    } finally {

        Utils.showLoading(false);
    }
}

function renderAvailableExams(exams) {
  const container = document.getElementById('availableExamsList');

  if (exams.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <h5>No Exams Available</h5>
        <p>Check back later for new examinations.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = exams.map((exam) => `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card exam-card h-100">
        <div class="card-header">${Utils.escapeHtml(exam.title)}</div>
        <div class="card-body">
          <p class="text-muted">${Utils.escapeHtml(exam.description || 'No description')}</p>
          <div class="exam-meta">
            <span><i class="fas fa-clock"></i> ${Utils.formatDuration(exam.duration)}</span>
            <span><i class="fas fa-question-circle"></i> ${exam.totalQuestions || 0} Questions</span>
            <span><i class="fas fa-star"></i> ${exam.totalMarks || 0} Marks</span>
          </div>
        </div>
        <div class="card-footer bg-white border-0 pb-3">
          <a href="instructions.html?examId=${exam.id}" class="btn btn-primary w-100">
            <i class="fas fa-play me-2"></i>Start Exam
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

function renderRecentResults(resultsSnap) {
  const container = document.getElementById('recentResultsList');
  const results = [];

  resultsSnap.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() });
  });

  results.sort((a, b) => {
    const aTime = a.submittedAt?.toMillis?.() || 0;
    const bTime = b.submittedAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  const recent = results.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state py-4">
        <i class="fas fa-history"></i>
        <p>No exam results yet</p>
      </div>
    `;
    return;
  }

  container.innerHTML = recent.map((result) => `
    <div class="activity-item">
      <div class="activity-icon ${result.percentage >= 50 ? 'success' : 'warning'}">
        <i class="fas fa-${result.percentage >= 50 ? 'check' : 'times'}"></i>
      </div>
      <div class="flex-grow-1">
        <strong>${Utils.escapeHtml(result.examTitle || 'Exam')}</strong>
        <div class="text-muted small">${Utils.formatDate(result.submittedAt)}</div>
      </div>
      <span class="badge ${result.percentage >= 50 ? 'bg-success' : 'bg-warning'}">${result.percentage}%</span>
    </div>
  `).join('');
}
