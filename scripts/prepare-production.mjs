import {cp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {auditSite} from './audit-site.mjs';
// Safe preview by default. Production requires a verified HTTPS domain and explicit switch.
// Publish dist/ on a separate production service; never enable indexing of public/ preview.
const origin=process.env.PUBLIC_SITE_ORIGIN||'';
const production=process.env.ENABLE_PUBLIC_INDEXING==='1';
if(!production)console.log('Production staging: indexing remains disabled until custom domain is verified');
const url=new URL(origin);
if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password||url.hostname.endsWith('.onrender.com'))throw Error('Use a verified custom HTTPS domain');
const report=await auditSite();
if(report.byKind.broken_local_link||report.byKind.javascript_syntax||report.byKind.invalid_jsonld)throw Error('Fix release audit errors before public indexing');
const source=resolve('public'),dest=resolve('dist');await rm(dest,{recursive:true,force:true});await cp(source,dest,{recursive:true});
const approved=new Set(['index.html','servis-pracek-praha.html','servis-mycek-praha.html','servis-susicek-praha.html','servis-trub-praha.html','servis-indukcnich-desek-praha.html','servis-pracek-stredocesky-kraj.html','servis-mycek-stredocesky-kraj.html','servis-susicek-stredocesky-kraj.html','servis-trub-stredocesky-kraj.html','servis-indukcnich-desek-stredocesky-kraj.html','servis-mesta.html','havarijni-servis.html','kontakt-firma.html','podminky-servisu.html','reklamace.html','ochrana-osobnich-udaju.html','realizace.html']);
// Main domain opens the complete service catalogue; preserve the washing-machine landing page.
const oldIndex=await readFile(resolve(dest,'index.html'),'utf8');
const hub=await readFile(resolve(dest,'servis-spotrebicu.html'),'utf8');
await writeFile(resolve(dest,'servis-pracek-praha.html'),oldIndex);
await writeFile(resolve(dest,'index.html'),hub);
const locs=[];const xml=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
for(const name of await readdir(dest)){if(!name.endsWith('.html'))continue;const path=resolve(dest,name);let h=await readFile(path,'utf8');h=h.replace(/\bhref=(['"])index\.html(?=[#?'"])/gi,'href=$1servis-pracek-praha.html').replace(/\bhref=(['"])servis-spotrebicu\.html(?=[#?'"])/gi,'href=$1/');if(!production||(!approved.has(name)&&!/^realizace-[a-f0-9]{24}\.html$/.test(name))){await writeFile(path,h);continue;}const canonical=url.origin+'/'+(name==='index.html'?'':name);h=h.replace(/<meta[^>]+name=["']robots["'][^>]*>/i,'<meta name="robots" content="index,follow">').replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi,'').replace('</head>','<link rel="canonical" href="'+canonical+'"></head>');await writeFile(path,h);locs.push(canonical);}
if(production){await writeFile(resolve(dest,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+url.origin+'/sitemap.xml\n');
await writeFile(resolve(dest,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+locs.map(l=>'<url><loc>'+xml(l)+'</loc></url>').join('\n')+'\n</urlset>\n');
}else{await rm(resolve(dest,'sitemap.xml'),{force:true});}
console.log('Production build: '+locs.length+' indexable pages; city pages remain noindex pending content review.');
