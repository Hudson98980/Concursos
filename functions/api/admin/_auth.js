const enc = new TextEncoder();
const COOKIE = 'cb_admin';
async function key(secret){ return crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']); }
async function sign(value, secret){ const k=await key(secret); const sig=await crypto.subtle.sign('HMAC',k,enc.encode(value)); return btoa(String.fromCharCode(...new Uint8Array(sig))).replaceAll('+','-').replaceAll('/','_').replaceAll('=',''); }
export async function makeSession(secret){ const payload=`admin.${Date.now()+1000*60*60*12}`; return `${payload}.${await sign(payload,secret)}`; }
export async function validSession(request, env){
  const secret=env.ADMIN_PASSWORD; if(!secret) return false;
  const cookie=request.headers.get('Cookie')||''; const m=cookie.match(new RegExp(`${COOKIE}=([^;]+)`)); if(!m) return false;
  const parts=m[1].split('.'); if(parts.length<3) return false; const exp=Number(parts[1]); if(!exp||Date.now()>exp) return false;
  const payload=parts.slice(0,2).join('.'); const expected=await sign(payload,secret); return expected===parts[2];
}
export async function requireAdmin(request,env){ if(!(await validSession(request,env))) return new Response(JSON.stringify({error:'Não autorizado'}),{status:401,headers:{'content-type':'application/json'}}); return null; }
export function cookieHeader(value,maxAge=43200){ return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }
export const clearCookie=`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
