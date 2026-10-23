
const DISCOUNT=0.10;
const selected=new Set();
const prepared=new Map();
const money=n=>'₹'+n.toLocaleString('en-IN',{maximumFractionDigits:2});
const sale=n=>Math.round(n*(1-DISCOUNT)*100)/100;
const el=id=>document.getElementById(id);
const status=t=>el('status').textContent=t;
function caption(b){return b.name+'\nMRP: '+money(b.mrp)+'\nAfter 10% off: '+money(sale(b.mrp))+' per piece';}
function source(p){return p.url;}
async function file(p){const response=await fetch(p.url);if(!response.ok)throw new Error('Photo unavailable: '+p.name);const blob=await response.blob();return new File([blob],p.name,{type:'image/jpeg'});}
let revision=0;
function invalidate(){revision++;prepared.clear();el('queue').replaceChildren();status('Selection or price changed. Tap Prepare selected batches.');}
batches.forEach(b=>{
const card=document.createElement('article');
card.innerHTML='<img class="thumb" alt=""><label><input type="checkbox"><strong></strong></label><small class="count"></small><div class="price"></div><label>Batch MRP <input type="number" min="1" step="0.01" aria-label="Batch MRP"></label><label class="confirm"><input type="checkbox">MRP verified for this batch</label><small class="note"></small>';
card.querySelector('img').src=source(b.photos[0]);card.querySelector('img').alt=b.name+' sample';
card.querySelector('strong').textContent=b.name;
card.querySelector('.count').textContent=b.photos.length+' original photos';
const update=()=>{card.querySelector('.price').textContent=money(sale(b.mrp))+' after 10% off';};
update();
const check=card.querySelector('input[type=checkbox]');
check.onchange=()=>{check.checked?selected.add(b.id):selected.delete(b.id);invalidate();};
const price=card.querySelector('input[type=number]');price.value=b.mrp;
const confirm=card.querySelector('.confirm input');confirm.checked=b.confirmed;
price.oninput=()=>{b.mrp=Number(price.value);b.confirmed=false;confirm.checked=false;update();invalidate();};
confirm.onchange=()=>{b.confirmed=confirm.checked;invalidate();};
card.querySelector('.note').textContent=b.confirmed?'MRP supplied by owner.':'MRP taken from folder name: verify before quoting.';
el('cards').append(card);
});
el('prepare').onclick=async()=>{
el('queue').replaceChildren();prepared.clear();
if(!selected.size){status('First select a batch.');return;}
const current=revision; const chosen=batches.filter(b=>selected.has(b.id)); el('prepare').disabled=true; status('Preparing original photos...');
try{
for(const b of chosen){
const files=[]; for(const p of b.photos){files.push(await file(p));if(current!==revision)return;}prepared.set(b.id,files);
const article=document.createElement('article');article.style.marginBottom='18px';
const h=document.createElement('h2');h.textContent=b.name+' · '+files.length+' photos';article.append(h);
const warning=document.createElement('p');warning.textContent='Share one batch at a time so photos and price stay together. Return here for the next batch.';article.append(warning);
const actions=document.createElement('div');actions.className='actions';
const share=document.createElement('button');share.textContent='Share batch photos';
share.onclick=async()=>{
if(!navigator.share||!navigator.canShare||!navigator.canShare({files})){status('Photo sharing is unavailable here. Use the download links below. A supported Android browser on HTTPS is needed for the sharing trial.');return;}
share.disabled=true;
try{await navigator.share({files});status(b.name+': handed to the phone sharing menu. Check WhatsApp and send to the correct customer. Delivery is not confirmed here.');}
catch(e){status(e.name==='AbortError'?'Sharing cancelled; nothing marked as sent.':'Could not share this batch: '+e.name+'. Use photo downloads below.');}
finally{share.disabled=false;}
};actions.append(share);
article.append(actions);
const text=document.createElement('textarea');text.readOnly=true;text.setAttribute('aria-label',b.name+' price message');
const valid=b.confirmed&&Number.isFinite(b.mrp)&&b.mrp>0;
text.value=valid?caption(b):'Confirm the batch MRP above to enable the price message.';
article.append(text);
const copy=document.createElement('button');copy.className='secondary';copy.textContent='Copy batch price';copy.disabled=!valid;
copy.onclick=async()=>{try{await navigator.clipboard.writeText(caption(b));status('Price copied. Paste after the matching photo batch in WhatsApp.');}catch(e){text.focus();text.select();status('Select and copy the highlighted price message manually.');}};
article.append(copy);
const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='View / download '+files.length+' photos';details.append(summary);
const gallery=document.createElement('div');gallery.className='gallery';
b.photos.forEach((p,i)=>{const a=document.createElement('a');a.href=source(p);a.download=p.name;const img=document.createElement('img');img.loading='lazy';img.src=source(p);img.alt=b.name+' photo '+(i+1);a.append(img,document.createTextNode('Download '+(i+1)));gallery.append(a);});details.append(gallery);article.append(details);el('queue').append(article);
}
status('Batches ready. Share photos, then copy the matching price message. Android / WhatsApp sharing has not yet been tested.');
el('queue').scrollIntoView({behavior:'smooth'});
}catch(e){el('queue').replaceChildren();prepared.clear();status('Could not prepare photos. Check connection and retry. '+e.message);}finally{el('prepare').disabled=false;}
};
