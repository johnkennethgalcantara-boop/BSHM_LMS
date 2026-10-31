/* ACES LMS · Page guard (runs at the top of every teacher / student page).
   Sends you to the login page when you are not signed in, or when the admin
   has disabled or deleted your account. Re-checks live if the admin changes
   something in another tab.
   Prototype only: this reads browser storage, so it is NOT real security.
   A real backend must enforce this on the server. */
(function () {
  'use strict';
  var role = document.body && document.body.getAttribute('data-role');
  if (role !== 'teacher' && role !== 'student') return;

  var rj = function (st, k) { try { return JSON.parse(st.getItem(k)); } catch (e) { return null; } };
  var low = function (v) { return String(v == null ? '' : v).trim().toLowerCase(); };

  function allowed() {
    var s = rj(sessionStorage, 'aces_session');
    if (!s || s.role !== role) return false;
    if (role === 'teacher') {
      return (rj(localStorage, 'bshm.accounts') || []).some(function (a) {
        return a && a.role === 'teacher' && String(a.id) === String(s.id) && a.status !== 'disabled';
      });
    }
    return (rj(localStorage, 'aces_users') || []).some(function (u) {
      return u && low(u.studentId) === low(s.studentId) && u.status === 'verified';
    });
  }

  function kick() {
    try { sessionStorage.removeItem('aces_session'); } catch (e) {}
    document.documentElement.style.display = 'none';
    location.replace('login-page.html?role=' + role);
  }

  if (!allowed()) { kick(); return; }
  var chk=function(){ if (!allowed()) kick(); };
  setInterval(chk, 4000);
  document.addEventListener('visibilitychange', chk);
  window.addEventListener('focus', chk);
  window.addEventListener('pageshow', chk);
  window.addEventListener('storage', function (e) {
    if (e.key === 'bshm.accounts' || e.key === 'aces_users') { if (!allowed()) kick(); }
  });
})();
