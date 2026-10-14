/* Teacher helpers. Header comes from shell.js. */
(function(){
  var ICONS={
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    chev:'<path d="M6 9l6 6 6-6"/>',
    bars:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
    check:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    alert:'<path d="M12 3l10 18H2zM12 10v5M12 18v.5"/>',
    idc:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h4M7 14h3M15 10h2M15 14h2"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    mob:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    pin:'<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    cap:'<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5"/>',
    grid:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    pal:'<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    edit:'<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>'
  };
  var s='';
  Object.keys(ICONS).forEach(function(id){
    if(!document.getElementById(id))s+='<symbol id="'+id+'" viewBox="0 0 24 24">'+ICONS[id]+'</symbol>';
  });
  if(s)document.body.insertAdjacentHTML('afterbegin','<svg width="0" height="0" style="position:absolute"><defs>'+s+'</defs></svg>');

  window.tlsGet=function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
  window.tlsSet=function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  window.tesc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  window.ttoast=function(m){var t=document.getElementById('tt');if(!t)return;t.textContent=m;t.className='tt on';clearTimeout(t._h);t._h=setTimeout(function(){t.className='tt'},2600)};

  /* compact preference from Settings */
  var c=(tlsGet('bshm.teacher.settings')||{}).compact;
  if(c){
    document.body.classList.add('compact');
    var st=document.createElement('style');
    st.textContent='body.compact main{padding:16px!important}body.compact .card{padding:14px}';
    document.head.appendChild(st);
  }
})();   