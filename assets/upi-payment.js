(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var params=new URLSearchParams(location.search),orderId=(params.get('order')||'').trim();
var STORE='onnmore_upi_order_v1',data=null,email='',imageB64='',pollTimer=null;
function money(n){return '₹'+Number(n).toLocaleString('en-IN')}
function show(el,on){el.hidden=!on}
function msg(el,text){el.textContent=text;el.classList.add('show')}
function clear(el){el.classList.remove('show');el.textContent=''}
async function api(payload){
  var url=window.ONNMORE_PAYMENT_API_URL||'';
  if(!url)throw new Error('Online payment is not connected yet. Please contact us on WhatsApp.');
  var res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
  if(!res.ok)throw new Error('The service could not be reached. Please try again in a moment.');
  var out=await res.json();
  if(!out.ok)throw new Error(out.error||'We could not process this request. Please try again.');
  return out;
}

/* ---------- start ---------- */
(function init(){
  $('year').textContent=new Date().getFullYear();
  if(!/^ONM-[A-Za-z0-9-]{5,30}$/.test(orderId)){show($('lookupCard'),true);$('lookupCard').querySelector('h2').textContent='Order not found';$('lookupCard').querySelector('p').textContent='This payment link is not valid. Please start again from your plan page.';$('lookupEmail').parentNode.hidden=true;$('lookupBtn').hidden=true;return;}
  var stored=null;try{stored=JSON.parse(sessionStorage.getItem(STORE)||'null')}catch(e){}
  if(stored&&stored.orderId===orderId&&stored.upiLink){email=stored.email||'';data=stored;renderPay();return;}
  show($('lookupCard'),true);
})();

$('lookupBtn').addEventListener('click',async function(){
  var el=$('lookupError');clear(el);
  var e=$('lookupEmail').value.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){msg(el,'Please enter the email address you used at checkout.');return;}
  this.disabled=true;
  try{
    var r=await api({action:'getUpiOrder',orderId:orderId,email:e});
    if(!r.found){msg(el,'We could not find a UPI order with that email address. Please check and try again.');return;}
    email=e;data=r;show($('lookupCard'),false);
    if(r.status==='PAID'){renderDone('PAID',{});}
    else if(r.status==='UPI_PROOF_SUBMITTED'){renderPay();renderDone('UPI_PROOF_SUBMITTED',{utr:r.utr});}
    else renderPay();
  }catch(err){msg(el,err.message)}finally{this.disabled=false}
});

/* ---------- payment details ---------- */
function renderPay(){
  show($('payArea'),true);
  $('planName').textContent=data.planName||'Your plan';
  $('orderRef').textContent=data.orderId;
  var amt=money(data.amount);
  $('amountTitle').textContent=amt;$('amountBig').innerHTML='';$('amountBig').textContent=amt;
  var small=document.createElement('small');small.textContent='incl. GST';$('amountBig').appendChild(small);
  $('amountRow').textContent=Number(data.amount).toFixed(2);
  $('vpa').textContent=data.upiId||'';$('remark').textContent=data.remark||data.orderId;
  $('openApp').href=data.upiLink||'#';
  try{$('qrBox').innerHTML=window.OnnmoreQR.svg(data.upiLink,216);}catch(e){$('qrBox').textContent='QR unavailable — please use the UPI ID.';}
}

document.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-copy]');if(!b)return;
  var text=$(b.getAttribute('data-copy')).textContent.trim();
  var done=function(){var old=b.textContent;b.textContent='Copied';setTimeout(function(){b.textContent=old},1400)};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done,function(){});
  else{var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');done()}catch(e){}document.body.removeChild(t)}
});

