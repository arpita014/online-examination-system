// =====================================================
// ONLINE EXAMINATION SYSTEM
// SECURE EXAM VERSION - CORRECTED
// =====================================================

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let examId = null;
let currentUser = null;
let examData = null;

let questions = [];
let currentQuestionIndex = 0;

let answers = {};

let timeRemaining = 0;
let timerInterval = null;

let examStarted = false;
let examSubmitted = false;

let warningCount = 0;
const MAX_WARNINGS = 3;


// =====================================================
// GET EXAM ID
// =====================================================

const urlParams = new URLSearchParams(window.location.search);
examId = urlParams.get("examId");

console.log("=================================");
console.log("EXAM ID:", examId);
console.log("=================================");


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("===== SECURE EXAM PAGE LOADED =====");

    if (!examId) {
        alert("Exam ID is missing.");
        return;
    }

    initializeExam();
});


// =====================================================
// INITIALIZE EXAM
// =====================================================

function initializeExam() {

    firebase.auth().onAuthStateChanged(async function (user) {

        if (!user) {

            alert("Please login before starting the exam.");

            window.location.href = "login.html";

            return;
        }

        currentUser = user;

        console.log("LOGGED USER:", user.uid);
        console.log("USER EMAIL:", user.email);

        await loadExam();

    });
}


// =====================================================
// LOAD EXAM
// =====================================================

async function loadExam() {

    try {

        console.log("=================================");
        console.log("LOADING EXAM...");
        console.log("EXAM ID:", examId);
        console.log("=================================");

        const examRef = db
            .collection("exams")
            .doc(examId);

        const examSnap = await examRef.get();

        // -----------------------------------------
        // CHECK EXAM
        // -----------------------------------------

        if (!examSnap.exists) {

            console.error("EXAM NOT FOUND");

            alert("Exam not found.");

            return;
        }

        examData = examSnap.data();

        console.log("EXAM DATA:", examData);


        // -----------------------------------------
        // DISPLAY TITLE
        // -----------------------------------------

        const titleElement =
            document.getElementById("examTitle");

        if (titleElement) {

            titleElement.textContent =
                examData.title || "Online Examination";
        }


        // -----------------------------------------
        // LOAD QUESTIONS
        // -----------------------------------------

        console.log("Loading questions...");

        const questionSnap = await examRef
            .collection("questions")
            .get();

        questions = [];

        questionSnap.forEach(function (doc) {

            const data = doc.data();

            questions.push({

                id: doc.id,

                question:
                    data.question || "",

                optionA:
                    data.optionA || "",

                optionB:
                    data.optionB || "",

                optionC:
                    data.optionC || "",

                optionD:
                    data.optionD || "",

                correctAnswer:
                    data.correctAnswer || "",

                marks:
                    Number(data.marks || 1),

                optionOrder: null
            });

        });


        console.log("=================================");
        console.log("TOTAL QUESTIONS:", questions.length);
        console.log("QUESTIONS:", questions);
        console.log("=================================");


        // -----------------------------------------
        // NO QUESTIONS
        // -----------------------------------------

        if (questions.length === 0) {

            const questionText =
                document.getElementById("questionText");

            if (questionText) {

                questionText.textContent =
                    "No questions found for this exam.";
            }

            alert("No questions found for this exam.");

            return;
        }


        // -----------------------------------------
        // RANDOM QUESTION ORDER
        // -----------------------------------------

        shuffleArray(questions);

        console.log("Questions randomized.");


        // -----------------------------------------
        // QUESTION COUNT
        // -----------------------------------------

        updateProgress();
        updatePalette();


        // -----------------------------------------
        // TIMER
        // -----------------------------------------

        const duration =
            Number(examData.duration || 30);

        timeRemaining = duration * 60;

        console.log(
            "EXAM DURATION:",
            duration,
            "minutes"
        );

        console.log(
            "TIMER START:",
            timeRemaining,
            "seconds"
        );


        // -----------------------------------------
        // SECURE START OVERLAY
        // -----------------------------------------

        const overlay =
            document.getElementById(
                "secureExamOverlay"
            );

        const startButton =
            document.getElementById(
                "startSecureExamBtn"
            );


        if (overlay) {

            overlay.style.display = "flex";
        }


        if (startButton) {

            // Remove previous event if any
            startButton.onclick = startSecureExam;
        }

    }

    catch (error) {

        console.error(
            "EXAM LOAD ERROR:",
            error
        );

        alert(
            "Unable to load exam: " +
            error.message
        );
    }
}


