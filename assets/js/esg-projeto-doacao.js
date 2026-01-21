/* =========================================================
   ESG — PROJETO DOAÇÃO (Mission Control)
   - Calculadora CO2 + custo evitado + equivalente
   - Copy report (clipboard)
   - Navbar scroll + dropdowns + mobile menu (compatível com seu padrão)
   ========================================================= */

(function(){
  const y = document.getElementById('currentYear');
  if (y) y.textContent = new Date().getFullYear();

  // ========= CONFIG (edite aqui se quiser) =========
  // Referência do projeto: 10 t -> 7 a 15 tCO2 (faixa), então:
  const CO2_MIN_PER_TON = 0.7;
  const CO2_MAX_PER_TON = 1.5;

  // Custo de incineração indicado: R$ 900 / ton
  const INCINERATION_R_PER_TON = 900;

  // Emissões tóxicas evitadas (estimativa conservadora em kg/ton)
  const TOXIC_EMISSIONS_PER_TON = 15; // kg

  // Equivalência aproximada (bem conservadora): 1 árvore/ano ~ 20 kg CO2 (~0,02 t)
  // => árvores = tCO2 / 0,02 = tCO2 * 50
  const TREES_PER_TCO2 = 50;

  // ========= NAVBAR SCROLL =========
  window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ========= MOBILE MENU =========
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileMenu = document.getElementById('closeMobileMenu');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.add('active');
      mobileMenu.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    });
  }
  if (closeMobileMenu && mobileMenu) {
    closeMobileMenu.addEventListener('click', function() {
      mobileMenu.classList.remove('active');
      mobileMenu.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
      if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  }
  if (mobileMenu) {
    mobileMenu.addEventListener('click', function(e) {
      if (e.target === mobileMenu) {
        mobileMenu.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden','true');
        document.body.style.overflow = '';
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ========= DROPDOWNS =========
  function closeAllDropdowns(exceptEl = null) {
    document.querySelectorAll('.nav-item.has-dropdown').forEach(item => {
      if (exceptEl && item === exceptEl) return;
      item.classList.remove('open');
      const btn = item.querySelector('.nav-dd-toggle');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  document.querySelectorAll('.nav-item.has-dropdown .nav-dd-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const item = btn.closest('.nav-item.has-dropdown');
      const isOpen = item.classList.contains('open');
      closeAllDropdowns(item);
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  document.addEventListener('click', (e) => {
    const clickedInside = e.target.closest('.nav-item.has-dropdown');
    if (!clickedInside) closeAllDropdowns();
  });

  // ========= REVEAL =========
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting) ent.target.classList.add('on');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.pd-reveal').forEach(el => io.observe(el));

  // ========= TELEMETRY CALC =========
  const range = document.getElementById('tonsRange');
  const tonsLabel = document.getElementById('tonsLabel');
  const tonsRangeValue = document.getElementById('tonsRangeValue');
  const co2MinEl = document.getElementById('co2Min');
  const co2MaxEl = document.getElementById('co2Max');
  const costAvoidEl = document.getElementById('costAvoid');
  const treesEqEl = document.getElementById('treesEq');
  const toxicEmissionsEl = document.getElementById('toxicEmissions');

  const ctaMission = document.getElementById('ctaMission');
  const ctaCopy = document.getElementById('ctaCopy');

  function fmtBR(n, decimals=1){
    return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function fmtMoney(n){
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function calc(tons){
    const t = clamp(Number(tons || 10), 1, 30);
    const co2Min = t * CO2_MIN_PER_TON;
    const co2Max = t * CO2_MAX_PER_TON;
    const avoided = t * INCINERATION_R_PER_TON;
    const toxicAvoided = t * TOXIC_EMISSIONS_PER_TON;
    // use média para equivalência
    const co2Avg = (co2Min + co2Max) / 2;
    const treesEq = Math.round(co2Avg * TREES_PER_TCO2);
    return { t, co2Min, co2Max, avoided, treesEq, toxicAvoided };
  }

  function render(){
    const { t, co2Min, co2Max, avoided, treesEq, toxicAvoided } = calc(range ? range.value : 10);

    if (tonsLabel) tonsLabel.textContent = `${t} t`;
    if (tonsRangeValue) tonsRangeValue.textContent = String(t);
    if (co2MinEl) co2MinEl.textContent = `${fmtBR(co2Min, 1)} tCO₂`;
    if (co2MaxEl) co2MaxEl.textContent = `${fmtBR(co2Max, 1)} tCO₂`;
    if (costAvoidEl) costAvoidEl.textContent = fmtMoney(avoided);
    if (treesEqEl) treesEqEl.textContent = `${treesEq.toLocaleString('pt-BR')} árvores`;
    if (toxicEmissionsEl) toxicEmissionsEl.textContent = `${fmtBR(toxicAvoided, 0)} kg`;

    return { t, co2Min, co2Max, avoided, treesEq, toxicAvoided };
  }

  if (range) range.addEventListener('input', render);
  const snapshot = render();

  // ========= CTA: scroll to telemetry =========
  if (ctaMission) {
    ctaMission.addEventListener('click', () => {
      const telemetry = document.querySelector('.pd-telemetry');
      if (telemetry) telemetry.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // pulse visual (classe temporária)
      telemetry?.classList.add('pd-pulse');
      setTimeout(()=>telemetry?.classList.remove('pd-pulse'), 650);
    });
  }

  // ========= Copy report =========
  function buildReport(){
    const { t, co2Min, co2Max, avoided, treesEq, toxicAvoided } = render();
    const lines = [
      "MAXPROD • ESG & Inovação — Projeto Doação (Telemetria)",
      "-----------------------------------------------------",
      `Lote (toneladas): ${t} t`,
      `CO₂ evitado (estimativa): ${fmtBR(co2Min,1)} → ${fmtBR(co2Max,1)} tCO₂`,
      `Custo evitado (incineração): ${fmtMoney(avoided)} (base: R$ ${INCINERATION_R_PER_TON}/ton)`,
      `Emissões tóxicas evitadas: ${fmtBR(toxicAvoided,0)} kg (dioxinas, furanos, metais pesados)`,
      `Equivalente aproximado: ${treesEq.toLocaleString('pt-BR')} árvores/ano`,
      "",
      "Projetos Impactados:",
      "- Projeto Roda (Recife - PE): +15 famílias impactadas, geração de renda sustentável",
      "- Árvore da Vida (Betim - MG): +25 jovens capacitados, oficinas de design sustentável",
      "",
      "Nota: valores estimados para simulação executiva; o método (governança+rastreabilidade) é o ativo replicável."
    ];
    return lines.join("\n");
  }

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(e){
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch(_) {}
      document.body.removeChild(ta);
      return ok;
    }
  }

  if (ctaCopy) {
    ctaCopy.addEventListener('click', async () => {
      const report = buildReport();
      const ok = await copyToClipboard(report);
      const original = ctaCopy.textContent;
      ctaCopy.textContent = ok ? "Relatório copiado ✔" : "Não foi possível copiar";
      setTimeout(()=>{ ctaCopy.textContent = original; }, 1400);
    });
  }

  // ========= small pulse style hook =========
  const style = document.createElement('style');
  style.textContent = `
    .pd-pulse{ 
      box-shadow: 0 0 0 4px rgba(0,212,170,.14), 0 0 44px rgba(0,212,170,.16) !important;
      animation: pd-pulse-anim 0.65s ease;
    }
    @keyframes pd-pulse-anim {
      0% { box-shadow: 0 0 0 0 rgba(0,212,170,.3); }
      70% { box-shadow: 0 0 0 12px rgba(0,212,170,0); }
      100% { box-shadow: 0 0 0 0 rgba(0,212,170,0); }
    }
  `;
  document.head.appendChild(style);
})();
