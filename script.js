/**
 * Internal Marks Calculator
 * Logic for marks computation, validation, local storage persistence,
 * clipboard copy, and sharing.
 */

// Field limits definition
const LIMITS = {
  fa1: { max: 10, label: "FA1" },
  cla1: { max: 10, label: "CLA1" },
  fa2: { max: 20, label: "FA2" },
  cla2: { max: 10, label: "CLA2" },
  fa3: { max: 20, label: "FA3" },
  cla3: { max: 10, label: "CLA3" },
  fa4: { max: 20, label: "FA4" },
  cla4: { max: 10, label: "CLA4" },
  cla5: { max: 10, label: "CLA5" }
};

const STORAGE_KEY = "internal_marks_saved_subjects";

// State variable for the current calculation
let currentResult = null;

// DOM Elements
const subjectNameInput = document.getElementById("subjectName");
const fa1Input = document.getElementById("fa1");
const cla1Input = document.getElementById("cla1");
const fa2Input = document.getElementById("fa2");
const cla2Input = document.getElementById("cla2");
const fa3Input = document.getElementById("fa3");
const cla3Input = document.getElementById("cla3");
const fa4Input = document.getElementById("fa4");
const cla4Input = document.getElementById("cla4");
const cla5Input = document.getElementById("cla5");

const validationMessage = document.getElementById("validationMessage");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");
const saveSubjectBtn = document.getElementById("saveSubjectBtn");

const resultsCard = document.getElementById("resultsCard");
const resultSubject = document.getElementById("resultSubject");
const resModule1 = document.getElementById("resModule1");
const resModule2 = document.getElementById("resModule2");
const resCla5 = document.getElementById("resCla5");
const resTotal = document.getElementById("resTotal");
const resPercentage = document.getElementById("resPercentage");

const copyResultBtn = document.getElementById("copyResultBtn");
const shareResultBtn = document.getElementById("shareResultBtn");
const actionFeedback = document.getElementById("actionFeedback");

const clearAllBtn = document.getElementById("clearAllBtn");
const savedListEmpty = document.getElementById("savedListEmpty");
const savedListContainer = document.getElementById("savedListContainer");

/**
 * Format a number preserving decimal precision up to 2 decimal places.
 * Eliminates redundant trailing zeroes.
 */
function formatNumber(val) {
  if (typeof val !== "number" || isNaN(val)) return "0";
  return parseFloat(val.toFixed(2)).toString();
}

/**
 * Clear validation error message.
 */
function clearValidation() {
  validationMessage.textContent = "";
  validationMessage.classList.remove("active");
  Object.keys(LIMITS).forEach((key) => {
    const el = document.getElementById(key);
    if (el) el.style.borderColor = "";
  });
}

/**
 * Display a validation error message and highlight the corresponding input.
 */
function showValidation(msg, elementId = null) {
  validationMessage.textContent = msg;
  validationMessage.classList.add("active");
  if (elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.style.borderColor = "var(--danger-color)";
      el.focus();
    }
  }
}

/**
 * Validate all inputs.
 * Returns an object with parsed numbers, or null if validation fails.
 */
function validateInputs() {
  clearValidation();

  const inputs = {
    fa1: fa1Input.value.trim(),
    cla1: cla1Input.value.trim(),
    fa2: fa2Input.value.trim(),
    cla2: cla2Input.value.trim(),
    fa3: fa3Input.value.trim(),
    cla3: cla3Input.value.trim(),
    fa4: fa4Input.value.trim(),
    cla4: cla4Input.value.trim(),
    cla5: cla5Input.value.trim()
  };

  const parsed = {};

  for (const [key, val] of Object.entries(inputs)) {
    if (val === "") {
      showValidation(`Please enter marks for ${LIMITS[key].label}.`, key);
      return null;
    }

    const num = Number(val);
    if (isNaN(num)) {
      showValidation(`${LIMITS[key].label} must be a valid number.`, key);
      return null;
    }

    if (num < 0) {
      showValidation(`${LIMITS[key].label} cannot be negative.`, key);
      return null;
    }

    if (num > LIMITS[key].max) {
      showValidation(
        `${LIMITS[key].label} cannot exceed the maximum of ${LIMITS[key].max}.`,
        key
      );
      return null;
    }

    parsed[key] = num;
  }

  return parsed;
}

