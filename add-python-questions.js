// Firebase SDK
const firebaseConfig = {
  apiKey: "AIzaSyDe5o4C6FFWc_O8LcUao61xHHnlruKtIZc",
  authDomain: "online-examination-syste-21adf.firebaseapp.com",
  projectId: "online-examination-syste-21adf",
  storageBucket: "online-examination-syste-21adf.firebasestorage.app",
  messagingSenderId: "271890466949",
  appId: "1:271890466949:web:13ff78e6523d28ad7ac1ec",
  measurementId: "G-BSMQ1MB3J0"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// Your Python Exam ID
const examId = "python_exam_01";

const questions = [
  {
    question: "Which keyword is used to define a function in Python?",
    optionA: "function",
    optionB: "def",
    optionC: "define",
    optionD: "fun",
    correctAnswer: "B",
    marks: 1
  },
  {
    question: "Which symbol is used for comments in Python?",
    optionA: "//",
    optionB: "/*",
    optionC: "#",
    optionD: "--",
    correctAnswer: "C",
    marks: 1
  },
  {
    question: "Which of the following is a Python data type?",
    optionA: "integer",
    optionB: "float",
    optionC: "string",
    optionD: "All of the above",
    correctAnswer: "D",
    marks: 1
  },
  {
    question: "Which function is used to display output in Python?",
    optionA: "print()",
    optionB: "display()",
    optionC: "output()",
    optionD: "show()",
    correctAnswer: "A",
    marks: 1
  },
  {
    question: "Which symbol is used to create a list in Python?",
    optionA: "()",
    optionB: "{}",
    optionC: "[]",
    optionD: "<>",
    correctAnswer: "C",
    marks: 1
  },
  {
    question: "Which keyword is used to create a class in Python?",
    optionA: "class",
    optionB: "Class",
    optionC: "create",
    optionD: "object",
    correctAnswer: "A",
    marks: 1
  },
  {
    question: "Which operator is used for exponentiation in Python?",
    optionA: "^",
    optionB: "**",
    optionC: "//",
    optionD: "%%",
    correctAnswer: "B",
    marks: 1
  },
  {
    question: "Which function is used to find the length of a list?",
    optionA: "size()",
    optionB: "count()",
    optionC: "length()",
    optionD: "len()",
    correctAnswer: "D",
    marks: 1
  },
  {
    question: "Which keyword is used to iterate over a sequence?",
    optionA: "repeat",
    optionB: "loop",
    optionC: "for",
    optionD: "iterate",
    correctAnswer: "C",
    marks: 1
  },
  {
    question: "Which value represents True in Python?",
    optionA: "true",
    optionB: "TRUE",
    optionC: "True",
    optionD: "yes",
    correctAnswer: "C",
    marks: 1
  }
];

// Add all questions
async function addQuestions() {
  try {

    const batch = db.batch();

    questions.forEach((question, index) => {

      const questionRef = db
        .collection("exams")
        .doc(examId)
        .collection("questions")
        .doc(`question${index + 1}`);

      batch.set(questionRef, question);
    });

    await batch.commit();

    console.log("✅ SUCCESS!");
    console.log("10 Python questions added to Firebase.");

  } catch (error) {

    console.error("❌ ERROR:", error);

  }
}

addQuestions();