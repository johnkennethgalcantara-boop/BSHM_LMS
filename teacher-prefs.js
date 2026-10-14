/* BSHM LMS – shared teacher prefs: theme + compact (all teacher pages) */
(function () {
  var K = 'bshm.teacher.settings';
  function read() { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } }
  var mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');

  var st = document.createElement('style');
  st.textContent =
    'html[data-theme="dark"]{filter:invert(1) hue-rotate(180deg);background:#fff}' +
    'html[data-theme="dark"] img,html[data-theme="dark"] video,html[data-theme="dark"] [style*="background-image"]{filter:invert(1) hue-rotate(180deg)}';
  (document.head || document.documentElement).appendChild(st);

  function apply() {
    var s = read(), t = s.theme || 'light';
    var dark = t === 'dark' || (t === 'system' && mq && mq.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (document.body) document.body.classList.toggle('compact', !!s.compact);
  }

  apply();
  document.addEventListener('DOMContentLoaded', apply);
  if (mq && mq.addEventListener) mq.addEventListener('change', apply);
  window.addEventListener('storage', function (e) { if (!e.key || e.key === K) apply(); });
  window.teacherPrefs = { apply: apply };
})();