/* ACES BSHM LMS · Teacher helpers.
   The navbar is built by assets/js/shell.js. This file marks the page as a teacher page,
   adds the extra icons teacher pages use, and provides small helpers.
   Load it BEFORE assets/js/shell.js and before any page script that uses tlsGet / tlsSet / tesc / ttoast. */
(function(){
  /* Every teacher page loads this file, so set the role here (assets/js/shell.js reads it).
     Without this, pages other than teacher.html showed the STUDENT navbar. */
  document.body.dataset.role='teacher';

  /* Extra icons that assets/js/shell.js does not add by itself */
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
  window.tlsSet=function(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){console.error('[teacher] Could not save browser data for '+k+'.',e);return false}};
  function teacherSession(){
    try{
      var s=JSON.parse(sessionStorage.getItem('aces_session')||'null');
      return s&&s.role==='teacher'&&s.id!=null? s:null;
    }catch(e){return null}
  }
  function teacherKey(base){
    var s=teacherSession();
    return s?base+'.'+encodeURIComponent(String(s.id)):base;
  }
  function legacyProfileBelongsTo(s,profile){
    var accounts=window.tlsGet('bshm.accounts')||[],account=accounts.filter(function(a){return a&&a.role==='teacher'&&String(a.id)===String(s.id)})[0];
    var directory=window.tlsGet('bshm.directory')||{},namedEntries=[];
    Object.keys(directory).forEach(function(k){
      var d=directory[k];
      if(d&&d.role==='teacher'&&profile.name&&d.name&&String(profile.name).trim().toLowerCase()===String(d.name).trim().toLowerCase())namedEntries.push(d);
    });
    if(namedEntries.length)return namedEntries.some(function(d){return String(d.teacherId||'')===String(s.id)});
    var oldName=window.tlsGet('bshm.teacher.chatid');
    if(!oldName||!account||String(account.name||'').trim().toLowerCase()!==String(oldName).trim().toLowerCase())return false;
    return accounts.filter(function(a){return a&&a.role==='teacher'&&String(a.name||'').trim().toLowerCase()===String(oldName).trim().toLowerCase()}).length===1;
  }
  window.tlsTeacherProfileKey=function(){return teacherKey('bshm.teacher.profile')};
  window.tlsTeacherProfileGet=function(){
    var key=teacherKey('bshm.teacher.profile'),profile=window.tlsGet(key);
    if(profile&&typeof profile==='object')return profile;
    var s=teacherSession(),legacy=window.tlsGet('bshm.teacher.profile');
    if(s&&legacy&&typeof legacy==='object'&&legacyProfileBelongsTo(s,legacy)){
      window.tlsSet(key,legacy);
      return legacy;
    }
    return {};
  };
  window.tlsTeacherProfileSet=function(profile){return window.tlsSet(teacherKey('bshm.teacher.profile'),profile)};
  window.tlsTeacherChatIdGet=function(){
    var key=teacherKey('bshm.teacher.chatid'),id=localStorage.getItem(key);
    if(id)return id;
    var s=teacherSession(),old=localStorage.getItem('bshm.teacher.chatid');
    if(s&&old){
      var accounts=window.tlsGet('bshm.accounts')||[],account=accounts.filter(function(a){return a&&a.role==='teacher'&&String(a.id)===String(s.id)})[0];
      var uniqueName=accounts.filter(function(a){return a&&a.role==='teacher'&&String(a.name||'').trim().toLowerCase()===String(old).trim().toLowerCase()}).length===1;
      if(uniqueName&&account&&String(account.name||'').trim().toLowerCase()===String(old).trim().toLowerCase()){
        localStorage.setItem(key,old);
        return old;
      }
    }
    return '';
  };
  window.tlsTeacherChatIdSet=function(id){try{localStorage.setItem(teacherKey('bshm.teacher.chatid'),id)}catch(e){}};
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
window.TLS_CLASSES=[];
(function(){try{
  var se=JSON.parse(sessionStorage.getItem('aces_session'))||{},m=JSON.parse(localStorage.getItem('bshm.assignments'))||{},db=JSON.parse(localStorage.getItem('bshm.db'))||{};
  if(se.role!=='teacher')return;
  if(Array.isArray(m[se.id])&&m[se.id].length){
    window.TLS_CLASSES=m[se.id].map(function(c){return [c[0],c[1],c[2],'Schedule not set','Room not set']});
    return;
  }
  if(db.assign&&db.assign.length)return;
  var published=JSON.parse(localStorage.getItem('bshm.class.all'))||[];
  window.TLS_CLASSES=published.filter(function(c){return c&&String(c[4]||'')===String(se.id)}).map(function(c){
    var info=c[3]||{};
    return [c[0],c[1],c[2],info.sched||'Schedule not set',info.room||'Room not set'];
  });
}catch(e){window.TLS_CLASSES=[]}})();
function tlsFullName(student){return [student&&student.firstName,student&&student.middleName,student&&student.lastName].filter(Boolean).join(' ').trim()}
function tlsRosterName(value){
  var raw=String(value==null?'':value).trim();
  if(raw.indexOf(',')>-1){var parts=raw.split(',').map(function(x){return x.trim()});if(parts.length===2)raw=parts[1]+' '+parts[0]}
  return raw.replace(/^prof\.?\s*/i,'').replace(/\s+/g,' ').toLowerCase();
}
window.tlsClassRoster=function(code){
  var users=tlsGet('aces_users')||[],enrollments=tlsGet('bshm.enrollments')||{},legacy=(tlsGet('bshm.joined')||{})[code]||[],records=window.tlsResults(),out=[],seen={};
  if(!Array.isArray(users))users=[];
  function add(user,name){
    var label=name||tlsFullName(user)||user&&user.name||'';
    if(!label)return;
    var id=user&&user.studentId?String(user.studentId):'';
    var key=id?'id:'+id:'name:'+tlsRosterName(label);
    if(seen[key])return;
    seen[key]=true;out.push({id:id,name:label,yearLevel:user&&user.yearLevel||''});
  }
  users.forEach(function(user){
    if(!user||user.status&&user.status!=='verified')return;
    var enrolled=enrollments[user.studentId];
    if(Array.isArray(enrolled)&&enrolled.indexOf(code)>-1)add(user);
  });
  legacy.forEach(function(entry){
    var label=typeof entry==='string'?entry:entry&&entry.name;
    if(!label)return;
    var user=users.filter(function(u){return u&&tlsRosterName(tlsFullName(u)||u.name)===tlsRosterName(label)})[0];
    add(user,label);
  });
  function resultStudent(record){
    var user=users.filter(function(u){return u&&record.student_account_id&&String(u.studentId)===String(record.student_account_id)})[0];
    if(!user&&record.student_id)user=users.filter(function(u){return u&&[tlsFullName(u),u.studentId,u.email].some(function(v){return tlsRosterName(v)===tlsRosterName(record.student_id)})})[0];
    return {user:user,name:user?tlsFullName(user):record.student_id||record.student};
  }
  records.H.forEach(function(record){
    var activity=(tlsGet('bshm.act.custom')||[]).filter(function(x){return x&&x.act&&x.act.id===record.exam_id})[0];
    if(!activity||activity.act.course!==code)return;
    var student=resultStudent(record);add(student.user,student.name);
  });
  records.P.forEach(function(record){
    var activity=(tlsGet('bshm.pos.custom')||[]).filter(function(x){return x&&x.id===record.activity_id})[0];
    if(!activity||activity.course!==code)return;
    var student=resultStudent(record);add(student.user,student.name);
  });
  return out;
};
window.tlsAllRoster=function(){
  var seen={},out=[];
  TLS_CLASSES.forEach(function(c){tlsClassRoster(c[0]).forEach(function(s){var k=s.id?'id:'+s.id:'name:'+tlsRosterName(s.name);if(!seen[k]){seen[k]=true;out.push(s.name)}})});
  return out;
};
window.TLS_ROSTER=window.tlsAllRoster();
window.tlsClassInfo=function(i){var c=TLS_CLASSES[i],o=(tlsGet('bshm.class.info')||{})[c[0]]||{};return {sched:o.sched||c[3],room:o.room||c[4]}};
window.tlsStudentStats=function(code){
  var R=tlsResults(),W=tlsGet('bshm.gb.w')||{q:30,e:40,p:30},G=tlsGet('bshm.gb.'+code)||{},lc=function(s){return String(s==null?'':s).trim().toLowerCase()};
  var avg=function(a){return a.length?Math.round(a.reduce(function(x,y){return x+y},0)/a.length):null};
  var days=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf('bshm.att.'+code+'.')===0)days.push(tlsGet(k)||{})}
  return tlsClassRoster(code).map(function(student){
    var n=student.name,key=lc(n),best={};
    R.H.forEach(function(r){var idMatch=student.id&&r.student_account_id&&String(r.student_account_id)===student.id,nameMatch=lc(r.student_id)===key;if((r.student_account_id&&student.id?!idMatch:!nameMatch)||r.percentage==null)return;if(!best[r.exam_id]||r.attempt_number>=best[r.exam_id].attempt_number)best[r.exam_id]=r});
    var q=[],e=[];Object.keys(best).forEach(function(k){(/quiz/i.test(best[k].exam_id+' '+best[k].exam_title)?q:e).push(best[k].percentage)});
    var p=R.P.filter(function(r){return student.id&&r.student_account_id?String(r.student_account_id)===student.id:lc(r.student)===key}).map(function(r){return r.score}),m=G[student.id]||G[n]||{};
    var v={q:m.q!=null?m.q:avg(q),e:m.e!=null?m.e:avg(e),p:m.p!=null?m.p:avg(p)},t=W.q+W.e+W.p;
    var fin=(v.q==null||v.e==null||v.p==null||!t)?null:Math.round((v.q*W.q+v.e*W.e+v.p*W.p)/t*10)/10;
    var mk=0,ok=0;days.forEach(function(d){if(d[n]){mk++;if(d[n]!=='Absent')ok++}});
    return {id:student.id,yearLevel:student.yearLevel,name:n,q:v.q,e:v.e,p:v.p,final:fin,att:mk?Math.round(ok/mk*100):null,days:mk,restricted:R.H.filter(function(r){var idMatch=student.id&&r.student_account_id&&String(r.student_account_id)===student.id,nameMatch=lc(r.student_id)===key;return (student.id&&r.student_account_id?idMatch:nameMatch)&&r.status==='RESTRICTED'}).length};
  });
};