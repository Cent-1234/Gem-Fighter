/* ==========================================================================
   Leaderboard page behavior
   - Modal toggling (single-open, outside click, ESC)
   - $HODL number formatting (50k, 1M, 1B)
   - Season countdown + Season loading from API
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
      openModals.forEach((m) => {
        if (m !== modal) m.classList.remove('active');
      });
      document
        .querySelectorAll('.lb-info-btn[aria-expanded="true"]')
        .forEach((b) => b.setAttribute('aria-expanded', 'false'));

      // Toggle this one
      modal.classList.toggle('active');
      infoBtn.setAttribute('aria-expanded', modal.classList.contains('active'));
      return;
    }

    // Outside click closes any open modal
    if (!e.target.closest('.lb-modal')) {
      openModals.forEach((m) => m.classList.remove('active'));
      document
        .querySelectorAll('.lb-info-btn[aria-expanded="true"]')
        .forEach((b) => b.setAttribute('aria-expanded', 'false'));
    }
  });

  // ESC closes modal(s)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document
        .querySelectorAll('.lb-modal.active')
        .forEach((m) => m.classList.remove('active'));
      document
        .querySelectorAll('.lb-info-btn[aria-expanded="true"]')
        .forEach((b) => b.setAttribute('aria-expanded', 'false'));
    }
  });

  // ---------- $HODL number formatting ----------
  const formatSuffix = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000)
      return (n / 1_000_000_000).toFixed(n % 1_000_000_000 ? 1 : 0) + 'B';
    if (abs >= 1_000_000)
      return (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0) + 'M';
    if (abs >= 1_000) return (n / 1_000).toFixed(n % 1_000 ? 1 : 0) + 'k';
    return String(n);
  };

  // ---------- Season countdown ----------
  const seasonInfo = document.getElementById('lbSeasonInfo');
  const countdownEl = document.querySelectorAll('.lbCountdown');

  const attachCountdown = () => {
    const endISO = seasonInfo?.getAttribute('data-end');
    if (!endISO) return;

    const end = new Date(endISO);
    const tick = () => {
      const ms = end - new Date();
      if (ms <= 0) {
        countdownEl.forEach((ct) => (ct.textContent = 'Ended'));
        return;
      }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      countdownEl.forEach((ct) => (ct.textContent = `${d}d ${h}h ${m}m`));
    };
    tick();
    if (seasonInfo._interval) clearInterval(seasonInfo._interval);
    seasonInfo._interval = setInterval(tick, 60_000);
  };

  // ---------- Season selector ----------
  const select = document.getElementById('lbSeasonSelect');
  const prev = document.getElementById('lbPrevSeason');
  const next = document.getElementById('lbNextSeason');
  const seasonNo = document.getElementById('lbSeasonNo');

  const changeSeason = (dir = 0) => {
    if (!select) return;
    let idx = select.selectedIndex + dir;
    idx = Math.max(0, Math.min(select.options.length - 1, idx));
    select.selectedIndex = idx;
    seasonNo.textContent =
      select.options[idx].textContent.replace(/\D+/g, '') || select.value;

    // API-Call for new Season
    loadLeaderboard(select.value);
  };

  prev?.addEventListener('click', () => changeSeason(-1));
  next?.addEventListener('click', () => changeSeason(1));
  select?.addEventListener('change', () => changeSeason(0));

  // ---------- API-Integration ----------
  const API_URL = 'https://rest.hodlbot.org/api/game/highscore';
  const API_SEASON_URL = 'https://rest.hodlbot.org/api/game/season';
  const GAME_NAME = 'gem fighter';

  let seasonData = new Map();

  async function loadLeaderboard(seasonId = null) {
    try {
      const difficultySelect = document.getElementById('lbDifficultySelect');
      const difficultyValue = difficultySelect
        ? parseInt(difficultySelect.value, 10)
        : 2;

      const headers = {
        game: GAME_NAME,
        difficulty: difficultyValue,
        season: seasonId,
      };
      let url = API_URL;

      const res = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('API meldet Fehler');

      // Set Season-Info
      if (data.season) {
        seasonInfo.setAttribute('data-end', data.season.end);
        seasonNo.textContent =
          data.season.name
            .replace(
              /Gem Fighter\s*|\(free\)|\(easy\)|\(difficult\)|\(masterclass\)/gi,
              ''
            )
            .trim() || '';
        attachCountdown();
      }

      // Parse rewards from season.reward
      let rewardMap = {};
      if (data.season && data.season.reward && data.season.reward !== 'None') {
        try {
          const rewardsArr = JSON.parse(data.season.reward);
          rewardsArr.forEach((r) => {
            if (Array.isArray(r.rewardDistribution)) {
              r.rewardDistribution.forEach((amt, i) => {
                const rank = i + 1;
                if (!rewardMap[rank]) rewardMap[rank] = [];
                rewardMap[rank].push({ type: r.rewardType, amount: amt });
              });
            }
          });
        } catch (e) {
          console.warn("Couldn't parse JSON rewards:", e);
        }
      }

      // Fill table
      const tbody = document.querySelector('.lb-table tbody');
      tbody.innerHTML = '';

      data.highscores.forEach((hs) => {
        const tr = document.createElement('tr');

        // Rewards-HTML
        const rewardsHtml = (rewardMap[hs.rank] || [])
          .filter((r) => r.amount > 0)
          .map((r) => {
            if (r.type === 'HODL') {
              return `<span class="lb-reward" title="$HODL"><span>${formatSuffix(
                r.amount
              )}</span><img src="Images/hodl-logo.svg" alt="$HODL" class="lb-token" /></span>`;
            }
            if (r.type === 'GEM') {
              return `<span class="lb-reward" title="Gem Fighter NFT"><span>${r.amount}</span><i class="fas fa-gem"></i></span>`;
            }
            if (r.type === 'HAND') {
              return `<span class="lb-reward" title="HODL Hands NFT"><span>${r.amount}</span><i class="fas fa-hand"></i></span>`;
            }
            return `<span class="lb-reward"><span>${r.amount}</span> ${r.type}</span>`;
          })
          .join('');

        tr.innerHTML = `
          <td>#${hs.rank}</td>
          <td>${hs.user}</td>
          <td>${hs.highscore}</td>
          <td class="lb-rewards-cell">
            <div class="lb-rewards">${rewardsHtml || '–'}</div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error loading highscores:', err);
    }
  }

  async function loadSeasonData() {
    try {
      const difficultySelect = document.getElementById('lbDifficultySelect');
      const difficultyValue = difficultySelect
        ? parseInt(difficultySelect.value, 10)
        : 2;

      const headers = { game: GAME_NAME, difficulty: difficultyValue };
      let url = API_SEASON_URL;

      const res = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        console.error(new Error(`HTTP ${res.status}`));
      } else {
        const data = await res.json();
        if (data.success && data.season) {
          console.log('data.season', data.season);
          seasonData = new Map();
          data.season.forEach((season) => {
            seasonData.set(season.name, season.id);
          });

          for (var i = select.options.length; i--; ) {
            select.removeChild(select.options[i]);
          }
          for (const [key, value] of seasonData) {
            let newOption = document.createElement('option');
            var shortKey = key
              .replace(
                /Gem Fighter\s*|\(free\)|\(easy\)|\(difficult\)|\(masterclass\)/gi,
                ''
              )
              .trim();
            newOption.setAttribute('value', value);
            newOption.text = shortKey;
            select.appendChild(newOption);
          }
          select.selectedIndex = 0;
        }
      }
    } catch (error) {
      console.error('Error on loading seasons:', error);
    }
  }

  loadSeasonData();

  document
    .getElementById('lbDifficultySelect')
    ?.addEventListener('change', async () => {
      await loadSeasonData();
      loadLeaderboard(select.value);
    });

  loadLeaderboard();
});
