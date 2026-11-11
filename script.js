
import { Amplify } from "https://esm.sh/aws-amplify@6";

import {
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    getCurrentUser,
    fetchAuthSession
} from "https://esm.sh/aws-amplify@6/auth";


// ==========================================
// AWS CONFIGURATION
// ==========================================

const USER_POOL_ID = "ap-southeast-2_xa83APyEH";
const CLIENT_ID = "1timb997bs5ie89k962m3u38ab";

const API_URL =
    "https://ojwj552n4i.execute-api.ap-southeast-2.amazonaws.com";

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: USER_POOL_ID,
            userPoolClientId: CLIENT_ID,
            loginWith: {
                email: true
            }
        }
    }
});


// ==========================================
// HTML ELEMENTS
// ==========================================

const authSection = document.getElementById("authSection");
const verifySection = document.getElementById("verifySection");
const userSection = document.getElementById("userSection");
const adminSection = document.getElementById("adminSection");

const authForm = document.getElementById("authForm");
const verifyForm = document.getElementById("verifyForm");
const feedbackForm = document.getElementById("feedbackForm");

const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");

const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const nameGroup = document.getElementById("nameGroup");

const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");

const switchPrompt = document.getElementById("switchPrompt");
const switchAuth = document.getElementById("switchAuth");

const verifyCode = document.getElementById("verifyCode");
const verifyMessage = document.getElementById("verifyMessage");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const userName = document.getElementById("userName");

const feedbackCategory = document.getElementById("feedbackCategory");
const feedbackMessage = document.getElementById("feedbackMessage");
const feedbackStatus = document.getElementById("feedbackStatus");

const historyBtn = document.getElementById("historyBtn");
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");


// ==========================================
// APPLICATION STATE
// ==========================================

let isSignUpMode = false;
let pendingEmail = "";


// ==========================================
// CHART INSTANCES
// ==========================================

let categoryChart = null;
let ratingChart = null;
let trendChart = null;


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function showMessage(element, message, success = false) {
    element.textContent = message;
    element.style.color = success ? "green" : "red";
}


function hideAllSections() {
    authSection.classList.add("hidden");
    verifySection.classList.add("hidden");
    userSection.classList.add("hidden");
    adminSection.classList.add("hidden");
}


function showLoginSection() {
    hideAllSections();

    authSection.classList.remove("hidden");

    loginBtn.classList.remove("hidden");
    signupBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
}


// ==========================================
// AUTHENTICATION TOKEN
// ==========================================

async function getToken() {
    const session = await fetchAuthSession();

    const token = session.tokens?.idToken?.toString();

    if (!token) {
        throw new Error(
            "Authentication token not found. Please log in again."
        );
    }

    return token;
}


async function getAuthHeaders() {
    const token = await getToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


// ==========================================
// LOGIN AND SIGNUP MODE
// ==========================================

function setMode(signUpMode) {
    isSignUpMode = signUpMode;

    authForm.reset();
    authMessage.textContent = "";

    if (isSignUpMode) {
        authTitle.textContent = "Create your account";

        authDescription.textContent =
            "Register to share feedback and improve campus services.";

        nameGroup.classList.remove("hidden");
        authName.required = true;

        authSubmit.textContent = "Create Account";

        switchPrompt.textContent = "Already have an account?";
        switchAuth.textContent = "Login";

    } else {
        authTitle.textContent = "Welcome back";

        authDescription.textContent =
            "Log in to submit feedback and track your submissions.";

        nameGroup.classList.add("hidden");
        authName.required = false;

        authSubmit.textContent = "Login";

        switchPrompt.textContent = "Don't have an account?";
        switchAuth.textContent = "Sign up";
    }
}


switchAuth.addEventListener("click", () => {
    setMode(!isSignUpMode);
});


loginBtn.addEventListener("click", () => {
    setMode(false);

    authSection.scrollIntoView({
        behavior: "smooth"
    });
});


signupBtn.addEventListener("click", () => {
    setMode(true);

    authSection.scrollIntoView({
        behavior: "smooth"
    });
});


// ==========================================
// STUDENT REGISTRATION AND LOGIN
// ==========================================

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value;

    authSubmit.disabled = true;
    authMessage.textContent = "";

    try {

        if (isSignUpMode) {

            const name = authName.value.trim();

            if (!name) {
                throw new Error("Please enter your full name.");
            }

            const result = await signUp({
                username: email,
                password: password,

                options: {
                    userAttributes: {
                        email: email,
                        name: name
                    }
                }
            });

            if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
                pendingEmail = email;

                hideAllSections();
                verifySection.classList.remove("hidden");

                showMessage(
                    verifyMessage,
                    "Verification code sent. Please check your email.",
                    true
                );

            } else {
                showMessage(
                    authMessage,
                    "Registration completed. You can now log in.",
                    true
                );

                setMode(false);
            }

        } else {

            const result = await signIn({
                username: email,
                password: password
            });

            if (result.isSignedIn) {
                await openDashboard();

            } else if (
                result.nextStep.signInStep === "CONFIRM_SIGN_UP"
            ) {
                pendingEmail = email;

                hideAllSections();
                verifySection.classList.remove("hidden");

                showMessage(
                    verifyMessage,
                    "Please verify your email using the code sent to you."
                );

            } else {
                showMessage(
                    authMessage,
                    "Additional verification is required. Please check the login instructions."
                );
            }
        }

    } catch (error) {
        console.error("Authentication error:", error);

        showMessage(
            authMessage,
            error.message || "Authentication failed."
        );

    } finally {
        authSubmit.disabled = false;
    }
});


