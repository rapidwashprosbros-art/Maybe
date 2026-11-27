# Rapid Wash Website

A plain HTML/CSS/JS website for Rapid Wash — no build step, no frameworks, no dependencies. Just files you can push straight to GitHub and host for free with GitHub Pages.

## File structure

```
index.html      homepage (and the original quote form)
services.html   services overview and published rates
*-cleaning.html / house-washing.html   one page per service
our-work.html   before/after drag sliders and photo gallery
service-area.html   radius map, travel fees, town checker
plans.html      yearly plan builder with instant estimate
about.html      about Rapid Wash
quote.html      step-by-step quote request (opens a pre-filled email)
site.js         slider, scroll-to-clean scene, map, fees, plan builder, quote steps
                (rates, travel fees and towns live at the top of site.js)
lights.html     Christmas lighting request form (noindex; sends to formsubmit.co)
styles.css      all styling
script.js       mobile menu, smooth scroll, and the quote form
assets/         photos and logo
favicon.svg     browser tab icon
og-pressure-washing.jpg   preview image for social media links (pressure washing card)
robots.txt      search engine crawling rules (points to sitemap.xml)
sitemap.xml     list of the site's public URLs for search engines
llms.txt        short plain-text summary of Rapid Wash for AI systems
llms-full.txt   full plain-text business details and FAQ for AI systems
agents.md       notes for AI agents helping someone contact Rapid Wash
```

## Keeping business details consistent

Rates, travel fees and the town list live at the top of `site.js`. The inner pages were generated from them; if you change a rate, also update the FAQ answer in `index.html` (visible FAQ and JSON-LD), `llms.txt`, `llms-full.txt` and `agents.md`.

The business description, services, service area and FAQ appear in several places: the About and FAQ sections of `index.html`, the JSON-LD structured data in `index.html`'s `<head>`, `llms.txt`, `llms-full.txt` and `agents.md`. When any business fact changes, update all of them. The visible FAQ and the FAQPage structured data must say exactly the same thing.

Never add review or rating markup (AggregateRating) unless it reflects real customer reviews shown on the site.

## Deploy with GitHub Pages (free hosting)

1. Create a new repository on GitHub (e.g. `rapid-wash-site`).
2. Upload all the files in this folder to the repository (drag-and-drop on github.com works, or use `git push`).
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`, pick the `main` branch and `/ (root)` folder, then save.
5. GitHub will give you a live URL like `https://yourusername.github.io/rapid-wash-site/` within a minute or two.

## Using a custom domain

In the same **Settings → Pages** screen, add your domain under **Custom domain**. You'll also need to point your domain's DNS at GitHub's servers — GitHub's docs walk through the exact records: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## About the quote form

This site has no backend/database, so the "Get Your Quote Fast" form doesn't submit anywhere on its own. Right now it opens the visitor's email app with a pre-filled message addressed to:

```
rapidwashprosbros@gmail.com
```

To change that address, open `script.js` and edit the `QUOTE_REQUEST_EMAIL` constant near the top of the file.

If you'd rather have form submissions land quietly in an inbox or spreadsheet (no email app popup for the visitor), a free service like [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) can do that — it just means swapping the form's submit handler for a fetch call to their endpoint. Ask if you'd like this wired up.

## Editing content

Everything is in plain HTML in `index.html` — phone numbers, service list, reviews, and section text can all be edited directly, no compiling required. Colors and spacing live in `styles.css` as CSS custom properties at the top of the file.
