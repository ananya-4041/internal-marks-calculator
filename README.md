# Internal Marks Calculator

A client-side academic marks calculator designed for computing internal assessment marks according to the prescribed multi-module evaluation scheme with scaled CLA5 and attendance/performance bonus allocation.

## Evaluation Structure

### Module 1 (20 Marks)
- **FA1:** Maximum 10
- **CLA1:** Maximum 10
- **FA2:** Maximum 20
- **CLA2:** Maximum 10
- **Formula:** `(FA1 + CLA1 + FA2 + CLA2) / 50 × 20`

### Module 2 (30 Marks)
- **FA3:** Maximum 20
- **CLA3:** Maximum 10
- **FA4:** Maximum 20
- **CLA4:** Maximum 10
- **Formula:** `(FA3 + CLA3 + FA4 + CLA4) / 60 × 30`

### CLA5 & Attendance (10 Marks)
- **CLA5 Scaled Component (8 Marks):**
  - Raw Marks: Maximum 10
  - Scaled Formula: `(Obtained Marks / 10) × 8`
- **Attendance / Performance Bonus (2 Marks):**
  - Selectable category options:
    - **Below 80%:** 0 Marks
    - **80%–89.99% (80%–90% inclusive):** 1 Mark
    - **90% and above:** 2 Marks
- **Final CLA5 Formula:** `Scaled Marks (max 8) + Attendance Bonus (max 2) = Maximum 10 Marks`

### Final Internal Total (60 Marks Max)
- **Formula:** `Module 1 (20) + Module 2 (30) + Final CLA5 (10) = 60 Marks Max`
- **Percentage Formula:** `(Final Total / 60) × 100`
- *Note:* Attendance is incorporated directly within the 10-mark CLA5 structure to maintain the strict 60-mark total limit without double-counting.

---

## Features
- **Real-Time Instant Calculation:** Calculations and previews update instantly as marks are typed and attendance tiers are selected.
- **Selectable Category Options:** Visual interactive pastel chips for Attendance / Performance bonus selection with instant state highlight.
- **Centralized Configuration:** All evaluation formulas, limits, weights, and attendance tiers are defined in a clean `CONFIG` object in `script.js`.
- **Input Validation:** Enforces non-negative inputs and field-specific maximum boundaries.
- **Persistence:** Subject-wise local saving via browser `localStorage`.
- **Copy & Share:** Integrated clipboard copy and native Web Share API support.
- **Collapsible Formula Reference:** Built-in interactive formula guide explaining the calculation scheme.
- **Responsive Pastel UI:** Clean pastel aesthetic optimized for both desktop and mobile viewports.

---

## File Structure
- `index.html`: Semantic markup, accessibility attributes (`role="radiogroup"`, `role="radio"`, `aria-live`), and structure.
- `style.css`: Design tokens, pastel color palette, interactive option pills, and responsive styles.
- `script.js`: Central configuration section (`CONFIG`), validation logic, calculation engine, live updates, and `localStorage` handling.
- `README.md`: System documentation and calculation reference.

---

## Deployment
- **Live Application:** [https://ananya-4041.github.io/internal-marks-calculator/](https://ananya-4041.github.io/internal-marks-calculator/)
- **GitHub Repository:** [https://github.com/ananya-4041/internal-marks-calculator](https://github.com/ananya-4041/internal-marks-calculator)