/* ---------- screenshot: choose, shrink, preview ---------- */
$('proofFile').addEventListener('change',function(){
  var f=this.files&&this.files[0];clear($('proofError'));imageB64='';$('preview').style.display='none';
  if(!f)return;
  if(!/^image\//.test(f.type)){msg($('proofError'),'Please choose an image file (JPG or PNG).');this.value='';return;}
  if(f.size>15*1024*1024){msg($('proofError'),'That image is too large. Please choose a smaller screenshot.');this.value='';return;}
  shrink(f).then(function(dataUrl){
    imageB64=dataUrl.split(',')[1];
    $('previewImg').src=dataUrl;$('preview').style.display='block';$('dropText').textContent=f.name.length>40?f.name.slice(0,37)+'…':f.name;
  }).catch(function(){msg($('proofError'),'We could not read that image. Please try a different screenshot.')});
});
function shrink(file){
  return new Promise(function(resolve,reject){
    var url=URL.createObjectURL(file),img=new Image();
    img.onload=function(){
      var max=1500,s=Math.min(1,max/Math.max(img.width,img.height)),w=Math.round(img.width*s),h=Math.round(img.height*s);
      var c=document.createElement('canvas');c.width=w;c.height=h;var ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      var q=.85,out=c.toDataURL('image/jpeg',q);
      while(out.length>3200000&&q>.4){q-=.1;out=c.toDataURL('image/jpeg',q)}
      resolve(out);
    };
    img.onerror=function(){URL.revokeObjectURL(url);reject(new Error('bad image'))};
    img.src=url;
  });
}

/* ---------- submit proof ---------- */
$('proofBtn').addEventListener('click',async function(){
  var err=$('proofError');clear(err);
  var utr=$('utr').value.replace(/\s/g,'');
  if(!imageB64){msg(err,'Please upload your payment screenshot.');return;}
  if(utr&&!/^\d{12}$/.test(utr)){msg(err,'The transaction ID (UTR) is normally 12 digits. Please check it, or leave it blank and we will read it from your screenshot.');return;}
  if(!email){msg(err,'Please reopen this page from your email link and confirm your email address.');return;}
  var btn=this;btn.disabled=true;btn.classList.add('co-loading');
  try{
    var r=await api({action:'submitUpiProof',proof:{orderId:orderId,email:email,mime:'image/jpeg',image:imageB64,utr:utr}});
    renderDone(r.status||'UPI_PROOF_SUBMITTED',{utr:r.utr,detected:r.detected});
  }catch(e){msg(err,e.message)}finally{btn.disabled=false;btn.classList.remove('co-loading')}
});

/* ---------- result + status ---------- */
function line(ok,text){var d=document.createElement('div');d.className='upi-check';var i=document.createElement('i');i.className=ok?'ri-checkbox-circle-fill':'ri-information-line';if(!ok)i.style.color='#ffd138';var s=document.createElement('span');s.textContent=text;d.appendChild(i);d.appendChild(s);return d}
function renderDone(status,info){
  show($('payBlock'),false);show($('doneBlock'),true);
  $('doneRef').textContent=orderId;$('doneEmail').textContent=email||'your email address';
  var checks=$('doneChecks');checks.innerHTML='';
  if(status==='PAID'){
    $('doneIcon').innerHTML='<i class="ri-check-double-line"></i>';
    $('doneTitle').textContent='Payment confirmed';
    $('doneText').textContent='Thank you. We have verified your payment, and a confirmation email has been sent. Our team will now begin the next steps.';
    clearInterval(pollTimer);return;
  }
  $('doneIcon').innerHTML='<i class="ri-time-line"></i>';
  $('doneTitle').textContent='Payment proof received';
  $('doneText').textContent='Thank you. We have received your screenshot and will confirm the payment once we verify it against our bank credit. This usually takes a few working hours.';
  if(info&&info.utr)checks.appendChild(line(true,'Transaction ID noted: '+info.utr));
  else checks.appendChild(line(false,'We could not read a transaction ID from the screenshot. Our team will check it manually.'));
  if(info&&info.detected&&info.detected.amount===false)checks.appendChild(line(false,'We could not see the expected amount in the screenshot. We will verify it manually.'));
  clearInterval(pollTimer);pollTimer=setInterval(checkStatus,45000);
}
async function checkStatus(){
  try{
    var r=await api({action:'getOrderStatus',orderId:orderId});
    if(r.found&&r.status==='PAID')renderDone('PAID',{});
    else if(r.found&&r.status==='UPI_REJECTED'){clearInterval(pollTimer);$('doneIcon').innerHTML='<i class="ri-error-warning-line"></i>';$('doneTitle').textContent='We could not verify your payment';$('doneText').textContent='We could not match this payment with our bank credit. We have emailed you the next steps, or message us on WhatsApp quoting your order reference.';}
  }catch(e){}
}
$('statusBtn').addEventListener('click',async function(){this.disabled=true;await checkStatus();this.disabled=false});
})();