// ==========================================
// EMAIL VERIFICATION
// ==========================================

verifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = verifyCode.value.trim();

    try {
        await confirmSignUp({
            username: pendingEmail,
            confirmationCode: code
        });

        showMessage(
            verifyMessage,
            "Email verified successfully! You can now log in.",
            true
        );

        setTimeout(() => {
            showLoginSection();
            setMode(false);

            authEmail.value = pendingEmail;

            verifyForm.reset();
        }, 1500);

    } catch (error) {
        console.error("Verification error:", error);

        showMessage(
            verifyMessage,
            error.message || "Email verification failed."
        );
    }
});


// ==========================================
// OPEN STUDENT OR ADMIN DASHBOARD
// ==========================================

async function openDashboard() {
    try {
        const currentUser = await getCurrentUser();
        const session = await fetchAuthSession();

        const payload = session.tokens?.idToken?.payload || {};

        const groups = payload["cognito:groups"] || [];

        const isAdmin =
            Array.isArray(groups) && groups.includes("Admins");

        const name = payload.name || currentUser.username;

        hideAllSections();

        loginBtn.classList.add("hidden");
        signupBtn.classList.add("hidden");
        logoutBtn.classList.remove("hidden");

        if (isAdmin) {
            adminSection.classList.remove("hidden");

            await loadAdminFeedback();

        } else {
            userSection.classList.remove("hidden");

            userName.textContent = name;

            historySection.classList.add("hidden");

            await loadFeedbackHistory();
        }

    } catch (error) {
        console.error("Dashboard error:", error);

        showLoginSection();

        showMessage(
            authMessage,
            error.message || "Unable to open dashboard."
        );
    }
}


// ==========================================
// SUBMIT STUDENT FEEDBACK
// ==========================================

feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const category = feedbackCategory.value;

    const selectedRating = document.querySelector(
        'input[name="rating"]:checked'
    );

    const rating = selectedRating
        ? Number(selectedRating.value)
        : 0;

    const message = feedbackMessage.value.trim();
    const name = userName.textContent;

    if (!rating) {
        showMessage(
            feedbackStatus,
            "Please select a satisfaction rating."
        );

        return;
    }

    try {
        const headers = await getAuthHeaders();

        const response = await fetch(`${API_URL}/feedback`, {
            method: "POST",
            headers: headers,

            body: JSON.stringify({
                name: name,
                category: category,
                rating: rating,
                message: message
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to submit feedback."
            );
        }

        showMessage(
            feedbackStatus,
            "Your feedback has been submitted successfully!",
            true
        );

        feedbackForm.reset();

        await loadFeedbackHistory();

    } catch (error) {
        console.error("Feedback submission error:", error);

        showMessage(
            feedbackStatus,
            error.message || "Feedback submission failed."
        );
    }
});


// ==========================================
// LOAD STUDENT FEEDBACK HISTORY
// ==========================================

async function loadFeedbackHistory() {
    historyList.textContent = "Loading feedback history...";

    try {
        const headers = await getAuthHeaders();

        const response = await fetch(`${API_URL}/my-feedback`, {
            method: "GET",
            headers: headers
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load feedback."
            );
        }

        historyList.innerHTML = "";

        const feedback = result.feedback || [];

        if (feedback.length === 0) {
            historyList.textContent =
                "You haven't submitted any feedback yet.";

            return;
        }

        feedback.forEach(item => {
            const card = document.createElement("div");
            card.className = "feedback-item";

            const heading = document.createElement("h3");
            heading.textContent = item.category;

            const rating = document.createElement("p");
            rating.textContent = `Rating: ${item.rating}/5`;

            const message = document.createElement("p");
            message.textContent = item.message;

            const date = document.createElement("small");
            date.textContent = new Date(
                item.createdAt
            ).toLocaleString();

            card.append(
                heading,
                rating,
                message,
                date
            );

            historyList.appendChild(card);
        });

    } catch (error) {
        console.error("History error:", error);

        historyList.textContent =
            error.message || "Unable to load feedback history.";
    }
}


