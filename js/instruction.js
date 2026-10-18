document.addEventListener('DOMContentLoaded', () => {

    const params = new URLSearchParams(window.location.search);
    const examId = params.get('examId');

    if (!examId) {
        alert('Exam not found');
        return;
    }

    document.getElementById('startExamBtn').onclick = () => {
        window.location.href = `exam.html?examId=${examId}`;
    };

});