/**
 * Calculation formulas:
 * Module 1 (20 Marks) = (FA1 + CLA1 + FA2 + CLA2) / 50 * 20
 * Module 2 (30 Marks) = (FA3 + CLA3 + FA4 + CLA4) / 60 * 30
 * CLA5     (10 Marks) = Raw CLA5 marks
 * Final Total (60 Marks) = Module 1 + Module 2 + CLA5
 * Percentage = (Final Total / 60) * 100
 */
function calculateMarks() {
  const values = validateInputs();
  if (!values) {
    currentResult = null;
    saveSubjectBtn.disabled = true;
    return;
  }

  // Module 1 calculation
  const m1RawSum = values.fa1 + values.cla1 + values.fa2 + values.cla2;
  const module1 = (m1RawSum / 50) * 20;

  // Module 2 calculation
  const m2RawSum = values.fa3 + values.cla3 + values.fa4 + values.cla4;
  const module2 = (m2RawSum / 60) * 30;

  // CLA5 raw marks
  const cla5 = values.cla5;

  // Final total marks out of 60
  const total = module1 + module2 + cla5;

  // Percentage
  const percentage = (total / 60) * 100;

  const subjectName = subjectNameInput.value.trim();

  currentResult = {
    subject: subjectName,
    rawValues: values,
    module1,
    module2,
    cla5,
    total,
    percentage,
    calculatedAt: new Date().toISOString()
  };

  // Render results
  if (subjectName) {
    resultSubject.textContent = subjectName;
    resultSubject.style.display = "block";
  } else {
    resultSubject.textContent = "";
    resultSubject.style.display = "none";
  }

  resModule1.textContent = `${formatNumber(module1)} / 20`;
  resModule2.textContent = `${formatNumber(module2)} / 30`;
  resCla5.textContent = `${formatNumber(cla5)} / 10`;
  resTotal.textContent = `${formatNumber(total)} / 60`;
  resPercentage.textContent = `${formatNumber(percentage)}%`;

  resultsCard.hidden = false;
  saveSubjectBtn.disabled = false;
  actionFeedback.textContent = "";
}

/**
 * Reset all input fields and hide the result card.
 */
function resetForm() {
  subjectNameInput.value = "";
  fa1Input.value = "";
  cla1Input.value = "";
  fa2Input.value = "";
  cla2Input.value = "";
  fa3Input.value = "";
  cla3Input.value = "";
  fa4Input.value = "";
  cla4Input.value = "";
  cla5Input.value = "";

  clearValidation();
  resultsCard.hidden = true;
  saveSubjectBtn.disabled = true;
  actionFeedback.textContent = "";
  currentResult = null;
}

/**
 * Retrieve saved calculations from localStorage.
 */
function getSavedCalculations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save current calculation to localStorage.
 */
function saveCurrentCalculation() {
  if (!currentResult) return;

  const saved = getSavedCalculations();
  const subjectTitle = currentResult.subject || `Subject ${saved.length + 1}`;

  const itemToSave = {
    id: "sub_" + Date.now(),
    subject: subjectTitle,
    module1: currentResult.module1,
    module2: currentResult.module2,
    cla5: currentResult.cla5,
    total: currentResult.total,
    percentage: currentResult.percentage,
    date: new Date().toLocaleDateString()
  };

  saved.push(itemToSave);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    renderSavedList();
    actionFeedback.textContent = `"${subjectTitle}" saved successfully.`;
  } catch (err) {
    actionFeedback.textContent = "Unable to save to local storage.";
  }
}

/**
 * Delete a specific saved calculation by ID.
 */
function deleteCalculation(id) {
  let saved = getSavedCalculations();
  saved = saved.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (err) {
    // Ignore storage errors on deletion
  }
  renderSavedList();
}

/**
 * Clear all saved calculations from localStorage.
 */
function clearAllCalculations() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // Ignore storage errors
  }
  renderSavedList();
  actionFeedback.textContent = "All saved calculations cleared.";
}

