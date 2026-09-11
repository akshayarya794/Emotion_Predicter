/**
 * SentientAI Frontend Application Controller
 * Connects directly to FastAPI BiGRU Inference Backend
 */

// Configuration
const API_BASE_URL = "http://127.0.0.1:8000";

// Emotion Emojis Mirroring Backend Dictionary
const EMOTION_EMOJIS = {
  sadness: "😢",
  joy: "😄",
  love: "❤️",
  anger: "😠",
  fear: "😨",
  surprise: "😲",
};

// DOM Selectors
const serverStatusEl = document.getElementById("server-status");
const statusIndicatorEl = document.getElementById("status-indicator");
const statusLabelEl = document.getElementById("status-label");

const predictionForm = document.getElementById("prediction-form");
const textInput = document.getElementById("text-input");
const charCount = document.getElementById("char-count");
const inputError = document.getElementById("input-error");
const submitBtn = document.getElementById("submit-btn");
const clearBtn = document.getElementById("clear-btn");

const globalAlert = document.getElementById("global-alert");
const alertHeading = document.getElementById("alert-heading");
const alertMessage = document.getElementById("alert-message");
const alertDismiss = document.getElementById("alert-dismiss");

const loadingState = document.getElementById("loading-state");
const resultDashboard = document.getElementById("result-dashboard");
const resultEmoji = document.getElementById("result-emoji");
const resultEmotion = document.getElementById("result-emotion");
const resultConfidence = document.getElementById("result-confidence");
const resultConfidenceBar = document.getElementById("result-confidence-bar");
const probabilitiesGrid = document.getElementById("probabilities-grid");
const resultOriginalText = document.getElementById("result-original-text");
const samplePillButtons = document.querySelectorAll(".pill-btn");

/**
 * Health Check: Verifies backend connection and model state
 */
async function verifyServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (data.model_loaded) {
      statusIndicatorEl.className = "status-indicator online";
      statusLabelEl.textContent = "Model Ready (BiGRU)";
    } else {
      statusIndicatorEl.className = "status-indicator";
      statusLabelEl.textContent = "Model Initializing...";
    }
  } catch (err) {
    statusIndicatorEl.className = "status-indicator offline";
    statusLabelEl.textContent = "Backend Offline";
  }
}

/**
 * Alert Helpers
 */
function showAlert(heading, message, isWarning = false) {
  alertHeading.textContent = heading;
  alertMessage.textContent = message;
  globalAlert.className = `alert-banner ${isWarning ? "warning" : ""}`;
  globalAlert.style.display = "flex";
}

function hideAlert() {
  globalAlert.style.display = "none";
}

/**
 * UI State Management
 */
function setLoading(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    loadingState.style.display = "block";
    resultDashboard.style.display = "none";
    hideAlert();
  } else {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    loadingState.style.display = "none";
  }
}

/**
 * Render Inference Result from PredictionResponse schema:
 * {
 *   text: string,
 *   predicted_emotion: string,
 *   confidence: float,
 *   all_probabilites: dict[str, float]
 * }
 */
function renderResults(data) {
  const emotion = data.predicted_emotion;
  const confidencePercent = (data.confidence * 100).toFixed(1);
  const emoji = EMOTION_EMOJIS[emotion] || "🎯";

  resultEmoji.textContent = emoji;
  resultEmotion.textContent = emotion;
  resultConfidence.textContent = `${confidencePercent}%`;
  resultConfidenceBar.style.width = `${confidencePercent}%`;
  resultOriginalText.textContent = `"${data.text}"`;

  // Render probabilities breakdown
  probabilitiesGrid.innerHTML = "";

  const entries = Object.entries(data.all_probabilites || {});
  // Sort descending by probability
  entries.sort((a, b) => b[1] - a[1]);

  entries.forEach(([label, prob]) => {
    const pct = (prob * 100).toFixed(1);
    const isTop = label === emotion;
    const itemEmoji = EMOTION_EMOJIS[label] || "•";

    const card = document.createElement("div");
    card.className = `prob-card ${isTop ? "top-choice" : ""}`;
    card.innerHTML = `
      <div class="prob-header">
        <span class="prob-label"><span>${itemEmoji}</span> ${label}</span>
        <span class="prob-percentage">${pct}%</span>
      </div>
      <div class="prob-bar-bg">
        <div class="prob-bar-fill" style="width: ${pct}%"></div>
      </div>
    `;
    probabilitiesGrid.appendChild(card);
  });

  resultDashboard.style.display = "block";
  resultDashboard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Form Submission Handler
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  hideAlert();
  inputError.textContent = "";

  const rawText = textInput.value.trim();

  // Validate Input according to Pydantic schema: min_length=1, max_length=2000
  if (!rawText) {
    inputError.textContent = "Please enter a sentence to evaluate.";
    textInput.focus();
    return;
  }

  if (rawText.length > 2000) {
    inputError.textContent = "Text exceeds maximum 2000 characters limit.";
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        text: rawText,
      }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Model is currently initializing or unavailable. Please retry shortly.");
      } else if (response.status === 422) {
        const errorData = await response.json();
        const detail = errorData.detail?.[0]?.msg || "Input validation failed on server.";
        throw new Error(detail);
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    }

    const resultData = await response.json();
    renderResults(resultData);
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      showAlert(
        "Connection Refused",
        "Could not reach FastAPI at http://127.0.0.1:8000. Ensure Uvicorn is active."
      );
    } else {
      showAlert("Prediction Error", err.message || "An unexpected error occurred.");
    }
  } finally {
    setLoading(false);
  }
}

/**
 * Event Listeners and Initializations
 */
function initEventListeners() {
  // Real-time character count
  textInput.addEventListener("input", () => {
    const len = textInput.value.length;
    charCount.textContent = len;
    if (len > 0 && inputError.textContent) {
      inputError.textContent = "";
    }
  });

  // Sample prompt buttons
  samplePillButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sample = btn.getAttribute("data-sample");
      if (sample) {
        textInput.value = sample;
        charCount.textContent = sample.length;
        inputError.textContent = "";
        textInput.focus();
      }
    });
  });

  // Clear button
  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    charCount.textContent = "0";
    inputError.textContent = "";
    resultDashboard.style.display = "none";
    hideAlert();
    textInput.focus();
  });

  alertDismiss.addEventListener("click", hideAlert);
  predictionForm.addEventListener("submit", handleFormSubmit);
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  verifyServerHealth();
  // Poll server health check periodically
  setInterval(verifyServerHealth, 15000);
});