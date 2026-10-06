import {requireAdmin} from './_auth.js';
export async function onRequestGet({request,env}){
 const denied=await requireAdmin(request,env); if(denied)return denied;
 if(!env.DB)return new Response(JSON.stringify({error:'D1 não configurado.'}),{status:503,headers:{'content-type':'application/json'}});
 const [c,h,s]=await Promise.all([env.DB.prepare('SELECT * FROM contests ORDER BY updated_at DESC').all(),env.DB.prepare('SELECT * FROM history ORDER BY id DESC LIMIT 100').all(),env.DB.prepare('SELECT * FROM sources ORDER BY name').all()]);
 return new Response(JSON.stringify({contests:c.results||[],history:h.results||[],sources:s.results||[],now:new Date().toISOString()}),{headers:{'content-type':'application/json'}});
}
