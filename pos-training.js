/* ===== BSHM POS — Student Training Simulator (frontend only, no storage) =====
   Adapted from the real POS (app.js): same products, categories, prices, stock,
   tax/service rates, discount logic, CASH/GCASH payment flow and receipt layout. */
(function(){
  /* The simulator is an activity execution screen: it needs the activity chosen in Activities */
  var ACT=(window.POS_ACTIVITIES||[]).filter(function(a){return a.id===new URLSearchParams(location.search).get('activity')})[0];
  if(!ACT){location.replace('activities.html?tab=pos');return}
  var BACK='activities.html?tab=pos';
  var $=function(s){return document.querySelector(s)};
  var P=function(n){return '₱'+(Number(n)||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var pad=function(n){return String(n).padStart(2,'0')};
  var fmt=function(ms){var s=Math.floor(ms/1000);return pad(Math.floor(s/60))+':'+pad(s%60)};
  var fdate=function(d){return d.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'2-digit'})};
  var ftime=function(d){return d.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})};

  /* ---------- POS CONSTANTS (from the real POS) ---------- */
  var CATS=['Meals','Snacks','Beverages','Desserts','Coffee','Other'];
  var ICONS={Meals:'fa-utensils',Snacks:'fa-burger',Beverages:'fa-glass-water',Desserts:'fa-ice-cream',Coffee:'fa-mug-hot',Other:'fa-box'};
  var SETTINGS={
    business:'BSHM Hospitality Bistro',address:'BSHM Building, Campus Ave., Manila',phone:'(02) 8123-4567',
    tax:12,service:5,footer:'Thank you for dining with us! This serves as your official receipt.',
    gcashName:'BSHM HOSPITALITY BISTRO',gcashNumber:'0917 123 4567',
    gcashInstructions:'1. Open your GCash app.\n2. Scan the QR code or send to the number shown.\n3. Enter the exact amount.\n4. Show the reference number to the cashier.'
  };
  /* Student name from the navbar ("Dela Cruz, Juan" -> "Juan Dela Cruz"), same format the Gradebook uses.
   Read when needed because shell.js builds the navbar after this script loads. */
function studentName(){
  var el=document.querySelector('.user b'),n=el?el.textContent.trim():'';
  if(!n)return 'Juan Dela Cruz';
  var m=n.match(/^([^,]+),\s*(.+)$/);
  return m?m[2]+' '+m[1]:n;
}

