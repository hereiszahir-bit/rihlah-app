# Contributing to Rihlah

## Workflow

1. Create a branch off `main` for your work
2. Make changes, commit, push your branch
3. Open a Pull Request — Z reviews before merging

Never push directly to `main`.

## Safe zones (design + content contributors)

You can freely edit these files:

### Content & data
- `src/data/destinations.js` — destination info, experiences, pricing, descriptions
- Text/copy in any component (button labels, headings, descriptions)

### Styling
- `src/App.css` — global styles
- `src/index.css` — base styles
- Inline styles within components you're editing

### Components (visual changes only)
- `src/components/ExperiencesTab.js` — experience card layout
- `src/components/DestinationGrid.js` — destination card layout
- `src/components/OnboardingCards.js` — onboarding visuals
- `src/pages/ModernHome.js` — landing page content and styling

### Static assets
- `public/` — images, icons, favicon

## Do not edit (without checking with Z first)

- `src/context/UserContext.js` — state management
- `src/firebase.js` — backend configuration
- `src/App.js` — routing and auth logic
- `scripts/` — admin utilities
- `firestore.rules` — security rules
- `package.json` — dependencies
- `CLAUDE.md` — AI project context

## Branch naming

Use descriptive branch names:
- `design/landing-page-refresh`
- `content/add-london-experiences`
- `style/destination-card-spacing`

## Commit messages

Keep them short and clear:
- "Update Istanbul experience descriptions"
- "Fix card spacing on destinations grid"
- "Add new hero image to landing page"

## Running locally

```bash
npm install
npm start
```

App runs at http://localhost:3000.

## Questions?

If you're unsure whether a change is safe, ask Z before pushing.
