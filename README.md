# CFI Checkride Study Notes + FOI + Oral Prep Study App

This repository now includes the original study-note files, ACS-organized lesson plans, and a static mobile-friendly flashcard/quiz app with both an FOI deck and a DPE-style oral prep deck for GitHub Pages.

## What is in the repo

### Study app
- `index.html` — main entry point for the FOI + Oral Prep app
- `app.css` — mobile-first styling
- `app.js` — flashcard, quiz, deck switching, shuffle, filtering, and localStorage logic
- `data/foi.json` — FOI study content
- `data/oral-prep.json` — ACS-aligned oral prep question bank (114 questions)

### Oral prep markdown set
- `oral-prep/README.md` — oral prep category index
- `oral-prep/*.md` — per-category Q&A files for browsing/printing

### Existing study content preserved in the repo
- `Task-A-Effects-of-Human-Behavior-and-Communication.md`
- `Task-B-Learning-Process.md`
- `Task-C-Course-Development-Lesson-Plans-Classroom-Techniques.md`
- `Task-D-Student-Evaluation-Assessment-Testing.md`
- `Task-E-Effective-Teaching-in-Professional-Environment.md`
- `Task-F-Elements-of-Effective-Teaching-Risk-Management.md`
- `flight-review-flashcards.html`
- `ACS-Task-Notes-Template.md`

## App features
- Flashcard mode with tap/click flip
- **Got it** / **Review again** progress tracking saved in `localStorage`
- Selectable deck: **FOI** or **Oral Prep**
- Category filter for the current deck
- Shuffle option for the current deck
- Quiz mode using the same JSON content as the flashcards
- Immediate feedback plus a score summary at the end of the quiz
- Mobile-friendly layout with large tap targets

## How to use the app

### On GitHub Pages
Open `index.html` from the published site and study on any phone, tablet, or desktop browser.

### Locally without a build step
Because the app loads `data/foi.json`, use a simple static file server instead of opening `index.html` directly as a `file://` URL.

Example:

```bash
cd /path/to/CFI-Checkride
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Enable GitHub Pages for this repo
1. Push the repository contents to GitHub.
2. Open **Settings** in the `breadrooster28/CFI-Checkride` repository.
3. Go to **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the branch you want to publish (usually `main`) and the **`/ (root)`** folder.
6. Save the settings and wait for GitHub Pages to publish the site.
7. Open the published site URL and use `index.html` as the landing page.

## Add or edit cards
Deck content lives in:

- `data/foi.json`
- `data/oral-prep.json`

Each card uses this structure:

```json
{
  "id": "hb-01",
  "category": "Human Behavior and Effective Communication",
  "prompt": "What five human needs are commonly described in Maslow's hierarchy for FOI study?",
  "answer": "Physiological, safety and security, belonging, esteem, and self-actualization.",
  "reference": "FAA-H-8083-9, Human Behavior chapter"
}
```

### Supported categories in the FOI deck
- Human Behavior and Effective Communication
- The Learning Process
- Effective Teaching
- Assessment and Critique
- Instructor Responsibilities and Professionalism
- Techniques of Flight Instruction
- Risk Management

### Tips for adding new cards
- Keep every `id` unique.
- Reuse the existing category names if you want cards to appear under the current filter options.
- Write concise prompts and accurate FAA-based answers.
- The quiz mode automatically builds multiple-choice options from the same JSON file, so no extra quiz file is needed.

### Oral prep card fields
The oral prep deck also includes:

- `area` (ACS area of operation)
- `task` (ACS task)
- `gotcha` (optional DPE follow-up/common miss)
- `scenario` (optional boolean for scenario-style prompts)

## Existing notes usage
The markdown task files remain in the repository and are linked from `index.html` so the new app lives alongside the original study content instead of replacing it.
