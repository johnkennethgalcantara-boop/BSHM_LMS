/* ===== BSHM POS Activities Data =====
   Shared by the student pages (activities.html, pos-training.js).
   1) BUILT-IN trainings are defined below.
   2) TEACHER-PUBLISHED trainings (saved by the POS Training Builder in
      localStorage under 'bshm.pos.custom') are merged in automatically.

   NOTE: if you already had your own built-in activities, paste them into
   BUILTIN below (replace the 3 samples). Keep the same fields.
*/
(function(){
  var KEY = 'bshm.pos.custom';

  /* ---------- 1. BUILT-IN TRAININGS ---------- */
  var BUILTIN = [
    {
      id: 'pos-1',
      title: 'POS Training 1: Basic Cash Order',
      desc: 'Process a simple cash order from start to finish.',
      objective: 'Complete the 7-step POS workflow accurately with a cash payment.',
      course: 'BSHM 101',
      due: '',
      points: 50, pass: 75, time: 15, steps: 7,
      scenario: { qty: 1, method: 'CASH', discount: null }
    },
    {
      id: 'pos-2',
      title: 'POS Training 2: GCash Order',
      desc: 'Process an order paid through GCash using the reference number.',
      objective: 'Verify a GCash payment and complete the transaction.',
      course: 'BSHM 101',
      due: '',
      points: 50, pass: 75, time: 15, steps: 7,
      scenario: { qty: 2, method: 'GCASH', discount: null }
    },
    {
      id: 'pos-3',
      title: 'POS Training 3: Discounted Cash Order',
      desc: 'Apply a customer discount and process a cash payment.',
      objective: 'Apply the requested discount at Review Total and complete payment.',
      course: 'BSHM 102',
      due: '',
      points: 50, pass: 75, time: 15, steps: 7,
      scenario: { qty: 2, method: 'CASH', discount: { type: 'percent', value: 20 } }
    }
  ];

  /* ---------- 2. TEACHER-PUBLISHED TRAININGS ---------- */
  function loadCustom(){
    try{
      var v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v : [];
    }catch(e){ return []; }
  }

  /* Fill in defaults and clamp values so a bad record can never crash the simulator */
  function normalize(a){
    if(!a || !a.id || !a.title) return null;
    var s = a.scenario || {};
    var method = (s.method === 'CASH' || s.method === 'GCASH' || s.method === 'random') ? s.method : 'CASH';
    var d = s.discount && Number(s.discount.value) > 0
      ? { type: s.discount.type === 'amount' ? 'amount' : 'percent', value: Number(s.discount.value) }
      : null;
    return {
      id: String(a.id),
      title: String(a.title),
      desc: a.desc || 'Practice the POS transaction workflow.',
      objective: a.objective || 'Complete the POS workflow accurately and within the time limit.',
      course: a.course || '',
      due: a.due || '',
      points: Math.max(1, Number(a.points) || 50),
      pass: Math.max(1, Math.min(100, Number(a.pass) || 75)),
      time: Math.max(1, Number(a.time) || 15),
      steps: 7,
      custom: true,
      scenario: {
        qty: Math.max(1, Math.min(3, Number(s.qty) || 1)),
        method: method,
        discount: d
      }
    };
  }

  /* ---------- MERGE ---------- */
  var seen = {}, all = [];
  BUILTIN.forEach(function(a){ seen[a.id] = 1; all.push(a); });
  loadCustom().forEach(function(raw){
    var a = normalize(raw);
    if(a && !seen[a.id]){ seen[a.id] = 1; all.push(a); }
  });

  window.POS_ACTIVITIES = all;
})();