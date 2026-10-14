/* ACES LMS · Homepage banners (the "Featured course" carousel).
   The admin manages these in admin.html > Homepage Banners.
   Stored in localStorage under 'bshm.banners' (photos are saved as small JPEG data URLs).
   Student dashboard: student.js reads them.  Teacher dashboard: auto-mounts into #bnTeacher. */
(function () {
  'use strict';
  var KEY = 'bshm.banners';

  // Shown until the admin saves their own banners
  var DEFAULTS = [
    { id: 'd1', title: 'Food & Beverage Services', caption: 'Module 4: Table Service · 78% complete', link: 'courses.html', img: '', colors: '#151A3A,#4F35D2', audience: 'student', active: true },
    { id: 'd2', title: 'Front Office Operations',  caption: 'Open this course', link: 'courses.html', img: '', colors: '#232B63,#3B2F9E', audience: 'student', active: true },
    { id: 'd3', title: 'Tourism Management',       caption: 'Open this course', link: 'courses.html', img: '', colors: '#151A3A,#3F4FC9', audience: 'student', active: true }
  ];

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // Only same-site .html pages or http(s) links. Blocks javascript: and similar.
  var safeLink = function (l) {
    l = String(l || '').trim();
    return (/^https?:\/\//i.test(l) || /^[\w\-./]+\.html?([?#].*)?$/i.test(l)) ? l : '';
  };

  function all() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(v)) return v;
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  // audience: 'student' | 'teacher'
  function read(audience) {
    return all().filter(function (b) {
      return b && b.active !== false && (b.audience === 'both' || b.audience === audience);
    });
  }
  function bg(b) {
    var grad = 'linear-gradient(135deg,' + (b.colors || '#151A3A,#4F35D2') + ')';
    if (!b.img || !/^data:image\//.test(b.img)) return grad;
    return 'linear-gradient(0deg,rgba(21,26,58,.78) 0%,rgba(21,26,58,0) 60%),url(\'' + b.img + '\') center/cover no-repeat,' + grad;
  }
  function onChange(fn) {
    window.addEventListener('storage', function (e) { if (e.key === KEY) fn(); });
  }

  /* ---------- Teacher dashboard carousel ---------- */
  function css() {
    if (document.getElementById('bn-css')) return;
    var s = document.createElement('style'); s.id = 'bn-css';
    s.textContent =
      '.bn-card{border:1px solid #ECEBF5;border-radius:20px;background:#fff;overflow:hidden;box-shadow:0 4px 14px rgba(79,53,210,.07)}' +
      '.bn-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:12px 16px}' +
      '.bn-h span{font-size:12px;font-weight:500;color:#7A7799}.bn-h b{font-size:14px;font-weight:600;color:#1B1740}' +
      '.bn-show{position:relative;overflow:hidden;aspect-ratio:16/4.6;background:#1E1B4B}' +
      '.bn-track{display:flex;height:100%;transition:transform .5s ease}' +
      '.bn-sl{flex:0 0 100%;height:100%;display:flex;align-items:flex-end;padding:12px 80px 12px 16px;color:#fff;font-weight:600;font-size:14px;text-shadow:0 1px 6px rgba(0,0,0,.45)}' +
      '.bn-nav{position:absolute;top:50%;transform:translateY(-50%);width:28px;height:28px;border:0;border-radius:50%;background:rgba(255,255,255,.9);color:#1B1740;font:18px/1 sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18)}' +
      '.bn-p{left:8px}.bn-n{right:8px}' +
      '.bn-dots{position:absolute;right:12px;bottom:12px;display:flex;gap:6px}' +
      '.bn-dots button{width:6px;height:6px;padding:0;border:0;border-radius:3px;background:rgba(255,255,255,.55);cursor:pointer;transition:width .25s}' +
      '.bn-dots button.on{width:16px;background:#fff}' +
      '.bn-f{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;font-size:12.5px;color:#7A7799}' +
      '.bn-f a{font-weight:500;color:#4F35D2;white-space:nowrap;text-decoration:none}' +
      '@media(prefers-reduced-motion:reduce){.bn-track{transition:none}}';
    document.head.appendChild(s);
  }

  function mount(el, audience) {
    var B = read(audience), i = 0;
    if (!B.length) { el.style.display = 'none'; return; }
    css(); el.style.display = ''; el.classList.add('bn-card');
    el.innerHTML =
      '<div class="bn-h"><span>Featured</span><b></b></div>' +
      '<div class="bn-show" role="region" aria-roledescription="carousel" aria-label="Featured">' +
        '<div class="bn-track">' + B.map(function (b) {
          return '<div class="bn-sl" style="background:' + bg(b) + '">' + esc(b.title) + '</div>';
        }).join('') + '</div>' +
        (B.length > 1 ? '<button class="bn-nav bn-p" aria-label="Previous slide">‹</button><button class="bn-nav bn-n" aria-label="Next slide">›</button>' +
          '<div class="bn-dots">' + B.map(function (_, k) { return '<button aria-label="Slide ' + (k + 1) + '" data-k="' + k + '"></button>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="bn-f"><span></span><a href="#"></a></div>';
    var tr = el.querySelector('.bn-track'), head = el.querySelector('.bn-h b'),
        cap = el.querySelector('.bn-f span'), lk = el.querySelector('.bn-f a'),
        dots = el.querySelectorAll('.bn-dots button');
    function go(n) {
      i = (n + B.length) % B.length;
      tr.style.transform = 'translateX(-' + i * 100 + '%)';
      [].forEach.call(dots, function (d, k) { d.className = k === i ? 'on' : ''; });
      var b = B[i], l = safeLink(b.link);
      head.textContent = b.title; cap.textContent = b.caption || '';
      lk.style.display = l ? '' : 'none';
      if (l) { lk.href = l; lk.textContent = 'Open →'; }
    }
    var p = el.querySelector('.bn-p'), n = el.querySelector('.bn-n');
    if (p) p.onclick = function () { go(i - 1); };
    if (n) n.onclick = function () { go(i + 1); };
    [].forEach.call(dots, function (d) { d.onclick = function () { go(+d.getAttribute('data-k')); }; });
    go(0);
  }

  window.ACESBanners = { KEY: KEY, all: all, save: save, read: read, bg: bg, esc: esc, safeLink: safeLink, mount: mount, onChange: onChange };

  function auto() {
    var t = document.getElementById('bnTeacher');
    if (t) { mount(t, 'teacher'); onChange(function () { mount(t, 'teacher'); }); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
