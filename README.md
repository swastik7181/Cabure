<div align="center">

  <img src="https://img.shields.io/badge/Real--Time-Cab%20Fare%20Comparator-FF4500?style=for-the-badge&logo=uber&logoColor=white" alt="Cabure">

  <h1>Caburé 🚕</h1>

  <p><strong>Compare Uber, Ola & Meru fares side by side</strong><br>
  route mapping, a live chart, and a one-tap PDF report.</p>

</div>

## What changed in this rebuild

The original project was a single Puppeteer script (`main.js`) with no
server, no `package.json`, hardcoded personal email/local file paths, and a
frontend `index.html` that got overwritten in place every run. This version
splits it into a proper client/server app:

- **`backend/`** — an Express API that runs the Uber/Ola/Meru/Google Maps
  scrapers, builds a PDF report, and optionally emails it. Configuration
  (ports, CORS, mock mode, SMTP credentials) now lives in environment
  variables instead of being hardcoded in source.
- **`frontend/`** — a standalone, responsive single-page app (no build step)
  that calls the API, shows a live bar chart (Chart.js) of fares by vehicle
  type, and renders each provider as its own "ticket" card with a book link.

## ⚠️ Before you rely on live scraping

`getUber`, `getOla`, `getMeru`, and `getMap` drive real Chromium tabs against
Uber, taxifarefinder.com (used as an Ola fare proxy, same as the original
project), Meru, and Google Maps' **public, unauthenticated pages** using CSS
selectors. That means:

- Any redesign of those pages can silently break a selector. Every scraper
  step is wrapped so a failure degrades to `"NOT AVAILABLE"` for that one
  entry instead of crashing the whole request, but you should expect to
  maintain selectors over time.
- Automating a third-party site's UI may conflict with that site's Terms of
  Service. Review each provider's ToS before deploying this for real users,
  and prefer an official/partner API where one exists.
- Set `USE_MOCK_DATA=true` (the default) to develop and demo against
  realistic sample data with zero browser automation. Flip it to `false`
  only once you've confirmed live scraping still works for your target
  cities.

## Project structure

```
cabure/
├── backend/
│   ├── server.js                 # Express app entrypoint
│   ├── .env.example              # copy to .env and fill in
│   └── src/
│       ├── config.js             # env-driven configuration
│       ├── logger.js
│       ├── routes/compare.routes.js
│       ├── controllers/compare.controller.js
│       ├── services/
│       │   ├── report.service.js # orchestrates scraping (or mock data)
│       │   ├── pdf.service.js    # renders a report to PDF via Puppeteer
│       │   └── email.service.js  # optional email/WhatsApp delivery
│       ├── scrapers/
│       │   ├── browser.js        # shared Puppeteer helpers
│       │   ├── uber.scraper.js
│       │   ├── ola.scraper.js
│       │   ├── meru.scraper.js
│       │   └── map.scraper.js
│       └── data/mock-fares.json  # sample data for USE_MOCK_DATA=true
└── frontend/
    ├── index.html
    ├── css/styles.css
    └── js/app.js
```

## Running it locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit values as needed
npm start                 # or: npm run dev (nodemon)
```

The API listens on `http://localhost:4000` by default and exposes:

| Method | Path            | Description                                  |
|--------|-----------------|-----------------------------------------------|
| GET    | `/api/health`   | Liveness check + whether mock mode is on       |
| POST   | `/api/compare`  | `{ source, destination, email? }` → fare report |
| GET    | `/reports/:id/*`| Static PDF report + map screenshot for a run   |

### 2. Frontend

The frontend is plain HTML/CSS/JS with no build step. Serve it with any
static file server, e.g.:

```bash
cd frontend
npx serve .          # or: python3 -m http.server 5500
```

Then open the printed URL in your browser. If your backend isn't on
`http://localhost:4000`, set `window.CABURE_API_BASE` before `app.js` loads,
e.g. add this above the `<script src="./js/app.js">` tag in `index.html`:

```html
<script>window.CABURE_API_BASE = "https://api.your-domain.com";</script>
```

### 3. Try it

With the default `USE_MOCK_DATA=true`, submitting any two locations
immediately returns a sample comparison — useful for checking the UI without
launching a real browser. Set `USE_MOCK_DATA=false` in `backend/.env` to
scrape live fares (requires Chromium, which `npm install` fetches for you
via Puppeteer).

## Email delivery (optional)

To let users email themselves a copy of the PDF report, set `EMAIL_USER` and
`EMAIL_APP_PASSWORD` in `backend/.env`. For Gmail, generate an
[App Password](https://support.google.com/accounts/answer/185833) — never
put your real account password in the `.env` file. Leave these blank to
disable the feature; the API will simply skip sending and say so in its
response.

## Security notes

- Secrets live in `.env` (git-ignored) instead of source files. The original
  project's `data/credentials.txt` (a hardcoded personal email) and the
  `../password.txt` / `../token.txt` files it read from outside the repo
  have been removed in favor of environment variables.
- The API validates and length-limits `source`/`destination`/`email`, rate
  limits `/api`, and sets standard security headers via `helmet`.
- CORS is locked to `CORS_ORIGIN` in production — set it to your real
  frontend origin(s) before deploying.

## Tech stack

- **Backend**: Node.js, Express, Puppeteer, Nodemailer, (optional) Twilio
- **Frontend**: HTML5, CSS3, vanilla JavaScript, Chart.js
- **Reports**: server-rendered HTML → PDF via headless Chromium
