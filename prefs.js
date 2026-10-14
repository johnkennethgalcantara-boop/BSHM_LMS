/* ACES Polytechnic College – shared student prefs: theme, compact, avatar (all pages) */
(function () {
  var K = 'bshm.student.settings', PK = 'bshm.student.profile';
  function read(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  var mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');

  /* Dark mode: invert the page, then re-invert photos so they look normal */
  var st = document.createElement('style');
  st.textContent =
    'html[data-theme="dark"]{filter:invert(1) hue-rotate(180deg);background:#fff}' +
    'html[data-theme="dark"] img,html[data-theme="dark"] video,html[data-theme="dark"] [style*="background-image"]{filter:invert(1) hue-rotate(180deg)}';
  (document.head || document.documentElement).appendChild(st);

  function apply() {
    var s = read(K), t = s.theme || 'light';
    var dark = t === 'dark' || (t === 'system' && mq && mq.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (document.body) document.body.classList.toggle('compact', !!s.compact);
  }

  function avatar() {
    var p = read(PK);
    [].forEach.call(document.querySelectorAll('header.topnav .av'), function (a) {
      if (p.photo) { a.style.backgroundImage = 'url("' + p.photo + '")'; a.style.backgroundSize = 'cover'; a.style.backgroundPosition = 'center'; a.style.color = 'transparent'; }
      else { a.style.backgroundImage = ''; a.style.color = ''; }
    });
  }

  apply();
  document.addEventListener('DOMContentLoaded', function () {
    apply(); avatar();
    /* shell.js builds the navbar later, so re-apply the avatar when it appears */
    new MutationObserver(avatar).observe(document.body, { childList: true, subtree: true });
  });
  if (mq && mq.addEventListener) mq.addEventListener('change', apply);
  window.addEventListener('storage', function (e) { if (!e.key || e.key === K || e.key === PK) { apply(); avatar(); } });
  window.bshmPrefs = { apply: apply, avatar: avatar };
})();