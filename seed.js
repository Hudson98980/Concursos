import {requireAdmin} from './_auth.js';
export async function onRequestPost({request,env}){
 const denied=await requireAdmin(request,env); if(denied)return denied;
 if(!env.DB)return new Response(JSON.stringify({error:'D1 não configurado.'}),{status:503,headers:{'content-type':'application/json'}});
 const r=await env.ASSETS.fetch(new Request(new URL('/data/seed.json',request.url))); const items=await r.json(); const now=new Date().toISOString();
 const stmt=env.DB.prepare(`INSERT OR IGNORE INTO contests (id,nome,orgao,uf,municipio,abrangencia,status,vagas,escolaridade,banca,inicio,fim,prova,fonte,oficial,origem,confidence,updated,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,?)`);
 const batch=items.map(x=>stmt.bind(x.id,x.nome,x.orgao||'',x.uf,x.municipio||'',x.abrangencia,x.status||'iminente',String(x.vagas??''),x.escolaridade||'',x.banca||'',x.inicio||null,x.fim||null,x.prova||null,x.fonte||'',x.oficial?1:0,'seed',x.oficial?'oficial':'previsao',x.updated||now,x.updated||now,now));
 if(batch.length) await env.DB.batch(batch);
 await env.DB.prepare('INSERT INTO history (contest_id,action,details,created_at) VALUES (?,?,?,?)').bind(null,'seed',`Carga inicial: ${items.length} registros`,now).run();
 return new Response(JSON.stringify({ok:true,inserted:items.length}),{headers:{'content-type':'application/json'}});
}
