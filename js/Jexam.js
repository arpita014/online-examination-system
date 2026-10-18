let examId = null;
let questions = [];
let currentIndex = 0;
let answers = {};
let currentUser = null;
let timerInterval = null;
let timeLeft = 0;

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    examId = params.get("examId");

    console.log("EXAM ID:", examId);

    if (!examId) {
        alert("Exam ID not found");
        return;
    }

    auth.onAuthStateChanged(async (user) => {

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        currentUser = user;

        await loadExam();
    });

    // Next button
    const nextBtn = document.getElementById("nextBtn");

    if (nextBtn) {
        nextBtn.addEventListener("click", nextQuestion);
    }

    // Previous button
    const prevBtn = document.getElementById("prevBtn");

    if (prevBtn) {
        prevBtn.addEventListener("click", prevQuestion);
    }

});


// ===============================
// LOAD EXAM
// ===============================

async function loadExam() {

    try {

        const examDoc = await db
            .collection("exams")
            .doc(examId)
            .get();

        if (!examDoc.exists) {
            alert("Exam not found");
            return;
        }

        const examData = examDoc.data();

        console.log("EXAM DATA:", examData);

        // Exam title
        const titleElement = document.getElementById("examTitle");

        if (titleElement) {
            titleElement.textContent = examData.title || "Online Exam";
        }

        // Timer
        timeLeft = (examData.duration || 30) * 60;

        startTimer();


        // ===============================
        // GET QUESTIONS FROM NESTED COLLECTION
        // ===============================

        const questionsSnap = await db
            .collection("exams")
            .doc(examId)
            .collection("questions")
            .get();

        console.log("TOTAL QUESTIONS:", questionsSnap.size);

        questions = [];

        questionsSnap.forEach((doc) => {

            const data = doc.data();

            console.log("QUESTION:", doc.id, data);

            questions.push({
                id: doc.id,
                ...data
            });

        });


        if (questions.length === 0) {

            alert("No questions found for this exam");

            return;
        }


        // Sort question1, question2, question3...
        questions.sort((a, b) => {

            const numA = parseInt(
                a.id.replace("question", "")
            ) || 0;

            const numB = parseInt(
                b.id.replace("question", "")
            ) || 0;

            return numA - numB;
        });


        console.log("QUESTIONS READY:", questions);


        // Build palette
        buildQuestionPalette();


        // Display first question
        renderQuestion(0);

    }

    catch (error) {

        console.error("FIREBASE ERROR:", error);

        alert("Failed to load questions: " + error.message);

    }

}


// ===============================
// RENDER QUESTION
// ===============================

function renderQuestion(index) {

    if (!questions[index]) {
        return;
    }

    currentIndex = index;

    const q = questions[index];


    // Question number

    const questionNumber =
        document.getElementById("questionNumber");

    if (questionNumber) {

        questionNumber.textContent =
            `Question ${index + 1} of ${questions.length}`;

    }


    // Question text

    const questionText =
        document.getElementById("questionText");

    if (questionText) {

        questionText.textContent =
            q.question || "Question not available";

    }


    // Options

    const optionsList =
        document.getElementById("optionsList");

    if (!optionsList) {

        console.error(
            "ERROR: optionsList not found in HTML"
        );

        return;
    }


    optionsList.innerHTML = `

        <li class="option-item">
            <label>
                <input
                    type="radio"
                    name="answer"
                    value="A"
                    ${answers[q.id] === "A" ? "checked" : ""}
                >
                <span>
                    A. ${q.optionA || ""}
                </span>
            </label>
        </li>


        <li class="option-item">
            <label>
                <input
                    type="radio"
                    name="answer"
                    value="B"
                    ${answers[q.id] === "B" ? "checked" : ""}
                >
                <span>
                    B. ${q.optionB || ""}
                </span>
            </label>
        </li>


        <li class="option-item">
            <label>
                <input
                    type="radio"
                    name="answer"
                    value="C"
                    ${answers[q.id] === "C" ? "checked" : ""}
                >
                <span>
                    C. ${q.optionC || ""}
                </span>
            </label>
        </li>


        <li class="option-item">
            <label>
                <input
                    type="radio"
                    name="answer"
                    value="D"
                    ${answers[q.id] === "D" ? "checked" : ""}
                >
                <span>
                    D. ${q.optionD || ""}
                </span>
            </label>
        </li>

    `;


    // Add change event

    const radios =
        document.querySelectorAll(
            'input[name="answer"]'
        );

    radios.forEach((radio) => {

        radio.addEventListener("change", function () {

            answers[q.id] = this.value;

            updateProgress();
            updatePalette();

        });

    });


    // Previous button

    const prevBtn =
        document.getElementById("prevBtn");

    if (prevBtn) {

        prevBtn.disabled =
            index === 0;

    }


    // Next button

    const nextBtn =
        document.getElementById("nextBtn");

    if (nextBtn) {

        nextBtn.textContent =
            index === questions.length - 1
                ? "Submit"
                : "Next";

    }


    updateProgress();
    updatePalette();

}


