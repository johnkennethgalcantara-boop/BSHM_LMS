/* ===== BSHM POS Activities Data =====
   Shared by the student pages (activities.html, assets/js/pos-training.js).
   1) TEACHER-PUBLISHED trainings (saved by the POS Training Builder in
      localStorage under 'bshm.pos.custom') are merged in automatically.
*/
(function(){
  var KEY = 'bshm.pos.custom';
  /* ---------- TEACHER-PUBLISHED TRAININGS ---------- */
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
  function build(){
    var seen = {}, all = [];
    loadCustom().forEach(function(raw){
      var a = normalize(raw);
      if(a && !seen[a.id]){ seen[a.id] = 1; all.push(a); }
    });
    return all;
  }

  window.POS_ACTIVITIES = build();
  window.ACES_REFRESH_POS_ACTIVITIES = function(){window.POS_ACTIVITIES=build();return window.POS_ACTIVITIES};
})();