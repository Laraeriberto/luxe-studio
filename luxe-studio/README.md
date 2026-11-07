# Luxe Hair & Beauty Studio — demo website

A single-page salon website with a service menu, lookbook gallery, video reel, team section and a 4-step online appointment booker. Plain HTML, CSS and JavaScript — no build step, no framework.

## Run it locally

```bash
cd luxe-studio
python3 -m http.server 8000
# open http://localhost:8000
```

Any static host works (Netlify, Vercel, GitHub Pages, S3). Just upload the folder.

## File structure

```
index.html            Page markup and all copy
assets/css/base.css   Reset and base element styles
assets/css/style.css  Design tokens (colors, type, spacing), light + dark themes, all components
assets/js/data.js     Business data: services, prices, durations, stylists, opening hours
assets/js/main.js     Theme toggle, nav, service menu, booking engine, lightbox, reveals
assets/img/           Photos (AI-generated placeholders — replace with real work)
assets/video/reel.mp4 Short reel clip (placeholder)
```

## Customizing

- **Name, copy, address, phone, email:** edit `index.html` (search for "Luxe", "123 Main Street", "555").
- **Services, prices, durations, categories:** edit `services` and `categories` in `assets/js/data.js`. The menu, booking picker and totals update automatically.
- **Stylists:** edit `stylists` in `data.js`. `skills` lists the category ids each person performs (stylists who cannot do a selected service are disabled in the booker). `days` lists the weekdays they work (0 = Sunday).
- **Opening hours:** edit `hours` in `data.js` (`null` = closed). `slotStep` sets the minutes between start times, `bookAheadDays` how far ahead clients can book.
- **Colors and fonts:** edit the variables at the top of `assets/css/style.css` (`--color-primary`, `--font-display`, etc.). Both light and dark palettes are defined there.
- **Images:** replace files in `assets/img/` keeping the same names, or update the `src` attributes.

## How booking works (demo mode)

- Availability is simulated: each stylist gets deterministic "already booked" blocks per day so the calendar looks realistic. See `busyBlocks()` in `main.js`.
- Only start times where the full length of all selected services fits before closing, and where the stylist is free, are offered.
- Confirmed bookings are stored in memory for the session and immediately block that time.
- Clients get a confirmation code and an "Add to calendar" .ics file.

### Going live

Replace the `setTimeout` inside `submitBooking()` in `main.js` with a request to your backend or booking service, for example:

```js
fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ services: state.services, stylist: state.assigned, date: ymd(state.date), start: state.time,
    name: form.name.value, email: form.email.value, phone: form.phone.value, notes: form.notes.value })
});
```

Then replace `busyBlocks()` with real availability fetched from the same backend (or a tool like Google Calendar, Square Appointments, Calendly or Cal.com).
# luxe-studio
# luxe-studio
