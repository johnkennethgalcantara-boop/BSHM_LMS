/* ACES BSHM LMS · Teacher + Student sidebar icon upgrade (soft indigo edition).
   Swaps the <use> inside #side links and styles the sidebar to match the new UI
   (dashboard-modern / activities / resources / calendar / profile / settings).
   Load AFTER teacher-shell.js / shell.js. Existing symbols and IDs are untouched. */
(function(){
  'use strict';
  var d=document,side=d.getElementById('side');
  if(!side)return;
  var S=function(id,body){return '<symbol id="ni-'+id+'" viewBox="0 0 24 24">'+body+'</symbol>'};
  var defs=
    S('home','<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5H5.5A1.5 1.5 0 0 1 4 19z"/>')+
    S('classes','<path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h4.5A2.5 2.5 0 0 1 12 6.5V20a2 2 0 0 0-2-2H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M20.5 5.5A1.5 1.5 0 0 0 19 4h-4.5A2.5 2.5 0 0 0 12 6.5V20a2 2 0 0 1 2-2h5a1.5 1.5 0 0 0 1.5-1.5z"/>')+
    S('activities','<path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z"/><path d="M8 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H16"/><path d="m9 13.5 2 2 4-4.5"/>')+
    S('materials','<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V7a1 1 0 0 0 1 1h3.5"/><path d="M9 12.5h6M9 16h4"/>')+
    S('pos','<rect x="5" y="3.5" width="14" height="6" rx="1.5"/><path d="M12 9.5V13"/><path d="M4 14.5A1.5 1.5 0 0 1 5.5 13h13a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M8 16.5h.01M12 16.5h.01M16 16.5h.01"/>')+
    S('results','<circle cx="12" cy="9" r="5.5"/><path d="m8.7 13.4-1.2 7.1L12 18l4.5 2.5-1.2-7.1"/><path d="m12 6.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>')+
    S('ann','<path d="M4 10.5v3a1 1 0 0 0 1 1h2.5l8.5 4.5V5L7.5 9.5H5a1 1 0 0 0-1 1z"/><path d="M19.5 9.5a4 4 0 0 1 0 5"/><path d="m8 14.5 1 4.5h2.2l-.9-3.9"/>')+
    S('calendar','<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/><path d="M8.5 14h.01M12 14h.01M15.5 14h.01"/>')+
    S('profile','<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.6-3.6 3.8-6 7.5-6s6.9 2.4 7.5 6"/>')+
    S('settings','<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>');

  if(!d.getElementById('ni-defs')){
    d.body.insertAdjacentHTML('afterbegin','<svg id="ni-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+defs+'</defs></svg>');
  }

  /* map by visible label, so it works for teacher and student sidebars */
  var MAP={
    'dashboard':'home','my classes':'classes','my courses':'classes','activities':'activities',
    'learning materials':'materials','learning resources':'materials','resources':'materials',
    'pos training':'pos','results & grades':'results','calendar':'calendar',
    'announcements':'ann','profile':'profile','settings':'settings'
  };
  [].slice.call(side.querySelectorAll('a')).forEach(function(a){
    var k=(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    var id=MAP[k],u=a.querySelector('svg use');
    if(id&&u){
      u.setAttribute('href','#ni-'+id);
      u.removeAttribute('xlink:href');
      var s=a.querySelector('svg');if(s)s.setAttribute('aria-hidden','true');
    }
  });

  /* icon + link styling to match the soft indigo UI */
  if(d.getElementById('ni-style'))return;
  var st=d.createElement('style');
  st.id='ni-style';
  st.textContent=
    /* icons */
    '#side a>svg.i{fill:none!important;stroke:currentColor!important;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;'+
      'transition:transform .22s cubic-bezier(.22,.8,.3,1),opacity .22s ease,color .22s ease;transform-origin:center}'+
    /* links: pill shape, tinted hover, gradient active */
    '#side a{border-radius:14px;transition:background .2s ease,color .2s ease,box-shadow .2s ease}'+
    '#side a:hover:not(.on):not([aria-current="page"]){background:#F3F1FD;color:#1B1B5E}'+
    '#side a:hover>svg.i,#side a:focus-visible>svg.i{transform:translateX(1px) scale(1.08);color:#6D4FE3}'+
    '#side a:focus-visible{outline:2px solid #6D4FE3;outline-offset:2px}'+
    '#side a.on,#side a[aria-current="page"]{background:linear-gradient(90deg,#4F3FD0,#8B63F0);color:#fff;font-weight:600;'+
      'box-shadow:0 8px 18px -8px rgba(79,63,208,.65)}'+
    '#side a.on>svg.i,#side a[aria-current="page"]>svg.i{color:#fff!important;stroke:#fff!important;opacity:1!important;transform:none}'+
    '@media(prefers-reduced-motion:reduce){#side a,#side a>svg.i{transition:none}#side a:hover>svg.i{transform:none}}';
  d.head.appendChild(st);
})();