/**
 * Render saved calculations list.
 */
function renderSavedList() {
  const saved = getSavedCalculations();

  if (saved.length === 0) {
    savedListEmpty.hidden = false;
    savedListContainer.hidden = true;
    savedListContainer.innerHTML = "";
    return;
  }

  savedListEmpty.hidden = true;
  savedListContainer.hidden = false;
  savedListContainer.innerHTML = "";

  saved.forEach((item) => {
    const row = document.createElement("div");
    row.className = "saved-card";

    const mainInfo = document.createElement("div");
    mainInfo.className = "saved-main-info";

    const title = document.createElement("div");
    title.className = "saved-title";
    title.textContent = item.subject;

    const details = document.createElement("div");
    details.className = "saved-details";
    details.textContent = `M1: ${formatNumber(item.module1)}/20 | M2: ${formatNumber(
      item.module2
    )}/30 | CLA5: ${formatNumber(item.cla5)}/10 — Total: `;

    const highlight = document.createElement("span");
    highlight.className = "saved-highlight";
    highlight.textContent = `${formatNumber(item.total)}/60 (${formatNumber(
      item.percentage
    )}%)`;

    details.appendChild(highlight);
    mainInfo.appendChild(title);
    mainInfo.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "saved-actions";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-sm-remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => deleteCalculation(item.id));

    actions.appendChild(removeBtn);
    row.appendChild(mainInfo);
    row.appendChild(actions);

    savedListContainer.appendChild(row);
  });
}

/**
 * Generate formatted text for sharing or copying.
 */
function generateResultText() {
  if (!currentResult) return "";

  const title = currentResult.subject
    ? `Internal Marks Calculation - ${currentResult.subject}`
    : "Internal Marks Calculation";

  return [
    title,
    `Module 1: ${formatNumber(currentResult.module1)} / 20`,
    `Module 2: ${formatNumber(currentResult.module2)} / 30`,
    `CLA5: ${formatNumber(currentResult.cla5)} / 10`,
    `Total: ${formatNumber(currentResult.total)} / 60`,
    `Percentage: ${formatNumber(currentResult.percentage)}%`
  ].join("\n");
}

/**
 * Copy results to clipboard.
 */
function copyResults() {
  const text = generateResultText();
  if (!text) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        actionFeedback.textContent = "Results copied to clipboard.";
      })
      .catch(() => {
        actionFeedback.textContent = "Failed to copy to clipboard.";
      });
  } else {
    // Fallback for browsers without navigator.clipboard
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      actionFeedback.textContent = "Results copied to clipboard.";
    } catch (err) {
      actionFeedback.textContent = "Failed to copy to clipboard.";
    }
    document.body.removeChild(textarea);
  }
}

/**
 * Share results using Web Share API with fallback to copy.
 */
function shareResults() {
  const text = generateResultText();
  if (!text) return;

  const title = currentResult.subject || "Internal Marks Calculation";

  if (navigator.share) {
    navigator
      .share({
        title: title,
        text: text
      })
      .then(() => {
        actionFeedback.textContent = "Shared successfully.";
      })
      .catch((err) => {
        // User cancellation is not considered an error to report
        if (err.name !== "AbortError") {
          copyResults();
        }
      });
  } else {
    copyResults();
  }
}

// Event Listeners
calculateBtn.addEventListener("click", calculateMarks);
resetBtn.addEventListener("click", resetForm);
saveSubjectBtn.addEventListener("click", saveCurrentCalculation);
copyResultBtn.addEventListener("click", copyResults);
shareResultBtn.addEventListener("click", shareResults);
clearAllBtn.addEventListener("click", clearAllCalculations);

// Real-time error clearance on input edit
[
  fa1Input,
  cla1Input,
  fa2Input,
  cla2Input,
  fa3Input,
  cla3Input,
  fa4Input,
  cla4Input,
  cla5Input
].forEach((el) => {
  el.addEventListener("input", () => {
    if (validationMessage.classList.contains("active")) {
      clearValidation();
    }
  });
});

// Initialize saved calculations display on load
document.addEventListener("DOMContentLoaded", renderSavedList);
