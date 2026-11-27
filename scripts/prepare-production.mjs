import {cp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {auditSite} from './audit-site.mjs';
// Safe preview by default. Production requires a verified HTTPS domain and explicit switch.
// Publish dist/ on a separate production service; never enable indexing of public/ preview.
const origin=process.env.PUBLIC_SITE_ORIGIN||'';
const production=process.env.ENABLE_PUBLIC_INDEXING==='1';
if(!production){console.log('Preview: indexing remains disabled');process.exit(0);}
const url=new URL(origin);
if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password||url.hostname.endsWith('.onrender.com'))throw Error('Use a verified custom HTTPS domain');
const report=await auditSite();
if(report.byKind.broken_local_link||report.byKind.javascript_syntax||report.byKind.invalid_jsonld)throw Error('Fix release audit errors before public indexing');
const source=resolve('public'),dest=resolve('dist');await rm(dest,{recursive:true,force:true});await cp(source,dest,{recursive:true});
const approved=new Set(['index.html','servis-spotrebicu.html','servis-mycek-praha.html','servis-susicek-praha.html','servis-trub-praha.html','servis-indukcnich-desek-praha.html','servis-pracek-stredocesky-kraj.html','servis-mycek-stredocesky-kraj.html','servis-susicek-stredocesky-kraj.html','servis-trub-stredocesky-kraj.html','servis-indukcnich-desek-stredocesky-kraj.html','servis-mesta.html','havarijni-servis.html','kontakt-firma.html','podminky-servisu.html','reklamace.html','ochrana-osobnich-udaju.html','realizace.html']);
const locs=[];const xml=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
for(const name of await readdir(dest)){if(!name.endsWith('.html'))continue;const path=resolve(dest,name);let h=await readFile(path,'utf8');if(!approved.has(name)&&!/^realizace-[a-f0-9]{24}\.html$/.test(name))continue;const canonical=url.origin+'/'+(name==='index.html'?'':name);h=h.replace(/<meta[^>]+name=["']robots["'][^>]*>/i,'<meta name="robots" content="index,follow">').replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi,'').replace('</head>','<link rel="canonical" href="'+canonical+'"></head>');await writeFile(path,h);locs.push(canonical);}
await writeFile(resolve(dest,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+url.origin+'/sitemap.xml\n');
await writeFile(resolve(dest,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+locs.map(l=>'<url><loc>'+xml(l)+'</loc></url>').join('\n')+'\n</urlset>\n');
console.log('Production build: '+locs.length+' indexable pages; city pages remain noindex pending content review.');
