import {cms} from './cms.mjs';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
const PORT=Number(process.env.PORT||10000), MAX=6*1024*1024;
const origins=new Set((process.env.ALLOWED_ORIGINS||'https://oprava-pracek-praha-preview.onrender.com').split(',').map(s=>s.trim()).filter(Boolean));
const hits=new Map(), done=new Map();let active=0;
const configured=()=>Boolean(process.env.TELEGRAM_BOT_TOKEN&&/^-100\d+$|^-\d+$/.test(process.env.TELEGRAM_CHAT_ID||''));
const types=new Set(['Pračka','Myčka nádobí','Sušička prádla','Elektrická trouba','Indukční deska','Jiný spotřebič']);
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const telegram=async(method,body)=>{const token=(process.env.TELEGRAM_BOT_TOKEN||'').trim();if(!/^\d+:[A-Za-z0-9_-]+$/.test(token))throw Error('token_format');let r;try{r=await fetch('https://api.telegram.org/bot'+token+'/'+method,{method:'POST',body,signal:AbortSignal.timeout(20000)});}catch{throw Error('network');}if(!r.ok)throw Error('http_'+r.status);const j=await r.json();if(!j.ok)throw Error('telegram_rejected');return j.result;};

const numberConfigured=()=>Boolean(process.env.ORDER_DB_URL&&process.env.ORDER_DB_KEY&&process.env.ORDER_NUMBER_SECRET);
const orderNumber=async(id,action,lease)=>{
 const r=await fetch(process.env.ORDER_DB_URL+'/rest/v1/rpc/elektro_order_number',{method:'POST',headers:{apikey:process.env.ORDER_DB_KEY,'Content-Type':'application/json','x-elektro-number-key':process.env.ORDER_NUMBER_SECRET},body:JSON.stringify({p_id:id,p_action:action,p_lease:lease}),signal:AbortSignal.timeout(6000)});
 if(!r.ok)throw Error('number_db_'+r.status);
 const j=await r.json();if(!Number.isSafeInteger(j.number)||j.number<1)throw Error('number_invalid');return j;
};
const formatOrderNumber=n=>String(n).padStart(6,'0');

/* Telegram phone entities use UTF-16 offsets, as do JS string indices.
 * Show Czech numbers as nine consecutive digits without +420; preserve other international prefixes. */
const dialNumber=phone=>{const digits=phone.replace(/\D/g,'');if(digits.length===14&&digits.startsWith('00420'))return digits.slice(5);if(digits.length===12&&digits.startsWith('420'))return digits.slice(3);if(phone.trim().startsWith('+'))return '+'+digits;if(digits.startsWith('00'))return '+'+digits.slice(2);return digits;};
const phoneEntity=(message,phone)=>{const offset=message.lastIndexOf('\nTelefon: ')+'\nTelefon: '.length;if(offset<10||message.slice(offset,offset+phone.length)!==phone)throw Error('phone_offset');return [{type:'phone_number',offset,length:phone.length}];};
const sendOrderTelegram=async(body,method,field)=>{
 try{const sent=await telegram(method,body);const entities=sent[field]||[];console.info('ORDER_PHONE '+(entities.some(e=>e.type==='phone_number')?'entity_confirmed':'client_detection_only'));return sent;}
 catch(e){if(e?.message!=='http_400'||!body.has(field))throw e;body.delete(field);const sent=await telegram(method,body);console.info('ORDER_PHONE fallback_plain');return sent;}
};


