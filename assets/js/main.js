/* Horic Homes – shared site script */
var HH = (function () {
  'use strict';

  // ---- Company settings ----
  var WHATSAPP = '233548000393';          // international format, no "+" or spaces
  var PHONE_TEL = '+233548000393';
  var PHONE_DISPLAY = '054 800 0393';
  var NEW_DAYS = 45;                      // listings newer than this are tagged "New"

  var REGIONS = ['Greater Accra', 'Eastern', 'Central', 'Ashanti'];
  var OPEN = ['Available', 'Few plots left', 'Few units left', 'Coming soon', 'Off-plan'];

  function all() { return window.PROPERTIES || []; }
  function byId(id) { return all().filter(function (p) { return p.id === id; })[0]; }
  function isOpen(p) { return OPEN.indexOf(p.status) !== -1; }
  function isNew(p) { return isOpen(p) && (Date.now() - new Date(p.listed).getTime()) / 864e5 <= NEW_DAYS; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return 'GH₵ ' + Number(n).toLocaleString('en-GH'); }
  function img(src, w) {
    if (/[\/.]/.test(src)) return src; // local path
    return 'https://images.unsplash.com/photo-' + src + '?q=70&w=' + (w || 900) + '&auto=format&fit=crop';
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function place(p) { return p.location + ', ' + p.region + ' Region'; }
  function wa(text) { return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text); }
  function monthYear(d) { return new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }

  function availText(p) {
    if (p.plotsTotal) return p.plotsLeft ? p.plotsLeft + ' of ' + p.plotsTotal + ' plots available' : 'All ' + p.plotsTotal + ' plots sold';
    if (p.unitsTotal) return p.unitsLeft ? p.unitsLeft + ' of ' + p.unitsTotal + ' units available' : 'All units sold';
    return '';
  }

  function badges(p) {
    var h = '<span class="badge s-' + slug(p.status) + '">' + esc(p.status) + '</span>';
    if (isNew(p)) h += '<span class="badge s-new">New</span>';
    return h;
  }

  function card(p) {
    var meta = p.type === 'Land'
      ? ['<i class="fas fa-ruler-combined"></i>' + esc(p.size), '<i class="far fa-file-lines"></i>' + esc(p.docs)]
      : ['<i class="fas fa-bed"></i>' + p.beds + ' bed', '<i class="fas fa-bath"></i>' + p.baths + ' bath', '<i class="fas fa-ruler-combined"></i>' + esc(p.size)];
    var av = availText(p);
    return '<a class="card' + (isOpen(p) ? '' : ' is-closed') + '" href="property.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="card-media"><img src="' + img(p.images[0], 700) + '" alt="' + esc(p.title) + '" loading="lazy">' +
      '<div class="card-tags">' + badges(p) + '</div><span class="card-type">' + esc(p.type) + '</span></div>' +
      '<div class="card-body">' +
      '<div class="card-price">' + money(p.price) + (p.priceUnit ? ' <small>' + esc(p.priceUnit) + '</small>' : '') + '</div>' +
      '<h3>' + esc(p.title) + '</h3>' +
      '<p class="card-loc"><i class="fas fa-location-dot"></i>' + esc(place(p)) + '</p>' +
      (av ? '<p class="card-avail">' + esc(av) + '</p>' : '') +
      '<ul class="card-meta"><li>' + meta.join('</li><li>') + '</li></ul>' +
      '</div></a>';
  }

  function sortDefault(list) {
    return list.slice().sort(function (a, b) {
      var oa = isOpen(a) ? 0 : 1, ob = isOpen(b) ? 0 : 1;
      if (oa !== ob) return oa - ob;
      return new Date(b.listed) - new Date(a.listed);
    });
  }

  function stats() {
    var open = all().filter(isOpen);
    var regions = {};
    all().forEach(function (p) { regions[p.region] = 1; });
    var plots = open.reduce(function (n, p) { return n + (p.plotsLeft || 0); }, 0);
    return { open: open.length, regions: Object.keys(regions).length, plots: plots };
  }

  function fill(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) { el.textContent = value; });
  }

  // ---------------------------------------------------------------
  // Global behaviour
  // ---------------------------------------------------------------
  function initCommon() {
    // Mobile menu
    var btn = document.getElementById('menuBtn');
    var nav = document.getElementById('nav');
    if (btn && nav) {
      var set = function (open) {
        nav.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open);
        btn.innerHTML = open ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
      };
      btn.addEventListener('click', function () { set(!nav.classList.contains('open')); });
      nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    }

    // WhatsApp links
    document.querySelectorAll('.js-wa-link').forEach(function (a) {
      a.href = wa(a.getAttribute('data-text') || 'Hello Horic Homes, I would like to enquire about your properties.');
      a.target = '_blank';
      a.rel = 'noopener';
    });

    // Forms -> WhatsApp with a pre-filled message
    // (delegated so forms rendered later, e.g. on the property page, also work)
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form.classList || !form.classList.contains('js-wa-form')) return;
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var lines = ['*' + form.getAttribute('data-subject') + '* (via website)'];
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && el.value && el.value.trim()) lines.push(el.name + ': ' + el.value.trim());
      });
      window.open(wa(lines.join('\n')), '_blank', 'noopener');
    });

    // Date inputs cannot be in the past
    var today = new Date().toISOString().slice(0, 10);
    document.querySelectorAll('input[type="date"]').forEach(function (d) { d.min = today; });

    // Live figures
    var s = stats();
    fill('.js-year', new Date().getFullYear());
    fill('.js-count-open', s.open);
    fill('.js-count-regions', s.regions);
    fill('.js-count-plots', s.plots);

    // Pre-select a topic on contact forms from ?topic= or ?property=
    var q = new URLSearchParams(location.search);
    var want = q.get('topic') || (q.get('property') && byId(q.get('property')) ? byId(q.get('property')).title : '');
    if (want) {
      document.querySelectorAll('select[data-topic]').forEach(function (sel) {
        var found = false;
        for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === want) { sel.selectedIndex = i; found = true; }
        if (!found) { var o = new Option(want, want, true, true); sel.add(o, 0); }
      });
    }

    // Fill property dropdowns
    document.querySelectorAll('select[data-properties]').forEach(function (sel) {
      sortDefault(all()).filter(isOpen).forEach(function (p) {
        if (![].some.call(sel.options, function (o) { return o.text === p.title; })) sel.add(new Option(p.title));
      });
    });
  }

  // ---------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------
  function initHome() {
    var featured = document.getElementById('featured');
    if (featured) featured.innerHTML = sortDefault(all()).filter(isOpen).slice(0, 6).map(card).join('');

    var locs = document.getElementById('locations');
    if (locs) {
      locs.innerHTML = REGIONS.map(function (r) {
        var items = all().filter(function (p) { return p.region === r; });
        var places = {};
        items.forEach(function (p) { places[p.location] = (places[p.location] || 0) + (isOpen(p) ? 1 : 0); });
        var open = items.filter(isOpen).length;
        return '<div><h3>' + esc(r) + '</h3><p class="count">' + open + ' active listing' + (open === 1 ? '' : 's') + '</p><ul>' +
          Object.keys(places).map(function (l) {
            return '<li><a href="properties.html?q=' + encodeURIComponent(l) + '">' + esc(l) + '</a><span>' + (places[l] ? places[l] + ' open' : 'Sold out') + '</span></li>';
          }).join('') + '</ul></div>';
      }).join('');
    }
  }

  // ---------------------------------------------------------------
  // Properties list
  // ---------------------------------------------------------------
  function initListings() {
    var grid = document.getElementById('results');
    if (!grid) return;
    var f = {
      q: document.getElementById('f-q'),
      type: document.getElementById('f-type'),
      region: document.getElementById('f-region'),
      max: document.getElementById('f-max'),
      status: document.getElementById('f-status'),
      sort: document.getElementById('f-sort'),
      hide: document.getElementById('f-hide')
    };
    var params = new URLSearchParams(location.search);
    ['q', 'type', 'region', 'max', 'status', 'sort'].forEach(function (k) { if (params.get(k)) f[k].value = params.get(k); });
    if (params.get('closed') === '1') f.hide.checked = false;

    function run() {
      var q = f.q.value.trim().toLowerCase();
      var list = all().filter(function (p) {
        if (q && (p.title + ' ' + p.location + ' ' + p.region + ' ' + p.district + ' ' + p.ref).toLowerCase().indexOf(q) === -1) return false;
        if (f.type.value && p.type !== f.type.value) return false;
        if (f.region.value && p.region !== f.region.value) return false;
        if (f.max.value && p.price > Number(f.max.value)) return false;
        if (f.status.value === 'open' && !isOpen(p)) return false;
        if (f.status.value && f.status.value !== 'open' && p.status !== f.status.value) return false;
        if (f.hide.checked && !isOpen(p)) return false;
        return true;
      });
      if (f.sort.value === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
      else if (f.sort.value === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
      else list = sortDefault(list);

      document.getElementById('count').textContent = list.length + ' propert' + (list.length === 1 ? 'y' : 'ies') + ' found';
      grid.innerHTML = list.length ? list.map(card).join('') :
        '<div class="empty" style="grid-column:1/-1"><h3>No properties match your search</h3><p class="muted">Try a different location or price, or <a class="link" href="contact.html?topic=' + encodeURIComponent('Tell me about new listings') + '">ask us about upcoming listings</a>.</p></div>';

      var out = new URLSearchParams();
      ['q', 'type', 'region', 'max', 'status'].forEach(function (k) { if (f[k].value) out.set(k, f[k].value); });
      if (f.sort.value) out.set('sort', f.sort.value);
      if (!f.hide.checked) out.set('closed', '1');
      history.replaceState(null, '', location.pathname + (out.toString() ? '?' + out : ''));
    }
    Object.keys(f).forEach(function (k) { f[k].addEventListener(k === 'q' ? 'input' : 'change', run); });
    document.getElementById('f-reset').addEventListener('click', function () {
      ['q', 'type', 'region', 'max', 'status', 'sort'].forEach(function (k) { f[k].value = ''; });
      f.hide.checked = true; run();
    });
    run();
  }

  // ---------------------------------------------------------------
  // Property detail
  // ---------------------------------------------------------------
  function initDetail() {
    var root = document.getElementById('detail');
    if (!root) return;
    var p = byId(new URLSearchParams(location.search).get('id'));
    if (!p) {
      root.innerHTML = '<div class="empty"><h3>Property not found</h3><p class="muted">This listing may have been removed. <a class="link" href="properties.html">View all properties</a>.</p></div>';
      return;
    }
    document.title = p.title + ' | Horic Homes';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', p.summary);
    fill('.js-crumb-title', p.title);

    var facts = [
      ['Reference', p.ref], ['Property type', p.type], ['Location', p.location],
      ['Region', p.region]
    ];
    if (p.district) facts.push(['District', p.district]);
    facts.push(['Size', p.size]);
    if (p.beds) facts.push(['Bedrooms', p.beds], ['Bathrooms', p.baths]);
    facts.push(['Tenure', p.tenure], ['Documents', p.docs], ['Status', p.status]);
    if (p.completion) facts.push(['Completion', p.completion]);
    if (facts.length % 3) facts.push(['Listed', monthYear(p.listed)]);
    while (facts.length % 3) facts.push(['', '']);

    var total = p.plotsTotal || p.unitsTotal, left = p.plotsTotal ? p.plotsLeft : p.unitsLeft;
    var unit = p.plotsTotal ? 'plots' : 'units';
    var meter = total ? '<section><h2>Availability</h2><p><strong>' + left + '</strong> of ' + total + ' ' + unit + ' available</p>' +
      '<div class="meter" role="img" aria-label="' + (total - left) + ' of ' + total + ' ' + unit + ' sold"><span style="width:' + Math.round((total - left) / total * 100) + '%"></span></div>' +
      '<p class="muted" style="font-size:14px">' + Math.round((total - left) / total * 100) + '% sold · updated ' + monthYear(new Date()) + '</p></section>' : '';

    var thumbs = p.images.slice(0, 3).map(function (src, i) {
      return '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-src="' + img(src, 1400) + '" aria-label="Show photo ' + (i + 1) + '"><img src="' + img(src, 400) + '" alt=""></button>';
    }).join('');

    var open = isOpen(p);
    var msg = 'Hello Horic Homes, I am interested in ' + p.title + ' (' + p.ref + ').';

    root.innerHTML =
      '<div class="detail-head"><div>' + badges(p) +
      '<h1>' + esc(p.title) + '</h1><p class="muted"><i class="fas fa-location-dot" style="color:var(--laterite);margin-right:6px"></i>' + esc(place(p)) + '</p></div>' +
      '<div class="detail-price"><strong>' + money(p.price) + '</strong><span>' + esc(p.priceUnit || (p.status === 'Off-plan' ? 'off-plan price' : 'asking price')) + '</span></div></div>' +
      '<div class="gallery"><div class="gallery-main"><img id="mainImg" src="' + img(p.images[0], 1400) + '" alt="' + esc(p.title) + '"></div><div class="thumbs">' + thumbs + '</div></div>' +
      '<div class="detail"><div class="detail-main">' +
      '<section><h2>Overview</h2>' + p.description.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</section>' +
      '<section><h2>Key facts</h2><dl class="facts">' + facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl></section>' +
      '<section><h2>Features</h2><ul class="checks">' + p.features.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
      meter +
      (open ? '<section><h2>Payment</h2><p>' + esc(p.payment) + '. All payments are made to the Horic Homes corporate bank account, and an official receipt is issued for each one.</p>' +
        '<div class="notice info" style="margin-top:16px"><i class="fas fa-circle-info"></i><div><p>Before you pay, you can carry out your own search at the Lands Commission. We will give you the site plan to do so. <a class="link" href="buying-guide.html#documents">What documents will I receive?</a></p></div></div></section>' : '') +
      '<section><h2>Location</h2><p class="muted" style="margin-bottom:14px">Nearby: ' + p.nearby.map(esc).join(' · ') + '</p>' +
      '<iframe class="map" title="Map of ' + esc(p.location) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(p.location + ', Ghana') + '&z=13&output=embed"></iframe>' +
      '<p class="muted" style="font-size:14px;margin-top:8px">Map shows the general area. The exact site location is shared on enquiry and during the site visit.</p></section>' +
      '</div>' +
      '<aside class="side">' +
      (open
        ? '<form class="form-card flat js-wa-form" data-subject="Property enquiry" novalidate><h3>Enquire about this property</h3><p>Ref ' + esc(p.ref) + '. Our sales team responds within one working day.</p>' +
          '<input type="hidden" name="Property" value="' + esc(p.title + ' (' + p.ref + ')') + '">' +
          '<div class="field"><label for="e-name">Full name</label><input id="e-name" name="Name" required autocomplete="name"></div>' +
          '<div class="field"><label for="e-phone">Phone / WhatsApp</label><input id="e-phone" name="Phone" type="tel" placeholder="+233" required autocomplete="tel"></div>' +
          '<div class="field"><label for="e-req">I would like to</label><select id="e-req" name="Request"><option>Book a site visit</option><option>Receive the site plan and documents</option><option>Discuss payment plans</option><option>Ask a question</option></select></div>' +
          '<div class="field"><label for="e-msg">Message (optional)</label><textarea id="e-msg" name="Message" rows="3"></textarea></div>' +
          '<button class="btn btn-primary btn-block" type="submit">Send Enquiry</button></form>'
        : '<div class="form-card flat"><h3>This property is ' + esc(p.status.toLowerCase()) + '</h3><p>Ask our sales team about similar properties in ' + esc(p.location) + ' and nearby areas.</p><a class="btn btn-primary btn-block" href="contact.html?topic=' + encodeURIComponent('Similar properties to ' + p.title) + '">Ask About Similar Properties</a></div>') +
      '<div class="contact-box"><a class="btn btn-dark btn-block" href="tel:' + PHONE_TEL + '"><i class="fas fa-phone"></i> Call ' + PHONE_DISPLAY + '</a>' +
      '<a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="' + wa(msg) + '"><i class="fab fa-whatsapp"></i> WhatsApp Us</a>' +
      '<p class="ref">Listing ref ' + esc(p.ref) + ' · Listed ' + monthYear(p.listed) + '</p></div>' +
      '</aside></div>';

    root.querySelectorAll('.thumbs button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.getElementById('mainImg').src = b.getAttribute('data-src');
        root.querySelectorAll('.thumbs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });

    var similar = sortDefault(all()).filter(function (x) { return x.id !== p.id && x.type === p.type && isOpen(x); });
    if (similar.length < 3) similar = similar.concat(sortDefault(all()).filter(function (x) { return x.id !== p.id && x.type !== p.type && isOpen(x); }));
    var simEl = document.getElementById('similar');
    if (simEl) simEl.innerHTML = similar.slice(0, 3).map(card).join('');
  }

  // ---------------------------------------------------------------
  // Investors: land bank table
  // ---------------------------------------------------------------
  function initLandBank() {
    var body = document.getElementById('landbank');
    if (!body) return;
    body.innerHTML = sortDefault(all()).filter(function (p) { return p.type === 'Land'; }).map(function (p) {
      return '<tr><td><a href="property.html?id=' + p.id + '">' + esc(p.title) + '</a></td><td>' + esc(p.location + ', ' + p.region) + '</td>' +
        '<td>' + p.plotsTotal + '</td><td>' + p.plotsLeft + '</td><td>' + money(p.price) + '</td><td>' + esc(p.docs) + '</td>' +
        '<td><span class="badge s-' + slug(p.status) + '">' + esc(p.status) + '</span></td></tr>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCommon();
    initHome();
    initListings();
    initDetail();
    initLandBank();
  });

  return { all: all, byId: byId, card: card, money: money };
})();