// ===============================
// NEXT QUESTION
// ===============================

function nextQuestion() {

    if (currentIndex < questions.length - 1) {

        renderQuestion(currentIndex + 1);

    }

    else {

        submitExam();

    }

}


// ===============================
// PREVIOUS QUESTION
// ===============================

function prevQuestion() {

    if (currentIndex > 0) {

        renderQuestion(currentIndex - 1);

    }

}


// ===============================
// QUESTION PALETTE
// ===============================

function buildQuestionPalette() {

    const palette =
        document.getElementById("questionPalette");

    if (!palette) {
        return;
    }

    palette.innerHTML = questions.map((q, index) => {

        return `
            <button
                type="button"
                class="palette-btn"
                onclick="goToQuestion(${index})"
            >
                ${index + 1}
            </button>
        `;

    }).join("");

}


// ===============================
// GO TO QUESTION
// ===============================

function goToQuestion(index) {

    renderQuestion(index);

}


// ===============================
// UPDATE PROGRESS
// ===============================

function updateProgress() {

    const answered =
        Object.keys(answers).length;

    const total =
        questions.length;

    const percentage =
        total > 0
            ? Math.round((answered / total) * 100)
            : 0;


    const progressBar =
        document.getElementById("progressBar");

    if (progressBar) {

        progressBar.style.width =
            percentage + "%";

    }


    const progressText =
        document.getElementById("progressText");

    if (progressText) {

        progressText.textContent =
            `${answered}/${total} answered`;

    }

}


// ===============================
// UPDATE PALETTE
// ===============================

function updatePalette() {

    const buttons =
        document.querySelectorAll(".palette-btn");

    buttons.forEach((btn, index) => {

        btn.classList.remove(
            "active",
            "answered"
        );


        if (index === currentIndex) {

            btn.classList.add("active");

        }


        const question =
            questions[index];

        if (
            question &&
            answers[question.id] !== undefined
        ) {

            btn.classList.add("answered");

        }

    });

}


// ===============================
// TIMER
// ===============================

function startTimer() {

    updateTimer();

    timerInterval =
        setInterval(() => {

            timeLeft--;

            updateTimer();


            if (timeLeft <= 0) {

                clearInterval(timerInterval);

                alert(
                    "Time is over! Exam will be submitted."
                );

                submitExam();

            }

        }, 1000);

}


function updateTimer() {

    const timer =
        document.getElementById("timer");

    if (!timer) {
        return;
    }

    const minutes =
        Math.floor(timeLeft / 60);

    const seconds =
        timeLeft % 60;


    timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


// ===============================
// SUBMIT EXAM
// ===============================

async function submitExam() {

    clearInterval(timerInterval);


    let score = 0;
    let attempted = 0;


    questions.forEach((q) => {

        const selected =
            answers[q.id];


        if (selected !== undefined) {

            attempted++;


            if (
                selected === q.correctAnswer
            ) {

                score += q.marks || 1;

            }

        }

    });


    const totalMarks =
        questions.reduce(
            (total, q) =>
                total + (q.marks || 1),
            0
        );


    const percentage =
        totalMarks > 0
            ? Math.round(
                (score / totalMarks) * 100
              )
            : 0;


    try {

        await db
            .collection("results")
            .add({

                userId: currentUser.uid,

                examId: examId,

                examTitle:
                    document.getElementById(
                        "examTitle"
                    ).textContent,

                score: score,

                totalMarks: totalMarks,

                percentage: percentage,

                attempted: attempted,

                totalQuestions:
                    questions.length,

                submittedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        await db
            .collection("examAttempts")
            .add({

                userId: currentUser.uid,

                examId: examId,

                score: score,

                percentage: percentage,

                attempted: attempted,

                submittedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        alert(
            `Exam submitted successfully!\n\nScore: ${score}/${totalMarks}\nPercentage: ${percentage}%`
        );


        window.location.href =
            "dashboard.html";

    }

    catch (error) {

        console.error(
            "SUBMIT ERROR:",
            error
        );

        alert(
            "Failed to submit exam: " +
            error.message
        );

    }

}