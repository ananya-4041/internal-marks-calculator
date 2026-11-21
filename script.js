/**
 * Internal Marks Calculator
 * Logic for academic marks computation, validation, live updates,
 * local storage persistence, clipboard copying, and native sharing.
 */

/* ==========================================================================
   1. Central Configuration Section
   All evaluation formulas, limits, weights, and attendance tiers are configured here.
   ========================================================================== */
const CONFIG = {
  // Input field maximum limits and display labels
  limits: {
    fa1: { max: 10, label: "FA1" },
    cla1: { max: 10, label: "CLA1" },
    fa2: { max: 20, label: "FA2" },
    cla2: { max: 10, label: "CLA2" },
    fa3: { max: 20, label: "FA3" },
    cla3: { max: 10, label: "CLA3" },
    fa4: { max: 20, label: "FA4" },
    cla4: { max: 10, label: "CLA4" },
    cla5: { max: 10, label: "CLA5" }
  },

  // Module 1 Weightage & Formula parameters: (Sum / rawMax) * scaledMax
  module1: {
    rawMax: 50,
    scaledMax: 20
  },

  // Module 2 Weightage & Formula parameters: (Sum / rawMax) * scaledMax
  module2: {
    rawMax: 60,
    scaledMax: 30
  },

  // CLA5 Weightage parameters:
  // Scaled: (obtained / rawMax) * scaledMax [max 8]
  // Bonus: Attendance / Performance Category [max 2]
  // Total: Scaled + Bonus = 10 Marks
  cla5: {
    rawMax: 10,
    scaledMax: 8,
    bonusMax: 2,
    totalMax: 10
  },

  // Selectable Attendance & CLA5 Performance Bonus Tiers
  attendanceTiers: [
    {
      id: "below-80",
      label: "Below 80%",
      bonusMarks: 0,
      badge: "+0 Marks",
      minPercent: 0,
      maxPercent: 79.99
    },
    {
      id: "80-90",
      label: "80% – 89.99%",
      altLabel: "80%–90% inclusive",
      bonusMarks: 1,
      badge: "+1 Mark",
      minPercent: 80,
      maxPercent: 89.99
    },
    {
      id: "above-90",
      label: "90% and above",
      altLabel: "Above 90%",
      bonusMarks: 2,
      badge: "+2 Marks",
      minPercent: 90,
      maxPercent: 100
    }
  ],

  // Default selected tier ID ('above-90', '80-90', or 'below-80')
  defaultTierId: "above-90",

  // Maximum Internal Marks
  maxTotal: 60,

  // LocalStorage Key
  storageKey: "internal_marks_saved_subjects"
};

/* ==========================================================================
   2. State Management
   ========================================================================== */
let selectedAttendanceTierId = CONFIG.defaultTierId;
let currentResult = null;

/* ==========================================================================
   3. DOM Elements
   ========================================================================== */
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
const cla5Hint = document.getElementById("cla5Hint");

const attendancePills = document.querySelectorAll("#attendanceOptions .option-pill");
const validationMessage = document.getElementById("validationMessage");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");
const saveSubjectBtn = document.getElementById("saveSubjectBtn");

const resultsCard = document.getElementById("resultsCard");
const resultSubject = document.getElementById("resultSubject");
const resModule1 = document.getElementById("resModule1");
const resModule2 = document.getElementById("resModule2");
const resCla5 = document.getElementById("resCla5");
const resCla5Detail = document.getElementById("resCla5Detail");
const resAttendance = document.getElementById("resAttendance");
const resTotal = document.getElementById("resTotal");
const resPercentage = document.getElementById("resPercentage");

const copyResultBtn = document.getElementById("copyResultBtn");
const shareResultBtn = document.getElementById("shareResultBtn");
const actionFeedback = document.getElementById("actionFeedback");

const clearAllBtn = document.getElementById("clearAllBtn");
const savedListEmpty = document.getElementById("savedListEmpty");
const savedListContainer = document.getElementById("savedListContainer");

/* ==========================================================================
   4. Utility Functions
   ========================================================================== */

