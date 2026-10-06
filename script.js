(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const data = Array.isArray(window.CONCURSOS) ? window.CONCURSOS : [];
  const config = window.APP_CONFIG || {};

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const statusOf = (c) => {
    if (c.monitorMode === 'date' && c.registrationStart) {
      const t = todayISO();
      if (t < c.registrationStart) return 'iminente';
      if (!c.registrationEnd || t <= c.registrationEnd) return 'aberto';
      return 'fechado';
    }
    return c.status || 'iminente';
  };
  const statusLabel = (s) => ({ iminente: 'IMINENTE', aberto: 'ABERTO', fechado: 'FECHADO' }[s] || s.toUpperCase());
  const fmtDate = (d) => d ? new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR') : '—';
  const esc = (v='') => String(v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function injectLastUpdate() {
    document.querySelectorAll('#lastUpdate').forEach(el => el.textContent = config.lastDataUpdate ? fmtDate(config.lastDataUpdate) : '—');
  }

  function card(c) {
    const s = statusOf(c);
    const location = c.scope === 'nacional' ? '🇧🇷 Nacional' : `${esc(c.city || '—')} / ${esc(c.uf || '—')}`;
    const period = c.registrationStart ? `<div class="date-line">Inscrições: ${fmtDate(c.registrationStart)} → ${fmtDate(c.registrationEnd)}</div>` : '';
    const checked = c.lastCheckedAt ? `Verificado ${new Date(c.lastCheckedAt).toLocaleDateString('pt-BR')}` : '';
    return `<article class="contest-card">
      <div class="contest-card-top"><span class="status-pill status-${s}"><i></i>${statusLabel(s)}</span><span class="confidence">${esc(c.confidence || '')}</span></div>
      <h3>${esc(c.name)}</h3><p class="location">${location}</p>
      <div class="meta-grid"><span><b>Vagas</b>${esc(c.vacancies || '—')}</span><span><b>Escolaridade</b>${esc(c.education || '—')}</span><span><b>Banca</b>${esc(c.bank || '—')}</span></div>
      ${period}<div class="monitor-line">${checked ? `◷ ${esc(checked)}` : '◷ Acompanhamento ativo'}</div>
      <a class="btn btn-outline full" href="concurso.html?id=${encodeURIComponent(c.id)}">VER CONCURSO <b>→</b></a>
    </article>`;
  }

  function populateCities() {
    const uf = $('#ufFilter'), city = $('#cityFilter');
    if (!uf || !city) return;
    const old = city.value;
    city.innerHTML = '<option value="">Todos os municípios</option>';
    [...new Set(data.filter(c => !uf.value || c.uf === uf.value).map(c => c.city).filter(Boolean))].sort((a,b) => a.localeCompare(b,'pt-BR')).forEach(c => {
      city.insertAdjacentHTML('beforeend', `<option value="${esc(c)}">${esc(c)}</option>`);
    });
    if ([...city.options].some(o => o.value === old)) city.value = old;
  }

  function setupFilters() {
    const list = $('#contestList');
    if (!list) return;
    const uf = $('#ufFilter');
    [...new Set(data.map(c => c.uf).filter(Boolean))].sort().forEach(v => uf.insertAdjacentHTML('beforeend', `<option value="${esc(v)}">${esc(v)}</option>`));
    populateCities();
    const params = new URLSearchParams(location.search);
    if (params.get('status')) $('#statusFilter').value = params.get('status');
    if (params.get('scope')) $('#scopeFilter').value = params.get('scope');
    if (params.get('uf')) { uf.value = params.get('uf'); populateCities(); }
    if (params.get('city')) $('#cityFilter').value = params.get('city');

    const render = () => {
      const q = ($('#searchInput').value || '').trim().toLowerCase();
      const filters = { uf: uf.value, city: $('#cityFilter').value, scope: $('#scopeFilter').value, status: $('#statusFilter').value };
      const results = data.filter(c => {
        const s = statusOf(c);
        const text = `${c.name} ${c.shortName} ${c.bank} ${c.education} ${c.city} ${c.uf} ${c.vacancies}`.toLowerCase();
        return (!q || text.includes(q)) && (!filters.uf || c.uf === filters.uf) && (!filters.city || c.city === filters.city) && (!filters.scope || c.scope === filters.scope) && (!filters.status || s === filters.status);
      });
      $('#resultCount').textContent = `${results.length} concurso(s) encontrado(s)`;
      list.innerHTML = results.length ? results.map(card).join('') : '<div class="empty-state"><b>Nenhum concurso encontrado.</b><span>Tente alterar ou limpar os filtros.</span></div>';
    };
    ['#searchInput','#ufFilter','#cityFilter','#scopeFilter','#statusFilter'].forEach(sel => $(sel).addEventListener('input', render));
    uf.addEventListener('change', () => { populateCities(); render(); });
    $('#clearFilters').addEventListener('click', () => { $('#searchInput').value=''; uf.value=''; populateCities(); $('#cityFilter').value=''; $('#scopeFilter').value=''; $('#statusFilter').value=''; render(); });
    render();
  }

  function setupHome() {
    if (!$('#stats')) return;
    const counts = { aberto:0, iminente:0, fechado:0 };
    data.forEach(c => counts[statusOf(c)]++);
    $('#stats').innerHTML = [['aberto','Abertos'],['iminente','Iminentes'],['fechado','Fechados']].map(([key,label]) => `<div class="stat-card"><span>${label}</span><strong>${counts[key]}</strong><small>no banco acompanhado</small></div>`).join('');
    $('#featured').innerHTML = data.filter(c => ['aberto','iminente'].includes(statusOf(c))).slice(0, 8).map(card).join('');
  }

  function setupDetail() {
    const details = $('#contestDetails');
    if (!details) return;
    const id = new URLSearchParams(location.search).get('id');
    const c = data.find(x => x.id === id);
    if (!c) { details.innerHTML = '<div class="empty-state">Concurso não encontrado.</div>'; return; }
    const s = statusOf(c);
    $('#contestHero').innerHTML = `<a class="back-link" href="concursos.html">‹ VOLTAR</a><div class="eyebrow">${c.scope === 'nacional' ? '🇧🇷 NACIONAL' : `${esc(c.uf)} • ${esc(c.city)}`}</div><h1>${esc(c.name)}</h1><p>${esc(c.notes || 'Acompanhe as informações e consulte sempre a fonte oficial.')}</p><span class="status-pill status-${s}"><i></i>${statusLabel(s)}</span>`;
    details.innerHTML = `<div class="detail-grid"><section class="card"><div class="section-kicker">SITUAÇÃO ATUAL</div><h2>${statusLabel(s)}</h2><p>${s==='aberto'?'As inscrições estão dentro do período cadastrado. Confirme o horário e os requisitos no edital.':s==='iminente'?'Há previsão ou movimentação, mas o portal não considera o concurso aberto sem confirmação oficial.':'O período de inscrição cadastrado já terminou.'}</p><a class="btn btn-gold full" target="_blank" rel="noopener noreferrer" href="${esc(c.sourceUrl)}">FONTE OFICIAL ↗</a></section><section class="card"><div class="section-kicker">INFORMAÇÕES</div><div class="info-list"><div><b>Vagas</b><span>${esc(c.vacancies||'—')}</span></div><div><b>Escolaridade</b><span>${esc(c.education||'—')}</span></div><div><b>Banca</b><span>${esc(c.bank||'—')}</span></div><div><b>Edital</b><span>${fmtDate(c.editalDate)}</span></div><div><b>Inscrições</b><span>${fmtDate(c.registrationStart)} → ${fmtDate(c.registrationEnd)}</span></div><div><b>Confiança</b><span>${esc(c.confidence||'—')}</span></div></div></section></div><section class="feature-card"><div class="section-kicker">MONITORAMENTO AUTOMÁTICO</div><h2>O status é acompanhado continuamente.</h2><p>Concursos com datas mudam automaticamente para ABERTO e FECHADO. Para concursos previstos, o robô consulta fontes oficiais e exige sinais de edital e inscrição antes de promover o status. Toda alteração fica registrada no log do monitor.</p></section>`;
  }

  const mb = $('#menuButton'), mm = $('#mobileMenu');
  mb?.addEventListener('click', () => { const open = mm.classList.toggle('open'); mb.textContent = open ? '✕' : '☰'; });
  injectLastUpdate(); setupHome(); setupFilters(); setupDetail();
})();
