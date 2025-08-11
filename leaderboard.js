/* ==========================================================================
   Leaderboard page behavior
   - (i) modal toggling (single-open, outside click, ESC)
   - $HODL number formatting (50k, 1M, 1B)
   - Season countdown + simple prev/next/select stub
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Modal behavior ----------
  document.addEventListener('click', (e) => {
    const infoBtn = e.target.closest('.lb-info-btn');
    const openModals = document.querySelectorAll('.lb-modal.active');

    if (infoBtn) {
      const cell = infoBtn.closest('.lb-rewards-cell');
      const modal = cell.querySelector('.lb-modal');

      // Close others
      openModals.forEach(m => { if (m !== modal) m.classList.remove('active'); });
      document.querySelectorAll('.lb-info-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));

      // Toggle this one
      modal.classList.toggle('active');
      infoBtn.setAttribute('aria-expanded', modal.classList.contains('active'));
      return;
    }

    // Outside click closes any open modal
    if (!e.target.closest('.lb-modal')) {
      openModals.forEach(m => m.classList.remove('active'));
      document.querySelectorAll('.lb-info-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }
  });

  // ESC closes modal(s)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.lb-modal.active').forEach(m => m.classList.remove('active'));
      document.querySelectorAll('.lb-info-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }
  });

  // ---------- $HODL number formatting ----------
  const formatSuffix = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 ? 1 : 0) + 'B';
    if (abs >= 1_000_000)     return (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0) + 'M';
    if (abs >= 1_000)         return (n / 1_000).toFixed(n % 1_000 ? 1 : 0) + 'k';
    return String(n);
  };
  document.querySelectorAll('[data-hodl]').forEach(el => {
    const raw = Number(el.getAttribute('data-hodl'));
    if (!Number.isNaN(raw)) el.textContent = formatSuffix(raw);
  });

  // ---------- Season countdown ----------
  const seasonInfo = document.getElementById('lbSeasonInfo');
  const countdownEl = document.getElementById('lbCountdown');

  const attachCountdown = () => {
    const endISO = seasonInfo?.getAttribute('data-end');
    if (!endISO) return;

    const end = new Date(endISO);
    const tick = () => {
      const ms = end - new Date();
      if (ms <= 0) { countdownEl.textContent = 'Ended'; return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      countdownEl.textContent = `${d}d ${h}h ${m}m`;
    };
    tick();
    if (seasonInfo._interval) clearInterval(seasonInfo._interval);
    seasonInfo._interval = setInterval(tick, 60_000);
  };
  attachCountdown();

  // ---------- Season selector stub (wire to data later) ----------
  const select = document.getElementById('lbSeasonSelect');
  const prev = document.getElementById('lbPrevSeason');
  const next = document.getElementById('lbNextSeason');
  const seasonNo = document.getElementById('lbSeasonNo');

  const changeSeason = (dir = 0) => {
    if (!select) return;
    let idx = select.selectedIndex + dir;
    idx = Math.max(0, Math.min(select.options.length - 1, idx));
    select.selectedIndex = idx;
    seasonNo.textContent = select.options[idx].textContent.replace(/\D+/g, '') || select.value;

    // TODO: fetch/replace table rows for the chosen season, and update end date:
    // seasonInfo.setAttribute('data-end', '2026-03-01T00:00:00Z');
    attachCountdown();
  };

  prev?.addEventListener('click', () => changeSeason(-1));
  next?.addEventListener('click', () => changeSeason(1));
  select?.addEventListener('change', () => changeSeason(0));
});