// ==========================================
// MY FEEDBACK BUTTON
// ==========================================

historyBtn.addEventListener("click", async () => {
    historySection.classList.toggle("hidden");

    if (!historySection.classList.contains("hidden")) {
        await loadFeedbackHistory();

        historySection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
});


// ==========================================
// ADMIN CHARTS
// ==========================================

function renderAdminCharts(feedback) {

    if (typeof Chart === "undefined") {
        console.error("Chart.js did not load. Charts cannot be displayed.");
        return;
    }

    // Destroy previous charts before recreating them
    if (categoryChart) categoryChart.destroy();
    if (ratingChart) ratingChart.destroy();
    if (trendChart) trendChart.destroy();

    // COMMON CHART OPTIONS
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: "#ddd",
                    padding: 18
                }
            }
        }
    };

    // --------------------------------------
    // 1. CATEGORY DISTRIBUTION
    // --------------------------------------

    const categoryCounts = {};

    feedback.forEach(item => {
        const category = item.category || "Other";

        categoryCounts[category] =
            (categoryCounts[category] || 0) + 1;
    });

    categoryChart = new Chart(
        document.getElementById("categoryChart"),
        {
            type: "doughnut",

            data: {
                labels: Object.keys(categoryCounts),

                datasets: [{
                    data: Object.values(categoryCounts),

                    backgroundColor: [
                        "#60a5fa",
                        "#34d399",
                        "#fbbf24",
                        "#f87171",
                        "#a78bfa",
                        "#22d3ee"
                    ],

                    borderColor: "#292929",
                    borderWidth: 3
                }]
            },

            options: {
                ...commonOptions,
                cutout: "65%"
            }
        }
    );


    // --------------------------------------
    // 2. RATING ANALYSIS
    // --------------------------------------

    const ratingCounts = [0, 0, 0, 0, 0];

    feedback.forEach(item => {
        const rating = Number(item.rating);

        if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
            ratingCounts[rating - 1]++;
        }
    });

    ratingChart = new Chart(
        document.getElementById("ratingChart"),
        {
            type: "bar",

            data: {
                labels: [
                    "1 Star",
                    "2 Stars",
                    "3 Stars",
                    "4 Stars",
                    "5 Stars"
                ],

                datasets: [{
                    label: "Number of Responses",
                    data: ratingCounts,

                    backgroundColor: [
                        "#f87171",
                        "#fb923c",
                        "#fbbf24",
                        "#60a5fa",
                        "#34d399"
                    ],

                    borderRadius: 6
                }]
            },

            options: {
                ...commonOptions,

                scales: {
                    x: {
                        ticks: {
                            color: "#ccc"
                        },
                        grid: {
                            display: false
                        }
                    },

                    y: {
                        beginAtZero: true,

                        ticks: {
                            color: "#ccc",
                            precision: 0
                        },

                        grid: {
                            color: "#444"
                        }
                    }
                }
            }
        }
    );


    // --------------------------------------
    // 3. FEEDBACK TRENDS
    // --------------------------------------

    const dailyCounts = {};

    feedback.forEach(item => {

        if (!item.createdAt) return;

        const date = new Date(item.createdAt);

        if (Number.isNaN(date.getTime())) return;

        const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

        dailyCounts[dateKey] =
            (dailyCounts[dateKey] || 0) + 1;
    });

    const sortedDates = Object.keys(dailyCounts).sort();

    const trendLabels = sortedDates.map(dateKey => {
        const [year, month, day] = dateKey.split("-").map(Number);

        return new Date(year, month - 1, day)
            .toLocaleDateString(undefined, {
                day: "numeric",
                month: "short"
            });
    });

    const trendValues = sortedDates.map(
        dateKey => dailyCounts[dateKey]
    );

    trendChart = new Chart(
        document.getElementById("trendChart"),
        {
            type: "line",

            data: {
                labels: trendLabels,

                datasets: [{
                    label: "Feedback Submissions",
                    data: trendValues,

                    borderColor: "#60a5fa",
                    backgroundColor: "rgba(96, 165, 250, 0.15)",

                    fill: true,
                    tension: 0.35,

                    pointBackgroundColor: "#60a5fa",
                    pointRadius: 5
                }]
            },

            options: {
                ...commonOptions,

                scales: {
                    x: {
                        ticks: {
                            color: "#ccc"
                        },
                        grid: {
                            display: false
                        }
                    },

                    y: {
                        beginAtZero: true,

                        ticks: {
                            color: "#ccc",
                            precision: 0
                        },

                        grid: {
                            color: "#444"
                        }
                    }
                }
            }
        }
    );
}


