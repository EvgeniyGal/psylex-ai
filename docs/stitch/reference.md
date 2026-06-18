# Stitch Reference

Project: `4139161588628616929`

## Target Screens

- Prism concept: `439cef063c644a748e736da04ec6ac28`
- Logo: `6a083dbbd6704172a6dd7124e35f29f5`
- Design system: `asset-stub-assets_3ff8f14bec7d444e8876edaff18e1443`
- Landing page: `10542681353879881039`
- Admin settings: `c1d10cd876204d948c6f251dce359da5`
- Admin sessions: `f3c62eb393d74211b14458d98342016d`
- Admin mediators: `27c3a600e85a40fc8824fb686d3f7501`
- Welcome screen: `e860d541e7cc46c3a554af3ad1ca549a`
- Disclaimer & consent: `a44ea237b6ed4933b823d8ddffb3feda`
- Testing dashboard: `e68406b2ae684411886bbebe2b284205`

## Asset Files

Downloaded via `node scripts/fetch-stitch.mjs`:

- `prism-concept.png` — hero background art
- `logo.png` — brand mark
- `landing-how-it-works.html` + `.png` — landing page reference
- `admin-settings.html` + `.png`
- `admin-sessions.html` + `.png`
- `admin-mediators.html` + `.png`
- `welcome-screen.html` + `.png`
- `disclaimer-consent.html` + `.png`
- `testing-dashboard.html` + `.png`

Runtime copies in `public/stitch/` for Next.js image serving.

## Design Tokens (from Stitch)

- Background: `#070f2b`
- Surface/Card: `#0f1a3f`
- Accent/Beam: `#f3c969`
- Text primary: `#f5f7ff`
- Text muted: `#9fb0d9`

## Asset Download Commands

Use Stitch MCP `get_screen` to retrieve each screen's `htmlCode.downloadUrl` and `screenshot.downloadUrl`, then:

```bash
curl -L "<downloadUrl>" -o "docs/stitch/<name>.html"
curl -L "<downloadUrl>" -o "docs/stitch/<name>.png"
```
