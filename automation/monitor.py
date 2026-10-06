import json, os, re, hashlib, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DB=ROOT/'data'/'database.json'; SEED=ROOT/'data'/'seed.json'; SOURCES=ROOT/'automation'/'sources.json'; RUNTIME=ROOT/'data'/'runtime.js'
NOW=datetime.now(timezone.utc).isoformat()

def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':'ConcursosBrasilMonitor/4.0 (+public-portal)'})
    with urllib.request.urlopen(req,timeout=20) as r:return r.read()

def load_db():
    if DB.exists():
        try:return json.loads(DB.read_text(encoding='utf8'))
        except:pass
    return {'version':4,'updatedAt':NOW,'contests':json.loads(SEED.read_text(encoding='utf8')),'history':[],'discovered':[]}

def normalize_status(x):
    if x.get('inicio') and x.get('fim'):
        today=datetime.now().date(); a=datetime.fromisoformat(x['inicio']).date(); b=datetime.fromisoformat(x['fim']).date()
        if a<=today<=b:return 'aberto'
        if today>b:return 'fechado'
    return x.get('status','iminente')

def discover_rss(source):
    q=urllib.parse.quote(source['query']); url=f"https://news.google.com/rss/search?q={q}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
    root=ET.fromstring(fetch(url)); out=[]
    for item in root.findall('.//item')[:12]:
        title=(item.findtext('title') or '').strip(); link=(item.findtext('link') or '').strip(); pub=(item.findtext('pubDate') or '').strip()
        if not title: continue
        low=title.lower()
        if not any(k in low for k in ['concurso','edital','processo seletivo','vagas','inscrições']):continue
        org=re.split(r'\s[-–|]\s',title)[0].strip()
        digest=hashlib.sha1((title+source['uf']).encode()).hexdigest()[:12]
        out.append({'id':'desc-'+digest,'nome':title,'orgao':org,'uf':source['uf'],'municipio':'','abrangencia':'Nacional' if source['uf']=='Nacional' else 'Estadual','status':'iminente','vagas':'A confirmar','escolaridade':'A confirmar','banca':'A definir','fonte':link,'oficial':False,'origem':'descoberta RSS','confidence':'noticia','updated':NOW,'published':pub})
    return out

def main():
    db=load_db(); contests={x['id']:x for x in db.get('contests',[])}; discovered=[]
    cfg=json.loads(SOURCES.read_text(encoding='utf8'))
    for s in cfg.get('discovery_rss',[]):
        try: discovered.extend(discover_rss(s))
        except Exception as e: print('RSS error',s.get('name'),e)
    added=0
    for x in discovered:
        if x['id'] not in contests: contests[x['id']]=x; added+=1
    for x in contests.values():x['status']=normalize_status(x);x['updated']=x.get('updated',NOW)
    db['contests']=list(contests.values());db['updatedAt']=NOW;db['discovered']=discovered[:200]
    db.setdefault('history',[]).insert(0,{'at':NOW,'action':'monitor','added':added,'total':len(db['contests'])})
    db['history']=db['history'][:500]
    DB.write_text(json.dumps(db,ensure_ascii=False,indent=2),encoding='utf8')
    payload='window.CONCURSOS_RUNTIME='+json.dumps(db,ensure_ascii=False,separators=(',',':'))+';\n'
    RUNTIME.write_text(payload,encoding='utf8')
    print(f'Concluído: {len(db["contests"])} concursos, {added} novos.')
    api=os.getenv('SITE_API_URL'); token=os.getenv('MONITOR_TOKEN')
    if api and token:
        req=urllib.request.Request(api.rstrip('/')+'/api/admin/monitor',data=json.dumps({'contests':list(contests.values())}).encode(),headers={'Content-Type':'application/json','X-Monitor-Token':token},method='POST')
        try:
            with urllib.request.urlopen(req,timeout=30) as r: print('D1:',r.read().decode())
        except Exception as e: print('D1 sync error:',e)
if __name__=='__main__':main()
