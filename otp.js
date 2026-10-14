/* ACES LMS · OTP verification (front-end prototype)
   Register flow checks the code stored on the pending account (aces-store.js).
   Replace the data access with real API calls when a backend exists. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);

  if (!window.ACES) {
    const t = $('toast');
    if (t) { t.textContent = 'aces-store.js is missing. Add it before otp.js.'; t.classList.add('show'); }
    console.error('aces-store.js did not load');
    return;
  }

  const params = new URLSearchParams(location.search);
  const sid = params.get('sid') || '';
  const flow = params.get('flow') === 'reset' ? 'reset' : 'register';

  const CONFIG = {
    resendSeconds: 59,
    codeLength: 6,
    routes: {
      changeEmail: { register: ACES.routes.register, reset: 'forgot-password.html' },
      backFallback: { register: ACES.routes.register, reset: 'forgot-password.html' },
      continue: { register: ACES.routes.login + '&verified=1', reset: 'reset-password.html' }
    }
  };
  const N = CONFIG.codeLength;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Data layer ---------- */
  let demoExpected = null;   // reset flow only
  const findPending = users =>
    users.find(u => u.status === 'pending' && ACES.norm(u.studentId) === ACES.norm(sid));

  const OtpService = {
    pendingUser() { return flow === 'register' ? findPending(ACES.readUsers()) : null; },

    async send() {
      await wait(400);
      if (flow !== 'register') { demoExpected = '123456'; return { ok: true, code: demoExpected }; }
      const users = ACES.readUsers(), u = findPending(users);
      if (!u) return { ok: false };
      u.otp = ACES.newOtp();
      ACES.writeUsers(users);
      return { ok: true, code: u.otp.code };
    },

    async verify(code) {
      await wait(600);
      if (flow !== 'register') {
        return code === demoExpected ? { ok: true } : { ok: false, msg: 'Invalid verification code. Please try again.' };
      }
      const users = ACES.readUsers(), u = findPending(users);
      if (!u || !u.otp) return { ok: false, msg: 'Session expired. Please create your account again.' };
      if (Date.now() > u.otp.expiresAt) return { ok: false, msg: 'Code expired. Please request a new one.' };
      if (code !== u.otp.code) return { ok: false, msg: 'Invalid verification code. Please try again.' };
      u.status = 'verified';
      u.verifiedAt = new Date().toISOString();
      delete u.otp;
      ACES.writeUsers(users);
      return { ok: true };
    }
  };

  /* ---------- Elements ---------- */
  const boxes = [...document.querySelectorAll('.otp-box')];
  const otp = $('otp'), status = $('status'), verifyBtn = $('verifyBtn'), resendBtn = $('resend');

  const maskEmail = e => {
    const [u, d] = (e || '').split('@');
    return d ? u.charAt(0) + '***@' + d : (e || '');
  };

  const pending = OtpService.pendingUser();
  const email = pending ? pending.email : (params.get('email') || 'student@example.com');
  $('maskedEmail').textContent = maskEmail(email);
  const showDemoCode = code => { $('demoCode').textContent = code; };

  const getCode = () => boxes.map(b => b.value).join('');
  const isComplete = () => getCode().length === N;

  function setStatus(msg, type) {
    status.textContent = msg || '';
    status.className = 'status' + (msg ? ' show ' + type : '');
  }
  function clearError() {
    otp.classList.remove('error');
    boxes.forEach(b => b.removeAttribute('aria-invalid'));
    if (status.classList.contains('err')) setStatus('');
  }
  function refresh() {
    boxes.forEach(b => b.classList.toggle('filled', !!b.value));
    verifyBtn.disabled = !isComplete();
  }
  function fillFrom(start, digits) {
    let i = start;
    for (const d of digits) { if (i >= N) break; boxes[i++].value = d; }
    refresh(); clearError();
    boxes[Math.min(i, N - 1)].focus();
  }
  function resetBoxes() { boxes.forEach(b => b.value = ''); refresh(); boxes[0].focus(); }

  /* ---------- Code boxes ---------- */
  boxes.forEach((box, i) => {
    box.addEventListener('focus', () => box.select());

    box.addEventListener('input', () => {
      const digits = box.value.replace(/\D/g, '');
      box.value = '';
      if (!digits) { refresh(); return; }
      fillFrom(i, digits.length > 1 ? digits : digits.slice(-1));   // >1 = autofill / fast paste
    });

    box.addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'Backspace') {
        if (!box.value && i > 0) { e.preventDefault(); boxes[i - 1].value = ''; boxes[i - 1].focus(); refresh(); clearError(); }
        else { clearError(); setTimeout(refresh, 0); }
      } else if (k === 'Delete') { setTimeout(refresh, 0); clearError(); }
      else if (k === 'ArrowLeft' && i > 0) { e.preventDefault(); boxes[i - 1].focus(); }
      else if (k === 'ArrowRight' && i < N - 1) { e.preventDefault(); boxes[i + 1].focus(); }
      else if (k === 'Home') { e.preventDefault(); boxes[0].focus(); }
      else if (k === 'End') { e.preventDefault(); boxes[N - 1].focus(); }
      else if (k.length === 1 && !/\d/.test(k) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); }   // numbers only
    });

    box.addEventListener('paste', e => {
      e.preventDefault();
      const digits = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, N);
      if (!digits) return;
      fillFrom(digits.length >= N ? 0 : i, digits);
    });
  });

  /* ---------- Verify ---------- */
  $('otpForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!isComplete() || verifyBtn.classList.contains('loading')) return;
    verifyBtn.classList.add('loading');
    verifyBtn.disabled = true;
    verifyBtn.querySelector('.lbl').textContent = 'Verifying…';
    setStatus('');
    let res = { ok: false };
    try { res = await OtpService.verify(getCode()); } catch (_) { res = { ok: false }; }
    verifyBtn.classList.remove('loading');
    verifyBtn.querySelector('.lbl').textContent = 'Verify Code';
    if (res.ok) { showSuccess(); return; }
    otp.classList.add('error');
    boxes.forEach(b => b.setAttribute('aria-invalid', 'true'));
    otp.classList.remove('shake'); void otp.offsetWidth; otp.classList.add('shake');
    setStatus(res.msg || 'Invalid verification code. Please try again.', 'err');
    boxes.forEach(b => b.value = ''); refresh(); boxes[0].focus();
  });

  function showSuccess() {
    stopTimer();
    $('verifyView').hidden = true;
    $('successView').hidden = false;
    $('continueBtn').focus();
  }
  $('continueBtn').addEventListener('click', () => { location.href = CONFIG.routes.continue[flow]; });

  /* ---------- Resend countdown ---------- */
  let remaining = 0, tick = null, noticeTimer = null;
  const fmt = s => '00:' + String(s).padStart(2, '0');
  function renderResend() {
    if (remaining > 0) {
      resendBtn.disabled = true;
      resendBtn.innerHTML = 'Resend Code in <span id="timer">' + fmt(remaining) + '</span>';
    } else {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  }
  function stopTimer() { clearInterval(tick); tick = null; }
  function startTimer() {
    stopTimer();
    remaining = CONFIG.resendSeconds;
    renderResend();
    tick = setInterval(() => {
      remaining--; renderResend();
      if (remaining <= 0) stopTimer();
    }, 1000);
  }

  resendBtn.addEventListener('click', async () => {
    if (resendBtn.disabled) return;
    startTimer();
    resetBoxes(); clearError();
    let res = { ok: false };
    try { res = await OtpService.send(); } catch (_) {}
    if (res.ok) {
      showDemoCode(res.code);
      setStatus('Verification code sent again.', 'ok');
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => { if (status.classList.contains('ok')) setStatus(''); }, 4000);
    } else {
      setStatus('Session expired. Please create your account again.', 'err');
    }
  });

  /* ---------- Navigation ---------- */
  $('changeEmail').addEventListener('click', e => { e.preventDefault(); location.href = CONFIG.routes.changeEmail[flow]; });
  $('backLink').addEventListener('click', e => {
    e.preventDefault();
    if (document.referrer && history.length > 1) history.back();
    else location.href = CONFIG.routes.backFallback[flow];
  });

  /* ---------- Init ---------- */
  if (flow === 'register' && !pending) {
    // opened directly, or the pending account is gone
    $('demoNote').hidden = true;
    boxes.forEach(b => b.disabled = true);
    resendBtn.disabled = true;
    resendBtn.textContent = 'Resend Code';
    setStatus('No pending registration found. Please create your account first.', 'err');
  } else {
    if (pending) showDemoCode(pending.otp ? pending.otp.code : '------');
    else OtpService.send().then(r => showDemoCode(r.code)).catch(() => {});
    startTimer();
    boxes[0].focus();
  }
})();