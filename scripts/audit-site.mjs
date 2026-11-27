import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,dirname,relative,sep} from 'node:path';
import {Script} from 'node:vm';
const root=new URL('../public/',import.meta.url);
const base=resolve(root.pathname);
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});const out=[];for(const e of entries){const p=resolve(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile())out.push(p);}return out;}
export async function auditSite(){
 const files=await walk(base), pages=files.filter(p=>p.endsWith('.html')), known=new Set(files.map(p=>relative(base,p).split(sep).join('/')));
 const issues=[], titles=new Map();let cityPages=0,forms=0,schemas=0,noindex=0,links=0;
 const record=(file,kind,detail)=>issues.push({file:relative(base,file),kind,detail:String(detail).slice(0,200)});
 for(const p of pages){
 const h=await readFile(p,'utf8'),name=relative(base,p);
 const title=h.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();if(!title)record(p,'missing_title','');else if(titles.has(title))record(p,'duplicate_title',titles.get(title));else titles.set(title,name);
 if(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(h))noindex++;else record(p,'missing_preview_noindex','');
 if(!/<meta[^>]+name=["']description["']/i.test(h))record(p,'missing_description','');
 if(!/<h1\b/i.test(h))record(p,'missing_h1','');
 if(name.startsWith('mesto-')){cityPages++;if(!h.includes('data-service-city=')||!h.includes('data-service-appliance=')||!h.includes('normal-arrival')||!h.includes('Do 24 hodin'))record(p,'city_service_data','');}
 if(/<form\b[^>]*id=["']request["']/i.test(h)){forms++;if(!h.includes('events.js'))record(p,'form_script_missing','');}
 for(const s of h.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){schemas++;try{JSON.parse(s[1]);}catch{record(p,'invalid_jsonld','');}}
 for(const m of h.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)){const v=m[1].split(/[?#]/)[0];if(!v||/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(v))continue;let target;try{target=relative(base,resolve(v.startsWith('/')?base:dirname(p),decodeURIComponent(v.replace(/^\//,'')))).split(sep).join('/');}catch{record(p,'invalid_url',v);continue;}links++;if(target==='')target='index.html';if(!known.has(target)&&!known.has(target+'/index.html'))record(p,'broken_local_link',v);}
 }
 for(const p of files.filter(p=>p.endsWith('.js'))){try{new Script(await readFile(p,'utf8'));}catch(e){record(p,'javascript_syntax',e.message);}}
 return {pages:pages.length,cityPages,forms,schemas,noindex,links,issueCount:issues.length,issues:issues.slice(0,40),byKind:issues.reduce((o,i)=>(o[i.kind]=(o[i.kind]||0)+1,o),{})};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))console.log(JSON.stringify(await auditSite(),null,2));
