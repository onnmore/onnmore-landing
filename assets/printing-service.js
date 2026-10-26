(function(){
'use strict';
const $=id=>document.getElementById(id),form=$('printOrderForm'),status=$('geoStatus'),title=$('geoTitle'),message=$('geoMessage'),icon=$('geoIcon'),landmark=$('landmarkSearch'),hint=$('landmarkHint'),filesInput=$('printFiles'),photosInput=$('passportFiles');
const zones=[
{name:'Ecospace Business Park',lat:22.5854,lon:88.4905,radius:850},
{name:'Tata Consultancy Services Limited, Gitanjali Park',lat:22.5820,lon:88.4854,radius:850},
{name:'Aliah University, New Town',lat:22.58952,lon:88.48660,radius:850},
{name:'Amity University, New Town',lat:22.59587,lon:88.48545,radius:850},
{name:'Techno International New Town (TINT)',lat:22.578373,lon:88.47467,radius:850},
{name:'Candor TechSpace, New Town',lat:22.5754,lon:88.4798,radius:850},
{name:'DLF IT Park II, New Town',lat:22.576944,lon:88.487222,radius:850}];
const cart=[];let stream=null,selectedZone='',lastPosition=null;
const setGeo=(state,heading,details,iconClass)=>{status.dataset.state=state;title.textContent=heading;message.textContent=details;icon.className=iconClass;form.hidden=state!=='available';};
const rad=x=>x*Math.PI/180;
function distance(a,b){const d1=rad(b.lat-a.lat),d2=rad(b.lon-a.lon),x=Math.sin(d1/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(d2/2)**2;return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function lookup(name){return zones.find(z=>z.name.toLowerCase()===name.trim().toLowerCase());}
function chooseArea(name){const z=lookup(name);if(!z){selectedZone='';setGeo('unavailable','Choose a New Town service area','Select one of the suggested locations to continue.','ri-map-pin-line');return;}selectedZone=z.name;lastPosition=null;setGeo('available','Service area selected',z.name+' · New Town, Kolkata. Add your files, review the estimate and continue to checkout.','ri-checkbox-circle-line');hint.textContent='Selected: '+z.name+'. Confirm your name, mobile number and delivery address at checkout.';}
landmark.addEventListener('change',()=>chooseArea(landmark.value));landmark.addEventListener('input',()=>{if(lookup(landmark.value))chooseArea(landmark.value);});
$('geoRetry').addEventListener('click',()=>{if(!navigator.geolocation||!window.isSecureContext){hint.textContent='Location needs a secure HTTPS connection. Choose a service area from the suggestions instead.';return;}setGeo('checking','Finding your area…','Allow location access to check the New Town pilot areas.','ri-loader-4-line');navigator.geolocation.getCurrentPosition(p=>{lastPosition={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};const match=zones.map(z=>({zone:z,distance:distance(lastPosition,z)})).filter(x=>x.distance<=x.zone.radius).sort((a,b)=>a.distance-b.distance)[0];if(match){landmark.value=match.zone.name;chooseArea(match.zone.name);lastPosition={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};}else{selectedZone='';setGeo('unavailable','Not available in this area yet','Your current location is outside our New Town pilot areas. Choose a suggested landmark only if that is your delivery area.','ri-map-pin-off-line');}},()=>{setGeo('unavailable','Select a service area to continue','Location permission was not available. Choose a service area manually and enter the delivery address at checkout.','ri-map-pin-line');},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});});
status.dataset.state='unavailable';title.textContent='Choose your New Town area';message.textContent='Select a suggested landmark, or check your current location.';icon.className='ri-map-pin-line';
function money(n){return '₹'+Math.round(n).toLocaleString('en-IN');}
function itemPrice(item){return item.kind==='photo'?item.copies*10:item.pages*item.copies*10;}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function getItemUrl(item){
  if(!item._objectUrl||item._urlFile!==item.file){
    if(item._objectUrl)URL.revokeObjectURL(item._objectUrl);
    item._objectUrl=URL.createObjectURL(item.file);
    item._urlFile=item.file;
  }
  return item._objectUrl;
}
function fileExtension(file){return (file.name.split('.').pop()||'').toLowerCase();}
function appendPreview(item,detailsBody){
  const file=item.file,ext=fileExtension(file),url=getItemUrl(item);
  detailsBody.className='document-preview-body';
  if(file.type.startsWith('image/')){
    const img=document.createElement('img');img.className='document-full-preview';img.src=url;img.alt='Preview of '+file.name;detailsBody.append(img);
    return;
  }
  if(file.type==='application/pdf'||ext==='pdf'){
    const open=document.createElement('a');open.className='document-open-link';open.href=url;open.target='_blank';open.rel='noopener noreferrer';open.textContent='Open PDF in a new tab';detailsBody.append(open);
    const frame=document.createElement('iframe');frame.className='document-pdf-frame';frame.src=url+'#toolbar=1&navpanes=0';frame.title='PDF preview: '+file.name;frame.loading='lazy';detailsBody.append(frame);
    return;
  }
  if(ext==='docx'){
    const load=document.createElement('button');load.type='button';load.className='btn ghost document-load-preview';load.textContent='Load Word document preview';
    const mount=document.createElement('div');mount.className='docx-preview-mount';mount.setAttribute('aria-live','polite');
    load.addEventListener('click',async()=>{
      load.disabled=true;load.textContent='Preparing preview…';mount.textContent='Converting your Word file in this browser…';
      try{
        if(!window.mammoth){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
        const result=await window.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()});
        const frame=document.createElement('iframe');frame.className='document-docx-frame';frame.title='Word document preview: '+file.name;frame.setAttribute('sandbox','');
        const style='<!doctype html><html><head><meta charset="utf-8"><style>body{font:14px/1.6 Arial,sans-serif;color:#1b1b1b;padding:20px;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}td,th{border:1px solid #bbb;padding:6px}h1,h2,h3{line-height:1.25}</style></head><body>'+result.value+'</body></html>';
        frame.srcdoc=style;mount.replaceChildren(frame);if(result.messages&&result.messages.length){const note=document.createElement('p');note.className='preview-note';note.textContent='Some Word formatting may look different in this preview.';mount.append(note);}load.remove();
      }catch(_){mount.textContent='The Word preview could not be loaded. The file is still attached to your order; download it to check the original formatting.';load.disabled=false;load.textContent='Try preview again';}
    });
    detailsBody.append(load,mount);return;
  }
  if(ext==='doc'){
    const note=document.createElement('p');note.className='preview-note';note.textContent='This older .doc format cannot be rendered reliably inside the browser. The file is included in your order; open it in Word or another compatible editor to review the original layout.';detailsBody.append(note);
    const download=document.createElement('a');download.className='document-open-link';download.href=url;download.download=file.name;download.textContent='Download a copy to review';detailsBody.append(download);return;
  }
  const note=document.createElement('p');note.className='preview-note';note.textContent='A visual preview is not available for this file type. The file is still attached to your order.';detailsBody.append(note);
}
function renderDocumentCard(item){
  const detail=document.createElement('details');detail.className='document-preview';
  const summary=document.createElement('summary');summary.innerHTML='<i class="ri-eye-line"></i> Preview document';detail.append(summary);
  const body=document.createElement('div');detail.append(body);detail.addEventListener('toggle',()=>{if(detail.open&&!body.dataset.ready){appendPreview(item,body);body.dataset.ready='1';}});
  return detail;
}
function renderPhotoEditor(item){
  const workspace=document.createElement('div');workspace.className='photo-editor';
  const top=document.createElement('div');top.className='photo-workspace';
  const original=document.createElement('div');original.className='photo-source-preview';
  original.innerHTML='<span class="photo-section-label">YOUR PHOTO</span>';
  const img=document.createElement('img');img.src=getItemUrl(item);img.alt='Current passport photo preview';original.append(img);
  const state=document.createElement('small');state.className='photo-preview-caption';state.textContent=item.edited?'Edited photo preview':'Original photo · adjust it on the right';original.append(state);
  const controls=document.createElement('div');controls.className='photo-edit-controls';
  controls.innerHTML='<span class="photo-section-label">EDIT PHOTO</span><label>Background<select data-photo-background><option value="original">Keep original</option><option value="white">Clean white</option><option value="lightblue">Passport light blue</option><option value="lightgrey">Light grey</option></select></label><label>Lighting<select data-photo-lighting><option value="natural">Natural</option><option value="bright">Brighten</option><option value="studio">Soft studio</option><option value="contrast">Clear contrast</option></select></label><label>Number of prints<select data-field="copies">'+[6,12,18,24,30,36,42,48,54,60].map(n=>'<option value="'+n+'" '+(n===item.copies?'selected':'')+'>'+n+' prints</option>').join('')+'</select></label><div class="photo-edit-buttons"><button type="button" class="btn primary" data-apply-photo-edits>Apply edits</button><button type="button" class="btn ghost" data-reset-photo-edits>Reset</button></div><small class="photo-edit-note">Background replacement works best with a clear, front-facing portrait. Your photo is processed in this browser.</small><p class="photo-edit-status" aria-live="polite"></p>';
  const bg=controls.querySelector('[data-photo-background]');bg.value=item.background||'original';const light=controls.querySelector('[data-photo-lighting]');light.value=item.lighting||'natural';
  bg.addEventListener('change',()=>{item.pendingBackground=bg.value;});light.addEventListener('change',()=>{item.pendingLighting=light.value;});
  controls.querySelector('[data-field="copies"]').addEventListener('change',e=>{item.copies=Math.max(6,Math.ceil((Number(e.target.value)||6)/6)*6);render();});
  controls.querySelector('[data-apply-photo-edits]').addEventListener('click',e=>applyPhotoEdits(item,e.currentTarget,controls.querySelector('.photo-edit-status')));
  controls.querySelector('[data-reset-photo-edits]').addEventListener('click',()=>{item.file=item.originalFile||item.file;item.background='original';item.lighting='natural';item.pendingBackground='original';item.pendingLighting='natural';item.edited=false;render();hint.textContent='Photo edits reset. You can choose another background or lighting filter.';});
  top.append(original,controls);
  const sheetWrap=document.createElement('div');sheetWrap.className='photo-sheet-section';
  const totalSheets=Math.max(1,Math.ceil(item.copies/6));
  sheetWrap.innerHTML='<div class="photo-sheet-heading"><div><strong>6-COPY PRINT PREVIEW</strong><span>One sheet · 2 columns × 3 rows</span></div><b>'+(item.copies>6?item.copies+' prints · '+totalSheets+' sheets':'6 identical copies')+'</b></div>';
  const paper=document.createElement('div');paper.className='photo-print-sheet';const grid=document.createElement('div');grid.className='photo-print-grid';const sheetUrl=getItemUrl(item);
  for(let i=0;i<6;i++){const cell=document.createElement('div');cell.className='photo-print-cell';const copy=document.createElement('img');copy.src=sheetUrl;copy.alt='Passport photo copy '+(i+1)+' of 6';cell.append(copy);grid.append(cell);}paper.append(grid);sheetWrap.append(paper);
  const foot=document.createElement('small');foot.className='photo-sheet-footnote';foot.textContent='Preview only: final crop and print sizing are confirmed during order processing. ₹60 per six prints.';sheetWrap.append(foot);
  workspace.append(top,sheetWrap);return workspace;
}
function render(){
  const host=$('cartItems');host.replaceChildren();
  if(!cart.length){host.innerHTML='<p class="cart-empty">Your order is empty. Add a document, scan, or passport photo to get started.</p>';}
  cart.forEach(item=>{
    const row=document.createElement('article');row.className='cart-item';
    const head=document.createElement('div');head.className='cart-item-head';
    const thumb=document.createElement('div');thumb.className='cart-thumb';
    if((item.kind==='photo'||item.file.type.startsWith('image/'))&&item.file.type.startsWith('image/')){const img=document.createElement('img');img.src=getItemUrl(item);img.alt=item.kind==='photo'?'Passport photo thumbnail':'Document image thumbnail';thumb.append(img);}else{thumb.innerHTML='<i class="'+(fileExtension(item.file)==='pdf'?'ri-file-pdf-2-line':'ri-file-text-line')+'"></i>';}
    const file=document.createElement('div');file.className='cart-file';file.innerHTML='<strong title="'+safe(item.file.name)+'">'+safe(item.file.name)+'</strong><small>'+(item.kind==='photo'?'Passport photo · six-copy sheet preview':'Document · '+Math.ceil(item.file.size/1048576)+' MB')+(item.cleaned?' · Scan cleanup applied':'')+(item.edited?' · Photo edits applied':'')+'</small>';
    const price=document.createElement('div');price.className='cart-price';price.innerHTML='<span>'+money(itemPrice(item))+'</span><button class="cart-remove" type="button" aria-label="Remove '+safe(item.file.name)+'"><i class="ri-close-line"></i></button>';
    head.append(thumb,file,price);row.append(head);
    if(item.kind==='photo'){
      row.append(renderPhotoEditor(item));
    }else{
      const settings=document.createElement('div');settings.className='cart-settings document-settings';
      settings.innerHTML='<label>Pages<input data-field="pages" type="number" min="1" max="1000" value="'+item.pages+'"></label><label>Ink<select data-field="colour"><option value="Black & white" '+(item.colour==='Black & white'?'selected':'')+'>Black & white</option><option value="Colour" '+(item.colour==='Colour'?'selected':'')+'>Colour</option></select></label><label>Sides<select data-field="sides"><option '+(item.sides==='Single-sided'?'selected':'')+'>Single-sided</option><option '+(item.sides==='Double-sided'?'selected':'')+'>Double-sided</option></select></label><label>Copies<input data-field="copies" type="number" min="1" max="500" value="'+item.copies+'"></label>';
      row.append(settings,renderDocumentCard(item));
      settings.querySelectorAll('[data-field]').forEach(control=>control.addEventListener('change',()=>{const key=control.dataset.field;if(key==='pages'||key==='copies')item[key]=Math.max(1,Math.min(key==='pages'?1000:500,Number(control.value)||1));else item[key]=control.value;render();}));
    }
    host.append(row);
    price.querySelector('button').addEventListener('click',()=>{if(item._objectUrl)URL.revokeObjectURL(item._objectUrl);cart.splice(cart.indexOf(item),1);render();});
  });
  const bytes=cart.reduce((n,x)=>n+x.file.size,0),docPages=cart.filter(x=>x.kind==='document').reduce((n,x)=>n+x.pages*x.copies,0),photoCount=cart.filter(x=>x.kind==='photo').reduce((n,x)=>n+x.copies,0),raw=cart.reduce((n,x)=>n+itemPrice(x),0),total=cart.length?Math.max(99,raw):0;
  $('cartFileCount').textContent=cart.length+' file'+(cart.length===1?'':'s')+' · '+(bytes/1048576).toFixed(1)+' / 30 MB';$('summaryFiles').textContent=cart.length;$('summaryPages').textContent=(docPages+photoCount).toLocaleString('en-IN');$('priceEstimate').textContent=money(total);$('minimumNote').textContent=raw>0&&raw<99?'₹99 minimum order applies (before delivery). Your current print subtotal is '+money(raw)+'.':'₹10 per document page · ₹60 for six passport photos. ₹99 minimum order applies. Delivery charges, if any, are confirmed before acceptance.';const now=new Date(Date.now()+20*60000);$('summaryEta').textContent='By '+now.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'})+' IST';
}
function addItem(file,kind,cleaned=false){cart.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),file,originalFile:file,kind,pages:1,copies:kind==='photo'?6:1,colour:'Black & white',sides:'Single-sided',cleaned,background:'original',lighting:'natural',pendingBackground:'original',pendingLighting:'natural',edited:false});}
async function scanCleanup(file){if(!file.type.startsWith('image/'))return {file,cleaned:false};try{const image=new Image(),url=URL.createObjectURL(file);image.src=url;await image.decode();if(image.naturalWidth*image.naturalHeight>24000000){URL.revokeObjectURL(url);return {file,cleaned:false};}const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const frame=ctx.getImageData(0,0,canvas.width,canvas.height),d=frame.data;let sum=0,sum2=0;for(let i=0;i<d.length;i+=16){const l=.299*d[i]+.587*d[i+1]+.114*d[i+2];sum+=l;sum2+=l*l;}const count=Math.ceil(d.length/16),mean=sum/count,sd=Math.sqrt(Math.max(0,sum2/count-mean*mean));let edge=0,samples=0;for(let y=1;y<canvas.height-1;y+=4){for(let x=1;x<canvas.width-1;x+=4){const i=(y*canvas.width+x)*4,l=.299*d[i]+.587*d[i+1]+.114*d[i+2],u=i-canvas.width*4,b=i+canvas.width*4,left=i-4,right=i+4,lap=4*l-(.299*d[u]+.587*d[u+1]+.114*d[u+2])-(.299*d[b]+.587*d[b+1]+.114*d[b+2])-(.299*d[left]+.587*d[left+1]+.114*d[left+2])-(.299*d[right]+.587*d[right+1]+.114*d[right+2]);edge+=Math.abs(lap);samples++;}}const sharpness=edge/Math.max(1,samples);if(sd>48&&sharpness>17){URL.revokeObjectURL(url);return {file,cleaned:false};}for(let y=1;y<canvas.height-1;y++){for(let x=1;x<canvas.width-1;x++){const i=(y*canvas.width+x)*4;let gray=.299*d[i]+.587*d[i+1]+.114*d[i+2];if(sharpness<17){const u=i-canvas.width*4,b=i+canvas.width*4,left=i-4,right=i+4,neighbors=((.299*d[u]+.587*d[u+1]+.114*d[u+2])+(.299*d[b]+.587*d[b+1]+.114*d[b+2])+(.299*d[left]+.587*d[left+1]+.114*d[left+2])+(.299*d[right]+.587*d[right+1]+.114*d[right+2]))/4;gray+=Math.max(-30,Math.min(30,(gray-neighbors)*.45));}const contrast=Math.max(0,Math.min(255,(gray-128)*1.18+128));d[i]=d[i+1]=d[i+2]=contrast;}}ctx.putImageData(frame,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));URL.revokeObjectURL(url);if(!blob)return {file,cleaned:false};return {file:new File([blob],file.name.replace(/\.[^.]+$/,'')+'-scan-clean.jpg',{type:'image/jpeg'}),cleaned:true};}catch(_){return {file,cleaned:false};}}
async function ingest(list,kind){for(const original of Array.from(list||[])){const result=kind==='document'?await scanCleanup(original):{file:original,cleaned:false};if(cart.reduce((n,x)=>n+x.file.size,0)+result.file.size>30*1048576){hint.textContent='Your order has reached the 30 MB upload limit. Remove a file before adding more.';break;}addItem(result.file,kind,result.cleaned);}render();if(kind==='document'&&cart.some(x=>x.cleaned))hint.textContent='Low-contrast image pages were cleaned automatically in your browser. You can review each scan before submitting.';}
filesInput.addEventListener('change',async()=>{await ingest(filesInput.files,'document');filesInput.value='';});photosInput.addEventListener('change',async()=>{await ingest(photosInput.files,'photo');photosInput.value='';});
async function openCamera(){try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});$('cameraVideo').srcObject=stream;$('cameraBox').hidden=false;}catch(_){hint.textContent='Camera access is unavailable. You can add a scan or photo from your device instead.';}}
function closeCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}$('cameraBox').hidden=true;}
$('openPhotoCamera').addEventListener('click',async()=>{try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});$('photoVideo').srcObject=stream;$('photoCameraBox').hidden=false;}catch(_){hint.textContent='Camera access is unavailable. Choose a passport photo from your device instead.';}});
$('closePhotoCamera').addEventListener('click',()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}$('photoCameraBox').hidden=true;});
$('capturePhoto').addEventListener('click',async()=>{const video=$('photoVideo');if(!video.videoWidth)return;const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.92));if(blob){await ingest([new File([blob],'passport-photo-'+(cart.length+1)+'.jpg',{type:'image/jpeg'})],'photo');if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}$('photoCameraBox').hidden=true;}});$('openScanner').addEventListener('click',openCamera);$('closeScanner').addEventListener('click',closeCamera);
$('capturePage').addEventListener('click',async()=>{const video=$('cameraVideo');if(!video.videoWidth)return;const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));if(blob){const scan=new File([blob],'scan-page-'+(cart.length+1)+'.jpg',{type:'image/jpeg'});await ingest([scan],'document');runOcr([scan]);}});
async function runOcr(files){const images=Array.from(files||[]).filter(f=>f.type.startsWith('image/'));if(!images.length){$('ocrText').value='Capture or add image scans to read text.';return;}const button=$('ocrFiles');button.disabled=true;button.innerHTML='<i class="ri-loader-4-line"></i> Reading text…';$('ocrText').value='Reading your scanned pages in this browser…';try{if(!window.Tesseract){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});}const worker=await Tesseract.createWorker('eng');let text='';for(const file of images){const result=await worker.recognize(file);text+=result.data.text.trim()+'\\n\\n';}await worker.terminate();$('ocrText').value=text.trim()||'No readable text found. You can still submit the image for printing.';}catch(_){$('ocrText').value='Text recognition could not load. The scan is still available in your print queue.';}finally{button.disabled=false;button.innerHTML='<i class="ri-scan-2-line"></i> Read text from scans (OCR)';}}
$('ocrFiles').addEventListener('click',()=>runOcr(cart.filter(x=>x.kind==='document').map(x=>x.file)));let segmentationScriptPromise=null;
function loadSegmentation(){
  if(window.SelfieSegmentation)return Promise.resolve();
  if(!segmentationScriptPromise){segmentationScriptPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/selfie_segmentation.js';s.crossOrigin='anonymous';s.onload=()=>window.SelfieSegmentation?resolve():reject(new Error('Segmentation model unavailable'));s.onerror=()=>reject(new Error('Could not load background model'));document.head.appendChild(s);});}
  return segmentationScriptPromise;
}
const lightingFilters={natural:'none',bright:'brightness(1.12) contrast(1.04) saturate(1.03)',studio:'brightness(1.07) contrast(1.02) saturate(1.08)',contrast:'brightness(1.03) contrast(1.16) saturate(1.04)'};
const backgroundColors={white:'#FFFFFF',lightblue:'#DCEBFA',lightgrey:'#E9ECEF'};
function loadImage(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read photo'));};img.src=url;});}
async function applyPhotoEdits(item,button,statusNode){
  button.disabled=true;button.textContent='Applying…';statusNode.textContent='Preparing your photo and six-copy sheet preview…';
  const background=item.pendingBackground||'original',lighting=item.pendingLighting||'natural',source=item.originalFile||item.file;
  try{
    const img=await loadImage(source);if(img.naturalWidth*img.naturalHeight>24000000)throw new Error('This image is too large to edit in the browser. Please choose an image under 24 megapixels.');
    const w=img.naturalWidth,h=img.naturalHeight,foreground=document.createElement('canvas');foreground.width=w;foreground.height=h;const fctx=foreground.getContext('2d');
    fctx.filter=lightingFilters[lighting]||'none';fctx.drawImage(img,0,0,w,h);fctx.filter='none';
    if(background!=='original'){
      statusNode.textContent='Separating the person from the background…';await loadSegmentation();
      const model=new SelfieSegmentation({locateFile:name=>'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/'+name});model.setOptions({modelSelection:1});
      let timeoutId;const result=await new Promise((resolve,reject)=>{timeoutId=setTimeout(()=>reject(new Error('Background editing timed out')),25000);model.onResults(resolve);Promise.resolve(model.send({image:img})).catch(reject);});clearTimeout(timeoutId);
      fctx.globalCompositeOperation='destination-in';fctx.drawImage(result.segmentationMask,0,0,w,h);fctx.globalCompositeOperation='source-over';model.close();
      const finalCanvas=document.createElement('canvas');finalCanvas.width=w;finalCanvas.height=h;const ctx=finalCanvas.getContext('2d');ctx.fillStyle=backgroundColors[background]||'#FFFFFF';ctx.fillRect(0,0,w,h);ctx.drawImage(foreground,0,0,w,h);
      const blob=await new Promise(resolve=>finalCanvas.toBlob(resolve,'image/jpeg',.94));if(!blob)throw new Error('Could not prepare the edited photo');item.file=new File([blob],source.name.replace(/\.[^.]+$/,'')+'-edited.jpg',{type:'image/jpeg'});
    }else{
      const blob=await new Promise(resolve=>foreground.toBlob(resolve,'image/jpeg',.94));if(!blob)throw new Error('Could not prepare the edited photo');
      // Keep the original exactly when Natural is selected and no background change is requested.
      item.file=(lighting==='natural')?source:new File([blob],source.name.replace(/\.[^.]+$/,'')+'-edited.jpg',{type:'image/jpeg'});
    }
    item.background=background;item.lighting=lighting;item.pendingBackground=background;item.pendingLighting=lighting;item.edited=background!=='original'||lighting!=='natural';render();hint.textContent='Photo edits applied. Review the six-copy print sheet before continuing.';
  }catch(err){statusNode.textContent=background!=='original'?'Background change could not be applied. Check your connection and try again; your original photo is unchanged.':(err&&err.message?err.message:'Photo editing failed. Your original photo is unchanged.');button.disabled=false;button.textContent='Apply edits';}
}
function refreshDeliveryEstimate(){const eta=new Date(Date.now()+20*60000);$('summaryEta').textContent='By '+eta.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'})+' IST';}
const buildFields=$('orderBuildFields'),checkoutPanel=$('printCheckoutPanel'),reviewNext=$('reviewOrderNext'),cartTitle=$('cartTitle'),checkoutStatus=$('printCheckoutStatus');
const customerNameStep=$('customerNameStep'),customerPhoneStep=$('customerPhoneStep'),deliveryConfirmStep=$('deliveryConfirmStep');
function showCheckoutStep(step){
  customerNameStep.hidden=step!=='name';customerPhoneStep.hidden=step!=='phone';deliveryConfirmStep.hidden=step!=='delivery';
  checkoutStatus.hidden=true;checkoutStatus.textContent='';
  const target=step==='name'?customerNameStep:step==='phone'?customerPhoneStep:deliveryConfirmStep;
  target.scrollIntoView({behavior:'smooth',block:'start'});
}
reviewNext.addEventListener('click',()=>{
  if(!selectedZone){hint.textContent='Choose a New Town service area to continue.';landmark.focus();return;}
  if(!cart.length){hint.textContent='Add at least one document or passport photo before continuing.';return;}
  if(cart.reduce((n,x)=>n+x.file.size,0)>30*1048576){hint.textContent='Your order exceeds the 30 MB total file limit.';return;}
  refreshDeliveryEstimate();buildFields.hidden=true;reviewNext.hidden=true;checkoutPanel.hidden=false;cartTitle.textContent='Review your print order';showCheckoutStep('name');
});
$('backToOrder').addEventListener('click',()=>{checkoutPanel.hidden=true;reviewNext.hidden=false;buildFields.hidden=false;cartTitle.textContent='Your print queue';checkoutStatus.hidden=true;checkoutStatus.textContent='';buildFields.scrollIntoView({behavior:'smooth',block:'start'});});
$('nextToPhone').addEventListener('click',()=>{
  const field=$('customerName');if(!field.value.trim()){field.setCustomValidity('Enter your name to continue.');field.reportValidity();field.addEventListener('input',()=>field.setCustomValidity(''),{once:true});return;}field.setCustomValidity('');showCheckoutStep('phone');
});
$('backToName').addEventListener('click',()=>showCheckoutStep('name'));
$('nextToDelivery').addEventListener('click',()=>{
  const field=$('customerPhone'),digits=field.value.trim().replace(/\D/g,'');
  if(!field.value.trim()){field.reportValidity();return;}
  if(!(digits.length===10||(digits.length===12&&digits.startsWith('91')))){showCheckoutError('Enter a valid 10-digit mobile number, or include the +91 country code.');field.focus();return;}
  showCheckoutStep('delivery');
});
$('backToPhone').addEventListener('click',()=>showCheckoutStep('phone'));
function showCheckoutError(message,withWhatsApp=false,details=''){
  checkoutStatus.replaceChildren(document.createTextNode(message));checkoutStatus.hidden=false;checkoutStatus.classList.remove('success');
  if(withWhatsApp){const wa=document.createElement('a');wa.href='https://wa.me/919477110971?text='+encodeURIComponent(details||'Hello Onnmore, I need help placing a printing order.');wa.target='_blank';wa.rel='noopener noreferrer';wa.textContent=' Continue on WhatsApp';wa.style.color='var(--accent-light)';wa.style.fontWeight='800';checkoutStatus.append(wa);}
  checkoutStatus.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function sendPrintOrderSecondary(payload){
  const sheet='https://script.google.com/macros/s/AKfycbwsgIpEKNUWUo8VHOIoF2O-w-xzfzu-5C1n7_S6d_CYLeTR5l9AdPMrkJB0aHk4O5MafQ/exec';
  fetch(sheet,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}).catch(()=>{});
}
function setPlaceButton(loading){const btn=$('placePrintOrder');btn.disabled=loading;btn.innerHTML=loading?'<i class="ri-loader-4-line"></i> Placing order…':'<i class="ri-check-line"></i> Agree &amp; Place Order';}
form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(checkoutPanel.hidden){showCheckoutError('Select “Next: Your details” to continue to checkout.');return;}
  if(!customerNameStep.hidden){$('nextToPhone').click();return;}
  if(!customerPhoneStep.hidden){$('nextToDelivery').click();return;}
  if(deliveryConfirmStep.hidden){return;}
  if(!selectedZone){showCheckoutError('Choose a New Town service area before placing your order.');return;}
  if(!cart.length){showCheckoutError('Your print order is empty. Go back and add a document or photo.');return;}
  const phone=$('customerPhone').value.trim(),digits=phone.replace(/\D/g,'');
  if(!$('customerName').value.trim()){showCheckoutStep('name');$('customerName').focus();showCheckoutError('Enter your name to continue.');return;}
  if(!(digits.length===10||(digits.length===12&&digits.startsWith('91')))){showCheckoutStep('phone');$('customerPhone').focus();showCheckoutError('Enter a valid 10-digit mobile number, or include the +91 country code.');return;}
  if(!form.reportValidity())return;
  if(!$('printTerms').checked){showCheckoutError('Please tick the agreement box before placing the order.');$('printTerms').focus();return;}
  const totalBytes=cart.reduce((n,x)=>n+x.file.size,0);
  if(totalBytes>30*1048576){showCheckoutError('Your order exceeds the 30 MB upload limit. Remove a file and try again.');return;}
  const raw=cart.reduce((n,x)=>n+itemPrice(x),0),estimate=money(Math.max(99,raw));refreshDeliveryEstimate();
  const caseId='ONN-PRT-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
  const values={caseId,service:'Printing and local delivery',name:$('customerName').value.trim(),phone,zone:selectedZone,address:$('deliveryAddress').value.trim(),notes:$('printNotes').value.trim(),estimate,rawEstimate:money(raw),eta:$('summaryEta').textContent,fileCount:cart.length,totalBytes,items:cart.map((x,i)=>({name:x.file.name,kind:x.kind,pages:x.pages,copies:x.copies,colour:x.colour,sides:x.sides,price:money(itemPrice(x)),cleaned:x.cleaned,background:x.background||'original',lighting:x.lighting||'natural',edited:!!x.edited,index:i})),gpsConfirmed:!!lastPosition,termsAccepted:true,termsAcceptedAt:new Date().toISOString()};
  const payload={...values,printItems:JSON.stringify(values.items),printFormat:'Mixed print order',printStyle:'Per-file selection',printCopies:'See printItems',printPages:'See printItems',printEstimatedPrice:estimate,printArea:selectedZone,printFileCount:cart.length,deliveryAddress:values.address,message:values.notes,location:'New Town, Kolkata',language:'en'};
  const button=$('placePrintOrder');setPlaceButton(true);checkoutStatus.hidden=false;checkoutStatus.classList.remove('success');checkoutStatus.textContent='Sending your order and files securely…';
  try{
    const fd=new FormData();
    const accessKey='30790f77-ad43-4bc1-8ccc-0daa24ed4328';
    Object.entries({access_key:accessKey,subject:'New Onnmore Printing Order · '+caseId,from_name:'Onnmore Website',...payload}).forEach(([k,v])=>{if(v!==''&&v!==null&&v!==undefined)fd.append(k,typeof v==='object'?JSON.stringify(v):String(v));});
    cart.forEach((item,i)=>fd.append('attachment',item.file,item.file.name||('print-file-'+(i+1))));
    const response=await fetch('https://api.web3forms.com/submit',{method:'POST',body:fd});
    const result=await response.json();
    if(!response.ok||!result.success)throw new Error(result.message||'The order could not be sent.');
    sendPrintOrderSecondary(payload);
    $('printOrderForm').hidden=true;$('printOrderSuccess').hidden=false;
    $('printSuccessReference').textContent=caseId;$('printSuccessEta').textContent=values.eta;$('printSuccessPrice').textContent=estimate;
    $('printSuccessMessage').textContent='Thanks, '+values.name+'. Your order request has been sent with '+cart.length+' file(s). Onnmore will contact you on '+values.phone+' to confirm delivery availability, timing and final charges.';
    try{sessionStorage.removeItem('onnmore_print_request');}catch(_){}
    $('printOrderSuccess').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    console.error('Onnmore print order submission failed:',err);
    const fallback='Hello Onnmore, I could not submit my printing order online. Reference: '+caseId+' | Name: '+values.name+' | Phone: '+values.phone+' | Area: '+selectedZone+' | Address: '+values.address+' | Estimate: '+estimate+' | Delivery: '+values.eta+' | Items: '+values.items.map(x=>x.name+' ('+x.price+')').join(', ')+'. I will attach my files here if needed.';
    showCheckoutError('We could not submit the order right now. Your details and files have not been confirmed; please retry or continue on WhatsApp.',true,fallback);
  }finally{setPlaceButton(false);}
});
render();
})(); 