/**
 * Format a number preserving decimal precision up to 2 decimal places.
 * Eliminates redundant trailing zeroes (e.g., 8.00 -> 8, 8.50 -> 8.5).
 */
function formatNumber(val) {
  if (typeof val !== "number" || isNaN(val)) return "0";
  return parseFloat(val.toFixed(2)).toString();
}

/**
 * Retrieve the currently selected attendance tier configuration object.
 */
function getSelectedTier() {
  return (
    CONFIG.attendanceTiers.find((tier) => tier.id === selectedAttendanceTierId) ||
    CONFIG.attendanceTiers[0]
  );
}

/**
 * Clear validation error message and restore input border colors.
 */
function clearValidation() {
  validationMessage.textContent = "";
  validationMessage.classList.remove("active");
  Object.keys(CONFIG.limits).forEach((key) => {
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
 * Update the UI pill highlight state to match selectedAttendanceTierId.
 */
function updatePillVisuals() {
  attendancePills.forEach((pill) => {
    const tierId = pill.getAttribute("data-tier-id");
    const isSelected = tierId === selectedAttendanceTierId;
    pill.classList.toggle("selected", isSelected);
    pill.setAttribute("aria-checked", isSelected ? "true" : "false");
  });
}

/**
 * Set the attendance tier, highlight the selection, and trigger instant calculation.
 */
function setAttendanceTier(tierId) {
  selectedAttendanceTierId = tierId;
  updatePillVisuals();
  updateCla5Hint();
  // Live calculation update
  calculateMarks(true);
}

/**
 * Update the CLA5 helper hint in real time (e.g., "Scaled: 8 / 8 (+2 Bonus = 10 / 10)").
 */
function updateCla5Hint() {
  if (!cla5Hint) return;
  const rawVal = cla5Input.value.trim();
  const tier = getSelectedTier();
  const bonus = tier ? tier.bonusMarks : 0;

  if (rawVal === "" || isNaN(Number(rawVal))) {
    cla5Hint.textContent = `Scaled: 0 / ${CONFIG.cla5.scaledMax} (+${bonus} Bonus)`;
    return;
  }

  const num = Number(rawVal);
  if (num < 0 || num > CONFIG.cla5.rawMax) {
    cla5Hint.textContent = `Input must be between 0 and ${CONFIG.cla5.rawMax}`;
    return;
  }

  const scaled = (num / CONFIG.cla5.rawMax) * CONFIG.cla5.scaledMax;
  const totalCla5 = Math.min(scaled + bonus, CONFIG.cla5.totalMax);
  cla5Hint.textContent = `Scaled: ${formatNumber(scaled)} / ${CONFIG.cla5.scaledMax} (+${bonus} Bonus = ${formatNumber(totalCla5)} / ${CONFIG.cla5.totalMax})`;
}

/**
 * Validate all inputs.
 * @param {boolean} silent - If true, do not display error messages for empty fields (used for live typing).
 * @returns {object|null} Parsed values or null if invalid.
 */
function validateInputs(silent = false) {
  if (!silent) {
    clearValidation();
  }

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
      if (!silent) {
        showValidation(`Please enter marks for ${CONFIG.limits[key].label}.`, key);
      }
      return null;
    }

    const num = Number(val);
    if (isNaN(num)) {
      if (!silent) {
        showValidation(`${CONFIG.limits[key].label} must be a valid number.`, key);
      }
      return null;
    }

    if (num < 0) {
      if (!silent) {
        showValidation(`${CONFIG.limits[key].label} cannot be negative.`, key);
      }
      return null;
    }

    if (num > CONFIG.limits[key].max) {
      if (!silent) {
        showValidation(
          `${CONFIG.limits[key].label} cannot exceed the maximum of ${CONFIG.limits[key].max}.`,
          key
        );
      }
      return null;
    }

    parsed[key] = num;
  }

  return parsed;
}

/* ==========================================================================
   5. Core Calculation Engine
   Academic Scheme:
   - Module 1 (20 Marks) = (FA1 + CLA1 + FA2 + CLA2) / 50 * 20
   - Module 2 (30 Marks) = (FA3 + CLA3 + FA4 + CLA4) / 60 * 30
   - CLA5 (10 Marks)     = (Obtained / 10) * 8 + Attendance Bonus (0, 1, or 2)
   - Final Total (60 M)  = Module 1 + Module 2 + CLA5
   - Percentage          = (Final Total / 60) * 100
   ========================================================================== */
function calculateMarks(silent = false) {
  const values = validateInputs(silent);
  if (!values) {
    if (!silent) {
      currentResult = null;
      saveSubjectBtn.disabled = true;
    }
    return;
  }

  clearValidation();

  // 1. Module 1 calculation (Max 20)
  const m1RawSum = values.fa1 + values.cla1 + values.fa2 + values.cla2;
  const module1 = (m1RawSum / CONFIG.module1.rawMax) * CONFIG.module1.scaledMax;

  // 2. Module 2 calculation (Max 30)
  const m2RawSum = values.fa3 + values.cla3 + values.fa4 + values.cla4;
  const module2 = (m2RawSum / CONFIG.module2.rawMax) * CONFIG.module2.scaledMax;

  // 3. CLA5 calculation (Max 10):
  // Scale obtained CLA5 marks to 8: (Obtained / Maximum) * 8
  const cla5Scaled = (values.cla5 / CONFIG.cla5.rawMax) * CONFIG.cla5.scaledMax;

  // Attendance & Performance Bonus (0, 1, or 2 Marks)
  const tier = getSelectedTier();
  const attendanceBonus = tier ? tier.bonusMarks : 0;

  // Final CLA5 = Scaled Marks + Performance Bonus (Max 10 Marks)
  const cla5Total = Math.min(cla5Scaled + attendanceBonus, CONFIG.cla5.totalMax);

  // 4. Overall Internal Marks Total (Max 60 Marks)
  const total = Math.min(module1 + module2 + cla5Total, CONFIG.maxTotal);

  // 5. Overall Percentage
  const percentage = (total / CONFIG.maxTotal) * 100;

  const subjectName = subjectNameInput.value.trim();

  currentResult = {
    subject: subjectName,
    rawValues: values,
    module1,
    module2,
    cla5Scaled,
    attendanceBonus,
    attendanceTier: tier.label,
    cla5: cla5Total,
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

  resModule1.textContent = `${formatNumber(module1)} / ${CONFIG.module1.scaledMax}`;
  resModule2.textContent = `${formatNumber(module2)} / ${CONFIG.module2.scaledMax}`;
  resCla5.textContent = `${formatNumber(cla5Total)} / ${CONFIG.cla5.totalMax}`;
  if (resCla5Detail) {
    resCla5Detail.textContent = `Scaled: ${formatNumber(cla5Scaled)} / ${CONFIG.cla5.scaledMax} | Bonus: ${attendanceBonus} / ${CONFIG.cla5.bonusMax}`;
  }
  if (resAttendance) {
    resAttendance.textContent = `${attendanceBonus} / ${CONFIG.cla5.bonusMax}`;
  }
  resTotal.textContent = `${formatNumber(total)} / ${CONFIG.maxTotal}`;
  resPercentage.textContent = `${formatNumber(percentage)}%`;

  resultsCard.hidden = false;
  saveSubjectBtn.disabled = false;
  actionFeedback.textContent = "";
}

/**
 * Reset all inputs, clear state, restore default attendance option, and hide results.
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

  selectedAttendanceTierId = CONFIG.defaultTierId;
  updatePillVisuals();
  updateCla5Hint();

  clearValidation();
  resultsCard.hidden = true;
  saveSubjectBtn.disabled = true;
  actionFeedback.textContent = "";
  currentResult = null;
}

/* ==========================================================================
   6. LocalStorage Persistence
   ========================================================================== */

function getSavedCalculations() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

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
    cla5Scaled: currentResult.cla5Scaled,
    attendanceBonus: currentResult.attendanceBonus,
    attendanceTier: currentResult.attendanceTier,
    total: currentResult.total,
    percentage: currentResult.percentage,
    date: new Date().toLocaleDateString()
  };

  saved.push(itemToSave);

  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(saved));
    renderSavedList();
    actionFeedback.textContent = `"${subjectTitle}" saved successfully.`;
  } catch (err) {
    actionFeedback.textContent = "Unable to save to local storage.";
  }
}