// ==========================================
// ADMIN DASHBOARD
// ==========================================

async function loadAdminFeedback() {

    const totalCount = document.getElementById("totalCount");
    const averageRating = document.getElementById("averageRating");
    const categoryCount = document.getElementById("categoryCount");
    const adminFeedbackList = document.getElementById("adminFeedbackList");

    adminFeedbackList.textContent = "Loading student feedback...";

    try {
        const headers = await getAuthHeaders();

        const response = await fetch(`${API_URL}/feedback`, {
            method: "GET",
            headers: headers
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load admin feedback."
            );
        }

        const feedback = result.feedback || [];

        // TOTAL FEEDBACK
        totalCount.textContent = feedback.length;

        // AVERAGE RATING
        const average = feedback.length
            ? feedback.reduce(
                (sum, item) => sum + Number(item.rating),
                0
            ) / feedback.length
            : 0;

        averageRating.textContent = average.toFixed(1);

        // SUPPORT CATEGORIES
        const categories = new Set(
            feedback.map(item => item.category)
        );

        categoryCount.textContent = categories.size;

        // UPDATE CHARTS USING AWS DATA
        renderAdminCharts(feedback);

        // CLEAR PREVIOUS FEEDBACK
        adminFeedbackList.innerHTML = "";

        if (feedback.length === 0) {
            adminFeedbackList.textContent =
                "No student feedback available yet.";

            return;
        }

        // DISPLAY ALL FEEDBACK
        feedback.forEach(item => {

            const card = document.createElement("div");
            card.className = "admin-feedback-item";

            const heading = document.createElement("h3");
            heading.textContent =
                item.category || "General Feedback";

            const student = document.createElement("p");
            student.textContent =
                `Student: ${item.name || "Unknown"}`;

            const email = document.createElement("p");
            email.textContent =
                `Email: ${item.email || "Not available"}`;

            const rating = document.createElement("p");
            rating.textContent =
                `Rating: ${item.rating}/5`;

            const message = document.createElement("p");
            message.textContent =
                item.message || "";

            const date = document.createElement("small");
            date.textContent = item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "Date unavailable";

            // DELETE BUTTON
            const deleteButton = document.createElement("button");

            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", async () => {

                const confirmed = confirm(
                    "Are you sure you want to delete this feedback?"
                );

                if (!confirmed) return;

                deleteButton.disabled = true;
                deleteButton.textContent = "Deleting...";

                try {
                    const deleteResponse = await fetch(
                        `${API_URL}/feedback/${encodeURIComponent(item.feedbackid)}`,
                        {
                            method: "DELETE",
                            headers: await getAuthHeaders()
                        }
                    );

                    const deleteResult = await deleteResponse.json();

                    if (!deleteResponse.ok) {
                        throw new Error(
                            deleteResult.message ||
                            "Unable to delete feedback."
                        );
                    }

                    alert("Feedback deleted successfully!");

                    await loadAdminFeedback();

                } catch (error) {
                    console.error("Delete error:", error);

                    alert(
                        error.message || "Unable to delete feedback."
                    );

                    deleteButton.disabled = false;
                    deleteButton.textContent = "Delete";
                }
            });

            card.append(
                heading,
                student,
                email,
                rating,
                message,
                date,
                deleteButton
            );

            adminFeedbackList.appendChild(card);
        });

    } catch (error) {
        console.error("Admin dashboard error:", error);

        adminFeedbackList.textContent =
            error.message || "Unable to load student feedback.";
    }
}


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener("click", async () => {

    try {
        await signOut();

        hideAllSections();
        showLoginSection();

        setMode(false);

        authForm.reset();
        feedbackForm.reset();

        historySection.classList.add("hidden");

        historyList.textContent =
            "Your submitted feedback will appear here.";

    } catch (error) {
        console.error("Logout error:", error);

        alert("Unable to log out. Please try again.");
    }
});


// ==========================================
// CHECK EXISTING LOGIN SESSION
// ==========================================

async function checkExistingSession() {

    try {
        await getCurrentUser();

        await openDashboard();

    } catch {
        showLoginSection();

        setMode(false);
    }
}


// ==========================================
// INITIALIZE APPLICATION
// ==========================================

checkExistingSession();
