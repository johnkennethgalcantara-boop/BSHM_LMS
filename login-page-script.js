/* ACES LMS · Sign in (login-page.html) */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'aces_role';

  /* ---------- Toast ---------- */
  const toast = $('toast');
  let toastTimer;
  const say = (msg, ms = 2400) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  };

  if (!window.ACES) { say('aces-store.js is missing. Add it before login-page-script.js.', 8000); return; }

  /* ---------- Elements ---------- */
  const loginBox = $('loginBox');
  const roleBox = $('role');
  const roleBtn = $('roleBtn');
  const roleLabel = $('roleLabel');
  const roleMenu = $('roleMenu');
  const userInput = $('user');
  const form = $('loginForm');
  const roleItems = Array.from(roleMenu.querySelectorAll('li'));

  const googleBtn = $('google');
  const createLink = $('create');
  const setStudentOnly = enabled => {
    googleBtn.disabled = !enabled;
    createLink.tabIndex = enabled ? 0 : -1;
  };

  /* ---------- Role dropdown ---------- */
  const setOpen = open => {
    roleBox.classList.toggle('open', open);
    roleBtn.setAttribute('aria-expanded', String(open));
  };

  const selectRole = name => {
    const role = name.toLowerCase();
    roleLabel.textContent = name;
    roleItems.forEach(li => li.setAttribute('aria-selected', String(li.dataset.role === name)));
    userInput.placeholder = `${name} ID or Email`;
    form.dataset.role = role;
    loginBox.dataset.role = role;
    setStudentOnly(role !== 'teacher');
    try { sessionStorage.setItem(STORAGE_KEY, role); } catch (_) {}
    document.dispatchEvent(new CustomEvent('rolechange', { detail: { role: name } }));
  };

  roleBtn.addEventListener('click', e => {
    e.stopPropagation();
    setOpen(!roleBox.classList.contains('open'));
  });
  roleItems.forEach(li => li.addEventListener('click', e => {
    e.stopPropagation();
    selectRole(li.dataset.role);
    setOpen(false);
    roleBtn.focus();
  }));
  document.addEventListener('click', e => { if (!roleBox.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && roleBox.classList.contains('open')) { setOpen(false); roleBtn.focus(); }
  });

  /* Preselect the role (URL param first, then storage) */
  const params = new URLSearchParams(location.search);
  let picked = params.get('role');
  if (!picked) { try { picked = sessionStorage.getItem(STORAGE_KEY); } catch (_) {} }
  selectRole(picked === 'teacher' ? 'Teacher' : 'Student');

  /* Arriving from the OTP page after a successful verification */
  if (params.get('verified') === '1') {
    say('Account verified. You can now sign in.', 4200);
    params.delete('verified');
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  /* ---------- Password visibility ---------- */
  const pass = $('pass');
  const eye = $('eye');
  eye.addEventListener('click', () => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    eye.classList.toggle('on', show);
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    pass.focus();
  });

  /* ---------- Links ---------- */
  $('forgot').addEventListener('click', e => { e.preventDefault(); say('Forgot Password clicked'); });

  /* ---------- Sign in ---------- */
  const signinBtn = $('signin');
  const signinLabel = signinBtn.querySelector('.lbl');
  const endLoading = () => { signinBtn.classList.remove('loading'); signinLabel.textContent = 'Sign In'; };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (signinBtn.classList.contains('loading')) return;

    const id = userInput.value.trim();
    const pw = pass.value;
    if (!id || !pw) { say('Enter your ID or email and your password.'); return; }

    signinBtn.classList.add('loading');
    signinLabel.textContent = 'Signing In…';
    await new Promise(r => setTimeout(r, 500));

    /* ----- Teacher ----- */
    if (form.dataset.role === 'teacher') {
      try {
        const t = await ACES.checkTeacher(id, pw);
        if (!t) { endLoading(); say('Incorrect ID/email or password.'); return; }
        const initials = (t.name || '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
        ACES.setSession({
          id: t.id,
          name: t.name,
          fullName: t.name,
          initials,
          email: t.email,
          role: 'teacher'
        });
        endLoading();
        say('Welcome back, ' + t.name + '!');
        setTimeout(() => { location.href = ACES.routes.teacherHome; }, 900);
      } catch (err) {
        endLoading();
        say(err.message === 'account-disabled'
          ? 'This account is disabled. Please contact the admin.'
          : err.message === 'crypto-unavailable'
          ? 'Open this page over https or localhost to sign in.'
          : 'Something went wrong. Please try again.');
      }
      return;
    }

    /* ----- Student ----- */
    try {
      const u = ACES.findUser(id);
      const ok = u && (await ACES.hashPw(pw, u.salt)) === u.passwordHash;
      if (!ok) { endLoading(); say('Incorrect ID/email or password.'); return; }

      if (u.status === 'disabled') {
        endLoading();
        say('This account is disabled. Please contact the admin.');
        return;
      }

      if (u.status !== 'verified') {
        const users = ACES.readUsers();
        const rec = users.find(x => ACES.norm(x.studentId) === ACES.norm(u.studentId));
        rec.otp = ACES.newOtp();
        ACES.writeUsers(users);
        say('Please verify your account first.');
        setTimeout(() => {
          location.href = ACES.routes.otp + '?flow=register&sid=' + encodeURIComponent(u.studentId);
        }, 900);
        return;
      }

      const fullName = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ');
      const initials = ((u.firstName || '')[0] || '') + ((u.lastName || '')[0] || '');

      ACES.setSession({
        studentId: u.studentId,
        name: u.firstName,
        firstName: u.firstName,
        middleName: u.middleName,
        lastName: u.lastName,
        fullName,
        initials: initials.toUpperCase(),
        email: u.email,
        role: 'student'
      });

      endLoading();
      say('Welcome back, ' + u.firstName + '!');
      if (ACES.routes.studentHome) setTimeout(() => { location.href = ACES.routes.studentHome; }, 900);
    } catch (err) {
      endLoading();
      say(err.message === 'crypto-unavailable'
        ? 'Open this page over https or localhost to sign in.'
        : 'Something went wrong. Please try again.');
    }
  });

  /* ---------- Google (visual only, student only) ---------- */
  googleBtn.addEventListener('click', () => say('Google sign-in is visual only'));
})();