// =====================================================
// START SECURE EXAM
// =====================================================

async function startSecureExam() {

    if (examStarted) {
        return;
    }

    if (!questions || questions.length === 0) {

        alert("Questions are not loaded yet.");

        return;
    }

    examStarted = true;

    currentQuestionIndex = 0;

    console.log("=================================");
    console.log("===== SECURE EXAM STARTED =====");
    console.log("TOTAL QUESTIONS:", questions.length);
    console.log("=================================");


    // -----------------------------------------
    // HIDE START SCREEN
    // -----------------------------------------

    const overlay =
        document.getElementById(
            "secureExamOverlay"
        );

    if (overlay) {

        overlay.style.display = "none";
    }


    // -----------------------------------------
    // FULL SCREEN
    // -----------------------------------------

    await enterFullScreen();


    // -----------------------------------------
    // START TIMER
    // -----------------------------------------

    startTimer();


    // -----------------------------------------
    // RENDER FIRST QUESTION
    // -----------------------------------------

    renderQuestion(0);


    // -----------------------------------------
    // ANTI CHEATING
    // -----------------------------------------

    setupAntiCheating();

}


// =====================================================
// FULL SCREEN
// =====================================================

async function enterFullScreen() {

    try {

        const element =
            document.documentElement;

        if (
            !document.fullscreenElement &&
            element.requestFullscreen
        ) {

            await element.requestFullscreen();

            console.log(
                "FULL SCREEN ENABLED"
            );
        }

    }

    catch (error) {

        console.log(
            "Fullscreen request blocked:",
            error
        );
    }
}


// =====================================================
// EXIT FULL SCREEN
// =====================================================

function exitFullScreen() {

    try {

        if (
            document.fullscreenElement &&
            document.exitFullscreen
        ) {

            document.exitFullscreen();
        }

    }

    catch (error) {

        console.log(error);
    }
}


// =====================================================
// TIMER
// =====================================================

function startTimer() {

    // Clear old timer
    if (timerInterval) {

        clearInterval(timerInterval);
    }


    updateTimerDisplay();


    timerInterval = setInterval(function () {

        if (examSubmitted) {

            clearInterval(timerInterval);

            return;
        }


        timeRemaining--;

        updateTimerDisplay();


        // -----------------------------------------
        // ONE MINUTE WARNING
        // -----------------------------------------

        if (timeRemaining <= 60) {

            const timerElement =
                document.getElementById("timer");

            if (timerElement) {

                timerElement.classList.add(
                    "timer-warning"
                );
            }
        }


        // -----------------------------------------
        // TIME OVER
        // -----------------------------------------

        if (timeRemaining <= 0) {

            clearInterval(timerInterval);

            alert(
                "⏰ Time is over! Your exam will be submitted automatically."
            );

            submitExam(true);
        }

    }, 1000);
}


// =====================================================
// TIMER DISPLAY
// =====================================================

function updateTimerDisplay() {

    const timerElement =
        document.getElementById("timer");

    if (!timerElement) {
        return;
    }


    const minutes =
        Math.floor(timeRemaining / 60);

    const seconds =
        timeRemaining % 60;


    timerElement.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");
}


// =====================================================
// FISHER-YATES SHUFFLE
// =====================================================

function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        const temp = array[i];

        array[i] = array[j];

        array[j] = temp;
    }

    return array;
}


// =====================================================
// RENDER QUESTION
// =====================================================