function deleteCalculation(id) {
  let saved = getSavedCalculations();
  saved = saved.filter((item) => item.id !== id);
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(saved));
  } catch (err) {
    // Ignore storage errors on deletion
  }
  renderSavedList();
}

function clearAllCalculations() {
  try {
    localStorage.removeItem(CONFIG.storageKey);
  } catch (err) {
    // Ignore storage errors
  }
  renderSavedList();
  actionFeedback.textContent = "All saved calculations cleared.";
}

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

    const attText = item.attendanceBonus !== undefined ? ` | Att: ${item.attendanceBonus}/2` : "";
    details.textContent = `M1: ${formatNumber(item.module1)}/20 | M2: ${formatNumber(
      item.module2
    )}/30 | CLA5: ${formatNumber(item.cla5)}/10${attText} | Total: `;

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

/* ==========================================================================
   7. Copy & Share Support
   ========================================================================== */

function generateResultText() {
  if (!currentResult) return "";

  const title = currentResult.subject
    ? `Internal Marks Calculation - ${currentResult.subject}`
    : "Internal Marks Calculation";

  return [
    title,
    `Module 1: ${formatNumber(currentResult.module1)} / 20`,
    `Module 2: ${formatNumber(currentResult.module2)} / 30`,
    `CLA5 (Scaled): ${formatNumber(currentResult.cla5Scaled)} / 8`,
    `Attendance / Performance: ${formatNumber(currentResult.attendanceBonus)} / 2 (${currentResult.attendanceTier})`,
    `Final CLA5: ${formatNumber(currentResult.cla5)} / 10`,
    `Total: ${formatNumber(currentResult.total)} / 60`,
    `Percentage: ${formatNumber(currentResult.percentage)}%`
  ].join("\n");
}

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
        fallbackCopy(text);
      });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
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
        if (err.name !== "AbortError") {
          copyResults();
        }
      });
  } else {
    copyResults();
  }
}

