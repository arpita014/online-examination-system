document.addEventListener("DOMContentLoaded", function () {

    console.log("===== RESULT PAGE LOADED =====");

    const params = new URLSearchParams(window.location.search);
    const resultId = params.get("resultId");

    console.log("RESULT ID:", resultId);

    if (!resultId) {
        console.error("RESULT ID NOT FOUND");
        return;
    }

    loadResult(resultId);
});


async function loadResult(resultId) {

    try {

        console.log("Loading result from Firebase...");

        const resultDoc = await db
            .collection("results")
            .doc(resultId)
            .get();

        console.log("RESULT EXISTS:", resultDoc.exists);

        if (!resultDoc.exists) {
            console.error("RESULT DOCUMENT NOT FOUND");
            return;
        }

        const result = resultDoc.data();

        console.log("========== RESULT DATA ==========");
        console.log(result);


        // ==============================
        // GET VALUES
        // ==============================

        const examTitle =
            result.examTitle || "Exam";

        const score =
            Number(result.score ?? 0);

        const totalMarks =
            Number(result.totalMarks ?? 0);

        const percentage =
            Number(result.percentage ?? 0);

        const correctAnswers =
            Number(result.correctAnswers ?? 0);

        const wrongAnswers =
            Number(result.wrongAnswers ?? 0);

        const totalQuestions =
            Number(result.totalQuestions ?? 0);


        console.log("EXAM TITLE:", examTitle);
        console.log("SCORE:", score);
        console.log("TOTAL MARKS:", totalMarks);
        console.log("PERCENTAGE:", percentage);
        console.log("CORRECT:", correctAnswers);
        console.log("WRONG:", wrongAnswers);
        console.log("TOTAL QUESTIONS:", totalQuestions);


        // ==============================
        // DISPLAY RESULT
        // ==============================

        updateElement("examTitle", examTitle);

        updateElement(
            "percentage",
            percentage + "%"
        );

        updateElement("score", score);

        updateElement(
            "totalMarks",
            totalMarks
        );

        updateElement(
            "correctAnswers",
            correctAnswers
        );

        updateElement(
            "wrongAnswers",
            wrongAnswers
        );

        updateElement(
            "totalQuestions",
            totalQuestions
        );


        // ==============================
        // DATE
        // ==============================

        const dateElement =
            document.getElementById("submittedDate");

        if (
            dateElement &&
            result.submittedAt
        ) {

            let date;

            if (
                typeof result.submittedAt.toDate ===
                "function"
            ) {

                date =
                    result.submittedAt.toDate();

            } else {

                date =
                    new Date(result.submittedAt);

            }

            dateElement.innerText =
                "Submitted on " +
                date.toLocaleString();
        }


        // ==============================
        // CREATE CERTIFICATE BUTTON
        // ==============================

        createCertificateButton(
            resultId,
            percentage
        );


        console.log(
            "===== RESULT DISPLAY SUCCESS ====="
        );

    }

    catch (error) {

        console.error(
            "RESULT ERROR:",
            error
        );

        alert(
            "Result loading error: " +
            error.message
        );

    }
}


// =====================================================
// CREATE CERTIFICATE BUTTON DYNAMICALLY
// =====================================================

function createCertificateButton(
    resultId,
    percentage
) {

    console.log(
        "Creating certificate button..."
    );

    console.log(
        "Percentage:",
        percentage
    );


    // --------------------------------------
    // Only 50% or above
    // --------------------------------------

    if (percentage < 50) {

        console.log(
            "Certificate not available. Percentage below 50%."
        );

        return;
    }


    // --------------------------------------
    // Check if already exists
    // --------------------------------------

    if (
        document.getElementById(
            "dynamicCertificateBtn"
        )
    ) {

        console.log(
            "Certificate button already exists."
        );

        return;
    }


    // --------------------------------------
    // Find action-buttons container
    // --------------------------------------

    let actionContainer =
        document.querySelector(
            ".action-buttons"
        );


    // --------------------------------------
    // If container doesn't exist,
    // create one
    // --------------------------------------

    if (!actionContainer) {

        console.log(
            "Action container not found. Creating one."
        );

        actionContainer =
            document.createElement("div");

        actionContainer.className =
            "action-buttons text-center";

        actionContainer.style.marginTop =
            "40px";


        const resultCard =
            document.querySelector(
                ".result-card"
            );


        if (resultCard) {

            resultCard.appendChild(
                actionContainer
            );

        } else {

            document.body.appendChild(
                actionContainer
            );

        }

    }


    // --------------------------------------
    // Create button
    // --------------------------------------

    const certificateButton =
        document.createElement("a");


    certificateButton.id =
        "dynamicCertificateBtn";


    certificateButton.href =
        "certificate.html?resultId=" +
        encodeURIComponent(resultId);


    certificateButton.innerHTML =
        '<i class="fas fa-certificate me-2"></i>' +
        'View Certificate';


    // --------------------------------------
    // Button styling
    // --------------------------------------

    certificateButton.style.display =
        "inline-block";

    certificateButton.style.visibility =
        "visible";

    certificateButton.style.opacity =
        "1";

    certificateButton.style.backgroundColor =
        "#198754";

    certificateButton.style.color =
        "#ffffff";

    certificateButton.style.border =
        "2px solid #198754";

    certificateButton.style.padding =
        "12px 24px";

    certificateButton.style.borderRadius =
        "8px";

    certificateButton.style.textDecoration =
        "none";

    certificateButton.style.fontWeight =
        "600";

    certificateButton.style.margin =
        "5px";


    // --------------------------------------
    // Insert button at FIRST position
    // --------------------------------------

    actionContainer.insertBefore(
        certificateButton,
        actionContainer.firstChild
    );


    console.log(
        "================================"
    );

    console.log(
        "CERTIFICATE BUTTON CREATED"
    );

    console.log(
        "Certificate URL:",
        certificateButton.href
    );

    console.log(
        "================================"
    );
}


// =====================================================
// SAFE ELEMENT UPDATE
// =====================================================

function updateElement(
    id,
    value
) {

    const element =
        document.getElementById(id);


    console.log(
        "Element:",
        id,
        "Found:",
        !!element,
        "Value:",
        value
    );


    if (element) {

        element.textContent =
            value;

    } else {

        console.error(
            "HTML ELEMENT NOT FOUND:",
            id
        );

    }
}