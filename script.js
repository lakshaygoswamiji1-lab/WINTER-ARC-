/* ═══════════════════════════════════════════════════════════
   WINTER ARC CHALLENGE — Main Script
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─── CONFIGURATION & CONSTANTS ─── */
  const USER_NAME = "Lakshya Goswami";
  const START_DATE = "2026-10-01";
  const HABITS = [
    { id: "wake",       label: "Wake Early",    type: "tick" },
    { id: "gym",        label: "Gym",           type: "tick" },
    { id: "running",    label: "Running",       type: "tick" },
    { id: "reading",    label: "Reading",       type: "tick" },
    { id: "lectures",   label: "Lectures",      type: "tick" },
    { id: "water",      label: "Water goal",    type: "tick" },
    { id: "screenTime", label: "Screen (hrs)",  type: "number" },
    { id: "instagramTime", label: "Insta (hrs)", type: "number" },
  ];
  const TICK_HABITS = HABITS.filter(h => h.type === "tick");
  const MIN_HABITS_FOR_STREAK = 6;
  const SCREEN_TIME_LIMIT_HOURS = 3;
  const INSTAGRAM_LIMIT_HOURS = 1;
  const SLEEP_GOAL_HOURS = 8;
  const WEIGHT_UNIT = "kg";

  const CONFIG = {
    storageKey: "winterArcTracker",
    tabStorageKey: "winterArcActiveTab",
    subtitleText: "CHALLENGE",
    titleDelay: 200, subtitleStartDelay: 900, letterInterval: 80, glowPulseDuration: 800,
    snowParticleCount: 60, snowMaxRadius: 3, snowMinRadius: 0.5, snowMaxSpeed: 0.6, snowMinSpeed: 0.15,
    snowOpacity: 0.7, snowColor: "rgba(186, 230, 253,",
    quoteRotateInterval: 15000,
  };

  const QUOTES = [
    "The iron never lies. Show up and prove yourself.", "Cold mornings build warm discipline.",
    "One more rep. One step closer.", "Nobody cares. Work harder.",
    "Your only competition is yesterday's version of you.", "Discipline is choosing what you want most.",
    "The gym doesn't care about your excuses.", "Comfort is the enemy of greatness.",
    "You don't have to feel like it. Just begin.", "Winter forges what summer reveals.",
    "Pain is temporary. Quitting lasts forever.", "The weight won't lift itself. Neither will you.",
    "Show up on the days you don't want to.", "Strong mind. Strong body. No shortcuts.",
    "Every set counts. Every rep matters.", "Fall in love with the process, not the result.",
    "Rest when you're done, not when you're tired.", "The cold doesn't build character — it reveals it.",
    "Be addicted to the feeling after the workout.", "Champions train when no one is watching.",
    "Suffer the pain of discipline or regret.", "Your future self is counting on you today.",
    "Consistency beats intensity every single time."
  ];

  /* ─── DATE UTILITIES ─── */
  function getTodayStr() { return formatDate(new Date()); }
  function formatDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function parseDate(str) { const [y,m,d] = str.split("-").map(Number); return new Date(y, m-1, d); }
  function daysBetween(a, b) { return Math.round((parseDate(a) - parseDate(b)) / 86400000); }
  function addDays(dateStr, n) { const d = parseDate(dateStr); d.setDate(d.getDate() + n); return formatDate(d); }
  function formatDateDisplay(dateStr) { return parseDate(dateStr).toLocaleDateString("en-GB", { weekday:"short", day:"2-digit", month:"short" }); }
  function formatDateShort(dateStr) { return parseDate(dateStr).toLocaleDateString("en-GB", { day:"numeric", month:"short" }); }
  function escapeHtml(str) { const div = document.createElement("div"); div.textContent = str; return div.innerHTML; }
  function generateId() { return Math.random().toString(36).substr(2, 9); }

  /* ─── LOCAL STORAGE ─── */
  function getDefaultData() { return { days: {}, sleep: {}, weight: {} }; }
  function loadData() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          // Migrate old data if necessary
          if (!parsed.days) {
            const migrated = getDefaultData();
            for (const key of Object.keys(parsed)) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(key)) migrated.days[key] = parsed[key];
              else if (key === "sleep") migrated.sleep = parsed[key] || {};
              else if (key === "weight") migrated.weight = parsed[key] || {};
              else if (key === "exercises" && typeof parsed[key] === "object") migrated.exercises = parsed[key] || {};
            }
            return migrated;
          }
          if (!parsed.weight) parsed.weight = {};
          return parsed;
        }
      }
    } catch (e) { console.warn("Winter Arc: Could not read localStorage", e); }
    return getDefaultData();
  }
  function saveData(data) {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(data)); } catch (e) { console.warn("Winter Arc: Could not write localStorage", e); }
  }
  function getDayRecord(data, dateStr) {
    if (!data.days[dateStr]) {
      data.days[dateStr] = {};
      TICK_HABITS.forEach(h => { data.days[dateStr][h.id] = false; });
      data.days[dateStr].screenTime = null;
      data.days[dateStr].instagramTime = null;
    }
    return data.days[dateStr];
  }

  /* ─── STREAK CALCULATIONS ─── */
  function dayQualifies(rec, dateStr) {
    if (!rec) return false;
    const isOld = daysBetween(dateStr, getTodayStr()) < 0;
    const required = isOld ? 5 : MIN_HABITS_FOR_STREAK;
    return TICK_HABITS.filter(h => rec[h.id] === true).length >= required;
  }
  function calculateStreak(data) {
    const today = getTodayStr();
    let streak = 0;
    let cursor = dayQualifies(data.days[today], today) ? today : addDays(today, -1);
    while (daysBetween(cursor, START_DATE) >= 0) {
      if (dayQualifies(data.days[cursor], cursor)) { streak++; cursor = addDays(cursor, -1); }
      else break;
    }
    return streak;
  }
  function calculateBestStreak(data) {
    const today = getTodayStr();
    const total = daysBetween(today, START_DATE) + 1;
    if (total <= 0) return 0;
    let best = 0, cur = 0;
    for (let i = 0; i < total; i++) {
      const d = addDays(START_DATE, i);
      if (dayQualifies(data.days[d], d)) { cur++; if (cur > best) best = cur; }
      else cur = 0;
    }
    return best;
  }
  function calculateScore(rec, dateStr) {
    const isOld = daysBetween(dateStr, getTodayStr()) < 0;
    const required = isOld ? 5 : TICK_HABITS.length;
    if (!rec) return { done: 0, total: required };
    const doneCount = TICK_HABITS.filter(h => rec[h.id] === true).length;
    return { done: Math.min(doneCount, required), total: required };
  }

  /* ─── HEADER ─── */
  let _lastRenderedStreak = -1;
  function renderHeaderStreak() {
    const data = loadData();
    const streak = calculateStreak(data);
    const best = calculateBestStreak(data);
    const streakEl = document.getElementById("streak-number");
    const bestEl = document.getElementById("streak-best");
    const userEl = document.getElementById("header-user");
    if (userEl) {
      const parts = USER_NAME.split(" ");
      const initials = parts.map(p => p[0]).join("").toUpperCase();
      userEl.innerHTML = `<span class="user-name-full">${escapeHtml(USER_NAME)}</span><span class="user-name-short">${escapeHtml(initials)}</span>`;
    }
    if (streakEl) {
      streakEl.textContent = streak;
      if (streak > _lastRenderedStreak && _lastRenderedStreak >= 0 && !prefersReducedMotion()) {
        streakEl.classList.remove("is-pulsing"); void streakEl.offsetWidth;
        streakEl.classList.add("is-pulsing");
        streakEl.addEventListener("animationend", () => streakEl.classList.remove("is-pulsing"), { once: true });
      }
    }
    if (bestEl) bestEl.textContent = best;
    _lastRenderedStreak = streak;
  }
  function initHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;
    setTimeout(() => header.classList.add("is-visible"), prefersReducedMotion() ? 0 : 2800);
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 80;
          const wasScrolled = header.classList.contains("is-scrolled");
          header.classList.toggle("is-scrolled", isScrolled);
          if (isScrolled && !wasScrolled) onHeaderScrolledIn();
          else if (!isScrolled && wasScrolled) onHeaderScrolledOut();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  function renderCountdown() {
    const diff = daysBetween(START_DATE, getTodayStr());
    const el = document.getElementById("hero-countdown");
    if (!el || diff <= 0) return;
    el.textContent = `STARTS IN ${diff} DAY${diff===1?"":"S"}`;
    el.removeAttribute("hidden");
    requestAnimationFrame(() => el.classList.add("is-visible"));
  }

  /* ─── QUOTE ─── */
  let _quoteInterval = null, _lastQuote = -1;
  function showNewQuote() {
    const el = document.getElementById("header-quote-text");
    if (!el) return;
    let idx; do { idx = Math.floor(Math.random() * QUOTES.length); } while (idx === _lastQuote);
    _lastQuote = idx;
    if (prefersReducedMotion()) { el.textContent = QUOTES[idx]; return; }
    el.classList.add("is-fading");
    setTimeout(() => { el.textContent = QUOTES[idx]; el.classList.remove("is-fading"); }, 400);
  }
  function onHeaderScrolledIn() { showNewQuote(); clearInterval(_quoteInterval); _quoteInterval = setInterval(showNewQuote, CONFIG.quoteRotateInterval); }
  function onHeaderScrolledOut() { clearInterval(_quoteInterval); _quoteInterval = null; }

  /* ─── TABS ─── */
  function initTabs() {
    const buttons = document.querySelectorAll(".tab-bar [role=tab]");
    const panels  = document.querySelectorAll("[role=tabpanel]");
    const saved = localStorage.getItem(CONFIG.tabStorageKey) || "tab-scorecard";
    if (document.getElementById(saved)) activateTab(saved, buttons, panels, false);
    
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => activateTab(btn.id, buttons, panels, true));
      btn.addEventListener("keydown", (e) => {
        const btns = Array.from(buttons);
        const idx = btns.indexOf(btn);
        let n = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (idx + 1) % btns.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp")   n = (idx - 1 + btns.length) % btns.length;
        if (n >= 0) { e.preventDefault(); btns[n].focus(); activateTab(btns[n].id, buttons, panels, true); }
      });
    });
  }
  function activateTab(id, buttons, panels, save) {
    buttons.forEach(b => {
      const act = b.id === id;
      b.classList.toggle("is-active", act); b.setAttribute("aria-selected", act); b.setAttribute("tabindex", act ? "0" : "-1");
    });
    panels.forEach(p => {
      if (p.id === document.getElementById(id).getAttribute("aria-controls")) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
    if (save) { try { localStorage.setItem(CONFIG.tabStorageKey, id); } catch(e){} }
    if (id === "tab-analysis") { renderUsageChart(); renderSleepChart(); }
    if (id === "tab-logs") { renderLogsForDate(); }
  }

  /* ─── SCORECARD ─── */
  function renderScorecard() {
    const today = getTodayStr();
    const totalDays = daysBetween(today, START_DATE) + 1;
    const thead = document.getElementById("scorecard-thead");
    const tbody = document.getElementById("scorecard-tbody");
    if (!thead || !tbody) return;
    
    thead.innerHTML = "<tr><th>Date</th>" + HABITS.map(h => `<th>${h.label}</th>`).join("") + "<th>Score</th></tr>";
    
    if (totalDays <= 0) {
      tbody.innerHTML = '<tr><td colspan="99" style="text-align:center;padding:2rem;color:var(--color-muted)">Challenge hasn\'t started yet.</td></tr>';
      return;
    }

    const data = loadData();
    let html = "";
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = addDays(START_DATE, i);
      const isToday = d === today;
      const rec = data.days[d] || {};
      html += `<tr class="${isToday ? "is-today" : ""}"><td><div class="cell-date"><span class="cell-date__day">${formatDateDisplay(d)}</span><span class="cell-date__meta">Day ${i+1}</span></div></td>`;
      HABITS.forEach(h => {
        if (h.type === "tick") {
          html += `<td><label class="tick"><input class="tick__input" type="checkbox" data-date="${d}" data-habit="${h.id}" ${rec[h.id]?"checked":""} aria-label="${h.label} on ${d}" /><span class="tick__box"><svg class="tick__icon" viewBox="0 0 16 16"><polyline points="3 8 7 12 13 4"/></svg></span></label></td>`;
        } else {
          const v = rec[h.id];
          const limit = h.id === "instagramTime" ? INSTAGRAM_LIMIT_HOURS : SCREEN_TIME_LIMIT_HOURS;
          const cc = (v!=null && v!=="" && !isNaN(v)) ? (parseFloat(v)<=limit?"is-good":"is-bad") : "";
          html += `<td><input class="screen-input ${cc}" type="number" data-date="${d}" data-habit="${h.id}" min="0" step="0.5" placeholder="hrs" value="${v!=null?v:""}" /></td>`;
        }
      });
      const sc = calculateScore(rec, d);
      html += `<td><span class="cell-score">${sc.done}/${sc.total}</span></td></tr>`;
    }
    tbody.innerHTML = html;

    tbody.querySelectorAll(".tick__input").forEach(cb => cb.addEventListener("change", () => toggleHabit(cb.dataset.date, cb.dataset.habit, cb.checked, cb)));
    tbody.querySelectorAll(".screen-input").forEach(inp => inp.addEventListener("input", () => setNumberHabit(inp.dataset.date, inp.dataset.habit, inp.value, inp)));
    renderScorecardSummary(totalDays);
  }
  function toggleHabit(d, hId, checked, el) {
    const data = loadData(); const rec = getDayRecord(data, d); rec[hId] = checked; saveData(data);
    if (checked && !prefersReducedMotion()) {
      const box = el.nextElementSibling;
      if (box) { box.classList.remove("is-popping"); void box.offsetWidth; box.classList.add("is-popping"); box.addEventListener("animationend", () => box.classList.remove("is-popping"), {once:true}); }
    }
    const r = el.closest("tr");
    if (r) { const s = calculateScore(rec, d); r.querySelector(".cell-score").textContent = `${s.done}/${s.total}`; }
    renderHeaderStreak(); renderScorecardSummary(daysBetween(getTodayStr(), START_DATE)+1);
  }
  function setNumberHabit(d, hId, val, el) {
    const data = loadData(); const rec = getDayRecord(data, d);
    const v = val.trim()==="" ? null : parseFloat(val); rec[hId] = v; saveData(data);
    el.classList.remove("is-good", "is-bad");
    const limit = hId === "instagramTime" ? INSTAGRAM_LIMIT_HOURS : SCREEN_TIME_LIMIT_HOURS;
    if (v!=null && !isNaN(v)) el.classList.add(v<=limit ? "is-good" : "is-bad");
    renderScorecardSummary(daysBetween(getTodayStr(), START_DATE)+1);
    if (!document.getElementById("panel-analysis").hasAttribute("hidden")) renderUsageChart();
  }
  function renderScorecardSummary(totalDays) {
    const el = document.getElementById("scorecard-summary");
    if (!el) return;
    const data = loadData();
    let full = 0, tScore = 0, stSum = 0, stDays = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(START_DATE, i);
      const rec = data.days[d] || {};
      const s = calculateScore(rec, d);
      tScore += s.done; if (s.done === s.total) full++;
      const st = parseFloat(rec.screenTime); if (!isNaN(st) && rec.screenTime!=null) { stSum += st; stDays++; }
    }
    const avg = totalDays>0 ? (tScore/totalDays).toFixed(1) : "0";
    const avgSt = stDays>0 ? (stSum/stDays).toFixed(1) : "—";
    const best = calculateBestStreak(data);
    el.innerHTML = `
      <div class="summary-stat"><span class="summary-stat__value">${totalDays}</span><span class="summary-stat__label">Total Days</span></div>
      <div class="summary-stat"><span class="summary-stat__value">${full}</span><span class="summary-stat__label">Full Score</span></div>
      <div class="summary-stat"><span class="summary-stat__value">${avg}</span><span class="summary-stat__label">Avg Score</span></div>
      <div class="summary-stat"><span class="summary-stat__value">${avgSt}</span><span class="summary-stat__label">Avg Screen (h)</span></div>
      <div class="summary-stat"><span class="summary-stat__value">${best}</span><span class="summary-stat__label">Best Streak</span></div>`;
  }

  /* ─── LOGS TAB (SLEEP & EXERCISES) ─── */
  let _logsDate = getTodayStr();

  function initLogsTab() {
    const picker = document.getElementById("logs-date");
    if (picker) {
      picker.max = getTodayStr();
      picker.min = START_DATE;
      picker.value = _logsDate;
      picker.addEventListener("change", (e) => {
        if (!e.target.value) return;
        _logsDate = e.target.value;
        renderLogsForDate();
      });
    }
    const saveSleep = document.getElementById("btn-save-sleep");
    if (saveSleep) saveSleep.addEventListener("click", handleSaveSleep);
    const saveWeight = document.getElementById("btn-save-weight");
    if (saveWeight) saveWeight.addEventListener("click", handleSaveWeight);
    const weightInput = document.getElementById("weight-input");
    if (weightInput) weightInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSaveWeight(); });
  }

  function renderLogsForDate() {
    // 1. Sleep
    const data = loadData();
    const sleep = data.sleep[_logsDate] || { sleepAt: "", wakeAt: "" };
    document.getElementById("sleep-at-input").value = sleep.sleepAt || "";
    document.getElementById("wake-at-input").value = sleep.wakeAt || "";
    renderSleepDashboard();
    
    // 2. Weight
    renderWeightLog();
  }

  /* SLEEP LOGIC */
  function handleSaveSleep() {
    const sAt = document.getElementById("sleep-at-input").value;
    const wAt = document.getElementById("wake-at-input").value;
    const data = loadData();
    if (sAt || wAt) {
      if (!data.sleep) data.sleep = {};
      data.sleep[_logsDate] = { sleepAt: sAt, wakeAt: wAt };
    } else {
      if (data.sleep && data.sleep[_logsDate]) delete data.sleep[_logsDate];
    }
    saveData(data);
    renderSleepDashboard();
    
    const btn = document.getElementById("btn-save-sleep");
    const orig = btn.textContent;
    btn.textContent = "SAVED ✓";
    setTimeout(() => btn.textContent = orig, 1500);
  }

  function calcSleepMinutes(sAt, wAt) {
    if (!sAt || !wAt) return null;
    const [sh, sm] = sAt.split(":").map(Number);
    const [wh, wm] = wAt.split(":").map(Number);
    let diff = (wh * 60 + wm) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return diff;
  }
  function formatMins(m) {
    if (m === null) return "—";
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    return `${hrs}h ${mins}m`;
  }

  function renderSleepDashboard() {
    const dash = document.getElementById("sleep-dashboard");
    if (!dash) return;
    const data = loadData();
    
    const curSleep = data.sleep[_logsDate] || {};
    const curMins = calcSleepMinutes(curSleep.sleepAt, curSleep.wakeAt);
    const goalMins = SLEEP_GOAL_HOURS * 60;
    
    // Determine color
    let color = "rgba(125,211,252,0.1)"; // default empty
    if (curMins !== null) {
      if (curMins >= goalMins) color = "var(--color-success)";
      else if (curMins >= goalMins - 60) color = "var(--color-amber)";
      else color = "var(--color-danger)";
    }
    
    // Arc math
    const radius = 40;
    const circumference = Math.PI * radius; // half circle
    const fillRatio = curMins ? Math.min(curMins / (goalMins * 1.5), 1) : 0; // scale up to 1.5x goal
    const dashoffset = circumference * (1 - fillRatio);
    const animStyle = !prefersReducedMotion() ? `style="transition: stroke-dashoffset 1s var(--ease-out-expo)"` : "";

    const arcSvg = `
      <div class="sleep-arc-wrap">
        <svg viewBox="0 0 100 50">
          <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8" stroke-linecap="round"/>
          <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" 
                stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}" ${animStyle} class="sleep-arc-path" />
        </svg>
        <div class="sleep-arc-text">${curMins !== null ? Math.floor(curMins/60) + "<span style='font-size:1rem'>h</span> " + (curMins%60) + "<span style='font-size:1rem'>m</span>" : "—"}</div>
      </div>
    `;

    // 7-day trend
    const trendDates = Array.from({length: 7}, (_, i) => addDays(_logsDate, -6 + i));
    const trendData = trendDates.map(d => calcSleepMinutes((data.sleep[d]||{}).sleepAt, (data.sleep[d]||{}).wakeAt));
    const maxVal = Math.max(goalMins + 60, ...trendData.filter(x => x !== null));
    
    let trendSvg = `<svg width="100%" height="100%" viewBox="0 0 140 40" preserveAspectRatio="none">`;
    const w = 140, h = 40;
    const goalY = h - (goalMins / maxVal) * h;
    trendSvg += `<line x1="0" y1="${goalY}" x2="${w}" y2="${goalY}" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2,2"/>`;
    
    const barW = (w / 7) - 4;
    let sumMins = 0, count = 0;
    trendData.forEach((v, i) => {
      const cx = i * (w / 7) + (w / 7) / 2;
      if (v === null) {
        trendSvg += `<rect x="${cx - barW/2}" y="${h-2}" width="${barW}" height="2" rx="1" fill="rgba(255,255,255,0.05)"/>`;
      } else {
        sumMins += v; count++;
        const barH = (v / maxVal) * h;
        let bColor = "var(--color-danger)";
        if (v >= goalMins) bColor = "var(--color-success)";
        else if (v >= goalMins - 60) bColor = "var(--color-amber)";
        trendSvg += `<rect x="${cx - barW/2}" y="${h - barH}" width="${barW}" height="${barH}" rx="2" fill="${bColor}" opacity="${i===6?1:0.6}"/>`;
      }
    });
    trendSvg += `</svg>`;
    const avg = count > 0 ? formatMins(Math.round(sumMins/count)) : "—";

    dash.innerHTML = `
      ${arcSvg}
      <div class="sleep-trend-wrap">
        <div class="sleep-trend-stats"><span>7D AVG: <strong>${avg}</strong></span><span>GOAL: <strong>${SLEEP_GOAL_HOURS}h</strong></span></div>
        <div class="sleep-trend-chart">${trendSvg}</div>
      </div>
    `;

    // History list (all time, newest first)
    const list = document.getElementById("sleep-history-list");
    if (list) {
      const allDates = Object.keys(data.sleep||{}).sort((a,b) => a < b ? 1 : -1);
      if (allDates.length === 0) {
        list.innerHTML = `<div class="chart-empty"><span class="chart-empty__text">No sleep logged yet.</span></div>`;
      } else {
        let lHtml = "";
        allDates.forEach(d => {
          const s = data.sleep[d];
          const dm = calcSleepMinutes(s.sleepAt, s.wakeAt);
          if (dm !== null) {
            lHtml += `<div class="sleep-history-item"><span class="sleep-history-item__date">${formatDateShort(d)}</span><span class="sleep-history-item__times">${s.sleepAt} - ${s.wakeAt}</span><span class="sleep-history-item__dur">${formatMins(dm)}</span></div>`;
          }
        });
        list.innerHTML = lHtml;
      }
    }
  }

  /* WEIGHT LOGIC */
  function parseDecimal(val) {
    if (!val) return null;
    let s = val.toString().replace(",", ".");
    let n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  function handleSaveWeight() {
    const inp = document.getElementById("weight-input");
    const err = document.getElementById("weight-error");
    const data = loadData();
    const val = parseDecimal(inp.value);
    
    if (inp.value.trim() !== "" && (val === null || val < 20 || val > 400)) {
      err.textContent = "Please enter a valid weight (e.g., 72.5) between 20 and 400.";
      return;
    }
    err.textContent = "";
    
    if (!data.weight) data.weight = {};
    if (inp.value.trim() === "") {
      delete data.weight[_logsDate];
    } else {
      data.weight[_logsDate] = inp.value.trim().replace(",", ".");
    }
    saveData(data);
    renderWeightLog();
    
    const btn = document.getElementById("btn-save-weight");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "SAVED ✓";
      setTimeout(() => btn.textContent = orig, 1500);
    }
  }
  window.deleteWeight = function(dateStr) {
    if (!confirm("Delete this weight entry?")) return;
    const data = loadData();
    if (data.weight) { delete data.weight[dateStr]; saveData(data); }
    renderWeightLog();
  };
  function renderWeightLog() {
    const data = loadData();
    const inp = document.getElementById("weight-input");
    const err = document.getElementById("weight-error");
    const summary = document.getElementById("weight-summary");
    const list = document.getElementById("weight-history-list");
    
    if (inp && data.weight) inp.value = data.weight[_logsDate] || "";
    if (err) err.textContent = "";
    
    if (!list || !summary) return;
    
    if (!data.weight || Object.keys(data.weight).length === 0) {
      summary.innerHTML = "";
      list.innerHTML = `<div class="chart-empty"><span class="chart-empty__text">No weight logged yet.</span></div>`;
      return;
    }
    
    const allDates = Object.keys(data.weight).sort((a,b) => a < b ? 1 : -1);
    const newestDate = allDates[0];
    const oldestDate = allDates[allDates.length - 1];
    const currentW = parseDecimal(data.weight[newestDate]);
    const startW = parseDecimal(data.weight[oldestDate]);
    
    if (currentW !== null && startW !== null) {
      const diff = currentW - startW;
      const diffStr = (diff > 0 ? "+" : "") + diff.toFixed(1) + " " + WEIGHT_UNIT;
      summary.innerHTML = `Current: <strong>${data.weight[newestDate]} ${WEIGHT_UNIT}</strong> &nbsp;&nbsp; <span class="trend-badge">${diffStr} since start</span>`;
    } else {
      summary.innerHTML = "";
    }
    
    let lHtml = "";
    allDates.forEach(d => {
      lHtml += `<div class="weight-history-item">
        <span class="weight-history-item__date">${formatDateShort(d)}</span>
        <span class="weight-history-item__val">${data.weight[d]} ${WEIGHT_UNIT}</span>
        <div class="weight-history-item__actions">
          <button class="btn-icon btn-icon--danger" onclick="window.deleteWeight('${d}')" title="Delete">×</button>
        </div>
      </div>`;
    });
    list.innerHTML = lHtml;
  }

  /* ─── ANALYSIS TAB ─── */
  let _chartRangeScreen = 7;
  let _activeTooltip = null;

  function initChartControls() {
    document.querySelectorAll(".range-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        if (btn.dataset.range && target === "screen") {
          document.querySelectorAll(`.range-btn[data-target="screen"][data-range]`).forEach(b => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          _chartRangeScreen = btn.dataset.range === "all" ? "all" : parseInt(btn.dataset.range);
          renderUsageChart();
        } else if (btn.dataset.range && target === "sleep") {
          document.querySelectorAll(`.range-btn[data-target="sleep"][data-range]`).forEach(b => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          renderSleepChart();
        }
      });
    });
    document.querySelectorAll(".legend-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pressed = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", String(!pressed));
        renderUsageChart();
      });
    });
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!document.getElementById("panel-analysis").hasAttribute("hidden")) { renderUsageChart(); renderSleepChart(); }
      }, 200);
    });
  }

  function showTooltip(container, content, x, y) {
    if (!_activeTooltip) { _activeTooltip = document.createElement("div"); _activeTooltip.className = "chart-tooltip"; document.body.appendChild(_activeTooltip); }
    _activeTooltip.innerHTML = content;
    _activeTooltip.classList.add("is-visible");
    _activeTooltip.style.left = (x + 10) + "px";
    _activeTooltip.style.top = (y - 30) + "px";
  }
  function hideTooltip() { if (_activeTooltip) _activeTooltip.classList.remove("is-visible"); }
  document.addEventListener("mousemove", (e) => {
    if (e.target && e.target.classList && e.target.classList.contains("chart-point-hover")) {
      showTooltip(null, e.target.dataset.tip, e.pageX, e.pageY);
    } else if (e.target && e.target.classList && e.target.classList.contains("chart-bar-hover")) {
      showTooltip(null, e.target.dataset.tip, e.pageX, e.pageY);
    } else {
      hideTooltip();
    }
  });

  /* Usage Line Chart */
  function renderUsageChart() {
    const container = document.getElementById("chart-container-screen");
    if (!container) return;
    const data = loadData();
    const today = getTodayStr();
    const totalDays = daysBetween(today, START_DATE) + 1;
    if (totalDays <= 0) { container.innerHTML = '<div class="chart-empty"><span class="chart-empty__text">Challenge hasn\'t started yet.</span></div>'; return; }

    const rangeDays = _chartRangeScreen === "all" ? totalDays : Math.min(_chartRangeScreen, totalDays);
    const startOffset = totalDays - rangeDays;
    const points = []; let hasAny = false;
    
    const screenBtn = document.querySelector('.legend-btn[data-line="screen"]');
    const instaBtn = document.querySelector('.legend-btn[data-line="instagram"]');
    const showScreen = screenBtn ? screenBtn.getAttribute("aria-pressed") === "true" : true;
    const showInsta = instaBtn ? instaBtn.getAttribute("aria-pressed") === "true" : true;

    for (let i = startOffset; i < totalDays; i++) {
      const d = addDays(START_DATE, i);
      const st = (data.days[d]||{}).screenTime;
      const it = (data.days[d]||{}).instagramTime;
      const sVal = (st != null && st !== "" && !isNaN(parseFloat(st))) ? parseFloat(st) : null;
      const iVal = (it != null && it !== "" && !isNaN(parseFloat(it))) ? parseFloat(it) : null;
      if (sVal !== null || iVal !== null) hasAny = true;
      points.push({ date: d, screen: sVal, instagram: iVal });
    }

    if (!hasAny) { container.innerHTML = '<div class="chart-empty"><span class="chart-empty__text">No screen time or Instagram time logged yet. Add them in the Scorecard.</span></div>'; return; }
    if (!showScreen && !showInsta) { container.innerHTML = '<div class="chart-empty"><span class="chart-empty__text">Select a metric from the legend to view data.</span></div>'; return; }

    const rect = container.getBoundingClientRect();
    const W = Math.max(rect.width, 300), H = 260;
    const PAD = { t: 30, r: 40, b: 40, l: 40 };
    const pW = W - PAD.l - PAD.r, pH = H - PAD.t - PAD.b;
    
    let maxVal = 0;
    if (showScreen) maxVal = Math.max(maxVal, SCREEN_TIME_LIMIT_HOURS + 1, ...points.filter(p=>p.screen!==null).map(p=>p.screen+0.5));
    if (showInsta) maxVal = Math.max(maxVal, INSTAGRAM_LIMIT_HOURS + 1, ...points.filter(p=>p.instagram!==null).map(p=>p.instagram+0.5));
    maxVal = Math.max(1, maxVal);

    const yS = v => PAD.t + pH - (v/maxVal)*pH;
    let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
    const yStep = maxVal<=6 ? 1 : Math.ceil(maxVal/5);
    for (let v=0; v<=maxVal; v+=yStep) {
      const y = yS(v);
      svg += `<line x1="${PAD.l}" y1="${y}" x2="${W-PAD.r}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      svg += `<text x="${PAD.l-6}" y="${y+3}" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="10" font-family="Inter">${v}</text>`;
    }
    
    if (showScreen) {
      const lY = yS(SCREEN_TIME_LIMIT_HOURS);
      svg += `<line x1="${PAD.l}" y1="${lY}" x2="${W-PAD.r}" y2="${lY}" stroke="var(--line-screen)" stroke-dasharray="6,4" opacity="0.5"/>`;
      svg += `<text x="${W-PAD.r+5}" y="${lY+3}" fill="var(--line-screen)" font-size="8" opacity="0.6">Limit</text>`;
    }
    if (showInsta) {
      const lY = yS(INSTAGRAM_LIMIT_HOURS);
      svg += `<line x1="${PAD.l}" y1="${lY}" x2="${W-PAD.r}" y2="${lY}" stroke="var(--line-instagram)" stroke-dasharray="6,4" opacity="0.5"/>`;
      svg += `<text x="${W-PAD.r+5}" y="${lY+3}" fill="var(--line-instagram)" font-size="8" opacity="0.6">Limit</text>`;
    }
    
    const xStep = pW / Math.max(1, points.length - 1);
    const labelE = Math.max(1, Math.ceil(points.length / Math.floor(pW/40)));

    points.forEach((p, i) => {
      const cx = PAD.l + i*xStep;
      if (i%labelE === 0 || i===points.length-1) {
        svg += `<text x="${cx}" y="${H-10}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9" font-family="Inter" transform="rotate(-30 ${cx} ${H-10})">${formatDateShort(p.date)}</text>`;
      }
    });

    const drawSeries = (key, color) => {
      let pathD = ""; let dotsHtml = ""; let activeSeg = false;
      points.forEach((p, i) => {
        const val = p[key]; const cx = PAD.l + i*xStep;
        if (val !== null) {
          const cy = yS(val);
          if (!activeSeg) { pathD += `M ${cx} ${cy} `; activeSeg = true; } else { pathD += `L ${cx} ${cy} `; }
          let tip = `<strong>${formatDateDisplay(p.date)}</strong><br>${key==="screen"?"Screen":"Instagram"}: ${val}h`;
          if (key === "screen" && p.instagram !== null) tip += `<br>Instagram: ${p.instagram}h`;
          if (key === "instagram" && p.screen !== null) tip = `<strong>${formatDateDisplay(p.date)}</strong><br>Screen: ${p.screen}h<br>Instagram: ${val}h`;
          dotsHtml += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${color}" stroke="rgba(10,14,26,0.8)" stroke-width="2" class="chart-point-hover" data-tip="${tip}" style="cursor:pointer; pointer-events:all;"/>`;
          dotsHtml += `<circle cx="${cx}" cy="${cy}" r="14" fill="transparent" class="chart-point-hover" data-tip="${tip}" style="cursor:pointer; pointer-events:all;"/>`;
        } else { activeSeg = false; }
      });
      if (pathD) {
        const pathLen = W * 2;
        const anim = !prefersReducedMotion() ? `<animate attributeName="stroke-dashoffset" from="${pathLen}" to="0" dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1"/>` : "";
        svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${pathLen}" stroke-dashoffset="${pathLen}" style="pointer-events:none;">${anim}</path>`;
      }
      svg += dotsHtml;
    };

    if (showScreen) drawSeries("screen", "var(--line-screen)");
    if (showInsta) drawSeries("instagram", "var(--line-instagram)");

    container.innerHTML = svg + "</svg>";
  }

  /* Sleep Analysis Chart */
  function renderSleepChart() {
    const container = document.getElementById("chart-container-sleep");
    if (!container || container.hasAttribute("hidden")) return;
    const data = loadData();
    const today = getTodayStr();
    const totalDays = daysBetween(today, START_DATE) + 1;
    if (totalDays <= 0) return;

    let rangeDays;
    const btn = document.querySelector('.range-btn[data-target="sleep"].is-active');
    if (btn) rangeDays = btn.dataset.range === "all" ? totalDays : parseInt(btn.dataset.range);
    else rangeDays = 7;

    const startOffset = totalDays - Math.min(rangeDays, totalDays);
    const points = []; let hasAny = false;

    for (let i = startOffset; i < totalDays; i++) {
      const d = addDays(START_DATE, i);
      const sleep = data.sleep[d] || {};
      const mins = calcSleepMinutes(sleep.sleepAt, sleep.wakeAt);
      const hrs = mins !== null ? (mins / 60) : null;
      if (hrs !== null) hasAny = true;
      points.push({ date: d, hrs: hrs });
    }

    if (!hasAny) { container.innerHTML = '<div class="chart-empty"><span class="chart-empty__text">No sleep logged in this range.</span></div>'; return; }

    const rect = container.getBoundingClientRect();
    const W = Math.max(rect.width, 300), H = 240;
    const PAD = { t: 30, r: 20, b: 40, l: 40 };
    const pW = W - PAD.l - PAD.r, pH = H - PAD.t - PAD.b;

    let maxVal = Math.max(SLEEP_GOAL_HOURS + 2, ...points.filter(p=>p.hrs!==null).map(p=>p.hrs + 1));
    const yS = v => PAD.t + pH - (v/maxVal)*pH;
    
    let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
    const yStep = maxVal <= 6 ? 1 : Math.ceil(maxVal/5);
    for (let v=0; v<=maxVal; v+=yStep) {
      const y = yS(v);
      svg += `<line x1="${PAD.l}" y1="${y}" x2="${W-PAD.r}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      svg += `<text x="${PAD.l-6}" y="${y+3}" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="10" font-family="Inter">${v}h</text>`;
    }

    const lY = yS(SLEEP_GOAL_HOURS);
    svg += `<line x1="${PAD.l}" y1="${lY}" x2="${W-PAD.r}" y2="${lY}" stroke="rgba(255,255,255,0.4)" stroke-dasharray="6,4" opacity="0.5"/>`;
    svg += `<text x="${W-PAD.r+5}" y="${lY+3}" fill="rgba(255,255,255,0.6)" font-size="8">Goal</text>`;

    const barW = Math.min(24, (pW - points.length*2) / Math.max(1, points.length));
    const xStep = pW / Math.max(1, points.length - (points.length > 1 ? 1 : 0));
    const labelE = Math.max(1, Math.ceil(points.length / Math.floor(pW/40)));

    points.forEach((p, i) => {
      const cx = PAD.l + (points.length > 1 ? i*xStep : pW/2);
      
      if (i%labelE === 0 || i===points.length-1) {
        svg += `<text x="${cx}" y="${H-10}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9" font-family="Inter" transform="rotate(-30 ${cx} ${H-10})">${formatDateShort(p.date)}</text>`;
      }

      if (p.hrs !== null) {
        const v = p.hrs;
        let color = "var(--color-danger)";
        if (v >= SLEEP_GOAL_HOURS) color = "var(--color-success)";
        else if (v >= SLEEP_GOAL_HOURS - 1) color = "var(--color-amber)";
        
        const h = (v/maxVal)*pH; const y = yS(v);
        const anim = !prefersReducedMotion() ? `<animate attributeName="height" from="0" to="${h}" dur="0.4s" fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1"/><animate attributeName="y" from="${yS(0)}" to="${y}" dur="0.4s" fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1"/>` : "";
        const tip = `<strong>${formatDateDisplay(p.date)}</strong><br>Slept: ${formatMins(Math.round(v*60))}`;
        svg += `<rect x="${cx-barW/2}" y="${y}" width="${barW}" height="${h}" rx="3" fill="${color}" class="chart-bar-hover" data-tip="${tip}" style="pointer-events:all;cursor:pointer">${anim}</rect>`;
      }
    });

    container.innerHTML = svg + "</svg>";
  }




  /* ─── RESET ─── */
  function resetAllData() {
    if (!confirm("⚠️ Reset ALL data?\n\nThis will permanently delete your entire scorecard, logs, streaks, and history.")) return;
    if (!confirm("Are you absolutely sure? All progress will be lost.")) return;
    saveData(getDefaultData());
    renderScorecard(); renderHeaderStreak(); renderLogsForDate();
    if (!document.getElementById("panel-analysis").hasAttribute("hidden")) { renderUsageChart(); renderSleepChart(); }
  }


  /* ─── INTRO ANIMATION ─── */
  function prefersReducedMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function playIntroAnimation() {
    const title = document.getElementById("main-title"); const subtitle = document.getElementById("subtitle");
    const divider = document.querySelector(".hero__divider"); const tagline = document.querySelector(".hero__tagline");
    if (!title || !subtitle) return;
    subtitle.innerHTML = "";
    for (const char of CONFIG.subtitleText) { const s = document.createElement("span"); s.className = "letter"; s.textContent = char; subtitle.appendChild(s); }
    if (prefersReducedMotion()) {
      title.classList.add("is-visible"); subtitle.querySelectorAll(".letter").forEach(l => l.classList.add("is-visible"));
      if(divider) divider.classList.add("is-visible"); if(tagline) tagline.classList.add("is-visible"); return;
    }
    const letters = subtitle.querySelectorAll(".letter");
    setTimeout(() => title.classList.add("is-visible"), CONFIG.titleDelay);
    letters.forEach((l, i) => setTimeout(() => l.classList.add("is-visible"), CONFIG.subtitleStartDelay + i * CONFIG.letterInterval));
    const allTime = CONFIG.subtitleStartDelay + letters.length * CONFIG.letterInterval;
    setTimeout(() => subtitle.classList.add("glow-pulse"), allTime + 100);
    setTimeout(() => subtitle.classList.remove("glow-pulse"), allTime + 100 + CONFIG.glowPulseDuration);
    setTimeout(() => { if(divider) divider.classList.add("is-visible"); if(tagline) tagline.classList.add("is-visible"); }, CONFIG.titleDelay + 50);
  }

  /* ─── SNOW PARTICLES ─── */
  function initSnow() {
    if (prefersReducedMotion()) return;
    const canvas = document.getElementById("snow-canvas"); if (!canvas) return;
    const ctx = canvas.getContext("2d"); let particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function create() { return { x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: CONFIG.snowMinRadius + Math.random()*(CONFIG.snowMaxRadius - CONFIG.snowMinRadius), speed: CONFIG.snowMinSpeed + Math.random()*(CONFIG.snowMaxSpeed - CONFIG.snowMinSpeed), drift: (Math.random()-0.5)*0.3, opacity: 0.2 + Math.random()*(CONFIG.snowOpacity - 0.2) }; }
    function seed() { particles = []; for (let i=0; i<CONFIG.snowParticleCount; i++) particles.push(create()); }
    function frame() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for (const p of particles) {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle = CONFIG.snowColor+p.opacity+")"; ctx.fill();
        p.y+=p.speed; p.x+=p.drift;
        if(p.y>canvas.height+p.r){p.y=-p.r;p.x=Math.random()*canvas.width} if(p.x>canvas.width+p.r) p.x=-p.r; if(p.x<-p.r) p.x=canvas.width+p.r;
      }
      requestAnimationFrame(frame);
    }
    resize(); seed(); frame();
    let rt; window.addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{resize();seed()},200)});
  }

  /* ─── INIT ─── */
  document.addEventListener("DOMContentLoaded", () => {
    playIntroAnimation();
    initSnow();
    renderCountdown();
    initHeader();
    initTabs();
    initChartControls();
    initLogsTab();
    
    renderScorecard();
    renderHeaderStreak();
    const btnResetAll = document.getElementById("btn-reset-all");
    if (btnResetAll) btnResetAll.addEventListener("click", resetAllData);
  });
})();
