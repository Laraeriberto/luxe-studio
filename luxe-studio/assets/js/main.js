/* =========================================================
   Luxe Hair & Beauty Studio — site behavior
   - Theme toggle, mobile nav, reveals, lightbox, reel autoplay
   - Service menu with "Add to booking"
   - 4-step appointment booker with availability engine
   Bookings are kept in memory for this demo. To go live, replace
   `submitBooking()` with a call to your backend or booking API.
   ========================================================= */
(function () {
  'use strict';
  var S = window.SALON;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var themeBtn = $('[data-theme-toggle]');
  var mode = 'light';
  var sun = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var moon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function applyTheme() {
    root.setAttribute('data-theme', mode);
    themeBtn.innerHTML = mode === 'dark' ? sun : moon;
    themeBtn.setAttribute('aria-label', 'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' mode');
  }
  themeBtn.addEventListener('click', function () { mode = mode === 'dark' ? 'light' : 'dark'; applyTheme(); });
  applyTheme();

  /* ---------- Header + mobile nav ---------- */
  var header = $('#site-header');
  window.addEventListener('scroll', function () { header.classList.toggle('is-scrolled', window.scrollY > 8); }, { passive: true });
  var nav = $('#nav'), navToggle = $('#nav-toggle');
  function setNav(open) {
    nav.setAttribute('data-open', String(open));
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navToggle.addEventListener('click', function () { setNav(nav.getAttribute('data-open') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('click', function (e) {
    if (nav.getAttribute('data-open') === 'true' && !e.target.closest('#nav') && !e.target.closest('#nav-toggle')) setNav(false);
  });

  /* ---------- Helpers ---------- */
  function money(n) { return '$' + n.toLocaleString('en-US'); }
  function durLabel(m) { var h = Math.floor(m / 60), r = m % 60; return (h ? h + ' hr' + (h > 1 ? 's' : '') : '') + (h && r ? ' ' : '') + (r ? r + ' min' : ''); }
  function toMin(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function timeLabel(m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'pm' : 'am'; var h12 = h % 12 || 12; return h12 + ':' + (mm < 10 ? '0' : '') + mm + ap; }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function sameDay(a, b) { return a && b && ymd(a) === ymd(b); }
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function svc(id) { return S.services.filter(function (s) { return s.id === id; })[0]; }
  function stylistById(id) { return S.stylists.filter(function (s) { return s.id === id; })[0]; }
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  /* ---------- State ---------- */
  var state = { services: [], stylist: 'any', date: null, time: null, assigned: null, step: 1, viewMonth: null };
  var bookings = []; // in-memory: {stylist, date:'YYYY-MM-DD', start, end}

  function totals() {
    var d = 0, p = 0;
    state.services.forEach(function (id) { var s = svc(id); d += s.duration; p += s.price; });
    return { duration: d, price: p };
  }
  function neededCats() { return state.services.map(function (id) { return svc(id).cat; }); }
  function canDo(st) { return neededCats().every(function (c) { return st.skills.indexOf(c) > -1; }); }
  function eligibleStylists() { return S.stylists.filter(canDo); }

  /* ---------- Availability engine ---------- */
  // Deterministic pseudo-random "already booked" blocks so the demo feels real.
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function busyBlocks(st, dateStr) {
    var set = {}, hrs = S.hours[new Date(dateStr + 'T12:00').getDay()];
    if (!hrs) return set;
    var open = toMin(hrs[0]), close = toMin(hrs[1]);
    for (var t = open; t < close; t += 30) {
      if (hash(dateStr + st.id + t) % 100 < 38) set[t] = true;
    }
    bookings.forEach(function (b) {
      if (b.stylist === st.id && b.date === dateStr) for (var x = b.start; x < b.end; x += 30) set[x - (x % 30)] = true;
    });
    return set;
  }
  function stylistFree(st, date, start, dur) {
    var day = date.getDay(), hrs = S.hours[day];
    if (!hrs || st.days.indexOf(day) === -1) return false;
    var close = toMin(hrs[1]);
    if (start + dur > close) return false;
    var busy = busyBlocks(st, ymd(date));
    for (var t = start - (start % 30); t < start + dur; t += 30) if (busy[t]) return false;
    return true;
  }
  function slotsFor(date, dur, who) {
    var hrs = S.hours[date.getDay()];
    if (!hrs || !dur) return [];
    var open = toMin(hrs[0]), close = toMin(hrs[1]);
    var now = new Date(), minStart = 0;
    if (sameDay(date, now)) minStart = now.getHours() * 60 + now.getMinutes() + 60;
    var pool = who === 'any' ? eligibleStylists() : [stylistById(who)];
    var out = [];
    for (var t = open; t + dur <= close; t += S.slotStep) {
      var free = null;
      if (t >= minStart) for (var i = 0; i < pool.length; i++) if (stylistFree(pool[i], date, t, dur)) { free = pool[i]; break; }
      out.push({ t: t, stylist: free });
    }
    return out;
  }
  function dayHasSlots(date, dur, who) { return slotsFor(date, dur, who).some(function (s) { return s.stylist; }); }
  var today = startOfDay(new Date());
  var lastDay = new Date(today); lastDay.setDate(lastDay.getDate() + S.bookAheadDays);

  /* ---------- Hero "next opening" ---------- */
  function nextOpening() {
    var saved = state.services; state.services = ['womens-cut'];
    for (var i = 0; i < 21; i++) {
      var d = new Date(today); d.setDate(d.getDate() + i);
      var s = slotsFor(d, 60, 'any').filter(function (x) { return x.stylist; })[0];
      if (s) {
        state.services = saved;
        var label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return label + ' at ' + timeLabel(s.t);
      }
    }
    state.services = saved; return 'This week';
  }
  $('#next-slot').textContent = 'Next opening: ' + nextOpening();

  /* ---------- Service menu (tabs) ---------- */
  var tabsEl = $('#service-tabs'), menuEl = $('#service-menu'), activeCat = S.categories[0].id;
  function renderTabs() {
    tabsEl.innerHTML = S.categories.map(function (c) {
      return '<button role="tab" class="tab" aria-selected="' + (c.id === activeCat) + '" data-cat="' + c.id + '">' + c.label + '</button>';
    }).join('');
  }
  function renderMenu() {
    menuEl.innerHTML = S.services.filter(function (s) { return s.cat === activeCat; }).map(function (s) {
      var on = state.services.indexOf(s.id) > -1;
      return '<article class="menu__item">' +
        '<div class="menu__text"><h3>' + s.name + '</h3><p>' + s.desc + '</p></div>' +
        '<div class="menu__meta"><span class="menu__dur">' + durLabel(s.duration) + '</span><span class="menu__price">from ' + money(s.price) + '</span></div>' +
        '<button class="pill' + (on ? ' is-on' : '') + '" data-add="' + s.id + '" aria-pressed="' + on + '">' + (on ? 'Added ✓' : 'Add') + '</button>' +
        '</article>';
    }).join('');
  }
  tabsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b) return;
    activeCat = b.getAttribute('data-cat'); renderTabs(); renderMenu();
  });
  tabsEl.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var i = S.categories.findIndex(function (c) { return c.id === activeCat; });
    i = (i + (e.key === 'ArrowRight' ? 1 : -1) + S.categories.length) % S.categories.length;
    activeCat = S.categories[i].id; renderTabs(); renderMenu(); $('[data-cat="' + activeCat + '"]', tabsEl).focus();
  });
  menuEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]'); if (!b) return;
    var id = b.getAttribute('data-add');
    toggleService(id);
    toast(state.services.indexOf(id) > -1 ? svc(id).name + ' added to your booking' : svc(id).name + ' removed');
  });

  /* ---------- Team list ---------- */
  $('#stylist-list').innerHTML = S.stylists.map(function (s) {
    var days = s.days.map(function (d) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]; }).join(', ');
    return '<li class="stylist"><div class="avatar" aria-hidden="true">' + s.name[0] + '</div><div><h3>' + s.name + ' <span>· ' + s.role + '</span></h3><p>' + s.bio + '</p><small>Works ' + days + '</small></div>' +
      '<a class="pill" href="#book" data-pick-stylist="' + s.id + '">Book ' + s.name + '</a></li>';
  }).join('');

  /* ---------- Booking: services step ---------- */
  var picker = $('#svc-picker');
  function renderPicker() {
    picker.innerHTML = S.categories.map(function (c) {
      return '<fieldset class="svc-group"><legend>' + c.label + '</legend>' +
        S.services.filter(function (s) { return s.cat === c.id; }).map(function (s) {
          var on = state.services.indexOf(s.id) > -1;
          return '<label class="svc' + (on ? ' is-on' : '') + '"><input type="checkbox" value="' + s.id + '"' + (on ? ' checked' : '') + '>' +
            '<span class="svc__name">' + s.name + '</span><span class="svc__meta">' + durLabel(s.duration) + ' · ' + money(s.price) + '</span></label>';
        }).join('') + '</fieldset>';
    }).join('');
  }
  picker.addEventListener('change', function (e) { if (e.target.matches('input[type=checkbox]')) toggleService(e.target.value); });

  function toggleService(id) {
    var i = state.services.indexOf(id);
    if (i > -1) state.services.splice(i, 1); else state.services.push(id);
    if (state.stylist !== 'any' && !canDo(stylistById(state.stylist))) state.stylist = 'any';
    state.time = null; state.assigned = null;
    $('#err-1').hidden = true;
    renderMenu(); renderPicker(); renderStylists(); renderSummary();
    if (state.step === 3) { renderCalendar(); renderSlots(); }
  }

  /* ---------- Booking: stylist step ---------- */
  var stPicker = $('#stylist-picker');
  function renderStylists() {
    var opts = [{ id: 'any', name: 'First available', role: 'Fastest way to get in', ok: true }].concat(S.stylists.map(function (s) {
      return { id: s.id, name: s.name, role: s.role, ok: canDo(s) };
    }));
    stPicker.innerHTML = opts.map(function (o) {
      var on = state.stylist === o.id;
      return '<label class="st' + (on ? ' is-on' : '') + (o.ok ? '' : ' is-off') + '">' +
        '<input type="radio" name="stylist" value="' + o.id + '"' + (on ? ' checked' : '') + (o.ok ? '' : ' disabled') + '>' +
        '<span class="avatar" aria-hidden="true">' + (o.id === 'any' ? '★' : o.name[0]) + '</span>' +
        '<span><strong>' + o.name + '</strong><small>' + (o.ok ? o.role : 'Does not offer one of your services') + '</small></span></label>';
    }).join('');
  }
  stPicker.addEventListener('change', function (e) {
    state.stylist = e.target.value; state.time = null; state.assigned = null;
    renderStylists(); renderSummary();
  });

  /* ---------- Booking: calendar + slots ---------- */
  var calGrid = $('#cal-grid'), calLabel = $('#cal-label');
  function renderCalendar() {
    if (!state.viewMonth) state.viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    var vm = state.viewMonth, dur = totals().duration;
    calLabel.textContent = vm.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    $('#cal-prev').disabled = vm <= new Date(today.getFullYear(), today.getMonth(), 1);
    $('#cal-next').disabled = new Date(vm.getFullYear(), vm.getMonth() + 1, 1) > lastDay;
    var first = vm.getDay(), days = new Date(vm.getFullYear(), vm.getMonth() + 1, 0).getDate(), html = '';
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= days; d++) {
      var date = new Date(vm.getFullYear(), vm.getMonth(), d);
      var closed = !S.hours[date.getDay()];
      var out = date < today || date > lastDay;
      var full = !closed && !out && !dayHasSlots(date, dur, state.stylist);
      var dis = closed || out || full;
      var sel = sameDay(date, state.date);
      var title = closed ? 'Closed' : out ? 'Unavailable' : full ? 'Fully booked' : 'Available';
      html += '<button type="button" class="day' + (sel ? ' is-sel' : '') + (full ? ' is-full' : '') + (sameDay(date, today) ? ' is-today' : '') + '" data-date="' + ymd(date) + '"' + (dis ? ' disabled' : '') +
        ' aria-label="' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ', ' + title + '" aria-pressed="' + sel + '">' + d + '</button>';
    }
    calGrid.innerHTML = html;
  }
  $('#cal-prev').addEventListener('click', function () { state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1); renderCalendar(); });
  $('#cal-next').addEventListener('click', function () { state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1); renderCalendar(); });
  calGrid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-date]'); if (!b || b.disabled) return;
    state.date = new Date(b.getAttribute('data-date') + 'T00:00'); state.time = null; state.assigned = null;
    renderCalendar(); renderSlots(); renderSummary();
  });

  var slotsEl = $('#slots'), slotsLabel = $('#slots-label');
  function renderSlots() {
    if (!state.date) { slotsLabel.textContent = 'Choose a date to see open times.'; slotsEl.innerHTML = ''; return; }
    var list = slotsFor(state.date, totals().duration, state.stylist);
    var open = list.filter(function (s) { return s.stylist; }).length;
    slotsLabel.textContent = state.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' · ' + open + ' open time' + (open === 1 ? '' : 's');
    var groups = { Morning: [], Afternoon: [], Evening: [] };
    list.forEach(function (s) { (s.t < 720 ? groups.Morning : s.t < 1020 ? groups.Afternoon : groups.Evening).push(s); });
    slotsEl.innerHTML = Object.keys(groups).filter(function (k) { return groups[k].length; }).map(function (k) {
      return '<div class="slot-group"><p>' + k + '</p><div>' + groups[k].map(function (s) {
        var on = state.time === s.t;
        return '<button type="button" role="radio" class="slot' + (on ? ' is-sel' : '') + '" data-t="' + s.t + '" data-st="' + (s.stylist ? s.stylist.id : '') + '" aria-checked="' + on + '"' + (s.stylist ? '' : ' disabled aria-label="' + timeLabel(s.t) + ' unavailable"') + '>' + timeLabel(s.t) + '</button>';
      }).join('') + '</div></div>';
    }).join('');
  }
  slotsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-t]'); if (!b || b.disabled) return;
    state.time = +b.getAttribute('data-t'); state.assigned = b.getAttribute('data-st');
    $('#err-3').hidden = true;
    renderSlots(); renderSummary();
  });

  /* ---------- Summary ---------- */
  function renderSummary() {
    var t = totals();
    $('#sum-list').innerHTML = state.services.length ? state.services.map(function (id) {
      var s = svc(id);
      return '<li><span>' + s.name + '</span><span>' + money(s.price) + '</span><button type="button" class="x" data-remove="' + id + '" aria-label="Remove ' + s.name + '">×</button></li>';
    }).join('') : '<li class="summary__empty">No services selected yet.</li>';
    var who = state.assigned ? stylistById(state.assigned).name + (state.stylist === 'any' ? ' (first available)' : '') : state.stylist === 'any' ? 'First available' : stylistById(state.stylist).name;
    $('#sum-stylist').textContent = who;
    $('#sum-when').textContent = state.date ? state.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + (state.time != null ? ' · ' + timeLabel(state.time) : ' · pick a time') : 'Not chosen';
    $('#sum-dur').textContent = t.duration ? durLabel(t.duration) : '—';
    $('#sum-total').textContent = money(t.price);
  }
  $('#sum-list').addEventListener('click', function (e) { var b = e.target.closest('[data-remove]'); if (b) toggleService(b.getAttribute('data-remove')); });

  /* ---------- Step navigation ---------- */
  var btnNext = $('#btn-next'), btnBack = $('#btn-back');
  function goStep(n, scroll) {
    state.step = n;
    $$('.panel').forEach(function (p) { p.hidden = +p.getAttribute('data-panel') !== n; });
    $$('#steps li').forEach(function (li) {
      var s = +li.getAttribute('data-step');
      li.classList.toggle('is-done', s < n);
      if (s === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    btnBack.hidden = n === 1 || n === 5;
    btnNext.hidden = n === 5;
    btnNext.textContent = n === 4 ? 'Confirm booking' : 'Continue';
    $('#booking').classList.toggle('is-done', n === 5);
    if (n === 3) { if (state.date) state.viewMonth = new Date(state.date.getFullYear(), state.date.getMonth(), 1); renderCalendar(); renderSlots(); }
    if (scroll) {
      var r = $('#booking').getBoundingClientRect();
      if (r.top < 90 || r.top > window.innerHeight * 0.5) window.scrollTo({ top: r.top + window.scrollY - 100, behavior: 'smooth' });
    }
  }
  $('#steps').addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    var s = +li.getAttribute('data-step'); if (s < state.step && state.step < 5) goStep(s, true);
  });
  btnBack.addEventListener('click', function () { goStep(state.step - 1, true); });
  btnNext.addEventListener('click', function () {
    if (state.step === 1) { if (!state.services.length) { $('#err-1').hidden = false; return; } goStep(2, true); }
    else if (state.step === 2) goStep(3, true);
    else if (state.step === 3) { if (!state.date || state.time == null) { $('#err-3').hidden = false; return; } goStep(4, true); }
    else if (state.step === 4) { if (validateDetails()) submitBooking(); }
  });

  /* ---------- Details form ---------- */
  var form = $('#details');
  function setInvalid(el, bad) { el.closest('.field').setAttribute('data-invalid', String(bad)); el.setAttribute('aria-invalid', String(bad)); }
  function validateDetails() {
    var ok = true, first = null;
    var name = form.name, email = form.email, phone = form.phone, policy = form.policy;
    var checks = [
      [name, name.value.trim().length > 1],
      [phone, phone.value.replace(/\D/g, '').length >= 10],
      [email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())]
    ];
    checks.forEach(function (c) { setInvalid(c[0], !c[1]); if (!c[1]) { ok = false; first = first || c[0]; } });
    var pOk = policy.checked; $('#err-policy').style.display = pOk ? 'none' : 'block';
    if (!pOk) { ok = false; first = first || policy; }
    if (first) first.focus();
    return ok;
  }
  form.addEventListener('input', function (e) { if (e.target.closest('.field') && e.target.closest('.field').getAttribute('data-invalid') === 'true') setInvalid(e.target, false); });
  form.policy.addEventListener('change', function () { if (form.policy.checked) $('#err-policy').style.display = 'none'; });
  form.addEventListener('submit', function (e) { e.preventDefault(); btnNext.click(); });

  /* ---------- Submit ---------- */
  function submitBooking() {
    btnNext.disabled = true; btnNext.classList.add('is-loading'); btnNext.textContent = 'Booking…';
    // Demo: simulate a network request. Replace with fetch('/api/bookings', {method:'POST', body: JSON.stringify(payload)})
    setTimeout(function () {
      var dur = totals().duration, st = stylistById(state.assigned);
      bookings.push({ stylist: st.id, date: ymd(state.date), start: state.time, end: state.time + dur });
      var code = 'LX-' + String(hash(ymd(state.date) + state.time + form.email.value) % 9000 + 1000);
      var first = form.name.value.trim().split(/\s+/)[0];
      $('#done-name').textContent = first;
      $('#done-code').textContent = code;
      var names = state.services.map(function (id) { return svc(id).name; });
      var when = state.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + timeLabel(state.time);
      $('#done-text').textContent = names.join(' + ') + ' with ' + st.name + ' on ' + when + ' (' + durLabel(dur) + '). A confirmation is on its way to ' + form.email.value.trim() + '.';
      $('#ics-link').href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(buildICS(names.join(' + '), st.name, state.date, state.time, dur, code));
      btnNext.disabled = false; btnNext.classList.remove('is-loading');
      goStep(5, true);
      $('#next-slot').textContent = 'Next opening: ' + nextOpening();
    }, 900);
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function icsDate(date, mins) { return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + 'T' + pad(Math.floor(mins / 60)) + pad(mins % 60) + '00'; }
  function buildICS(title, who, date, start, dur, code) {
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Luxe Studio//Booking//EN', 'BEGIN:VEVENT',
      'UID:' + code + '@luxestudio.example', 'DTSTAMP:' + icsDate(new Date(), new Date().getHours() * 60 + new Date().getMinutes()),
      'DTSTART:' + icsDate(date, start), 'DTEND:' + icsDate(date, start + dur),
      'SUMMARY:' + title + ' with ' + who + ' — Luxe Studio', 'LOCATION:' + S.address,
      'DESCRIPTION:Confirmation ' + code + '. Free cancellation up to 24 hours before.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  $('#book-again').addEventListener('click', function () {
    state.services = []; state.stylist = 'any'; state.date = null; state.time = null; state.assigned = null;
    form.reset(); renderMenu(); renderPicker(); renderStylists(); renderSummary(); goStep(1, true);
  });

  /* ---------- Shortcuts into booking ---------- */
  document.addEventListener('click', function (e) {
    var pre = e.target.closest('[data-preselect]');
    if (pre) { var id = pre.getAttribute('data-preselect'); if (state.services.indexOf(id) === -1) toggleService(id); if (state.step === 5) goStep(1); }
    var ps = e.target.closest('[data-pick-stylist]');
    if (ps) {
      var sid = ps.getAttribute('data-pick-stylist');
      if (canDo(stylistById(sid))) { state.stylist = sid; state.time = null; state.assigned = null; renderStylists(); renderSummary(); }
      if (state.step === 5) goStep(1);
      toast(stylistById(sid).name + ' selected — now pick your services');
    }
  });

  /* ---------- Reveal on scroll ---------- */
  $$('.section__head, .menu, .looks, .feature__grid, .reel__grid, .team__grid, .quotes, .visit__grid').forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
    var vid = $('#reel-video');
    new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } else vid.pause(); }); }, { threshold: 0.4 }).observe(vid);
  } else { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- Lightbox ---------- */
  var looks = $$('.look'), lb = $('#lightbox'), lbImg = $('#lb-img'), idx = 0, lastFocus;
  function show(i) {
    idx = (i + looks.length) % looks.length; var b = looks[idx];
    lbImg.src = b.getAttribute('data-src'); lbImg.alt = b.querySelector('img').alt;
    $('#lb-title').textContent = b.getAttribute('data-title'); $('#lb-sub').textContent = b.getAttribute('data-sub');
  }
  function openLb(i) { lastFocus = document.activeElement; show(i); lb.setAttribute('data-open', 'true'); document.body.style.overflow = 'hidden'; $('#lb-close').focus(); }
  function closeLb() { lb.setAttribute('data-open', 'false'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  looks.forEach(function (b, i) { b.addEventListener('click', function () { openLb(i); }); });
  $('#lb-close').addEventListener('click', closeLb);
  $('#lb-prev').addEventListener('click', function () { show(idx - 1); });
  $('#lb-next').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (lb.getAttribute('data-open') === 'true') closeLb(); else setNav(false); }
    if (lb.getAttribute('data-open') !== 'true') return;
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });

  /* ---------- Init ---------- */
  $('#year').textContent = new Date().getFullYear();
  renderTabs(); renderMenu(); renderPicker(); renderStylists(); renderSummary(); goStep(1);
})();