const imageType=b=>b.length>=12&&b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':b.length>=12&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'image/webp':null;
setInterval(()=>{const n=Date.now();for(const [k,v] of hits)if(n-v.start>600000)hits.delete(k);for(const [k,v] of done)if(n-v.at>3600000)done.delete(k);},60000).unref();
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin||'';
 if(origins.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
 const path=(req.url||'').split('?')[0];
 if(await cms(req,res,path))return;
 if(req.method==='GET'&&path==='/health')return send(res,200,{ok:true,configured:configured()&&numberConfigured()});
 if(!origins.has(origin))return send(res,403,{ok:false,error:'origin'});
 if(req.method==='OPTIONS')return send(res,204,{});
 if(req.method!=='POST'||path!=='/request')return send(res,404,{ok:false});
 if(!configured()||!numberConfigured())return send(res,503,{ok:false,error:'unavailable'});
 const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',').at(-1).trim();
 const now=Date.now(), hit=hits.get(ip)||{start:now,count:0};if(now-hit.start>600000){hit.start=now;hit.count=0;}if(hit.count>=5||active>=8)return send(res,429,{ok:false,error:'rate'});hit.count++;hits.set(ip,hit);active++;
 try{
 if(!String(req.headers['content-type']||'').startsWith('multipart/form-data;'))return send(res,415,{ok:false,error:'format'});
 const len=Number(req.headers['content-length']||0);if(len>MAX)return send(res,413,{ok:false,error:'size'});
 let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>MAX){send(res,413,{ok:false,error:'size'});return;}chunks.push(chunk);}
 const data=await new Request('http://localhost/request',{method:'POST',headers:{'content-type':req.headers['content-type']},body:Buffer.concat(chunks)}).formData();
 if(clean(data.get('website'),100))return send(res,400,{ok:false,error:'invalid'});
 const phone=clean(data.get('phone'),35), type=clean(data.get('type'),45), area=clean(data.get('area'),180), problem=clean(data.get('problem'),320),brand=clean(data.get('brand'),70),model=clean(data.get('model'),100),id=clean(data.get('request_id'),60),mode=clean(data.get('mode'),12)||'repair',visit=clean(data.get('visit'),35);
 if(!/^[+()\d\s-]{7,35}$/.test(phone)||phone.replace(/\D/g,'').length<8||phone.replace(/\D/g,'').length>15||!['repair','callback'].includes(mode)||(mode==='repair'&&(!types.has(type)||!area||!problem))||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))return send(res,400,{ok:false,error:'invalid'});
 if(done.has(id)){const old=done.get(id);return send(res,old.pending?409:200,old.pending?{ok:false,error:'pending'}:{ok:true,id,number:old.number});}
 const photo=mode==='repair'?data.get('photo'):null;let buf=null,mime=null;if(photo&&typeof photo!=='string'&&photo.size){if(photo.size>5*1024*1024)return send(res,413,{ok:false,error:'size'});buf=Buffer.from(await photo.arrayBuffer());mime=imageType(buf);if(!mime)return send(res,415,{ok:false,error:'photo'});}

 const lease=randomUUID();let receipt;
 try{receipt=await orderNumber(id,'claim',lease);}catch(e){console.info('ORDER_NUMBER reservation_failed '+(e.message?.match(/^number_db_\d{3}$/)?.[0]||'unavailable'));return send(res,503,{ok:false,error:'unavailable'});}
 const number=formatOrderNumber(receipt.number);
 if(receipt.status==='delivered'){done.set(id,{pending:false,at:Date.now(),number});return send(res,200,{ok:true,id,number});}
 if(receipt.status==='pending')return send(res,409,{ok:false,error:'pending'});
 if(receipt.status!=='claimed')return send(res,503,{ok:false,error:'unavailable'});
 const dial=dialNumber(phone);
 const msg=mode==='callback'?['📞 Poptávka '+number+' – Zpětné zavolání','Úkol: zavolat zpět.','','Telefon: '+dial].join('\n'):['🔧 Poptávka '+number+' – Elektro Specialist','Spotřebič: '+type,'Značka: '+(brand||'neuvedena'),'Model: '+(model||'neuveden'),'Závada: '+problem,'Preferovaný termín: '+(visit||'co nejdříve'),'Úkol: zavolat zpět a sdělit orientační cenu.','','Město / adresa: '+area,'Telefon: '+dial].join('\n');
 done.set(id,{pending:true,at:now,number});
 try{const body=new FormData();body.set('chat_id',process.env.TELEGRAM_CHAT_ID);if(buf){body.set('document',new Blob([buf],{type:mime}),'model.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime]));body.set('caption',msg);body.set('caption_entities',JSON.stringify(phoneEntity(msg,dial)));await sendOrderTelegram(body,'sendDocument','caption_entities');}else{body.set('text',msg);body.set('entities',JSON.stringify(phoneEntity(msg,dial)));await sendOrderTelegram(body,'sendMessage','entities');}}catch(e){done.delete(id);if(/^http_4\d\d$/.test(e?.message||''))try{await orderNumber(id,'release',lease);}catch{}return send(res,502,{ok:false,error:'delivery'});}
 done.set(id,{pending:false,at:Date.now(),number});
 let marked=false;for(let attempt=0;attempt<2&&!marked;attempt++)try{await orderNumber(id,'complete',lease);marked=true;}catch{}
 console.info('ORDER_NUMBER delivered '+number+(marked?'':' receipt_update_failed'));
 return send(res,200,{ok:true,id,number});
 }catch{return send(res,400,{ok:false,error:'invalid'});}finally{active--;}
});server.requestTimeout=35000;server.headersTimeout=15000;server.listen(PORT,'0.0.0.0');

