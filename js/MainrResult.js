document.addEventListener('DOMContentLoaded', async () => {

    const params = new URLSearchParams(window.location.search);

    const resultId = params.get('resultId');

    if (!resultId) {
        alert('Result not found');
        window.location.href = 'dashboard.html';
        return;
    }

    try {

        const resultDoc = await db
            .collection('results')
            .doc(resultId)
            .get();

        if (!resultDoc.exists) {
            alert('Result not found');
            window.location.href = 'dashboard.html';
            return;
        }

        const result = resultDoc.data();

        document.getElementById('examTitle').textContent =
            result.examTitle || 'Exam';

        document.getElementById('score').textContent =
            result.score || 0;

        document.getElementById('totalMarks').textContent =
            result.totalMarks || 0;

        document.getElementById('percentage').textContent =
            (result.percentage || 0) + '%';

        document.getElementById('correctAnswers').textContent =
            result.correctAnswers || 0;

        document.getElementById('wrongAnswers').textContent =
            result.wrongAnswers || 0;

        document.getElementById('totalQuestions').textContent =
            result.totalQuestions || 0;

    } catch (error) {

        console.error(error);

        alert('Failed to load result');

        window.location.href = 'dashboard.html';
    }

});