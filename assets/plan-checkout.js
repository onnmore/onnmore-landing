(function(){
'use strict';
const params=new URLSearchParams(location.search),service=params.get('service')||'',planId=params.get('plan')||'';
const catalog=window.ONNMORE_PLAN_CATALOG||{},plan=(catalog[service]||{})[planId];
const $=id=>document.getElementById(id),draftKey='onnmore_plan_checkout_draft_v1';
const serviceNames={'business-plan':'Business Consultation','tech-plan':'Website & Digital Development','tech-care':'Tech Care Club'};
function money(n){return '₹'+Number(n).toLocaleString('en-IN');}
function showError(message){const el=$('formError');el.textContent=message;el.classList.add('show');}
function hideError(){const el=$('formError');el.textContent='';el.classList.remove('show');}
if(!plan){$('coSelectedTitle').textContent='Plan not found';$('coPlanDescription').textContent='Please return to the plans page and select a plan again.';$('coPrice').textContent='';$('coPlanCall').hidden=true;$('planCheckoutForm').hidden=true;return;}
$('coServiceLabel').textContent=serviceNames[service]||'Selected plan';$('coSelectedTitle').textContent=plan.name;$('coPlanDescription').textContent=plan.description;$('coPrice').innerHTML=money(plan.price)+'<small>'+plan.cadence+'</small>';$('coPlanCall').textContent=plan.call;
const back=service==='tech-plan'?'it-support.html#plans':service==='tech-care'?'tech-care-club.html':'index.html#pricing';$('coBack').href=back;$('coCancel').href=back;
$('businessTypeWrap').hidden=service!=='business-plan';$('deviceDetailsWrap').hidden=service!=='tech-care';$('deviceModelWrap').hidden=service!=='tech-care';$('techGoalWrap').hidden=service!=='tech-plan';$('siteAddressWrap').hidden=service!=='tech-plan';
if(service==='tech-care'){$('deviceType').required=true;$('deviceModel').required=true;$('customerState').required=false;$('businessName').value='';$('customerState').value='';
$('coHeading').textContent='Let’s set up your Tech Care membership.';$('coSubheading').textContent='Tell us about your device once. You’ll review everything before choosing how to pay.';$('coStep2Label').textContent='Device details';
$('cityLabel').innerHTML='City / area <span class="req">*</span>';$('customerCity').placeholder='e.g. New Town, Kolkata';$('cityHint').hidden=false;$('cityHint').textContent='Tech Care Club is available only in Kolkata and New Town.';}
else if(service==='tech-plan'){$('coHeading').textContent='Let’s plan your online presence.';$('coStep2Label').textContent='Business details';$('businessNameLabel').textContent='Business name';$('businessName').placeholder='Your business or brand name';}
else{$('coStep2Label').textContent='Business details';}
let previous=null;try{previous=JSON.parse(sessionStorage.getItem(draftKey)||'null')}catch(e){}
if(previous&&previous.serviceType===service&&previous.planId===planId){const restoreMap={customerName:'customerName',customerEmail:'customerEmail',customerPhone:'customerPhone',businessName:'businessName',customerState:'state',customerCity:'city',businessType:'businessType',deviceType:'deviceType',deviceModel:'deviceModel',websiteUrl:'websiteUrl',techGoal:'techGoal',orderNotes:'notes'};Object.keys(restoreMap).forEach(id=>{const v=previous[restoreMap[id]];if($(id)&&v!==undefined)$(id).value=v});$('privacyConsent').checked=!!previous.consent;}
$('planCheckoutForm').addEventListener('submit',function(e){e.preventDefault();hideError();if(!this.reportValidity())return;
const email=$('customerEmail').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showError('Please enter a valid email address so we can send your confirmation.');$('customerEmail').focus();return;}
const phone=$('customerPhone').value.trim(),digits=phone.replace(/\D/g,'');if(digits.length<10||digits.length>15){showError('Please enter a valid mobile number including the country code if needed.');$('customerPhone').focus();return;}
if(service==='tech-care'&&(!$('deviceType').value||!$('deviceModel').value.trim())){showError('Please enter your device type and make/model.');return;}
const draft={serviceType:service,planId:planId,planName:plan.name,price:plan.price,serviceLabel:serviceNames[service]||service,customerName:$('customerName').value.trim(),customerEmail:email,customerPhone:phone,businessName:$('businessName').value.trim(),state:$('customerState').value.trim(),city:$('customerCity').value.trim(),businessType:$('businessType').value,deviceType:$('deviceType').value,deviceModel:$('deviceModel').value.trim(),websiteUrl:$('websiteUrl').value.trim(),techGoal:$('techGoal').value.trim(),notes:$('orderNotes').value.trim(),consent:true,consentAt:new Date().toISOString()};
sessionStorage.setItem(draftKey,JSON.stringify(draft));location.href='plan-review.html?service='+encodeURIComponent(service)+'&plan='+encodeURIComponent(planId);
});

// Guided, one-step-at-a-time plan form.
const stepGroups=Array.from(document.querySelectorAll('[data-form-step]'));
const stepLabels=Array.from(document.querySelectorAll('[data-form-step-label]'));
const stepTitle=$('coFormStepTitle'),stepNext=$('formStepNext'),stepBack=$('formStepBack'),stepSubmit=$('formStepSubmit'),stepError=$('stepError');
let activeFormStep=0;
function renderFormStep(){
  stepGroups.forEach(el=>{const requiredService=el.dataset.serviceOnly;const serviceMatches=!requiredService||requiredService.split(',').includes(service);el.hidden=Number(el.dataset.formStep)!==activeFormStep||!serviceMatches;});
  stepLabels.forEach(el=>{const n=Number(el.dataset.formStepLabel);el.classList.toggle('is-active',n===activeFormStep);el.classList.toggle('is-done',n<activeFormStep);});
  stepTitle.textContent=['Step 1 of 3 · Your contact details',service==='tech-care'?'Step 2 of 3 · Your device details':'Step 2 of 3 · Your business details','Step 3 of 3 · Final checks'][activeFormStep];
  stepBack.hidden=activeFormStep===0;stepNext.hidden=activeFormStep===2;stepSubmit.hidden=activeFormStep!==2;
  stepError.textContent='';stepError.classList.remove('show');
}
function techCareArea(v){return /(kolkata|calcutta|new\s*town|newtown|rajarhat)/i.test(String(v||''));}
function validateCurrentStep(){
  const fields=stepGroups.filter(el=>Number(el.dataset.formStep)===activeFormStep).flatMap(el=>Array.from(el.querySelectorAll('input,select,textarea'))).filter(el=>!el.disabled&&!el.closest('[hidden]'));
  for(const field of fields){if(!field.checkValidity()){field.reportValidity();return false;}}
  if(service==='tech-care'&&activeFormStep===1&&!techCareArea($('customerCity').value)){showError('Tech Care Club is currently available only in Kolkata and New Town. Please enter an area in Kolkata or New Town, or contact us if you are nearby.');$('customerCity').focus();return false;}
  hideError();
  return true;
}
stepNext.addEventListener('click',()=>{if(!validateCurrentStep())return;activeFormStep=Math.min(2,activeFormStep+1);renderFormStep();stepTitle.scrollIntoView({behavior:'smooth',block:'nearest'});});
stepBack.addEventListener('click',()=>{activeFormStep=Math.max(0,activeFormStep-1);renderFormStep();});
renderFormStep();

$('year').textContent=new Date().getFullYear();
})();