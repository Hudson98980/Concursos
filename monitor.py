#!/usr/bin/env python3
from __future__ import annotations
import json,re,hashlib,urllib.request
from datetime import datetime,date,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DB=ROOT/'data/database.json'; SEED=ROOT/'data/seed.js'; SOURCES=ROOT/'automation/sources.json'; OUT=ROOT/'data/runtime.js'
def now(): return datetime.now(timezone.utc).isoformat()
def norm(s): return re.sub(r'[^a-z0-9]+',' ',(s or '').lower()).strip()
def ident(n,o,u=''): return hashlib.sha1(f'{norm(n)}|{norm(o)}|{u}'.encode()).hexdigest()[:14]
def seed():
 t=SEED.read_text(encoding='utf-8'); m=re.search(r'\[\s*\{.*\}\s*\]',t,re.S)
 if not m:return []
 try:return json.loads(m.group(0))
 except:return []
def recalc(c):
 a,b=c.get('registrationStart'),c.get('registrationEnd'); today=date.today().isoformat()
 if a and b: c['status']='aberto' if a<=today<=b else ('fechado' if today>b else 'iminente')
 return c
def main():
 db=json.loads(DB.read_text(encoding='utf-8')) if DB.exists() else {'version':4,'contests':[],'history':[],'discovered':[],'sources':[]}; old={c.get('id'):c for c in db.get('contests',[])}; src=json.loads(SOURCES.read_text(encoding='utf-8'))
 for c in seed(): c.setdefault('id',ident(c.get('name'),c.get('organization'),c.get('uf',''))); c.setdefault('confidence',.95 if c.get('officialNotice') else .75); old[c['id']]=c
 for c in old.values():
  before=c.get('status'); recalc(c); c['lastCheckedAt']=now()
  if before and before!=c.get('status'): db.setdefault('history',[]).append({'type':'status_change','id':c['id'],'from':before,'to':c['status'],'at':now()})
 db['contests']=sorted(old.values(),key=lambda c:(c.get('status')!='aberto',c.get('uf') or 'ZZ',c.get('name') or '')); db['updatedAt']=now(); db['sources']=src.get('official_portals',[])
 DB.write_text(json.dumps(db,ensure_ascii=False,indent=2),encoding='utf-8'); OUT.write_text('window.CONCURSOS_RUNTIME='+json.dumps(db,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8'); print('updated',len(old))
if __name__=='__main__':main()