/* Saves one finished attempt where the teacher Gradebook reads it (bshm.poshist.<activity id>) */
function recordResult(){
  if(T.recorded)return;
  T.recorded=true;
  var score=calculateScore(),key='bshm.poshist.'+ACT.id,h=[];
  try{h=JSON.parse(localStorage.getItem(key))||[]}catch(e){}
  h.push({
    id:ACT.id+'-'+(h.length+1),
    activity_id:ACT.id,
    activity_title:ACT.title,
    student:studentName(),
    attempt_number:h.length+1,
    score:score,
    status:score>=PASS?'PASSED':'FAILED',
    mistakes:T.mistakes,
    time_seconds:Math.round(T.elapsed/1000),
    submitted_at:new Date().toISOString()
  });
  try{localStorage.setItem(key,JSON.stringify(h))}catch(e){}
}
  var LIMIT=ACT.time*60000,PASS=ACT.pass,PENALTY=4;
  var STEPS=[
    {label:'Select Category',full:'Select Product Category',ins:'Select the product category containing the item requested by the customer.'},
    {label:'Select Product',full:'Select Product',ins:'Select the product requested by the customer from the product list.'},
    {label:'Add Product',full:'Add Product to Order',ins:'Use Add to Order to place the selected product in the current order.'},
    {label:'Adjust Quantity',full:'Adjust Quantity',ins:'Adjust the quantity in the current order so it matches the customer request.'},
    {label:'Review Total',full:'Review Order Total',ins:'Review the order and total, then confirm the order total.'},
    {label:'Process Payment',full:'Process Payment',ins:'Click Proceed to Payment and complete the payment requested by the customer.'},
    {label:'Complete Transaction',full:'Complete Transaction / Receipt',ins:'Review the receipt, then complete the transaction.'}
  ];
  var PRODUCTS=[],T=null;

  /* ---------- DATA ---------- */
  function loadPOSData(){
    /* Snapshot of the POS seed products: [name, category, price, cost, stock, reorder, emoji]
       Pictures: put files in images/pos/<product-name>.jpg (e.g. images/pos/beef-burger.jpg).
       If a picture is missing, the emoji is shown instead. */
    PRODUCTS=[
      ['Chicken Rice Meal','Meals',185,110,40,10,'🍗'],['Beef Burger','Meals',165,95,32,10,'🍔'],
      ['Carbonara','Meals',175,100,25,8,'🍝'],['Chicken Pasta','Meals',170,98,6,8,'🍜'],
      ['French Fries','Snacks',85,40,48,12,'🍟'],['Club Sandwich','Snacks',125,70,20,8,'🥪'],
      ['Nachos','Snacks',110,55,4,10,'🌮'],['Iced Coffee','Coffee',95,38,60,15,'☕'],
      ['Soft Drink','Beverages',55,25,80,20,'🥤'],['Fruit Shake','Beverages',105,45,26,10,'🍹'],
      ['Bottled Water','Beverages',30,12,0,15,'💧'],['Chocolate Cake','Desserts',120,60,18,6,'🎂'],
      ['Cheesecake','Desserts',135,68,12,6,'🍰'],['Ice Cream','Desserts',75,32,35,10,'🍨']
    ].map(function(p,i){return {id:'p'+(i+1),name:p[0],category:p[1],price:p[2],cost:p[3],stock:p[4],reorder:p[5],emoji:p[6],
      image:'images/pos/'+p[0].toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.jpg',description:'',active:true}});
  }
  var byId=function(id){return PRODUCTS.filter(function(p){return p.id===id})[0]};

  /* Same maths as the real POS cartTotals() */
  function calculateTotal(items,disc){
    var sub=items.reduce(function(s,i){return s+i.price*i.qty},0);
    var d=disc.type==='percent'?sub*(Number(disc.value)||0)/100:Math.min(Number(disc.value)||0,sub);
    var base=sub-d,tax=base*SETTINGS.tax/100,svc=base*SETTINGS.service/100;
    return {sub:sub,disc:d,tax:tax,svc:svc,total:base+tax+svc};
  }
  var cur=function(){return calculateTotal(T.cart,T.discount)};

  function generateTrainingScenario(){
    var cfg=ACT.scenario;
    var pool=PRODUCTS.filter(function(p){return p.active&&p.stock>=4&&p.category!=='Other'});
    var p=pool[Math.floor(Math.random()*pool.length)],qty=cfg.qty,disc=cfg.discount||{type:'percent',value:0};
    var total=calculateTotal([{price:p.price,qty:qty}],disc).total;
    var digits='';for(var i=0;i<12;i++)digits+=Math.floor(Math.random()*10);
    var cash=Math.ceil(total/500)*500;
    var method=cfg.method==='random'?(Math.random()<.5?'CASH':'GCASH'):cfg.method;
    return {orderNo:'TR-001',product:p,qty:qty,discount:cfg.discount,method:method,total:total,cash:cash,change:cash-total,
      ref:digits.slice(0,4)+' '+digits.slice(4,8)+' '+digits.slice(8)};
  }

  /* ---------- VIEWS / FEEDBACK ---------- */
function show(v){['sim','result','review'].forEach(function(k){$('#v-'+k).hidden=k!==v});window.scrollTo(0,0);var m=document.querySelector('main.pg');if(m)m.scrollTop=0}
  function showToast(msg,type){
    var t=document.createElement('div');t.className='toast '+(type||'');t.textContent=msg;$('#toasts').appendChild(t);
    setTimeout(function(){t.remove()},3200);
    if(type==='error'||type==='warn'){if(T)T.hint=msg;var h=$('#hint');if(h)h.textContent=msg}
  }
  function mistake(msg,pts){T.mistakes++;T.penalty+=(pts==null?PENALTY:pts);showToast(msg,'error');return false}
  function early(){return mistake('Complete the current training step first.',2)}

  /* ---------- INIT / RESET ---------- */
  function initializeTraining(){
    if(T&&T.timer)clearInterval(T.timer);
    T={scenario:generateTrainingScenario(),step:0,mistakes:0,penalty:0,cat:'All',q:'',sort:'name',sel:null,cart:[],
      discount:{type:'percent',value:0},start:Date.now(),timer:null,receipt:null,payment:null,locked:false,finished:false,hint:'',elapsed:0};
    T.timer=setInterval(function(){if(T.finished)return;T.elapsed=Date.now()-T.start;$('#clock').textContent=fmt(T.elapsed)},1000);
    $('#clock').textContent='00:00';$('#pq').value='';$('#psort').value='name';
    renderAll();
  }
  function resetTraining(){initializeTraining();show('sim')}
  function renderAll(){renderSteps();renderGuide();renderCategories();renderProducts();renderSelBar();renderCart()}

  /* ---------- LEFT: STEPS ---------- */
  function renderSteps(){
    $('#stepList').innerHTML=STEPS.map(function(s,i){
      var c=i<T.step?'done':i===T.step&&!T.finished?'cur':'';
      return '<li class="'+c+'"><span class="n">'+(i<T.step?'<i class="fa-solid fa-check" style="font-size:11px"></i>':pad(i+1))+'</span>'+s.label+'</li>'}).join('');
    var d=Math.min(T.step,7);
    $('#progTxt').textContent=d+' / 7 Steps Completed';$('#progBar').style.width=Math.round(d/7*100)+'%';
  }

  /* ---------- RIGHT: GUIDANCE ---------- */
  function renderGuide(){
    var s=T.scenario,st=STEPS[Math.min(T.step,6)];
    var ins=(T.step===4&&s.discount)?'Apply the discount requested by the customer in the order panel, review the total, then confirm the order total.':st.ins;
    var dl=s.discount?'<div><span>Discount</span><b>'+s.discount.value+'%</b></div>':'';
    var pay=s.method==='CASH'?'<div><span>Amount Received</span><b>'+P(s.cash)+'</b></div>':'<div><span>GCash Reference</span><b>'+s.ref+'</b></div><div><span>Amount Sent</span><b>Exact order total</b></div>';
    $('#guide').innerHTML='<div class="cs"><span class="num">'+pad(Math.min(T.step+1,7))+'</span><div><small>Current Step</small><b>'+st.full.toUpperCase()+'</b><p>'+ins+'</p></div></div>'+
      '<div class="scn"><h5>Customer Order<span>Order #'+s.orderNo+'</span></h5><div><span>Customer requests</span><b>'+esc(s.product.name)+'</b></div><div><span>Quantity</span><b>'+s.qty+'</b></div>'+dl+'<div><span>Payment Method</span><b>'+s.method+'</b></div>'+pay+'</div>'+
      '<div class="hint" id="hint">'+esc(T.hint)+'</div>';
  }

  /* ---------- CENTER: POS ---------- */
  function renderCategories(){
    $('#chips').innerHTML=['All'].concat(CATS).map(function(c){return '<button class="chip'+(T.cat===c?' active':'')+'" data-cat="'+c+'">'+c+'</button>'}).join('');
  }
  function renderProducts(){
    var l=PRODUCTS.filter(function(p){return p.active});
    if(T.cat!=='All')l=l.filter(function(p){return p.category===T.cat});
    if(T.q)l=l.filter(function(p){return p.name.toLowerCase().indexOf(T.q.toLowerCase())>-1});
    l.sort(function(a,b){return T.sort==='price'?a.price-b.price:T.sort==='priceD'?b.price-a.price:T.sort==='stock'?a.stock-b.stock:a.name.localeCompare(b.name)});
    $('#plist').innerHTML=l.length?l.map(function(p){
      return '<div class="p-card'+(p.stock<=0?' out':'')+(T.sel===p.id?' sel':'')+'" data-prod="'+p.id+'"><div class="img">'+
        '<span class="emo">'+p.emoji+'</span>'+
        '<img src="'+esc(p.image)+'" alt="'+esc(p.name)+'" loading="lazy" onerror="this.remove()">'+
        '<span class="stock-pill">'+(p.stock<=0?'Out':p.stock+' left')+'</span></div>'+
        '<div class="body"><div class="name">'+esc(p.name)+'</div><div class="cat">'+p.category+'</div><div class="price">'+P(p.price)+'</div></div></div>'}).join(''):
      '<div class="empty"><i class="fa-solid fa-magnifying-glass"></i>No products found</div>';
  }
  function renderSelBar(){
    var p=T.sel?byId(T.sel):null;
    $('#selbar').innerHTML=(p?'<div><span>Selected product</span><br><b>'+esc(p.name)+' · '+P(p.price)+'</b></div>':'<span>No product selected</span>')+
      '<button class="btn primary sm" id="addBtn"'+(T.locked?' disabled':'')+'><i class="fa-solid fa-cart-plus"></i> Add to Order</button>';
  }

  function selectCategory(c){
    if(T.locked||T.finished)return;
    if(T.step===0){
      var m=validateStep('category',c);if(m)return mistake(m);
      T.cat=c;renderCategories();renderProducts();completeStep();
    }else{T.cat=c;renderCategories();renderProducts()}
  }
  function selectProduct(id){
    if(T.locked||T.finished)return;
    if(T.step<1)return early();
    var m=validateStep('product',id);if(m)return mistake(m);
    T.sel=id;renderProducts();renderSelBar();
    if(T.step===1)completeStep();
  }
  function addToCart(){
    if(T.locked||T.finished)return;
    if(T.step<2)return early();
    if(!T.sel)return mistake('Please select the product specified in the training scenario.');
    var p=byId(T.sel),it=T.cart.filter(function(c){return c.id===p.id})[0];
    if((it?it.qty:0)+1>p.stock){showToast('Not enough stock for '+p.name,'error');return}
    if(it)it.qty++;else T.cart.push({id:p.id,name:p.name,price:p.price,qty:1});
    renderCart();
    if(T.step===2)completeStep();else if(T.step===3)checkQty();
  }
  function updateQuantity(id,d){
    if(T.locked)return;
    var it=T.cart.filter(function(c){return c.id===id})[0];if(!it)return;
    if(d>0){var p=byId(id);if(it.qty+1>p.stock){showToast('Not enough stock for '+p.name,'error');return}}
    it.qty+=d;if(it.qty<=0)T.cart=T.cart.filter(function(c){return c.id!==id});
    renderCart();if(T.step===3)checkQty();
  }
  function removeItem(id){if(T.locked)return;T.cart=T.cart.filter(function(c){return c.id!==id});renderCart()}
  function checkQty(){
    var it=T.cart.filter(function(c){return c.id===T.scenario.product.id})[0];if(!it)return;
    var m=validateStep('qty',it.qty);
    if(!m)completeStep();else if(it.qty>T.scenario.qty)mistake(m);
  }
  function confirmTotal(){
    if(T.locked||T.finished)return;
    if(T.step<4)return early();
    if(T.step>4)return;
    var m=validateStep('review');if(m)return mistake(m);
    completeStep();
  }
  function proceedToPayment(){
    if(T.locked||T.finished)return;
    if(!T.cart.length)return mistake('Cart is empty. Add the requested product first.',2);
    if(T.step<5)return early();
    paymentModal();
  }

  /* One place for all step rules */
  function validateStep(key,arg){
    var s=T.scenario;
    if(key==='category')return arg===s.product.category?'':'Select the category containing the requested product.';
    if(key==='product')return arg===s.product.id?'':'Please select the product specified in the training scenario.';
    if(key==='qty')return arg===s.qty?'':'Adjust the quantity to match the customer order.';
    if(key==='review'){
      var it=T.cart[0],d=s.discount,dok=d?(T.discount.type===d.type&&Number(T.discount.value)===d.value):!(Number(T.discount.value)>0);
      var ok=T.cart.length===1&&it.id===s.product.id&&it.qty===s.qty&&dok;
      return ok?'':'Review the order and make sure it matches the customer request.';
    }
    return '';
  }
  function completeStep(){
    T.step++;T.hint='';
    if(T.step>=7){T.finished=true;clearInterval(T.timer);T.elapsed=Date.now()-T.start;recordResult();renderAll();showToast('Transaction completed','success');setTimeout(showResult,500);return}
    renderAll();showToast('Step '+pad(T.step)+' completed','success');
  }

  /* ---------- RIGHT: CURRENT ORDER ---------- */
  function renderCart(){
    var t=cur(),n=T.cart.reduce(function(s,i){return s+i.qty},0),L=T.locked;
    $('#cartBox').innerHTML='<h3><i class="fa-solid fa-cart-shopping"></i> Current Order<span class="tag">'+n+' items</span></h3><div class="ordno">Order #'+T.scenario.orderNo+'</div>'+
      '<div class="cart-items">'+(T.cart.length?T.cart.map(function(i){
        return '<div class="ci"><div class="nm">'+esc(i.name)+'<span>'+P(i.price)+' each</span></div><div class="qty"><button data-dec="'+i.id+'"'+(L?' disabled':'')+'>−</button><b>'+i.qty+'</b><button data-inc="'+i.id+'"'+(L?' disabled':'')+'>+</button></div><b class="sub">'+P(i.price*i.qty)+'</b><button class="rm" data-rm="'+i.id+'"'+(L?' disabled':'')+' aria-label="Remove"><i class="fa-solid fa-trash"></i></button></div>'}).join(''):'<div class="empty"><i class="fa-solid fa-cart-shopping"></i>Cart is empty</div>')+'</div>'+
      '<div class="row2"><div><label>Discount</label><select id="dType"'+(L?' disabled':'')+'><option value="percent">% Percent</option><option value="amount">₱ Amount</option></select></div><div><label>Value</label><input id="dVal" type="number" min="0" value="'+T.discount.value+'"'+(L?' disabled':'')+'></div></div>'+
      '<div class="lines">'+linesHTML(t)+'</div>'+
      '<button class="btn block" id="confirmBtn"'+(L||T.step>4?' disabled':'')+'><i class="fa-solid fa-clipboard-check"></i> '+(T.step>4?'Order Total Confirmed':'Confirm Order Total')+'</button>'+
      '<button class="btn primary block" id="payBtn"'+(L?' disabled':'')+'><i class="fa-solid fa-credit-card"></i> Proceed to Payment</button>';
    $('#dType').value=T.discount.type;
  }
  function linesHTML(t){return '<div><span>Subtotal</span><span>'+P(t.sub)+'</span></div><div><span>Discount</span><span style="color:var(--p-red)">-'+P(t.disc)+'</span></div><div><span>Tax ('+SETTINGS.tax+'%)</span><span>'+P(t.tax)+'</span></div><div><span>Service Charge ('+SETTINGS.service+'%)</span><span>'+P(t.svc)+'</span></div><div class="total"><span>TOTAL</span><span>'+P(t.total)+'</span></div>'}
  /* Discount edits refresh only the totals; re-rendering the whole cart on blur destroyed the Confirm/Pay button before its click landed */
  function updateCart(){var l=$('#cartBox .lines');if(l)l.innerHTML=linesHTML(cur());var v=$('#dVal');if(v)v.value=T.discount.value}

  /* ---------- PAYMENT (mirrors real POS payment modal) ---------- */
  function openModal(title,body,foot){$('#modalRoot').innerHTML='<div class="modal"><div class="mbox"><div class="mhead">'+title+'</div><div class="mbody">'+body+'</div><div class="mfoot">'+foot+'</div></div></div>'}
  function closeModal(){$('#modalRoot').innerHTML=''}
  function paymentModal(){
    var t=cur(),method='CASH',items=T.cart.reduce(function(s,i){return s+i.qty},0);
    openModal('Payment','<div class="payment-summary"><div><span>Current Order</span><b>'+items+' '+(items===1?'item':'items')+'</b></div><div class="payment-total"><span>Total to Pay</span><strong>'+P(t.total)+'</strong></div></div>'+
      '<div class="chips"><button class="chip active" id="mCash"><i class="fa-solid fa-money-bill"></i> CASH</button><button class="chip" id="mG"><i class="fa-solid fa-mobile-screen"></i> GCASH</button></div><div id="payPane"></div>',
      '<button class="btn ghost" id="cancelPay">Cancel</button><button class="btn primary" id="confirmPay"><i class="fa-solid fa-check"></i> Confirm Payment</button>');
    var cash=function(){return '<label>Amount Received</label><input id="cashAmt" type="number" min="0" step="0.01" placeholder="0.00"><div class="row3">'+
      [t.total,Math.ceil(t.total/50)*50,Math.ceil(t.total/100)*100,Math.ceil(t.total/500)*500].filter(function(v,i,a){return a.indexOf(v)===i}).slice(0,4).map(function(v){return '<button class="btn sm" data-quick="'+v+'">'+P(v)+'</button>'}).join('')+'</div>'+
      '<div class="lines" style="margin-top:14px"><div><span>Change</span><b id="chg" style="color:var(--p-green)">'+P(0)+'</b></div></div><div id="cashWarn" class="warn hidden"><i class="fa-solid fa-circle-exclamation"></i> Insufficient payment</div>'};
    var gc=function(){return '<div class="qrbox"><div id="qr"></div></div><div class="lines" style="margin-top:12px"><div><span>Account Name</span><b>'+esc(SETTINGS.gcashName)+'</b></div><div><span>Mobile Number</span><b>'+esc(SETTINGS.gcashNumber)+'</b></div><div><span>Amount</span><b>'+P(t.total)+'</b></div></div>'+
      '<div class="gbox"><b style="font-size:12px">Payment Instructions</b><p>'+esc(SETTINGS.gcashInstructions)+'</p></div><label>GCash Reference Number</label><input id="gref" placeholder="e.g. 0123456789123">'+
      '<label class="chk"><input type="checkbox" id="gconf"> Cashier confirms payment received in GCash app</label>'};
    var paint=function(){
      $('#payPane').innerHTML=method==='CASH'?cash():gc();
      $('#mCash').classList.toggle('active',method==='CASH');$('#mG').classList.toggle('active',method==='GCASH');
      if(method==='CASH'){
        var upd=function(){var r=Number($('#cashAmt').value)||0,c=r-t.total;$('#chg').textContent=P(Math.max(0,c));$('#chg').style.color=c<0?'var(--p-red)':'var(--p-green)';$('#cashWarn').classList.toggle('hidden',r===0||r>=t.total)};
        $('#cashAmt').oninput=upd;
        document.querySelectorAll('[data-quick]').forEach(function(b){b.onclick=function(){$('#cashAmt').value=Number(b.dataset.quick).toFixed(2);upd()}});
      }else{
        var box=$('#qr');box.innerHTML='';
        if(typeof QRCode!=='undefined')new QRCode(box,{text:'GCASH|'+SETTINGS.gcashName+'|'+SETTINGS.gcashNumber+'|'+t.total.toFixed(2),width:180,height:180,colorDark:'#4f46e5'});
        else box.innerHTML='<span class="small">QR code unavailable offline</span>';
      }
    };
    $('#mCash').onclick=function(){method='CASH';paint()};
    $('#mG').onclick=function(){method='GCASH';paint()};
    $('#cancelPay').onclick=closeModal;
    paint();
    $('#confirmPay').onclick=function(){
      if(method!==T.scenario.method)return mistake('Use the payment method requested by the customer: '+T.scenario.method+'.');
      var ok=method==='CASH'?processCashPayment(Number($('#cashAmt').value)||0):processGCashPayment($('#gref').value.trim(),$('#gconf').checked);
      if(!ok)return;
      closeModal();T.locked=true;completeStep();renderCart();generateReceipt();
    };
  }
  function processCashPayment(recv){
    var t=cur(),s=T.scenario;
    if(recv<t.total-.005)return mistake('Insufficient payment. Please enter the correct amount.');
    if(Math.abs(recv-s.cash)>.005)return mistake('Enter the amount received from the customer ('+P(s.cash)+').');
    T.payment={received:recv,change:recv-t.total};T.method='CASH';return true;
  }
  function processGCashPayment(ref,conf){
    var s=T.scenario,norm=function(x){return x.replace(/\s+/g,'')};
    if(!ref)return mistake('Enter the GCash reference number.');
    if(!conf)return mistake('Confirm that the payment was received.');
    if(norm(ref)!==norm(s.ref))return mistake("Enter the reference number shown in the customer's GCash receipt.");
    T.payment={reference:ref,account:SETTINGS.gcashName,number:SETTINGS.gcashNumber};T.method='GCASH';return true;
  }

  /* ---------- RECEIPT (same layout as real POS receiptHTML) ---------- */
  function receiptHTML(t){
    return '<div class="receipt"><h3>'+esc(SETTINGS.business)+'</h3><div class="c small">'+esc(SETTINGS.address)+'<br>'+esc(SETTINGS.phone)+'</div><div class="c small" style="margin-top:4px;color:#888">— TRAINING COPY —</div><hr>'+
      '<div class="l"><span>Transaction</span><b>'+t.id+'</b></div><div class="l"><span>Date</span><span>'+fdate(t.date)+'</span></div><div class="l"><span>Time</span><span>'+ftime(t.date)+'</span></div><div class="l"><span>Cashier</span><span>'+esc(t.cashier)+'</span></div><hr>'+
      t.items.map(function(i){return '<div class="l"><span>'+i.qty+' × '+esc(i.name)+'</span><span>'+P(i.qty*i.price)+'</span></div><div class="l" style="color:#888"><span style="padding-left:10px">@ '+P(i.price)+'</span><span></span></div>'}).join('')+'<hr>'+
      '<div class="l"><span>Subtotal</span><span>'+P(t.subtotal)+'</span></div><div class="l"><span>Discount</span><span>-'+P(t.discount)+'</span></div><div class="l"><span>Tax ('+t.taxRate+'%)</span><span>'+P(t.tax)+'</span></div><div class="l"><span>Service Charge ('+t.serviceRate+'%)</span><span>'+P(t.service)+'</span></div><hr>'+
      '<div class="l" style="font-size:15px;font-weight:700"><span>TOTAL</span><span>'+P(t.total)+'</span></div><div class="l"><span>Payment</span><b>'+t.method+'</b></div>'+
      (t.method==='CASH'?'<div class="l"><span>Cash Received</span><span>'+P(t.payment.received)+'</span></div><div class="l"><span>Change</span><span>'+P(t.payment.change)+'</span></div>':
        '<div class="l"><span>GCash Ref.</span><span>'+esc(t.payment.reference)+'</span></div><div class="l"><span>Account</span><span>'+esc(t.payment.account)+'</span></div>')+
      '<div class="l"><span>Status</span><b>PAID</b></div><hr><div class="c small">'+esc(SETTINGS.footer)+'</div><div class="c small" style="margin-top:6px">'+t.id+'</div></div>';
  }
  function generateReceipt(){
    var t=cur(),d=new Date();
    var key=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate());
    T.receipt={id:'BSHM-'+key+'-TR01',date:d,cashier:studentName(),items:T.cart.map(function(i){return {id:i.id,name:i.name,price:i.price,qty:i.qty}}),
      subtotal:t.sub,discount:t.disc,tax:t.tax,service:t.svc,total:t.total,method:T.method,payment:T.payment,taxRate:SETTINGS.tax,serviceRate:SETTINGS.service};
    openModal('Receipt',receiptHTML(T.receipt),'<button class="btn primary" id="doneBtn"><i class="fa-solid fa-check"></i> Complete Transaction</button>');
    $('#doneBtn').onclick=function(){closeModal();completeStep()};
  }

  /* ---------- SCORE / RESULT / REVIEW ---------- */
  /* Back to Activities keeps the POS Training tab; a pass is passed back so the card shows Completed */
  function backHref(passed){return BACK+(passed?'&done='+ACT.id:'')}
  function calculateScore(){return Math.max(0,100-T.penalty)}
  function showResult(){
    var score=calculateScore(),ok=score>=PASS;
    $('#v-result').innerHTML='<div class="card res"><span class="tk'+(ok?'':' bad')+'"><i class="fa-solid '+(ok?'fa-check':'fa-xmark')+'"></i></span><h2>POS TRAINING COMPLETED</h2><div class="sub">'+esc(ACT.title)+'</div>'+
      '<div class="info"><div>Score<b>'+score+'%</b></div><div>Steps Completed<b>7 / 7</b></div><div>Time<b>'+fmt(T.elapsed)+'</b></div></div>'+
      '<div class="info" style="grid-template-columns:1fr"><div>Status<b style="color:'+(ok?'#217A4D':'#B42318')+'">'+(ok?'PASSED':'NOT PASSED')+'</b></div></div>'+
      '<p class="msg">'+(ok?'You successfully completed the POS training activity.':'You did not reach the passing score of '+PASS+'%. Review your mistakes and try again.')+'</p>'+
      '<div class="rbtns"><button class="pbtn" id="revBtn">REVIEW TRAINING</button>'+(ok?'':'<button class="pbtn" id="retryBtn">TRY AGAIN</button>')+'<a class="pbtn solid" href="'+backHref(ok)+'">BACK TO ACTIVITIES</a></div></div>';
    $('#revBtn').onclick=reviewTraining;
    var r=$('#retryBtn');if(r)r.onclick=resetTraining;
    show('result');
  }
  function reviewTraining(){
    var s=T.scenario;
    $('#v-review').innerHTML='<div class="simbar"><div><h2>Review Training<small>'+esc(ACT.title)+' · '+calculateScore()+'% · '+(calculateScore()>=PASS?'PASSED':'NOT PASSED')+'</small></h2></div><span class="ro">Read-only</span></div>'+
      '<div class="rv"><div class="card"><h4>Completed Workflow</h4><ol>'+STEPS.map(function(x){return '<li class="done"><span class="n"><i class="fa-solid fa-check" style="font-size:11px"></i></span>'+x.full+'</li>'}).join('')+'</ol>'+
      '<h4 style="margin-top:18px">Customer Order #'+s.orderNo+'</h4><p style="font-size:13px;color:var(--body);line-height:1.7">'+s.qty+' × '+esc(s.product.name)+'<br>Payment: '+s.method+(s.method==='CASH'?' · '+P(s.cash)+' received':' · Ref. '+s.ref)+'<br>Mistakes: '+T.mistakes+'</p></div>'+
      '<div class="card">'+receiptHTML(T.receipt)+'</div></div>'+
      '<div class="rbtns" style="justify-content:flex-start"><button class="pbtn" id="toRes">← Back to Result</button><a class="pbtn solid" href="'+backHref(calculateScore()>=PASS)+'">BACK TO ACTIVITIES</a></div>';
    $('#toRes').onclick=showResult;
    show('review');
  }

  /* ---------- EVENTS ---------- */
  $('#exitBtn').onclick=function(){if(T&&T.timer)clearInterval(T.timer);location.href=BACK+'&open='+ACT.id};   /* back to this activity's overview in Activities */
  $('#pq').oninput=function(e){T.q=e.target.value;renderProducts()};
  $('#psort').onchange=function(e){T.sort=e.target.value;renderProducts()};
  $('#chips').onclick=function(e){var b=e.target.closest('[data-cat]');if(b)selectCategory(b.dataset.cat)};
  $('#plist').onclick=function(e){var c=e.target.closest('[data-prod]');if(c)selectProduct(c.dataset.prod)};
  $('#selbar').onclick=function(e){if(e.target.closest('#addBtn'))addToCart()};
  $('#cartBox').onclick=function(e){
    var b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.inc)updateQuantity(b.dataset.inc,1);
    else if(b.dataset.dec)updateQuantity(b.dataset.dec,-1);
    else if(b.dataset.rm)removeItem(b.dataset.rm);
    else if(b.id==='confirmBtn')confirmTotal();
    else if(b.id==='payBtn')proceedToPayment();
  };
  $('#cartBox').onchange=function(e){
    if(e.target.id==='dType'){T.discount.type=e.target.value;updateCart()}
    if(e.target.id==='dVal'){T.discount.value=Math.max(0,Number(e.target.value)||0);updateCart()}
  };

  loadPOSData();
  $('#actTitle').textContent=ACT.title;$('#limit').textContent='/ '+pad(ACT.time)+':00';
  initializeTraining();show('sim');   /* opens directly on the POS: Register #01, ready. No login. */

  /* Sidebar toggle / drawer: handled once by shell.js */
})();