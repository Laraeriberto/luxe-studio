/* =========================================================
   Luxe Hair & Beauty Studio — editable business data
   Change services, prices, stylists and hours here.
   ========================================================= */
window.SALON = {
  name: 'Luxe Hair & Beauty Studio',
  email: 'hello@luxestudio.example',
  address: '123 Main Street, Suite 2, Your City, ST 00000',

  /* Opening hours by weekday (0 = Sunday). null = closed. Times in 24h "HH:MM". */
  hours: {
    0: null,
    1: null,
    2: ['09:00', '19:00'],
    3: ['09:00', '19:00'],
    4: ['09:00', '19:00'],
    5: ['09:00', '19:00'],
    6: ['08:00', '17:00']
  },
  slotStep: 30,          // minutes between start times
  bookAheadDays: 60,     // how far ahead clients can book

  categories: [
    { id: 'hair', label: 'Cuts & Styling' },
    { id: 'color', label: 'Color' },
    { id: 'texture', label: 'Curls & Texture' },
    { id: 'beauty', label: 'Makeup, Brows & Lashes' }
  ],

  /* duration in minutes, price in dollars (starting price) */
  services: [
    { id: 'womens-cut', cat: 'hair', name: "Women's Cut & Style", duration: 60, price: 75, desc: 'Consultation, wash, precision cut and a finished blowout.' },
    { id: 'mens-cut', cat: 'hair', name: "Men's Cut", duration: 30, price: 40, desc: 'Scissor or clipper cut with a hot-towel neck finish.' },
    { id: 'blowout', cat: 'hair', name: 'Signature Blowout', duration: 45, price: 55, desc: 'Wash, scalp massage and a smooth or bouncy blowout.' },
    { id: 'kids-cut', cat: 'hair', name: 'Kids Cut (under 12)', duration: 30, price: 30, desc: 'Quick, patient and fun — includes a mini style.' },
    { id: 'updo', cat: 'hair', name: 'Event Updo', duration: 75, price: 120, desc: 'Braids, buns or half-up styles for weddings and events.' },

    { id: 'single-color', cat: 'color', name: 'Single-Process Color', duration: 90, price: 110, desc: 'All-over color or root touch-up with a gloss finish.' },
    { id: 'balayage', cat: 'color', name: 'Balayage', duration: 180, price: 220, desc: 'Hand-painted, lived-in lightness with toner and bond builder.' },
    { id: 'highlights', cat: 'color', name: 'Partial Highlights', duration: 120, price: 150, desc: 'Foiled brightness around the face and part line.' },
    { id: 'gloss', cat: 'color', name: 'Gloss & Tone', duration: 45, price: 60, desc: 'Refresh faded color and add mirror shine.' },

    { id: 'silk-press', cat: 'texture', name: 'Silk Press', duration: 90, price: 95, desc: 'Deep cleanse, treatment and a sleek, heat-protected press.' },
    { id: 'curl-cut', cat: 'texture', name: 'Curl Cut & Define', duration: 90, price: 110, desc: 'Dry curl-by-curl cut with a defined wash-and-go.' },
    { id: 'treatment', cat: 'texture', name: 'Deep Repair Treatment', duration: 30, price: 35, desc: 'Bond-building mask for dry or damaged hair. Pairs with any service.' },

    { id: 'glam', cat: 'beauty', name: 'Full Glam Makeup', duration: 60, price: 85, desc: 'Event-ready makeup with lashes included.' },
    { id: 'bridal-makeup', cat: 'beauty', name: 'Bridal Makeup', duration: 90, price: 150, desc: 'Long-wear bridal look, touch-up kit included.' },
    { id: 'brows', cat: 'beauty', name: 'Brow Shape & Tint', duration: 30, price: 35, desc: 'Mapping, wax or thread, and a custom tint.' },
    { id: 'lash-lift', cat: 'beauty', name: 'Lash Lift & Tint', duration: 60, price: 80, desc: 'A natural curl that lasts six to eight weeks.' }
  ],

  /* skills: list of category ids the stylist performs. days: weekdays worked. */
  stylists: [
    { id: 'maya', name: 'Maya', role: 'Senior Colorist', skills: ['hair', 'color'], days: [2, 3, 4, 5, 6], bio: 'Balayage and color-correction specialist. 11 years behind the chair.' },
    { id: 'sofia', name: 'Sofia', role: 'Cut & Curl Specialist', skills: ['hair', 'texture', 'color'], days: [2, 3, 5, 6], bio: 'Curl-certified, precision bobs and silk presses. 8 years.' },
    { id: 'ana', name: 'Ana', role: 'Makeup & Bridal Artist', skills: ['beauty', 'hair'], days: [3, 4, 5, 6], bio: 'Bridal hair and makeup, brows and lashes. 9 years.' }
  ]
};