/* Private setup diagnostics: only server logs, never the public API.
 * No update offset is advanced and no customer messages or token are logged. */
(async function setupTelegram(){
 if(!process.env.TELEGRAM_BOT_TOKEN){console.info('TELEGRAM_SETUP token_missing');return;}
 try{
 const bot=await telegram('getMe',new URLSearchParams());
 console.info('TELEGRAM_SETUP token_valid');
 if(configured()){
 if(process.env.TELEGRAM_SETUP_TEST==='1'){
 const chat=await telegram('getChat',new URLSearchParams({chat_id:process.env.TELEGRAM_CHAT_ID}));
 if(!['group','supergroup'].includes(chat.type)||chat.title?.trim().toLowerCase()!=='objednavky new'){console.info('TELEGRAM_SETUP test_refused_group_mismatch');return;}
 const sent=await telegram('sendMessage',new URLSearchParams({chat_id:process.env.TELEGRAM_CHAT_ID,text:'✅ TEST – Elektro Specialist: nová skupina Objednavky new je připojena. Toto není objednávka zákazníka.'}));
 console.info('TELEGRAM_SETUP test_delivered message_id='+sent.message_id);
 }else console.info('TELEGRAM_SETUP chat_configured');
 return;
 }
 for(let attempt=0;attempt<6;attempt++){
 const updates=await telegram('getUpdates',new URLSearchParams({timeout:'0',limit:'100',allowed_updates:JSON.stringify(['message','my_chat_member'])}));
 const ids=new Set();
 for(const u of updates){const chat=u.message?.chat||u.my_chat_member?.chat;if(chat&&['group','supergroup'].includes(chat.type)&&chat.title?.trim().toLowerCase()==='objednavky new'&&Number.isSafeInteger(chat.id)&&chat.id<0)ids.add(String(chat.id));}
 if(ids.size===1){console.info('TELEGRAM_SETUP group_id='+[...ids][0]);return;}
 if(ids.size>1){console.info('TELEGRAM_SETUP multiple_matching_groups');return;}
 if(attempt===0)console.info('TELEGRAM_SETUP waiting_for_group_update');
 if(attempt<5)await new Promise(r=>setTimeout(r,15000));
 }
 console.info('TELEGRAM_SETUP group_not_found');
 }catch(e){const code=/^(token_format|network|http_\d{3}|telegram_rejected)$/.test(e?.message||'')?e.message:'unknown';console.info('TELEGRAM_SETUP verification_failed '+code);}
})();

/* Check authorized numbering connectivity without reserving any sequence number. */
(async()=>{if(!numberConfigured()){console.info('ORDER_NUMBER setup_missing');return;}try{
 const r=await fetch(process.env.ORDER_DB_URL+'/rest/v1/rpc/elektro_order_number',{method:'POST',headers:{apikey:process.env.ORDER_DB_KEY,'Content-Type':'application/json','x-elektro-number-key':process.env.ORDER_NUMBER_SECRET},body:JSON.stringify({p_id:randomUUID(),p_action:'probe',p_lease:randomUUID()}),signal:AbortSignal.timeout(6000)});
 const j=await r.json();console.info('ORDER_NUMBER '+(j.message==='invalid action'?'database_connected':'probe_failed_http_'+r.status));
 }catch{console.info('ORDER_NUMBER probe_network_failed');}})();

/* Release diagnostics, no customer data. */
import('./scripts/audit-site.mjs').then(m=>m.auditSite()).then(r=>console.info('SITE_RELEASE_AUDIT '+JSON.stringify(r))).catch(()=>console.info('SITE_RELEASE_AUDIT failed'));
