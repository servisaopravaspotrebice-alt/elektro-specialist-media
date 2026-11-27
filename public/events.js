window.serviceEvent=function(name){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name});};document.addEventListener('click',function(e){const a=e.target.closest('a');if(!a)return;if(a.getAttribute('href')?.startsWith('tel:'))window.serviceEvent('phone_click');else if(a.href.includes('maps.app.goo.gl'))window.serviceEvent('map_click');});


(function(){
const API='https://elektro-specialist-callback-api.onrender.com';
const template="<form class=\"form-card callback-form\" id=\"request\" enctype=\"multipart/form-data\" novalidate><div class=\"callback-heading\"><h3>Nechte si zavolat zpět</h3><p>Odešlete krátkou poptávku. Zavoláme vám, upřesníme závadu a sdělíme orientační cenu opravy. Poptávka je nezávazná.</p></div><div class=\"fields\"><div class=\"full\"><label for=\"cb-phone\">Telefon *</label><input id=\"cb-phone\" name=\"phone\" type=\"tel\" inputmode=\"tel\" autocomplete=\"tel\" required maxlength=\"35\" placeholder=\"+420 777 123 456\"></div><div><label for=\"cb-type\">Spotřebič *</label><select id=\"cb-type\" name=\"type\" required><option value=\"\">Vyberte spotřebič</option><option value=\"Pračka\">Pračka</option><option value=\"Myčka nádobí\">Myčka nádobí</option><option value=\"Sušička prádla\">Sušička prádla</option><option value=\"Elektrická trouba\">Elektrická trouba</option><option value=\"Indukční deska\">Indukční deska</option><option value=\"Jiný spotřebič\">Jiný spotřebič</option></select></div><div><label for=\"cb-area\">Obec / městská část *</label><input id=\"cb-area\" name=\"area\" autocomplete=\"address-level2\" required maxlength=\"120\" placeholder=\"Např. Praha 4 nebo Kladno\"></div><div class=\"full\"><label for=\"cb-problem\">Co nefunguje? *</label><textarea id=\"cb-problem\" name=\"problem\" required maxlength=\"500\" rows=\"2\" placeholder=\"Např. nevypouští vodu, hlásí chybu…\"></textarea></div><div class=\"full\"><label for=\"cb-model\">Značka a model (nepovinné)</label><input id=\"cb-model\" name=\"model\" maxlength=\"100\" placeholder=\"Např. Bosch WAN…\"></div><div class=\"full photo-field\"><label for=\"cb-photo\">Fotografie modelu nebo výrobního štítku (nepovinné)</label><input id=\"cb-photo\" name=\"photo\" type=\"file\" accept=\"image/jpeg,image/png,image/webp\"><p class=\"fine\">Vyfoťte označení modelu nebo vyberte fotografii. JPG, PNG nebo WebP, max. 5 MB po zmenšení. Nepřikládejte doklady, platební údaje ani fotografie osob.</p><div id=\"cb-preview\" hidden><img alt=\"Náhled fotografie modelu\"><button type=\"button\" class=\"photo-remove\">Odebrat fotografii</button></div></div></div><div class=\"cb-trap\" aria-hidden=\"true\"><label>Web<input name=\"website\" tabindex=\"-1\" autocomplete=\"off\"></label></div><button class=\"btn callback-submit\" type=\"submit\" disabled>Odeslat poptávku a nechat si zavolat</button><div class=\"callback-status\" role=\"status\" aria-live=\"polite\">Ověřujeme dostupnost formuláře…</div><p class=\"fine\">Údaje předáme našemu servisnímu týmu za účelem vyřízení poptávky. <a href=\"ochrana-osobnich-udaju.html\">Ochrana osobních údajů</a> · <a href=\"podminky-servisu.html\">Podmínky servisu</a>. Nebo volejte <a href=\"tel:+420770644383\">+420 770 644 383</a>.</p><noscript><p>Pro odeslání formuláře povolte JavaScript, nebo nám zavolejte.</p></noscript></form>";
const footer=document.querySelector('footer');
if(footer&&!footer.querySelector('.legal-links')){const div=document.createElement('div');div.className='wrap';div.innerHTML="<div class=\"legal-links\" aria-label=\"Informace pro zákazníky\"><a href=\"kontakt-firma.html\">Kontakt a provozovatel</a> · <a href=\"podminky-servisu.html\">Podmínky servisu a ceny</a> · <a href=\"reklamace.html\">Reklamace a ADR</a> · <a href=\"ochrana-osobnich-udaju.html\">Ochrana osobních údajů</a></div>";footer.appendChild(div);}
for(const a of document.querySelectorAll('a[href="index.html#soukromi"],a[href="#soukromi"]'))a.href='ochrana-osobnich-udaju.html';
let form=document.querySelector('form#request');
const path=location.pathname;
const type=/mycek/.test(path)?'Myčka nádobí':/susicek/.test(path)?'Sušička prádla':/trub/.test(path)?'Elektrická trouba':/indukcnich-desek/.test(path)?'Indukční deska':/servis-spotrebicu|kontakt-firma|podminky-servisu|reklamace|ochrana-osobnich-udaju/.test(path)?'':'Pračka';
if(form&&!form.classList.contains('callback-form')){
 const block=form.closest('section');form.outerHTML=template;form=document.querySelector('form#request');
 const text=block?.querySelector('.form-grid > div .intro');if(text)text.textContent='Stačí telefon, místo a krátký popis. Můžete přiložit fotografii modelu. Po doručení poptávky vám zavoláme zpět s orientační cenou.';
}
if(!form)return;
const sel=form.elements.type;if(!sel.value&&type)sel.value=type;
for(const el of document.querySelectorAll('.strip span'))if(el.textContent.includes('WhatsApp'))el.textContent='Telefon nebo online formulář';
const button=form.querySelector('.callback-submit'),status=form.querySelector('.callback-status'),input=form.elements.photo,preview=form.querySelector('#cb-preview'),img=preview.querySelector('img');
let photo=null,url='',id=crypto.randomUUID(),busy=false,ready=false,photoBusy=false;
const message=(str,kind='')=>{status.textContent=str;status.dataset.state=kind;};
const sync=()=>{button.disabled=!ready||busy||photoBusy;};
async function availability(){try{const r=await fetch(API+'/health',{cache:'no-store',signal:AbortSignal.timeout(65000)});const j=await r.json();ready=r.ok&&j.configured===true;message(ready?'':'Online formulář nyní není dostupný. Zavolejte nám na +420 770 644 383.',ready?'':'error');}catch{ready=false;message('Online formulář se nepodařilo připojit. Zavolejte na +420 770 644 383.','error');}sync();}
function clear(){photo=null;input.value='';if(url)URL.revokeObjectURL(url);url='';img.removeAttribute('src');preview.hidden=true;}
preview.querySelector('button').addEventListener('click',clear);
input.addEventListener('change',async()=>{const f=input.files[0];photo=null;if(url)URL.revokeObjectURL(url);preview.hidden=true;if(!f)return;
photoBusy=true;sync();try{if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>20*1024*1024)throw Error('photo');const bm=await createImageBitmap(f);try{const scale=Math.min(1,1800/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bm.width*scale));c.height=Math.max(1,Math.round(bm.height*scale));const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bm,0,0,c.width,c.height);photo=await new Promise(r=>c.toBlob(r,'image/jpeg',.86));if(!photo||photo.size>5*1024*1024)throw Error('size');url=URL.createObjectURL(photo);img.src=url;preview.hidden=false;message('Fotografie je připravena.');}finally{bm.close();}}catch{clear();message('Fotografii se nepodařilo načíst. Vyberte JPG, PNG nebo WebP do 20 MB, nebo pokračujte bez fotografie.','error');}finally{photoBusy=false;sync();}});
form.addEventListener('submit',async e=>{e.preventDefault();if(busy||photoBusy||!ready||!form.reportValidity())return;
const phone=form.elements.phone.value.trim(), digits=phone.replace(/\D/g,'');if(!/^[+()\d\s-]{7,35}$/.test(phone)||digits.length<8||digits.length>15){message('Zadejte platné telefonní číslo.','error');form.elements.phone.focus();return;}
const fd=new FormData(form);fd.delete('photo');if(photo)fd.set('photo',photo,'model.jpg');fd.set('request_id',id);
busy=true;sync();message('Odesíláme poptávku…');
try{const r=await fetch(API+'/request',{method:'POST',body:fd,signal:AbortSignal.timeout(65000)});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'delivery');form.reset();clear();if(type)sel.value=type;id=crypto.randomUUID();message('Děkujeme! Poptávku jsme přijali. Zavoláme vám zpět, abychom upřesnili závadu a sdělili orientační cenu opravy.','success');window.serviceEvent?.('callback_request_success');}
catch(err){const m=err.message==='rate'?'Příliš mnoho pokusů. Zkuste to později nebo zavolejte.':err.message==='pending'?'Předchozí pokus ještě zpracováváme. Zkuste to později.':'Doručení poptávky se nepodařilo potvrdit. Zkuste znovu nebo volejte +420 770 644 383.';message(m,'error');}
finally{busy=false;sync();}});
// The separate callback API must not compete with the initial page render.
let started=false;const start=()=>{if(started)return;started=true;availability();};
if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){obs.disconnect();start();}},{rootMargin:'250px'});obs.observe(form);}else{window.addEventListener('load',start,{once:true});if(document.readyState==='complete')start();}
form.addEventListener('focusin',start,{once:true});
})();

/* Category-specific, local WebP photos for all older regional/brand pages. */
(function(){
 const path=location.pathname;
 const categories=[['indukcnich-desek','indukce','Servis indukční varné desky'],['susicek','susicky','Servis sušičky prádla'],['mycek','mycky','Servis myčky nádobí'],['trub','trouby','Servis elektrické trouby']];
 const category=categories.find(c=>path.includes(c[0]))||['pracek','pracky','Servis pračky'];
 for(const visual of document.querySelectorAll('.visual')){
   const svg=visual.querySelector('svg');if(!svg||visual.querySelector('.hero-photo'))continue;
   const img=document.createElement('img');img.className='hero-photo';img.width=1000;img.height=740;img.alt=category[2]+' – ilustrační snímek vytvořený pomocí AI';img.decoding='async';img.loading='eager';img.fetchPriority='high';img.src='images/'+category[1]+'.webp';svg.replaceWith(img);
   const note=visual.querySelector('.visual-note');if(note){note.replaceChildren();const a=document.createElement('span'),b=document.createElement('span');a.textContent='Ilustrační snímek (AI)';b.textContent='Diagnostika · Opravy';note.append(a,b);}
 }
})();
