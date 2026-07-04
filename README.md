# Rapid Wash Website

A single-page marketing site for Rapid Wash, a pressure-washing business in Smith County, TN.

## What's inside
- `index.html` — the entire site (HTML + Tailwind via CDN + vanilla JS). No build step required.
- `images/` — all photos and the logo used on the page.

## Deploying to GitHub Pages
1. Create a new GitHub repository (or use an existing one).
2. Upload `index.html` and the `images/` folder to the repo root, keeping the folder structure intact.
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a branch".
5. Choose the branch (usually `main`) and folder `/ (root)`, then save.
6. GitHub will give you a URL like `https://yourusername.github.io/your-repo-name/` — the site will be live there within a minute or two.

## Editing content
- Phone number, email, and copy live directly in `index.html` — search for the text you want to change.
- The quote form saves submitted leads to the visitor's browser `localStorage` under the key `rapidWashLeads` (there's no backend). Connect it to a real form service (e.g. Formspree, Netlify Forms) or your own API if you want leads emailed or stored centrally.
- To swap a photo, replace the file in `images/` with a new file of the same name, or update the `src="images/..."` path in `index.html`.

## Local preview
Just open `index.html` in a browser, or run a simple local server from this folder:
```
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.