function renderQuestion(index = currentQuestionIndex) {

    console.log(
        "================================="
    );

    console.log(
        "RENDER QUESTION:",
        index + 1
    );


    // -----------------------------------------
    // VALID INDEX
    // -----------------------------------------

    if (
        index < 0 ||
        index >= questions.length
    ) {

        console.error(
            "Invalid question index:",
            index
        );

        return;
    }


    // -----------------------------------------
    // UPDATE CURRENT INDEX
    // -----------------------------------------

    currentQuestionIndex = index;


    const q =
        questions[currentQuestionIndex];


    if (!q) {

        console.error(
            "Question not found:",
            currentQuestionIndex
        );

        return;
    }


    console.log(
        "QUESTION DATA:",
        q
    );


    // =================================================
    // QUESTION NUMBER
    // =================================================

    const questionNumber =
        document.getElementById(
            "questionNumber"
        );

    if (questionNumber) {

        questionNumber.textContent =
            currentQuestionIndex + 1;
    }


    // =================================================
    // QUESTION TEXT
    // =================================================

    const questionText =
        document.getElementById(
            "questionText"
        );

    if (questionText) {

        questionText.textContent =
            q.question ||
            "Question not available";
    }


    // =================================================
    // OPTIONS CONTAINER
    // =================================================

    const optionsList =
        document.getElementById(
            "optionsList"
        );


    if (!optionsList) {

        console.error(
            "❌ optionsList element not found"
        );

        return;
    }


    // =================================================
    // CREATE ORIGINAL OPTIONS
    // =================================================

    const originalOptions = [

        {
            key: "A",
            text: q.optionA
        },

        {
            key: "B",
            text: q.optionB
        },

        {
            key: "C",
            text: q.optionC
        },

        {
            key: "D",
            text: q.optionD
        }

    ];


    // =================================================
    // RANDOM OPTION ORDER
    // =================================================

    let options;


    if (
        Array.isArray(q.optionOrder) &&
        q.optionOrder.length === 4
    ) {

        options =
            q.optionOrder
                .map(function (key) {

                    return originalOptions.find(
                        function (option) {

                            return option.key === key;
                        }
                    );

                })
                .filter(Boolean);

    }

    else {

        options =
            shuffleArray(
                [...originalOptions]
            );

        q.optionOrder =
            options.map(function (option) {

                return option.key;

            });
    }


    // =================================================
    // CLEAR OLD OPTIONS
    // =================================================

    optionsList.innerHTML = "";


    // =================================================
    // CREATE OPTION CARDS
    // =================================================

    options.forEach(
        function (option, optionIndex) {


            // -----------------------------------------
            // Unique ID
            // -----------------------------------------

            const optionId =
                "question_" +
                q.id +
                "_option_" +
                optionIndex;


            // -----------------------------------------
            // Wrapper
            // -----------------------------------------

            const optionWrapper =
                document.createElement("div");

            optionWrapper.className =
                "option-item";


            // -----------------------------------------
            // Radio
            // -----------------------------------------

            const radio =
                document.createElement("input");

            radio.type = "radio";

            radio.name = "answer";

            radio.id = optionId;

            // IMPORTANT:
            // Store ORIGINAL answer key
            radio.value = option.key;

            radio.className =
                "form-check-input";


            // -----------------------------------------
            // Restore previous answer
            // -----------------------------------------

            if (
                answers[q.id] ===
                option.key
            ) {

                radio.checked = true;
            }


            // -----------------------------------------
            // Label
            // -----------------------------------------

            const label =
                document.createElement("label");

            label.htmlFor =
                optionId;

            label.className =
                "form-check-label";


            // Display A/B/C/D according to
            // RANDOMIZED position

            const displayLetter =
                String.fromCharCode(
                    65 + optionIndex
                );


            label.innerHTML = `

                <span class="option-letter">
                    ${displayLetter}.
                </span>

                <span class="option-text">
                    ${escapeHtml(option.text)}
                </span>

            `;


            // -----------------------------------------
            // Add to DOM
            // -----------------------------------------

            optionWrapper.appendChild(
                radio
            );

            optionWrapper.appendChild(
                label
            );

            optionsList.appendChild(
                optionWrapper
            );


            // -----------------------------------------
            // RADIO CHANGE
            // -----------------------------------------

            radio.addEventListener(
                "change",
                function () {

                    // Save ORIGINAL key
                    answers[q.id] =
                        this.value;


                    console.log(
                        "ANSWER SELECTED:",
                        q.id,
                        this.value
                    );


                    updateProgress();

                    updatePalette();

                }
            );


            // -----------------------------------------
            // MAKE WHOLE CARD CLICKABLE
            // -----------------------------------------

            optionWrapper.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target.tagName
                            .toLowerCase() !==
                        "input"
                    ) {

                        radio.checked = true;

                        radio.dispatchEvent(
                            new Event(
                                "change",
                                {
                                    bubbles: true
                                }
                            )
                        );
                    }

                }
            );

        }
    );


    // =================================================
    // NAVIGATION
    // =================================================

    updateNavigationButtons();


    // =================================================
    // PROGRESS
    // =================================================

    updateProgress();


    // =================================================
    // PALETTE
    // =================================================

    updatePalette();


    console.log(
        "QUESTION RENDERED SUCCESSFULLY"
    );

    console.log(
        "================================="
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null ? "" : String(value);

    return div.innerHTML;
}


// =====================================================
// SAVE CURRENT ANSWER
// =====================================================