/* ==========================================================================
   8. Event Listeners & Initialization
   ========================================================================== */

// Buttons
calculateBtn.addEventListener("click", () => calculateMarks(false));
resetBtn.addEventListener("click", resetForm);
saveSubjectBtn.addEventListener("click", saveCurrentCalculation);
copyResultBtn.addEventListener("click", copyResults);
shareResultBtn.addEventListener("click", shareResults);
clearAllBtn.addEventListener("click", clearAllCalculations);

// Attendance / Performance category option pills
attendancePills.forEach((pill) => {
  pill.addEventListener("click", () => {
    const tierId = pill.getAttribute("data-tier-id");
    setAttendanceTier(tierId);
  });

  pill.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const tierId = pill.getAttribute("data-tier-id");
      setAttendanceTier(tierId);
    }
  });
});

// Real-time instant calculation & hint updates on input
const allInputs = [
  fa1Input,
  cla1Input,
  fa2Input,
  cla2Input,
  fa3Input,
  cla3Input,
  fa4Input,
  cla4Input,
  cla5Input
];

allInputs.forEach((el) => {
  el.addEventListener("input", () => {
    if (validationMessage.classList.contains("active")) {
      clearValidation();
    }
    updateCla5Hint();
    // Instant live calculation
    calculateMarks(true);
  });
});

if (subjectNameInput) {
  subjectNameInput.addEventListener("input", () => {
    if (currentResult) {
      const subjectName = subjectNameInput.value.trim();
      currentResult.subject = subjectName;
      if (subjectName) {
        resultSubject.textContent = subjectName;
        resultSubject.style.display = "block";
      } else {
        resultSubject.textContent = "";
        resultSubject.style.display = "none";
      }
    }
  });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  updatePillVisuals();
  updateCla5Hint();
  renderSavedList();
});
