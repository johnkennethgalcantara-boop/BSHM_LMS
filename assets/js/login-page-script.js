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

  if (!window.ACES) { say('assets/js/aces-store.js is missing. Add it before assets/js/login-page-script.js.', 8000); return; }

  /* ---------- Elements ---------- */
  const loginBox = $('loginBox');
  const roleBox = $('role');
  const roleBtn = $('roleBtn');
  const roleLabel = $('roleLabel');
  const roleMenu = $('roleMenu');
  const userInput = $('user');
  const form = $('loginForm');
  const roleItems = Array.from(roleMenu.querySelectorAll('li'));

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

  /* ---------- Password reset ---------- */
  const resetHost = $('resetHost');
  let resetFlow = null;
  let resetPreviousOverflow = null;
  const resetEmail = email => {
    const parts = String(email || '').split('@');
    return parts.length === 2 ? parts[0].charAt(0) + '***@' + parts[1] : 'your registered email';
  };
  const closeReset = () => {
    resetFlow = null;
    resetHost.innerHTML = '';
    if (resetPreviousOverflow !== null) {
      document.body.style.overflow = resetPreviousOverflow.body;
      document.documentElement.style.overflow = resetPreviousOverflow.html;
      resetPreviousOverflow = null;
    }
  };
  const resetMarkup = () => {
    if (resetPreviousOverflow === null) {
      resetPreviousOverflow = {
        body: document.body.style.overflow,
        html: document.documentElement.style.overflow
      };
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    resetHost.innerHTML =
      '<div class="reset-backdrop" data-reset-close>' +
        '<section class="reset-dialog" role="dialog" aria-modal="true" aria-labelledby="resetTitle">' +
          '<button type="button" class="reset-close" data-reset-close aria-label="Close">×</button>' +
          '<h2 id="resetTitle">Reset your password</h2>' +
          '<p class="reset-intro">Verify your account, then choose a new password.</p>' +
          '<p class="reset-status" id="resetStatus" role="status" aria-live="polite" hidden></p>' +
          '<form id="resetForm" novalidate></form>' +
        '</section>' +
      '</div>';
    resetHost.querySelector('.reset-dialog').addEventListener('click', e => e.stopPropagation());
    resetHost.querySelector('.reset-close').addEventListener('click', closeReset);
    resetHost.querySelector('.reset-backdrop').addEventListener('click', closeReset);
    renderResetStep();
    const focus = resetHost.querySelector('input');
    if (focus) focus.focus();
  };
  const resetMessage = (message, error) => {
    const status = $('resetStatus');
    status.textContent = message || '';
    status.classList.toggle('error', !!error);
    status.hidden = !message;
    const otp = $('resetOtp');
    if (otp) {
      otp.classList.toggle('error', !!error);
      if (!error) otp.classList.remove('shake');
    }
  };
  const setupResetOtp = () => {
    const otp = $('resetOtp');
    const boxes = Array.from(otp.querySelectorAll('.reset-otp-box'));
    const verify = $('resetVerify');
    const refresh = () => {
      boxes.forEach(box => box.classList.toggle('filled', !!box.value));
      verify.disabled = boxes.some(box => !box.value);
    };
    const clearError = () => {
      otp.classList.remove('error', 'shake');
      boxes.forEach(box => box.removeAttribute('aria-invalid'));
      if ($('resetStatus').classList.contains('error')) resetMessage('');
    };
    const fillFrom = (start, digits) => {
      let index = start;
      for (const digit of digits) {
        if (index >= boxes.length) break;
        boxes[index++].value = digit;
      }
      refresh();
      clearError();
      boxes[Math.min(index, boxes.length - 1)].focus();
    };

    boxes.forEach((box, index) => {
      box.addEventListener('focus', () => box.select());
      box.addEventListener('input', () => {
        const digits = box.value.replace(/\D/g, '');
        box.value = '';
        if (!digits) { refresh(); clearError(); return; }
        fillFrom(index, digits.length > 1 ? digits : digits.slice(-1));
      });
      box.addEventListener('keydown', e => {
        if (e.key === 'Backspace') {
          if (!box.value && index > 0) {
            e.preventDefault();
            boxes[index - 1].value = '';
            boxes[index - 1].focus();
            refresh();
            clearError();
          } else {
            clearError();
            setTimeout(refresh, 0);
          }
        } else if (e.key === 'Delete') {
          setTimeout(refresh, 0);
          clearError();
        } else if (e.key === 'ArrowLeft' && index > 0) {
          e.preventDefault();
          boxes[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < boxes.length - 1) {
          e.preventDefault();
          boxes[index + 1].focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          boxes[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          boxes[boxes.length - 1].focus();
        } else if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
      });
      box.addEventListener('paste', e => {
        e.preventDefault();
        const digits = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, boxes.length);
        if (!digits) return;
        fillFrom(digits.length >= boxes.length ? 0 : index, digits);
      });
    });
    refresh();
  };
  const renderResetStep = () => {
    const role = form.dataset.role;
    const roleName = role === 'teacher' ? 'teacher' : 'student';
    const resetForm = $('resetForm');
    const resetDialog = resetHost.querySelector('.reset-dialog');
    const status = $('resetStatus');
    resetDialog.classList.toggle('reset-code-step', !!resetFlow && resetFlow.step === 'code');
    resetDialog.classList.toggle('reset-account-step', !resetFlow || resetFlow.step === 'account');
    resetDialog.insertBefore(status, resetForm);
    if (!resetFlow || resetFlow.step === 'account') {
      resetForm.innerHTML =
        '<div class="reset-account-header">' +
          '<span class="reset-shield" aria-hidden="true"><svg viewBox="0 0 48 52"><path d="M24 2 4 9.5v14.5c0 12 8.5 20.5 20 25.5 11.5-5 20-13.5 20-25.5V9.5z" fill="#fff"/><rect x="15.5" y="22" width="17" height="13" rx="3" fill="#4535c9"/><path d="M18.5 22v-3.5a5.5 5.5 0 0 1 11 0V22" fill="none" stroke="#4535c9" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="28.5" r="2" fill="#fff"/></svg></span>' +
          '<h3>Reset your password</h3>' +
          '<p>Verify your account, then choose a new password.</p>' +
        '</div>' +
        '<label for="resetId">' + (role === 'teacher' ? 'Teacher username, email or employee ID' : 'Student ID or email') + '</label>' +
        '<input id="resetId" name="resetId" autocomplete="username" required value="' + (userInput.value.trim().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))) + '">' +
        '<button class="btn-primary reset-submit reset-account-submit" type="submit"><span class="lbl">Send verification code</span><svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17M14 5l7 7-7 7"/></svg></button>';
      resetForm.onsubmit = async e => {
        e.preventDefault();
        const identity = $('resetId').value.trim();
        if (!identity) return resetMessage('Enter your account ID or email.', true);
        let account = null;
        if (role === 'teacher') {
          account = ACES.readTeachers().find(t =>
            [t.username, t.email, t.empId, t.id].some(v => v && ACES.norm(v) === ACES.norm(identity))
          ) || null;
          if (account && account.status === 'disabled') account = null;
        } else {
          account = ACES.findUser(identity);
          if (account && account.status !== 'verified') account = null;
        }
        if (!account) return resetMessage('No active ' + roleName + ' account matched that information. Check the account type and try again, or contact the administrator.', true);
        try {
          resetFlow = {step:'code', role, identity, accountId:account.id || account.studentId, otp:ACES.newOtp()};
          resetMessage('');
          renderResetStep();
          const masked = resetEmail(account.email);
          $('resetDemoCode').textContent = resetFlow.otp.code;
          $('resetDestination').textContent = masked;
          const codeInput = $('resetCode');
          if (codeInput) codeInput.focus();
        } catch (err) {
          resetMessage(err.message === 'crypto-unavailable'
            ? 'Open this page over HTTPS or localhost to request a verification code.'
            : 'Could not create a verification code. Please try again.', true);
        }
      };
      return;
    }
    if (resetFlow.step === 'code') {
      resetForm.innerHTML =
        '<div class="reset-code-header">' +
          '<span class="reset-shield" aria-hidden="true"><svg viewBox="0 0 48 52"><path d="M24 2 4 9.5v14.5c0 12 8.5 20.5 20 25.5 11.5-5 20-13.5 20-25.5V9.5z" fill="#fff"/><rect x="15.5" y="22" width="17" height="13" rx="3" fill="#4535c9"/><path d="M18.5 22v-3.5a5.5 5.5 0 0 1 11 0V22" fill="none" stroke="#4535c9" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="28.5" r="2" fill="#fff"/></svg></span>' +
          '<h3>Verify Your Account</h3>' +
          '<p>We\'ve sent a 6-digit verification code to your registered email address.</p>' +
        '</div>' +
        '<p class="reset-destination"><span>Code sent to</span><b id="resetDestination"></b></p>' +
        '<div class="reset-demo"><b>Prototype verification code</b><code id="resetDemoCode"></code><small>Email delivery is not configured yet. Use this code to continue.</small></div>' +
        '<div class="reset-otp" id="resetOtp" role="group" aria-label="6-digit verification code">' +
          Array.from({length: 6}, (_, i) => '<input class="reset-otp-box" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" '+(i===0?'id="resetCode" autocomplete="one-time-code"':'autocomplete="off"')+' aria-label="Digit '+(i+1)+'">').join('') +
        '</div>' +
        '<button class="btn-primary reset-submit" id="resetVerify" type="submit" disabled><span class="lbl">Verify Code</span><svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17M14 5l7 7-7 7"/></svg></button>' +
        '<div class="reset-help"><p>Didn\'t receive the code? <button type="button" class="reset-link" id="resetResend">Resend Code</button></p><button type="button" class="reset-link reset-back-account" id="resetBack">Use a different account</button></div>';
      resetForm.insertBefore(status, resetForm.querySelector('#resetVerify'));
      $('resetDestination').textContent = resetEmail(resetFlow.accountEmail || (resetFlow.role === 'teacher'
        ? ACES.readTeachers().find(t => String(t.id) === String(resetFlow.accountId))?.email
        : ACES.readUsers().find(u => ACES.norm(u.studentId) === ACES.norm(resetFlow.accountId))?.email));
      $('resetDemoCode').textContent = resetFlow.otp.code;
      setupResetOtp();
      $('resetBack').onclick = () => { resetFlow = null; resetMessage(''); renderResetStep(); };
      $('resetResend').onclick = () => {
        try {
          resetFlow.otp = ACES.newOtp();
          resetMessage('');
          renderResetStep();
          $('resetCode').focus();
          resetMessage('A new verification code is ready.');
        } catch {
          resetMessage('Could not create a verification code. Please try again.', true);
        }
      };
      resetForm.onsubmit = e => {
        e.preventDefault();
        const code = Array.from($('resetOtp').querySelectorAll('.reset-otp-box')).map(box => box.value).join('');
        if (code.length !== 6) return resetMessage('Enter all 6 digits of the verification code.', true);
        if (Date.now() > resetFlow.otp.expiresAt) return resetMessage('This code expired. Send a new code to continue.', true);
        if (code !== resetFlow.otp.code) {
          resetMessage('That code is incorrect. Check it and try again.', true);
          const otp = $('resetOtp');
          const boxes = otp.querySelectorAll('.reset-otp-box');
          boxes.forEach(box => box.setAttribute('aria-invalid', 'true'));
          otp.classList.remove('shake');
          void otp.offsetWidth;
          otp.classList.add('shake');
          boxes.forEach(box => { box.value = ''; });
          $('resetVerify').disabled = true;
          $('resetCode').focus();
          return;
        }
        resetFlow.step = 'password';
        resetMessage('');
        renderResetStep();
        $('newPassword').focus();
      };
      return;
    }
    resetForm.innerHTML =
      '<label for="newPassword">New password</label><input id="newPassword" type="password" autocomplete="new-password" required>' +
      '<label for="confirmPassword">Confirm new password</label><input id="confirmPassword" type="password" autocomplete="new-password" required>' +
      '<p class="reset-foot">Use 8+ characters, one uppercase letter, one number, and one special character.</p>' +
      '<button class="btn-primary reset-submit" type="submit"><span class="lbl">Save new password</span></button>';
    resetForm.onsubmit = async e => {
      e.preventDefault();
      const password = $('newPassword').value;
      if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
        return resetMessage('Password needs 8+ characters, one uppercase letter, one number, and one special character.', true);
      }
      if (password !== $('confirmPassword').value) return resetMessage('The passwords do not match.', true);
      const submit = resetForm.querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        if (resetFlow.role === 'teacher') {
          const accounts = JSON.parse(localStorage.getItem('bshm.accounts') || '[]');
          const teacher = accounts.find(t => t && t.role === 'teacher' && String(t.id) === String(resetFlow.accountId));
          if (!teacher || teacher.status === 'disabled') throw new Error('account-unavailable');
          if (!window.crypto || !crypto.subtle) throw new Error('crypto-unavailable');
          const salt = ACES.newSalt();
          const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + password));
          teacher.salt = salt;
          teacher.hash = [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
          teacher.mustChange = false;
          localStorage.setItem('bshm.accounts', JSON.stringify(accounts));
        } else {
          const users = ACES.readUsers();
          const student = users.find(u => u && ACES.norm(u.studentId) === ACES.norm(resetFlow.accountId));
          if (!student || student.status !== 'verified') throw new Error('account-unavailable');
          const salt = ACES.newSalt();
          student.passwordHash = await ACES.hashPw(password, salt);
          student.salt = salt;
          ACES.writeUsers(users);
        }
        userInput.value = resetFlow.identity;
        pass.value = '';
        closeReset();
        say('Password updated. Sign in with your new password.', 4200);
      } catch (err) {
        submit.disabled = false;
        resetMessage(err.message === 'crypto-unavailable'
          ? 'Password security is unavailable here. Open this page over HTTPS or localhost and try again.'
          : err.message === 'account-unavailable'
          ? 'This account is no longer active. Contact the administrator for help.'
          : 'Could not save the new password. Browser storage may be unavailable or full; please try again.', true);
      }
    };
  };
  $('forgot').addEventListener('click', e => {
    e.preventDefault();
    resetFlow = null;
    resetMarkup();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && resetHost.firstElementChild) closeReset();
  });

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

})();