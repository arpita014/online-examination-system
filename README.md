<<<<<<< HEAD
# Cloud-Based Online Examination System

A complete serverless online examination platform built with HTML5, CSS3, Bootstrap 5, Vanilla JavaScript, and Firebase (Authentication, Cloud Firestore, Hosting).

---

## Project Description

This system enables educational institutions to conduct secure MCQ-based online examinations in the cloud. Students can register, take timed exams with randomized questions, and view instant results. Administrators can manage exams, questions, students, and view analytics dashboards powered by Chart.js.

---

## Features

### Authentication
- Email & Password registration and login
- Role-based access (student / admin)
- Auto-redirect based on user role
- Secure logout

### Student Features
- Dashboard with statistics
- Browse available active exams
- Exam instructions page
- Live exam with timer, progress bar, question palette
- Random question order and shuffled options
- Auto-save answers every 30 seconds
- Auto-submit on timer expiry
- Instant result with score, percentage, correct/wrong counts
- Exam history with performance charts

### Admin Features
- Dashboard with stats cards (students, exams, questions, attempts, avg score)
- Manage Exams (Create, Update, Delete, Activate/Deactivate)
- Manage Questions (CRUD with MCQ options)
- Manage Students (View, Search)
- Manage Results (View, Filter, Analytics charts)

---

## Folder Structure

```
online-examination-system/
├── index.html
├── login.html
├── register.html
├── README.md
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── css/
│   ├── style.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── exam.css
│   └── responsive.css
├── js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── utils.js
│   ├── student-dashboard.js
│   ├── admin-dashboard.js
│   ├── exam.js
│   ├── timer.js
│   ├── result.js
│   ├── history.js
│   ├── exam-management.js
│   ├── question-management.js
│   ├── student-management.js
│   └── result-management.js
├── student/
│   ├── dashboard.html
│   ├── exam.html
│   ├── instructions.html
│   ├── result.html
│   └── history.html
└── admin/
    ├── dashboard.html
    ├── manage-exams.html
    ├── manage-questions.html
    ├── manage-students.html
    └── manage-results.html
```

---

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** and follow the wizard

### 2. Register Web App
1. Project Overview → Web icon (`</>`)
2. Copy the `firebaseConfig` object

### 3. Enable Authentication
1. **Build → Authentication → Sign-in method**
2. Enable **Email/Password**

### 4. Create Firestore Database
1. **Build → Firestore Database → Create database**
2. Start in **Production mode**
3. Choose a region (e.g., `asia-south1`)

### 5. Configure Project
Open `js/firebase-config.js` and replace placeholders:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 6. Deploy Security Rules
```bash
npm install -g firebase-tools
firebase login
cd online-examination-system
firebase init
firebase deploy --only firestore:rules,firestore:indexes
```

### 7. Create Admin Account
1. Register via the app OR add user in Firebase Console
2. In Firestore `users` collection, set `role` to `"admin"` for that user's document

---

## Firestore Collections

| Collection | Fields |
|------------|--------|
| `users` | fullName, email, course, college, role, status, createdAt |
| `exams` | title, description, duration, totalQuestions, totalMarks, isActive, createdAt |
| `questions` | examId, questionText, options[], correctAnswer, marks, createdAt |
| `results` | userId, studentName, examId, examTitle, score, totalMarks, percentage, correctAnswers, wrongAnswers, answers[], submittedAt |
| `examAttempts` | userId, examId, examTitle, startedAt, status, answers, completedAt |

---

## Authentication Setup

- Students register at `register.html` with Full Name, Email, Password, Course, College
- Default role is `student`, status is `active`
- Admin users must have `role: "admin"` in their Firestore user document
- Login redirects: admin → `admin/dashboard.html`, student → `student/dashboard.html`

---

## How to Run

1. Open `online-examination-system` folder in VS Code
2. Install **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**
4. App runs at `http://127.0.0.1:5500`

> Do not open HTML files directly via `file://` protocol.

---

## Deployment

```bash
cd online-examination-system
firebase init hosting
firebase deploy
```

Live URL: `https://YOUR_PROJECT_ID.web.app`

---

## Remaining Configuration

After cloning, you must:
1. Add your Firebase config in `js/firebase-config.js`
2. Enable Email/Password authentication in Firebase Console
3. Create Firestore database
4. Deploy `firestore.rules`
5. Create an admin user in Firestore

---

## License

Academic project — free for educational use.
=======
# online-examination-system
Cloud-Based Online Examination System built with HTML, CSS, JavaScript, Bootstrap, and Firebase for student authentication and online exam management.
>>>>>>> df1a1cb23822e3b0fb686bd1832656d08cd73c5e