function saveCurrentAnswer() {

    const question =
        questions[currentQuestionIndex];


    if (!question) {
        return;
    }


    const selected =
        document.querySelector(
            'input[name="answer"]:checked'
        );


    if (selected) {

        answers[question.id] =
            selected.value;


        console.log(
            "ANSWER SAVED:",
            question.id,
            selected.value
        );
    }
}


// =====================================================
// NEXT QUESTION
// =====================================================

function nextQuestion() {

    saveCurrentAnswer();


    if (
        currentQuestionIndex <
        questions.length - 1
    ) {

        currentQuestionIndex++;

        renderQuestion(
            currentQuestionIndex
        );

    }

    else {

        submitExam(false);
    }
}


// =====================================================
// PREVIOUS QUESTION
// =====================================================

function previousQuestion() {

    saveCurrentAnswer();


    if (
        currentQuestionIndex > 0
    ) {

        currentQuestionIndex--;

        renderQuestion(
            currentQuestionIndex
        );
    }
}


// =====================================================
// NAVIGATION BUTTONS
// =====================================================

function updateNavigationButtons() {

    const prevBtn =
        document.getElementById(
            "prevBtn"
        );


    const nextBtn =
        document.getElementById(
            "nextBtn"
        );


    // -----------------------------------------
    // PREVIOUS
    // -----------------------------------------

    if (prevBtn) {

        prevBtn.disabled =
            currentQuestionIndex === 0;

        prevBtn.onclick =
            previousQuestion;
    }


    // -----------------------------------------
    // NEXT / SUBMIT
    // -----------------------------------------

    if (nextBtn) {

        nextBtn.onclick =
            nextQuestion;


        if (
            currentQuestionIndex ===
            questions.length - 1
        ) {

            nextBtn.textContent =
                "Submit Exam";

        }

        else {

            nextBtn.textContent =
                "Next";
        }
    }
}


// =====================================================
// UPDATE PROGRESS
// =====================================================

function updateProgress() {

    const total =
        questions.length;


    let answered = 0;


    questions.forEach(
        function (question) {

            if (
                answers[question.id]
            ) {

                answered++;
            }

        }
    );


    // -----------------------------------------
    // Progress text
    // -----------------------------------------

    const progressText =
        document.getElementById(
            "progressText"
        );


    if (progressText) {

        progressText.textContent =
            answered +
            "/" +
            total +
            " answered";
    }


    // -----------------------------------------
    // Progress bar
    // -----------------------------------------

    const progressBar =
        document.getElementById(
            "progressBar"
        );


    if (progressBar) {

        const percentage =
            total > 0
                ? (answered / total) * 100
                : 0;


        progressBar.style.width =
            percentage + "%";

        progressBar.setAttribute(
            "aria-valuenow",
            percentage
        );
    }
}


// =====================================================
// QUESTION PALETTE
// =====================================================

function updatePalette() {

    const palette =
        document.getElementById(
            "questionPalette"
        );


    if (!palette) {
        return;
    }


    palette.innerHTML = "";


    questions.forEach(
        function (question, index) {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";


            button.textContent =
                index + 1;


            button.className =
                "question-palette-btn";


            // Current question
            if (
                index ===
                currentQuestionIndex
            ) {

                button.classList.add(
                    "active"
                );
            }


            // Answered question
            if (
                answers[question.id]
            ) {

                button.classList.add(
                    "answered"
                );
            }


            button.addEventListener(
                "click",
                function () {

                    saveCurrentAnswer();

                    currentQuestionIndex =
                        index;

                    renderQuestion(
                        currentQuestionIndex
                    );
                }
            );


            palette.appendChild(
                button
            );

        }
    );
}


// =====================================================
// ANTI CHEATING SETUP
// =====================================================

function setupAntiCheating() {

    // Avoid duplicate listeners
    if (
        setupAntiCheating.initialized
    ) {

        return;
    }


    setupAntiCheating.initialized =
        true;


    // -----------------------------------------
    // TAB SWITCH
    // -----------------------------------------

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );


    // -----------------------------------------
    // FULLSCREEN
    // -----------------------------------------

    document.addEventListener(
        "fullscreenchange",
        handleFullscreenChange
    );


    // -----------------------------------------
    // BEFORE LEAVE
    // -----------------------------------------

    window.addEventListener(
        "beforeunload",
        handleBeforeUnload
    );


    // -----------------------------------------
    // RIGHT CLICK
    // -----------------------------------------

    document.addEventListener(
        "contextmenu",
        function (event) {

            if (examStarted && !examSubmitted) {

                event.preventDefault();
            }

        }
    );


    // -----------------------------------------
    // KEYBOARD RESTRICTIONS
    // -----------------------------------------

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                !examStarted ||
                examSubmitted
            ) {

                return;
            }


            const key =
                event.key.toLowerCase();


            if (

                (event.ctrlKey &&
                    (
                        key === "c" ||
                        key === "x" ||
                        key === "v" ||
                        key === "u"
                    ))

                ||

                event.key === "F12"

            ) {

                event.preventDefault();


                showWarning(
                    "Copy, paste and developer tools are disabled during the exam."
                );
            }

        }
    );

}


