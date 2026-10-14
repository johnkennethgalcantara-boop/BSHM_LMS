/* ACES BSHM LMS · Teacher helpers.
   The navbar is built by shell.js. This file marks the page as a teacher page,
   adds the extra icons teacher pages use, and provides small helpers.
   Load it BEFORE shell.js and before any page script that uses tlsGet / tlsSet / tesc / ttoast. */
(function(){
  /* Every teacher page loads this file, so set the role here (shell.js reads it).
     Without this, pages other than teacher.html showed the STUDENT navbar. */
  document.body.dataset.role='teacher';

  /* Extra icons that shell.js does not add by itself */
  var sy='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
  '<symbol id="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>'+
  '<symbol id="check" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/></symbol>'+
  '<symbol id="alert" viewBox="0 0 24 24"><path d="M12 3l10 18H2zM12 10v5M12 18v.5"/></symbol>'+
  '<symbol id="idc" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h4M7 14h3M15 10h2M15 14h2"/></symbol>'+
  '<symbol id="mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></symbol>'+
  '<symbol id="mob" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></symbol>'+
  '<symbol id="pin" viewBox="0 0 24 24"><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></symbol>'+
  '<symbol id="cam" viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></symbol>'+
  '<symbol id="cap" viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5"/></symbol>'+
  '<symbol id="grid" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></symbol>'+
  '<symbol id="shield" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></symbol>'+
  '<symbol id="lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></symbol>'+
  '<symbol id="eye" viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></symbol>'+
  '<symbol id="pal" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/></symbol>'+
  '<symbol id="edit" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/></symbol>'+
  '</defs></svg>';
  document.body.insertAdjacentHTML('afterbegin',sy);

  /* Helpers used by the teacher pages */
  window.tlsGet=function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
  window.tlsSet=function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  window.tesc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  window.ttoast=function(m){var t=document.getElementById('tt');if(!t)return;t.textContent=m;t.className='tt on';clearTimeout(t._h);t._h=setTimeout(function(){t.className='tt'},2600)};
})();

/* Compact interface preference (set in Settings) applies to every teacher page.
   Bottom padding is left alone so the mobile tab bar never covers content.
   Also makes the [hidden] attribute always win over component display rules. */
(function(){
  var c=(tlsGet('bshm.teacher.settings')||{}).compact;
  if(c)document.body.classList.add('compact');
  var st=document.createElement('style');
  st.textContent='[hidden]{display:none!important}body.compact main{padding-top:16px!important;padding-left:16px!important;padding-right:16px!important}body.compact .card{padding:14px}';
  document.head.appendChild(st);
})();

/* Student results written by the student pages (same browser): quizzes/exams = bshm.hist.*, POS = bshm.poshist.* */
window.tlsResults=function(){
  var H=[],P=[];
  for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);
    if(k.indexOf('bshm.hist.')===0)(tlsGet(k)||[]).forEach(function(r){H.push(r)});
    else if(k.indexOf('bshm.poshist.')===0)(tlsGet(k)||[]).forEach(function(r){P.push(r)});}
  return {H:H,P:P};
};

/* Shared class data + per-student stats (attendance, grades) used by Classes and Reports */
window.TLS_CLASSES=[['BSHM 101','Food & Beverage Services','Section A','Mon & Wed · 8:00–9:30 AM','Room 204 · Kitchen Lab'],['BSHM 103','Tourism Management','Section A','Tue & Thu · 10:00–11:30 AM','Room 105'],['BSHM 104','Housekeeping Operations','Section B','Fri · 1:00–4:00 PM','Room 301']];
/* Admin > Faculty Assignment (bshm.assignments, keyed by teacher id). If the admin has assigned this teacher classes, those replace the demo list. */
(function(){try{var se=JSON.parse(sessionStorage.getItem('aces_session'))||{},m=JSON.parse(localStorage.getItem('bshm.assignments'))||{},db=JSON.parse(localStorage.getItem('bshm.db'))||{};
  if(se.role==='teacher'&&m[se.id]&&m[se.id].length)window.TLS_CLASSES=m[se.id].map(function(c){return [c[0],c[1],c[2],'Schedule not set','Room not set']});
  else if(se.role==='teacher'&&db.assign&&db.assign.length)window.TLS_CLASSES=[];}catch(e){}})();
window.TLS_ROSTER=['Juan Dela Cruz','Ana Reyes','Mark Lim','Rica Cruz','Paolo Garcia','Jenny Tan','Carlo Mendoza','Bea Aquino'];
window.tlsClassInfo=function(i){var c=TLS_CLASSES[i],o=(tlsGet('bshm.class.info')||{})[c[0]]||{};return {sched:o.sched||c[3],room:o.room||c[4]}};
window.tlsStudentStats=function(code){
  var R=tlsResults(),W=tlsGet('bshm.gb.w')||{q:30,e:40,p:30},G=tlsGet('bshm.gb.'+code)||{},lc=function(s){return String(s==null?'':s).trim().toLowerCase()};
  var avg=function(a){return a.length?Math.round(a.reduce(function(x,y){return x+y},0)/a.length):null};
  var days=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf('bshm.att.'+code+'.')===0)days.push(tlsGet(k)||{})}
  return TLS_ROSTER.map(function(n){
    var key=lc(n),best={};
    R.H.forEach(function(r){if(lc(r.student_id)!==key||r.percentage==null)return;if(!best[r.exam_id]||r.attempt_number>=best[r.exam_id].attempt_number)best[r.exam_id]=r});
    var q=[],e=[];Object.keys(best).forEach(function(k){(/quiz/i.test(best[k].exam_id+' '+best[k].exam_title)?q:e).push(best[k].percentage)});
    var p=R.P.filter(function(r){return lc(r.student)===key}).map(function(r){return r.score}),m=G[n]||{};
    var v={q:m.q!=null?m.q:avg(q),e:m.e!=null?m.e:avg(e),p:m.p!=null?m.p:avg(p)},t=W.q+W.e+W.p;
    var fin=(v.q==null||v.e==null||v.p==null||!t)?null:Math.round((v.q*W.q+v.e*W.e+v.p*W.p)/t*10)/10;
    var mk=0,ok=0;days.forEach(function(d){if(d[n]){mk++;if(d[n]!=='Absent')ok++}});
    return {name:n,q:v.q,e:v.e,p:v.p,final:fin,att:mk?Math.round(ok/mk*100):null,days:mk,restricted:R.H.filter(function(r){return lc(r.student_id)===key&&r.status==='RESTRICTED'}).length};
  });
};