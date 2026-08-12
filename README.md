# Battery Wale — Website

A single-page site for Battery Wale (Asansol, WB) with tabbed navigation:
Home, About, Product Catalogue, **Inverter & Battery Requirement** (the load
calculator), Testimonial, and Contact Us.

## Files

```
index.html   → all page content + tab sections
style.css    → all styling (no external CSS framework)
script.js    → tab switching + calculator logic
```

No build step, no dependencies to install — it's plain HTML/CSS/JS. The only
external requests are Google Fonts (Oswald, Inter, JetBrains Mono).

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy on GitHub Pages

1. Create a new GitHub repository and push these three files (plus this
   README) to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In the repo on GitHub: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick branch `main` and folder `/ (root)`, then **Save**.
5. Wait a minute, then your site will be live at:
   `https://<your-username>.github.io/<your-repo>/`

Each nav tab updates the URL hash (e.g. `#calculator`, `#contact`), so you can
link straight to a tab, like
`https://<your-username>.github.io/<your-repo>/#calculator`.

## Connect the Contact form (Google Sheet + email, via Apps Script)

The Contact Us form (Name, Email, Contact number, Message) is wired to
submit to a **Google Apps Script Web App**. On every submission it:

- appends a row to a Google Sheet with a **timestamp**, and
- **emails you** a notification with the enquiry details.

There's no server to host — Google runs the script for free. Setup:

1. **Create a Google Sheet.** Any name, e.g. "Battery Wale Enquiries".
2. In the Sheet: **Extensions → Apps Script**. Delete the placeholder
   `myFunction() {}` code and paste in the contents of
   [`apps-script/Code.gs`](apps-script/Code.gs) from this repo.
3. In that pasted code, change this line to your real inbox:
   ```js
   var NOTIFY_EMAIL = 'your-email@example.com';
   ```
4. Click **Deploy → New deployment**. For "Select type" choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy**, then **Authorize access** and approve the permissions
   (it's your own script acting on your own Sheet and Gmail, so this is safe).
5. Copy the **Web app URL** shown (it ends in `/exec`).
6. Open `script.js` in this repo and paste that URL in:
   ```js
   const APPS_SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
7. Commit and push. Submit a test enquiry on the live site — you should
   see a new row (with timestamp) in your Sheet, and an email in your inbox.

**If you edit `Code.gs` later:** go to **Deploy → Manage deployments →
Edit (pencil) → New version → Deploy**. Editing the script alone doesn't
update the live `/exec` URL until you redeploy a new version.

**If submissions don't seem to arrive:** open the `/exec` URL directly in
a browser — you should see `{"status":"Battery Wale form endpoint is
running."}`. If you get a permissions or login page instead, redo step 4
and make sure "Who has access" is set to **Anyone**, not "Anyone with a
Google account" or "Only myself".

## Things you'll likely want to personalize

- Swap the placeholder phone/email/address in the Contact tab and calculator
  CTA for your real details (currently uses the numbers from the original
  site: `+91 96479 61843`, `chittaranjantrading@email.com`).
- The contact form doesn't send anywhere yet (GitHub Pages can't run a
  backend). Easiest fix: point it at a form service like Formspree or
  Getform, or swap it for a `mailto:` link.
- Replace the product-catalogue icons/testimonial photos with real photos
  once you have them — everything currently uses lightweight inline SVG so
  there are no broken image links.