// =====================================================
// TAB SWITCH
// =====================================================

function handleVisibilityChange() {

    if (
        !examStarted ||
        examSubmitted
    ) {

        return;
    }


    if (document.hidden) {

        showWarning(
            "You switched away from the exam tab."
        );
    }
}


// =====================================================
// FULLSCREEN DETECTION
// =====================================================

function handleFullscreenChange() {

    if (
        !examStarted ||
        examSubmitted
    ) {

        return;
    }


    if (
        !document.fullscreenElement
    ) {

        showWarning(
            "You exited full-screen mode."
        );
    }
}


// =====================================================
// BEFORE UNLOAD
// =====================================================

function handleBeforeUnload(event) {

    if (
        examStarted &&
        !examSubmitted
    ) {

        event.preventDefault();

        event.returnValue =
            "Your exam is still in progress. Are you sure you want to leave?";
    }
}


// =====================================================
// WARNING SYSTEM
// =====================================================

function showWarning(message) {

    warningCount++;


    console.warn(
        "WARNING:",
        warningCount,
        message
    );


    const warningMessage =
        document.getElementById(
            "warningMessage"
        );


    const warningCountElement =
        document.getElementById(
            "warningCount"
        );


    if (warningMessage) {

        warningMessage.textContent =
            message;

        warningMessage.style.display =
            "block";
    }


    if (warningCountElement) {

        warningCountElement.textContent =
            warningCount;
    }


    alert(
        "⚠️ WARNING " +
        warningCount +
        "/" +
        MAX_WARNINGS +
        "\n\n" +
        message
    );


    // -----------------------------------------
    // AUTO SUBMIT
    // -----------------------------------------

    if (
        warningCount >=
        MAX_WARNINGS
    ) {

        alert(
            "Maximum warnings reached. Your exam will be submitted."
        );


        submitExam(true);
    }
}


// =====================================================
// SUBMIT EXAM
// =====================================================

