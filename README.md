# Ham Radio Test Prep

A study app for the US FCC amateur radio license exams. It starts with **Technician (Element 2)** and uses the official **2026–2030 question pool**.

## Features
- **Study by topic.** Work through any subelement (T1–T0) or a single group. Each question shows an explanation as soon as you answer it.
- **Practice exams.** These are built like the real exam: 35 questions, one random question from each of the 35 groups, and 26 correct answers to pass.
- **Smart review.** Spaced repetition (Leitner boxes) plus decks for missed questions, questions you haven't seen yet, and flagged questions.
- **Dashboard.** Shows mastery by subelement, an estimated exam score, readiness, and your exam history.
- **AI tutor.** Ask follow-up questions about any question using Claude (`claude-opus-5-5`). It uses each person's own Anthropic API key.
- **License guide.** Covers requirements, the steps to get licensed, and Technician privileges.

## Run it
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

## The AI tutor and API keys
The tutor calls the Anthropic API directly from the browser, using the key entered on the Settings page. The key is stored in that browser's localStorage and is never sent anywhere except api.anthropic.com. This lets the app be hosted as a plain static site, where each person who uses it brings their own key. Do **not** build a key into the app.

## Data
- `source_data/`: the original NCVEC pool file (Feb 19, 2026 revision, which includes the errata) (figures T1–T3 are in `public/figures/`).
- `scripts/parse_pool.py`: converts the pool to `src/data/technician_pool.json`. To regenerate it:
  `textutil -convert txt -output source_data/tech_pool.txt source_data/tech_pool_2026_feb19.docx && python3 scripts/parse_pool.py source_data/tech_pool.txt src/data/technician_pool.json`
- `src/data/explanations/*.json`: original explanations keyed by question id. They are AI-written, so review them and correct any that are wrong.

The question pool is public domain (NCVEC Question Pool Committee).

## Hosting publicly
`npm run build` produces a static `dist/` folder with relative paths. You can deploy it to GitHub Pages, Netlify, Cloudflare Pages, or any static host.
