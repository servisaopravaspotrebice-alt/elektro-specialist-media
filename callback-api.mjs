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
const telegram=async(method,body)=>{const r=await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/'+method,{method:'POST',body,signal:AbortSignal.timeout(20000)});const j=await r.json();if(!r.ok||!j.ok)throw Error('delivery');return j.result;};
const imageType=b=>b.length>=12&&b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':b.length>=12&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'image/webp':null;
setInterval(()=>{const n=Date.now();for(const [k,v] of hits)if(n-v.start>600000)hits.delete(k);for(const [k,v] of done)if(n-v.at>3600000)done.delete(k);},60000).unref();
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin||'';
 if(origins.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
 const path=(req.url||'').split('?')[0];
 if(await cms(req,res,path))return;
 if(req.method==='GET'&&path==='/health')return send(res,200,{ok:true,configured:configured()});
 if(!origins.has(origin))return send(res,403,{ok:false,error:'origin'});
 if(req.method==='OPTIONS')return send(res,204,{});
 if(req.method!=='POST'||path!=='/request')return send(res,404,{ok:false});
 if(!configured())return send(res,503,{ok:false,error:'unavailable'});
 const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',').at(-1).trim();
 const now=Date.now(), hit=hits.get(ip)||{start:now,count:0};if(now-hit.start>600000){hit.start=now;hit.count=0;}if(hit.count>=5||active>=8)return send(res,429,{ok:false,error:'rate'});hit.count++;hits.set(ip,hit);active++;
 try{
 if(!String(req.headers['content-type']||'').startsWith('multipart/form-data;'))return send(res,415,{ok:false,error:'format'});
 const len=Number(req.headers['content-length']||0);if(len>MAX)return send(res,413,{ok:false,error:'size'});
 let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>MAX){send(res,413,{ok:false,error:'size'});return;}chunks.push(chunk);}
 const data=await new Request('http://localhost/request',{method:'POST',headers:{'content-type':req.headers['content-type']},body:Buffer.concat(chunks)}).formData();
 if(clean(data.get('website'),100))return send(res,400,{ok:false,error:'invalid'});
 const phone=clean(data.get('phone'),35), type=clean(data.get('type'),45), area=clean(data.get('area'),180), problem=clean(data.get('problem'),320),brand=clean(data.get('brand'),70),model=clean(data.get('model'),100),id=clean(data.get('request_id'),60),mode=clean(data.get('mode'),12)||'repair',visit=clean(data.get('visit'),35);
 if(!/^[+()\d\s-]{7,35}$/.test(phone)||phone.replace(/\D/g,'').length<8||phone.replace(/\D/g,'').length>15||!['repair','callback'].includes(mode)||(mode==='repair'&&(!types.has(type)||!area||!problem))||!/^[a-f0-9-]{36}$/.test(id))return send(res,400,{ok:false,error:'invalid'});
 if(done.has(id)){const old=done.get(id);return send(res,old.pending?409:200,old.pending?{ok:false,error:'pending'}:{ok:true,id});}
 const photo=mode==='repair'?data.get('photo'):null;let buf=null,mime=null;if(photo&&typeof photo!=='string'&&photo.size){if(photo.size>5*1024*1024)return send(res,413,{ok:false,error:'size'});buf=Buffer.from(await photo.arrayBuffer());mime=imageType(buf);if(!mime)return send(res,415,{ok:false,error:'photo'});}
 const msg=mode==='callback'?['📞 Žádost o zpětné zavolání','ID: '+id,'Telefon: '+phone,'Úkol: zavolat zpět.'].join('\n'):['🔧 Nová poptávka – Elektro Specialist','ID: '+id,'Spotřebič: '+type,'Telefon: '+phone,'Město / adresa: '+area,'Značka: '+(brand||'neuvedena'),'Model: '+(model||'neuveden'),'Závada: '+problem,'Preferovaný termín: '+(visit||'co nejdříve'),'Úkol: zavolat zpět a sdělit orientační cenu.'].join('\n');
 done.set(id,{pending:true,at:now});
 try{const body=new FormData();body.set('chat_id',process.env.TELEGRAM_CHAT_ID);if(buf){body.set('document',new Blob([buf],{type:mime}),'model.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime]));body.set('caption',msg);await telegram('sendDocument',body);}else{body.set('text',msg);await telegram('sendMessage',body);}done.set(id,{pending:false,at:Date.now()});return send(res,200,{ok:true,id});}catch{done.delete(id);return send(res,502,{ok:false,error:'delivery'});}
 }catch{return send(res,400,{ok:false,error:'invalid'});}finally{active--;}
});server.requestTimeout=35000;server.headersTimeout=15000;server.listen(PORT,'0.0.0.0');