async function submitExam(
    autoSubmit = false
) {

    if (examSubmitted) {
        return;
    }


    // -----------------------------------------
    // SAVE CURRENT ANSWER
    // -----------------------------------------

    saveCurrentAnswer();


    // -----------------------------------------
    // MANUAL CONFIRMATION
    // -----------------------------------------

    if (!autoSubmit) {

        const confirmed =
            confirm(
                "Are you sure you want to submit the exam?"
            );


        if (!confirmed) {

            return;
        }
    }


    examSubmitted = true;


    // -----------------------------------------
    // STOP TIMER
    // -----------------------------------------

    if (timerInterval) {

        clearInterval(
            timerInterval
        );
    }


    // -----------------------------------------
    // REMOVE LEAVE WARNING
    // -----------------------------------------

    window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
    );


    // -----------------------------------------
    // CALCULATE RESULT
    // -----------------------------------------

    let correctAnswers = 0;

    let wrongAnswers = 0;

    let attemptedQuestions = 0;

    let score = 0;

    let totalMarks = 0;


    questions.forEach(
        function (question) {

            const marks =
                Number(
                    question.marks || 1
                );


            totalMarks += marks;


            const selectedAnswer =
                answers[question.id];


            // -----------------------------------------
            // ATTEMPTED
            // -----------------------------------------

            if (selectedAnswer) {

                attemptedQuestions++;


                const correctKey =
                    getCorrectAnswerKey(
                        question
                    );


                // -----------------------------------------
                // CORRECT
                // -----------------------------------------

                if (
                    selectedAnswer ===
                    correctKey
                ) {

                    correctAnswers++;

                    score += marks;
                }

                // -----------------------------------------
                // WRONG
                // -----------------------------------------

                else {

                    wrongAnswers++;
                }
            }

        }
    );


    // -----------------------------------------
    // PERCENTAGE
    // -----------------------------------------

    const percentage =
        totalMarks > 0
            ? Math.round(
                (score / totalMarks) * 100
            )
            : 0;


    // -----------------------------------------
    // CONSOLE
    // -----------------------------------------

    console.log(
        "================================="
    );

    console.log(
        "FINAL RESULT"
    );

    console.log(
        "SCORE:",
        score
    );

    console.log(
        "TOTAL MARKS:",
        totalMarks
    );

    console.log(
        "PERCENTAGE:",
        percentage
    );

    console.log(
        "CORRECT:",
        correctAnswers
    );

    console.log(
        "WRONG:",
        wrongAnswers
    );

    console.log(
        "ATTEMPTED:",
        attemptedQuestions
    );

    console.log(
        "================================="
    );


    // -----------------------------------------
    // SAVE TO FIREBASE
    // -----------------------------------------

    try {

        if (!currentUser) {

            throw new Error(
                "User is not logged in."
            );
        }


        // -----------------------------------------
        // SAVE RESULT
        // -----------------------------------------

        const resultRef =
            await db
                .collection("results")
                .add({

                    examId:
                        examId,

                    examTitle:
                        examData.title ||
                        "Online Examination",

                    userId:
                        currentUser.uid,

                    score:
                        score,

                    totalMarks:
                        totalMarks,

                    percentage:
                        percentage,

                    correctAnswers:
                        correctAnswers,

                    wrongAnswers:
                        wrongAnswers,

                    totalQuestions:
                        questions.length,

                    attemptedQuestions:
                        attemptedQuestions,

                    warningCount:
                        warningCount,

                    autoSubmitted:
                        autoSubmit,

                    submittedAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });


        console.log(
            "RESULT SAVED:",
            resultRef.id
        );


        // -----------------------------------------
        // SAVE EXAM ATTEMPT
        // -----------------------------------------

        await db
            .collection("examAttempts")
            .add({

                examId:
                    examId,

                userId:
                    currentUser.uid,

                score:
                    score,

                totalMarks:
                    totalMarks,

                percentage:
                    percentage,

                correctAnswers:
                    correctAnswers,

                wrongAnswers:
                    wrongAnswers,

                totalQuestions:
                    questions.length,

                attemptedQuestions:
                    attemptedQuestions,

                warningCount:
                    warningCount,

                autoSubmitted:
                    autoSubmit,

                submittedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        console.log(
            "EXAM ATTEMPT SAVED"
        );


        // -----------------------------------------
        // EXIT FULLSCREEN
        // -----------------------------------------

        exitFullScreen();


        // -----------------------------------------
        // RESULT PAGE
        // -----------------------------------------

        window.location.href =
            "result.html?resultId=" +
            encodeURIComponent(
                resultRef.id
            );

    }

    catch (error) {

        console.error(
            "SUBMIT ERROR:",
            error
        );


        examSubmitted = false;


        alert(
            "Unable to submit exam: " +
            error.message
        );
    }
}


// =====================================================
// FIND CORRECT ANSWER KEY
// =====================================================

function getCorrectAnswerKey(
    question
) {

    const correct =
        String(
            question.correctAnswer || ""
        )
            .trim()
            .toLowerCase();


    // -----------------------------------------
    // A
    // -----------------------------------------

    if (
        correct === "a" ||
        correct === "option a"
    ) {

        return "A";
    }


    // -----------------------------------------
    // B
    // -----------------------------------------

    if (
        correct === "b" ||
        correct === "option b"
    ) {

        return "B";
    }


    // -----------------------------------------
    // C
    // -----------------------------------------

    if (
        correct === "c" ||
        correct === "option c"
    ) {

        return "C";
    }


    // -----------------------------------------
    // D
    // -----------------------------------------

    if (
        correct === "d" ||
        correct === "option d"
    ) {

        return "D";
    }


    // -----------------------------------------
    // FULL OPTION TEXT
    // -----------------------------------------

    if (
        correct ===
        String(
            question.optionA || ""
        )
            .trim()
            .toLowerCase()
    ) {

        return "A";
    }


    if (
        correct ===
        String(
            question.optionB || ""
        )
            .trim()
            .toLowerCase()
    ) {

        return "B";
    }


    if (
        correct ===
        String(
            question.optionC || ""
        )
            .trim()
            .toLowerCase()
    ) {

        return "C";
    }


    if (
        correct ===
        String(
            question.optionD || ""
        )
            .trim()
            .toLowerCase()
    ) {

        return "D";
    }


    console.error(
        "UNKNOWN CORRECT ANSWER:",
        question.correctAnswer
    );


    return "";
}