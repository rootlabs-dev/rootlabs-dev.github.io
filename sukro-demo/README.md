# Sukro Hotel Website

A clean, mobile-responsive website for **Sukro Hotel** — a modern hotel on La Salle Avenue, Bacolod City, Philippines.

## What's Included

- **6 pages**: Home, Rooms, Amenities, About, Gallery, Contact
- **Tailwind CSS** via CDN (no build step required)
- **Mobile-responsive** design (phones, tablets, desktops)
- **Google Maps** embed for the hotel location
- **Reservation inquiry form** (opens the visitor's email client to send to `sukro.reservations@gmail.com`)
- **Basic SEO**: meta tags, Open Graph, JSON-LD structured data, sitemap, robots.txt
- **Social media links** to Facebook & Instagram
- **Custom SVG logo** matching the Sukro brand (brown + olive green)
- **Lightbox gallery** for full-size image viewing

## File Structure

```
sukro-website/
├── index.html          # Home page
├── rooms.html          # Rooms & Suites
├── amenities.html      # Hotel Amenities
├── about.html          # About Sukro
├── gallery.html        # Photo Gallery
├── contact.html        # Contact + Reservation form
├── assets/
│   └── logo.svg        # Sukro logo
├── css/
│   └── style.css       # Custom styles
├── js/
│   └── main.js         # Mobile menu, form handler, lightbox
├── robots.txt
├── sitemap.xml
└── README.md
```

## How to View

### Option 1: Open directly
Double-click `index.html` to open in your browser. (Some features like form submission still work; Google Maps loads via HTTPS.)

### Option 2: Local server (recommended)
Run a simple HTTP server in the project folder:

```bash
# Python 3
python3 -m http.server 8000

# Or Node.js
npx serve .
```

Then visit: `http://localhost:8000`

## How to Deploy

This is a static site — drop the whole folder on any web host:

- **Netlify**: drag-and-drop the folder at https://app.netlify.com/drop
- **Vercel**: `vercel` in the folder
- **GitHub Pages**: push to a repo, enable Pages in settings
- **Traditional hosting (cPanel, etc.)**: upload via FTP to `public_html`

## Customization Guide

### Replace the hotel photos

The site uses placeholder hotel images from Unsplash. To replace with your own photos:

1. Add your images to an `images/` folder (e.g. `images/hero.jpg`, `images/room-standard.jpg`, etc.)
2. Find the `<img src="https://images.unsplash.com/...">` tags in each HTML file
3. Replace the `src` with your local path: `src="images/your-photo.jpg"`

Suggested file names (so it's easy to find/replace):
- `images/hero.jpg` — Home page hero
- `images/room-standard.jpg`
- `images/room-deluxe.jpg`
- `images/room-suite.jpg`
- `images/lobby.jpg`
- `images/exterior.jpg`

### Update the logo
The SVG logo lives at `assets/logo.svg`. Edit it directly or replace with a PNG (then update the `src` in each HTML file's `<header>`).

### Update contact details
Search across all HTML files for:
- `0917 890 0920`
- `sukro.reservations@gmail.com`
- `La Salle Avenue`
- `https://www.facebook.com/sukrobyisecurerealtycorporation`

### Change room rates
Edit the price text in `rooms.html` (search for `₱1,500`, `₱2,200`, `₱3,200`).

### Connect the form to a real backend
The form currently uses a `mailto:` link (opens the visitor's email app). To send directly to your inbox without the email app:

**Easiest option — Formspree:**
1. Sign up at https://formspree.io (free)
2. Replace the form's submit handler in `js/main.js` with:
   ```js
   form.action = 'https://formspree.io/f/YOUR_FORM_ID';
   form.method = 'POST';
   ```
3. Remove `e.preventDefault()` so the form submits normally.

**Other options:** Getform, Basin, Web3Forms, or a custom backend.

## Browser Support

Tested on modern browsers (Chrome, Firefox, Safari, Edge — latest versions). The site uses standard HTML5/CSS3 with Tailwind's modern reset.

## Credits

- **Framework**: Tailwind CSS
- **Fonts**: Inter (Google Fonts), Georgia (system serif)
- **Icons**: Heroicons (inline SVG)
- **Placeholder images**: Unsplash

---

© 2026 Sukro Hotel — A property of Isecure Realty Corporation
