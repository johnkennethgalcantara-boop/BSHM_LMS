/* Dinelearn LMS · Role selection (index.html) */
(() => {
  'use strict';

  const LOGIN_PAGE = 'login-page.html';   // change if your login page has another name
  const STORAGE_KEY = 'aces_role';

  document.querySelectorAll('.card[data-role]').forEach(card => {
    card.addEventListener('click', () => {
      const role = card.dataset.role; // "student" or "teacher"

      try {
        sessionStorage.setItem(STORAGE_KEY, role);
      } catch (err) {
        /* storage unavailable: the URL param below still carries the role */
      }

      location.href = `${LOGIN_PAGE}?role=${encodeURIComponent(role)}`;
    });
  });
})();