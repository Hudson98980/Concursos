#!/usr/bin/env python3
"""Monitor conservador de concursos.

- Registros com datas: calcula ABERTO/FECHADO pelo período de inscrição.
- Registros em previsão: só promove para ABERTO quando a fonte oficial contém
  simultaneamente termos de edital e inscrição; não inventa datas.
- Não usa portais de notícias como autoridade para abrir concurso.
- Gera monitor-log.json para auditoria.
"""
from __future__ import annotations
import json, re, ssl, urllib.request
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data.js'
SOURCES = ROOT / 'automation' / 'sources.json'
LOG = ROOT / 'automation' / 'monitor-log.json'

UA = 'ConcursosBrasilMonitor/2.0 (+GitHub Actions)'
DATE_RE = re.compile(r'(\d{1,2})[/.](\d{1,2})[/.](20\d{2})')


def load_data():
    raw = DATA.read_text(encoding='utf-8')
    m = re.search(r'window\.CONCURSOS\s*=\s*(\[.*?\]);\s*window\.APP_CONFIG', raw, re.S)
    if not m:
        raise RuntimeError('window.CONCURSOS não encontrado')
    contests = json.loads(m.group(1))
    cfg = json.loads(re.search(r'window\.APP_CONFIG\s*=\s*(\{.*?\});', raw, re.S).group(1))
    return contests, cfg


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language':'pt-BR,pt;q=0.9'})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=25, context=ctx) as r:
        body = r.read(2_000_000)
    text = body.decode('utf-8', errors='ignore')
    text = re.sub(r'<script[\s\S]*?</script>', ' ', text, flags=re.I)
    text = re.sub(r'<style[\s\S]*?</style>', ' ', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    return re.sub(r'\s+', ' ', text).lower()


def dates_from(text):
    out=[]
    for d,m,y in DATE_RE.findall(text):
        try: out.append(date(int(y),int(m),int(d)).isoformat())
        except ValueError: pass
    return sorted(set(out))


def rebuild(contests, cfg):
    # Horário oficial do portal: Brasilia. Evita trocar a data à noite por causa do UTC do GitHub.
    today = datetime.now(ZoneInfo('America/Sao_Paulo')).date().isoformat()
    byid={c['id']:c for c in contests}
    log={'checkedAt':datetime.now(timezone.utc).isoformat(),'today':today,'sources':[],'changes':[]}
    for src in json.loads(SOURCES.read_text(encoding='utf-8'))['sources']:
        item={'id':src['id'],'url':src['url'],'ok':False,'error':None,'detectedDates':[]}
        try:
            text=fetch(src['url'])
            item['ok']=True
            dates=dates_from(text)
            item['detectedDates']=dates[:30]
            for cid in src['contests']:
                c=byid.get(cid)
                if not c: continue
                old=c.get('status')
                if c.get('monitorMode')=='date' and c.get('registrationStart'):
                    s,e=c['registrationStart'],c.get('registrationEnd')
                    c['status']='aberto' if today>=s and (not e or today<=e) else ('fechado' if e and today>e else 'iminente')
                elif c.get('monitorMode')=='official':
                    req=src.get('openRequires',['edital','inscri'])
                    if all(term.lower() in text for term in req):
                        c['status']='aberto'
                        c['officialConfirmationAt']=datetime.now(timezone.utc).isoformat()
                    # previsão nunca vira fechado automaticamente sem uma data oficial cadastrada.
                if c.get('status')!=old:
                    log['changes'].append({'id':cid,'from':old,'to':c['status'],'source':src['url']})
                c['lastCheckedAt']=datetime.now(timezone.utc).isoformat()
        except Exception as exc:
            item['error']=str(exc)
        log['sources'].append(item)
    cfg['lastDataUpdate']=today
    DATA.write_text('/* Atualizado automaticamente pelo monitor. */\nwindow.CONCURSOS = '+json.dumps(contests,ensure_ascii=False,indent=2)+';\nwindow.APP_CONFIG = '+json.dumps(cfg,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    LOG.write_text(json.dumps(log,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':
    contests,cfg=load_data()
    rebuild(contests,cfg)
    print(f'Monitor concluído: {len(contests)} concursos, {date.today().isoformat()}')
