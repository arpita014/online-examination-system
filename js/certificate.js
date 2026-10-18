document.addEventListener("DOMContentLoaded", function () {

    console.log("===== CERTIFICATE PAGE LOADED =====");

    const params = new URLSearchParams(window.location.search);
    const resultId = params.get("resultId");

    console.log("RESULT ID:", resultId);

    if (!resultId) {
        alert("Result ID is missing.");
        return;
    }

    loadCertificate(resultId);
});


// =====================================================
// LOAD CERTIFICATE
// =====================================================

async function loadCertificate(resultId) {

    try {

        console.log("Loading certificate...");


        // -----------------------------------------------
        // Get Result
        // -----------------------------------------------

        const resultRef =
            db.collection("results").doc(resultId);

        const resultSnap =
            await resultRef.get();


        if (!resultSnap.exists) {

            alert("Result not found.");

            return;
        }


        const result =
            resultSnap.data();


        console.log(
            "RESULT DATA:",
            result
        );


        // -----------------------------------------------
        // Result details
        // -----------------------------------------------

        const examTitle =
            result.examTitle || "Online Examination";


        const score =
            Number(result.score || 0);


        const totalMarks =
            Number(result.totalMarks || 0);


        const percentage =
            Number(result.percentage || 0);


        const userId =
            result.userId;


        // -----------------------------------------------
        // GET STUDENT NAME
        // -----------------------------------------------

        const studentName =
            await getStudentName(userId, result);


        console.log(
            "STUDENT NAME:",
            studentName
        );


        // -----------------------------------------------
        // Certificate ID
        // -----------------------------------------------

        let certificateId =
            result.certificateId;


        if (!certificateId) {

            certificateId =
                generateCertificateId(
                    examTitle,
                    resultId
                );


            await resultRef.update({

                certificateId:
                    certificateId

            });

        }


        // -----------------------------------------------
        // DISPLAY CERTIFICATE
        // -----------------------------------------------

        const studentElement =
            document.getElementById("studentName");


        if (studentElement) {

            studentElement.textContent =
                studentName;

        }


        const examElement =
            document.getElementById("examTitle");


        if (examElement) {

            examElement.textContent =
                examTitle;

        }


        const scoreElement =
            document.getElementById("score");


        if (scoreElement) {

            scoreElement.textContent =
                `${score} / ${totalMarks}`;

        }


        const percentageElement =
            document.getElementById("percentage");


        if (percentageElement) {

            percentageElement.textContent =
                `${percentage}%`;

        }


        const dateElement =
            document.getElementById("examDate");


        if (dateElement) {

            dateElement.textContent =
                formatDate(
                    result.submittedAt
                );

        }


        const certificateElement =
            document.getElementById("certificateId");


        if (certificateElement) {

            certificateElement.textContent =
                certificateId;

        }


        console.log(
            "===== CERTIFICATE DISPLAY SUCCESS ====="
        );

    }

    catch (error) {

        console.error(
            "CERTIFICATE ERROR:",
            error
        );

        alert(
            "Certificate loading error: " +
            error.message
        );

    }

}


// =====================================================
// GET STUDENT NAME
// =====================================================

async function getStudentName(userId, result) {

    try {

        console.log(
            "Getting student name..."
        );


        // ------------------------------------------------
        // OPTION 1
        // Result document already has studentName
        // ------------------------------------------------

        if (
            result.studentName &&
            result.studentName.trim() !== ""
        ) {

            return result.studentName;

        }


        // ------------------------------------------------
        // OPTION 2
        // Get user from Firestore
        // ------------------------------------------------

        if (userId) {

            console.log(
                "Looking for user:",
                userId
            );


            const userDoc =
                await db
                    .collection("users")
                    .doc(userId)
                    .get();


            if (userDoc.exists) {

                const userData =
                    userDoc.data();


                console.log(
                    "USER DATA:",
                    userData
                );


                /*
                 * Check common name fields
                 */

                const name =
                    userData.name ||
                    userData.fullName ||
                    userData.studentName ||
                    userData.displayName ||
                    userData.username;


                if (
                    name &&
                    name.toString().trim() !== ""
                ) {

                    return name.toString().trim();

                }

            }

        }


        // ------------------------------------------------
        // OPTION 3
        // Firebase Authentication
        // ------------------------------------------------

        const currentUser =
            firebase.auth().currentUser;


        if (currentUser) {

            console.log(
                "AUTH USER:",
                currentUser
            );


            if (
                currentUser.displayName &&
                currentUser.displayName.trim() !== ""
            ) {

                return currentUser.displayName;

            }

        }


        // ------------------------------------------------
        // Last fallback
        // ------------------------------------------------

        return "Student";

    }

    catch (error) {

        console.error(
            "STUDENT NAME ERROR:",
            error
        );

        return "Student";

    }

}


// =====================================================
// GENERATE CERTIFICATE ID
// =====================================================

function generateCertificateId(
    examTitle,
    resultId
) {

    const examCode =
        (examTitle || "EXAM")
            .replace(/[^a-zA-Z]/g, "")
            .substring(0, 6)
            .toUpperCase();


    const uniqueCode =
        resultId
            .substring(0, 6)
            .toUpperCase();


    return (
        "CERT-" +
        examCode +
        "-" +
        uniqueCode
    );

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(timestamp) {

    if (!timestamp) {

        return "N/A";

    }


    let date;


    if (
        timestamp &&
        typeof timestamp.toDate ===
        "function"
    ) {

        date =
            timestamp.toDate();

    }

    else {

        date =
            new Date(timestamp);

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// DASHBOARD
// =====================================================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}