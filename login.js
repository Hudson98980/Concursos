import {makeSession,cookieHeader} from './_auth.js';
export async function onRequestPost({request,env}){
  if(!env.ADMIN_PASSWORD) return new Response(JSON.stringify({error:'ADMIN_PASSWORD não configurada no Cloudflare.'}),{status:503,headers:{'content-type':'application/json'}});
  const body=await request.json().catch(()=>({}));
  if(body.password!==env.ADMIN_PASSWORD) return new Response(JSON.stringify({error:'Senha incorreta.'}),{status:401,headers:{'content-type':'application/json'}});
  const token=await makeSession(env.ADMIN_PASSWORD);
  return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json','Set-Cookie':cookieHeader(token)}});
}
