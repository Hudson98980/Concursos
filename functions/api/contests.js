function calc(x){ const now=new Date(); if(x.inicio&&x.fim){const a=new Date(x.inicio+'T00:00:00'),b=new Date(x.fim+'T23:59:59'); if(now>=a&&now<=b)return'aberto'; if(now>b)return'fechado';} return x.status||'iminente'; }
async function seedFallback(env,request){ try { const r=await env.ASSETS.fetch(new Request(new URL('/data/seed.json',request.url))); if(r.ok)return await r.json(); }catch{} return []; }
export async function onRequestGet({request,env}){
  let rows=[];
  if(env.DB){ try { rows=await env.DB.prepare('SELECT * FROM contests ORDER BY updated_at DESC').all(); rows=rows.results||[]; }catch{} }
  if(!rows.length) rows=await seedFallback(env,request);
  rows=rows.map(x=>({...x,status:calc(x),oficial:Boolean(x.oficial)}));
  return new Response(JSON.stringify({version:4,updatedAt:new Date().toISOString(),contests:rows}),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=120'}});
}
