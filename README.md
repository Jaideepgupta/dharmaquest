# DharmaQuest — Homepage Starter

A responsive Next.js homepage concept for DharmaQuest, designed with a contemporary fusion visual direction: modern learning-app usability with subtle Indian cultural motifs.

## Included
- Responsive desktop and mobile homepage
- Scripture collection cards with category filters and live search
- Brief / Detailed lesson preview toggle
- Daily wisdom feature
- Six Darshanas overview
- Beginner, explorer and dedicated-student learning paths
- Mobile navigation
- PWA manifest starter

## Run locally
1. Install Node.js 20 or later.
2. Extract this folder.
3. In the project directory run:

```bash
npm install
npm run dev
```

4. Open http://localhost:3000

## Build
```bash
npm run build
npm start
```

## Publish with GitHub + Vercel
1. Create a new empty GitHub repository named `dharmaquest`.
2. In this folder run:
   ```bash
   git init
   git add .
   git commit -m "Initial DharmaQuest homepage"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/dharmaquest.git
   git push -u origin main
   ```
3. Import the repository into Vercel and deploy. Vercel detects Next.js automatically.

## Deployment
The site is deployed on Vercel from the `main` branch of this repository. Pushes to `main` build production; other branches get preview deployments.

## Project structure
- `app/` — routes: `/`, `/scriptures`, `/scriptures/[slug]`, `/gita`, `/gita/[slug]`, `/gita/bhagavad-gita`, `/gita/bhagavad-gita/[chapter]`, `/gita/bhagavad-gita/[chapter]/[verse]`, `/darshanas`, `/darshanas/[slug]`, `/learn`, `/about`, plus `sitemap.xml` and `robots.txt`.
- `components/` — shared UI (header, search dialog, footer, page header, explore grid, lesson preview).
- `lib/content/` — typed, static content (`scriptures.ts`, `darshanas.ts`, `verses.ts`, `gita.ts`) and the search index. `gita.ts` holds the Gita catalogue, the 18 Bhagavad Gita chapter guides and verse study records. This layer is the seam for a future database: swap these modules for queries without changing the UI.

## Adding a verse study page
Add a `VerseStudy` to `verseStudies` in `lib/content/gita.ts`. A page is generated only for verses listed there. Before adding: verify the Sanskrit against a public-domain text, give every translation a named translator and a public-domain or licensed source, and keep your own summaries labelled as DharmaQuest editorial. Datasets whose code is public domain (e.g. Unlicense) may still contain copyrighted translations: check the translation's own licence before reuse.

## Content rules
- No verse is added without a source (`SourceRef`). Never invent Sanskrit, chapter or verse references.
- Translations are added only with a named translator and a public-domain or licensed text. Until then the status is `under-review` and the UI shows "Content under review".
- Shruti, Smriti, Itihasa, Purana and philosophical literature are kept distinct (`classification`).
- Disputed or unverified facts (dates, counts) are omitted or flagged, never guessed.

## Product architecture direction
This is a front-end prototype. It intentionally uses sample/static content and does not yet include accounts, a CMS, a database, verse-source licensing, or progress persistence. A future shared backend (e.g. Supabase/PostgreSQL) can power both this Next.js website and a React Native + Expo mobile app.

## Content integrity note
Scriptural wording and translations should be reviewed against identified editions and translators before launch. The current daily wisdom excerpt is an illustrative homepage sample, not a complete scholarly citation system.
