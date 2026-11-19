# Internal Marks Calculator

A client-side calculator for computing academic internal assessment marks according to the prescribed multi-module evaluation scheme.

Calculation System:

Module 1 (20 Marks):
- FA1: Maximum 10
- CLA1: Maximum 10
- FA2: Maximum 20
- CLA2: Maximum 10
Formula: (FA1 + CLA1 + FA2 + CLA2) / 50 * 20

Module 2 (30 Marks):
- FA3: Maximum 20
- CLA3: Maximum 10
- FA4: Maximum 20
- CLA4: Maximum 10
Formula: (FA3 + CLA3 + FA4 + CLA4) / 60 * 30

CLA5 (10 Marks):
- Maximum 10
- Raw marks added directly

Final Total:
- Maximum 60 Marks
- Final Total = Module 1 + Module 2 + CLA5
- Percentage = (Final Total / 60) * 100

Features:
- Module-wise breakdown and final total computation.
- Decimal precision formatting.
- Client-side validation preventing negative inputs and values above maximum limits.
- Subject-wise local saving via browser localStorage.
- Copy results to clipboard and native Web Share API support.
- Collapsible formula reference section.
- Fully responsive layout with pastel aesthetics.

File Structure:
- index.html: Semantic document structure and accessibility attributes.
- style.css: Modular styling, design tokens, and responsive layout rules.
- script.js: Calculation logic, validation, localStorage operations, and UI interactions.
- README.md: Project documentation and specification details.

Future Maintenance:
All source code files are unminified, clean, and directly editable. Changes pushed to the main branch automatically deploy via GitHub Pages.
