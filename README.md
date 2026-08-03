# custom-browser

Electron BrowserView-based sample browser.

Quick start (local dev)
1. npm install
2. npm start

Build (local)
1. npm run dist
   - Builds platform-specific installer/package for the current host OS.

CI / Releases
- The repository includes a GitHub Actions workflow (.github/workflows/build-and-release.yml) that builds on Linux/Windows/macOS runners and uploads artifacts.
- To publish to GitHub Releases automatically when pushing a tag (v1.0.0), create a Personal Access Token (repo scope) and add it to repository secrets as `GH_TOKEN`.

GitHub Pages demo
- A static demo (iframe-based) is in the `docs/` folder. To publish:
  - In repo Settings → Pages choose Branch: `main`, Folder: `/docs`.
  - NOTE: many external sites set X-Frame-Options/CSP that prevent being embedded in an iframe — pick an embeddable demo site.

Security notes
- BrowserView views run in main; keep `nodeIntegration: false`.
- The preload bridge exposes only limited IPC calls.
- Do not commit GH_TOKEN or other secrets to the repo.

If you want, I can:
- Add session persistence (save/restore tabs).
- Add favicons and thumbnails in the UI.
- Add a view-preload content script to capture favicons or messaging.
