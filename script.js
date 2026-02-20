/**
 * MaximizePTO 2026 - Escape Atelier
 */

const YEAR = 2026;

const DEFAULT_FEDERAL_HOLIDAYS = [
  { id: "h1", date: "2026-01-01", name: "New Year's Day" },
  { id: "h2", date: "2026-01-19", name: "Martin Luther King, Jr. Day" },
  { id: "h3", date: "2026-02-16", name: "Presidents' Day" },
  { id: "h4", date: "2026-05-25", name: "Memorial Day" },
  { id: "h5", date: "2026-06-19", name: "Juneteenth" },
  { id: "h6", date: "2026-07-03", name: "Independence Day (Observed)" },
  { id: "h7", date: "2026-09-07", name: "Labor Day" },
  { id: "h8", date: "2026-10-12", name: "Columbus Day" },
  { id: "h9", date: "2026-11-11", name: "Veterans Day" },
  { id: "h10", date: "2026-11-26", name: "Thanksgiving Day" },
  { id: "h11", date: "2026-12-25", name: "Christmas Day" }
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let accrualRate = 1.5;
let aggressiveness = 2;
let observedHolidays = [];
let customHolidays = [];
let suggestedPTO = [];
let strategies = [];
let selectedStrategyName = "";

const accrualInput = document.getElementById("accrual-rate");
const aggressivenessInput = document.getElementById("aggressiveness");
const aggressivenessLabel = document.getElementById("aggressiveness-label");
const annualTotalEl = document.getElementById("annual-total");
const ptoRemainingEl = document.getElementById("pto-remaining");
const ptoUsedEl = document.getElementById("pto-used");
const yieldScoreEl = document.getElementById("yield-score");
const longestBreakEl = document.getElementById("longest-break");
const microBreaksEl = document.getElementById("micro-breaks");
const unusedRiskEl = document.getElementById("unused-risk");
const energyLineEl = document.getElementById("energy-line");

const calendarGrid = document.getElementById("calendar-grid");
const suggestionsList = document.getElementById("suggestions-list");
const holidayToggleList = document.getElementById("holiday-toggle-list");
const customHolidaysList = document.getElementById("custom-holidays-list");
const customHName = document.getElementById("custom-h-name");
const customHDate = document.getElementById("custom-h-date");
const addCustomHBtn = document.getElementById("add-custom-h");
const presetButtons = Array.from(document.querySelectorAll(".preset-btn"));

function init() {
  loadState();

  accrualInput.addEventListener("input", handleAccrualChange);
  aggressivenessInput.addEventListener("input", handleAggressivenessChange);
  addCustomHBtn.addEventListener("click", handleAddCustomHoliday);

  holidayToggleList.addEventListener("change", handleHolidayToggleChange);
  customHolidaysList.addEventListener("click", handleCustomHolidayListClick);
  suggestionsList.addEventListener("click", handleSuggestionSelect);

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const level = Number(btn.dataset.level);
      aggressiveness = level;
      aggressivenessInput.value = String(level);
      updateAggressivenessLabel();
      syncPresetButtons();
      saveState();
      updateDashboard();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
      event.preventDefault();
      accrualInput.focus();
    }
  });

  renderHolidayControls();
  updateAggressivenessLabel();
  syncPresetButtons();
  updateDashboard();
}

function loadState() {
  observedHolidays = DEFAULT_FEDERAL_HOLIDAYS.map((h) => h.id);

  const savedRaw = localStorage.getItem("pto-planner-state");
  if (!savedRaw) {
    return;
  }

  try {
    const state = JSON.parse(savedRaw);
    accrualRate = Number(state.accrualRate) || 1.5;
    aggressiveness = Number(state.aggressiveness) || 2;

    if (Array.isArray(state.observedHolidays) && state.observedHolidays.length) {
      observedHolidays = state.observedHolidays;
    }

    customHolidays = Array.isArray(state.customHolidays) ? state.customHolidays : [];
  } catch (_error) {
    customHolidays = [];
    observedHolidays = DEFAULT_FEDERAL_HOLIDAYS.map((h) => h.id);
  }

  accrualInput.value = String(accrualRate);
  aggressivenessInput.value = String(aggressiveness);
}

function saveState() {
  const state = {
    accrualRate,
    aggressiveness,
    observedHolidays,
    customHolidays
  };
  localStorage.setItem("pto-planner-state", JSON.stringify(state));
}

function handleAccrualChange(event) {
  accrualRate = Math.max(0, Number(event.target.value) || 0);
  saveState();
  updateDashboard();
}

function handleAggressivenessChange(event) {
  aggressiveness = Number(event.target.value);
  updateAggressivenessLabel();
  syncPresetButtons();
  saveState();
  updateDashboard();
}

function handleAddCustomHoliday() {
  const name = customHName.value.trim();
  const date = customHDate.value;

  if (!name || !date) {
    energyLineEl.textContent = "Name and date both matter. Add both to create a custom holiday.";
    return;
  }

  if (customHolidays.some((h) => h.date === date && h.name.toLowerCase() === name.toLowerCase())) {
    energyLineEl.textContent = "That custom holiday already exists in your planner.";
    return;
  }

  customHolidays.push({
    id: `c${Date.now()}`,
    name,
    date
  });

  customHName.value = "";
  customHDate.value = "";
  saveState();
  renderHolidayControls();
  updateDashboard();
}

function handleHolidayToggleChange(event) {
  const input = event.target.closest("input[data-id]");
  if (!input) {
    return;
  }

  const holidayId = input.dataset.id;
  if (!holidayId) {
    return;
  }

  if (input.checked) {
    if (!observedHolidays.includes(holidayId)) {
      observedHolidays.push(holidayId);
    }
  } else {
    observedHolidays = observedHolidays.filter((id) => id !== holidayId);
  }

  saveState();
  updateDashboard();
}

function handleCustomHolidayListClick(event) {
  const button = event.target.closest("button[data-remove-id]");
  if (!button) {
    return;
  }

  const id = button.dataset.removeId;
  customHolidays = customHolidays.filter((holiday) => holiday.id !== id);
  saveState();
  renderHolidayControls();
  updateDashboard();
}

function handleSuggestionSelect(event) {
  const card = event.target.closest(".suggestion-card[data-strategy]");
  if (!card) {
    return;
  }

  selectedStrategyName = card.dataset.strategy || "";
  renderSuggestions();
  renderCalendar();
}

function updateAggressivenessLabel() {
  const labels = ["Chill", "Balanced", "Max Out"];
  aggressivenessLabel.textContent = labels[aggressiveness - 1] || "Balanced";
}

function syncPresetButtons() {
  presetButtons.forEach((button) => {
    const active = Number(button.dataset.level) === aggressiveness;
    button.classList.toggle("active", active);
  });
}

function renderHolidayControls() {
  holidayToggleList.innerHTML = DEFAULT_FEDERAL_HOLIDAYS.map((holiday) => {
    const checked = observedHolidays.includes(holiday.id) ? "checked" : "";
    return `
      <label class="holiday-item">
        <input type="checkbox" data-id="${holiday.id}" ${checked}>
        <span>${holiday.name}</span>
      </label>
    `;
  }).join("");

  if (!customHolidays.length) {
    customHolidaysList.innerHTML = '<p class="support-text">No custom holidays yet.</p>';
    return;
  }

  customHolidaysList.innerHTML = customHolidays
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((holiday) => {
      return `
        <div class="custom-entry">
          <span>${holiday.name} (${holiday.date})</span>
          <button class="remove-btn" data-remove-id="${holiday.id}" aria-label="Remove ${holiday.name}">&times;</button>
        </div>
      `;
    })
    .join("");
}

function getActiveHolidays() {
  const standard = DEFAULT_FEDERAL_HOLIDAYS.filter((holiday) => observedHolidays.includes(holiday.id));
  return [...standard, ...customHolidays];
}

function updateDashboard() {
  const annualTotal = accrualRate * 12;
  const roundedBudget = Math.floor(annualTotal);

  annualTotalEl.textContent = annualTotal.toFixed(1);

  calculateOptimalPTO(roundedBudget);
  const metrics = calculateOverviewMetrics(annualTotal);

  ptoUsedEl.textContent = String(suggestedPTO.length);
  ptoRemainingEl.textContent = Math.max(annualTotal - suggestedPTO.length, 0).toFixed(1);
  yieldScoreEl.textContent = `${metrics.yieldScore.toFixed(1)}x`;
  longestBreakEl.textContent = `${metrics.longestBreak} days`;
  microBreaksEl.textContent = String(metrics.microBreaks);
  unusedRiskEl.textContent = metrics.unusedRisk;

  updateEnergyLine(metrics);
  renderSuggestions();
  renderCalendar();
}

function calculateOptimalPTO(budget) {
  suggestedPTO = [];
  strategies = [];

  if (budget <= 0) {
    selectedStrategyName = "";
    return;
  }

  const activeHolidays = getActiveHolidays();
  const holidayDates = new Set(activeHolidays.map((holiday) => holiday.date));

  addBridgeStrategies(activeHolidays, holidayDates, budget);

  if (aggressiveness >= 2) {
    addExtendedWeekendStrategies(activeHolidays, holidayDates, budget);
  }

  if (aggressiveness >= 3) {
    addFullWeekStrategies(activeHolidays, holidayDates, budget);
  }

  suggestedPTO.sort();

  strategies = strategies
    .map((strategy) => {
      const offSet = buildOffdaySet(activeHolidays, strategy.dates);
      const windows = getBreakWindows(offSet);
      const vacationDays = windows
        .filter((window) => window.length >= 3)
        .reduce((total, window) => total + window.length, 0);
      const longest = windows.reduce((max, window) => Math.max(max, window.length), 0);
      const micro = windows.filter((window) => window.length >= 3 && window.length <= 4).length;

      const yieldScore = strategy.dates.length
        ? Number((vacationDays / strategy.dates.length).toFixed(1))
        : 0;
      const rank = vacationDays * 2 + longest * 1.25 - strategy.dates.length * 0.75;

      return {
        ...strategy,
        ptoDays: strategy.dates.length,
        vacationDays,
        longest,
        micro,
        yieldScore,
        rank
      };
    })
    .sort((a, b) => b.rank - a.rank || a.ptoDays - b.ptoDays);

  if (!selectedStrategyName || !strategies.some((strategy) => strategy.name === selectedStrategyName)) {
    selectedStrategyName = strategies[0]?.name || "";
  }
}

function addBridgeStrategies(activeHolidays, holidayDates, budget) {
  activeHolidays.forEach((holiday) => {
    const date = parseISODate(holiday.date);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 2) {
      const bridgeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
      addPTOIfPossible(bridgeDate, `Bridge ${holiday.name}`, budget, holidayDates);
    }

    if (dayOfWeek === 4) {
      const bridgeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      addPTOIfPossible(bridgeDate, `Bridge ${holiday.name}`, budget, holidayDates);
    }
  });
}

function addExtendedWeekendStrategies(activeHolidays, holidayDates, budget) {
  activeHolidays.forEach((holiday) => {
    const date = parseISODate(holiday.date);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 1) {
      const beforeWeekend = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 3);
      addPTOIfPossible(beforeWeekend, `4-Day ${holiday.name}`, budget, holidayDates);
    }

    if (dayOfWeek === 5) {
      const afterWeekend = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3);
      addPTOIfPossible(afterWeekend, `4-Day ${holiday.name}`, budget, holidayDates);
    }
  });

  const thanksgiving = activeHolidays.find((holiday) => holiday.name === "Thanksgiving Day");
  if (thanksgiving) {
    const friday = parseISODate(thanksgiving.date);
    friday.setDate(friday.getDate() + 1);
    addPTOIfPossible(friday, "Thanksgiving Escape", budget, holidayDates);
  }
}

function addFullWeekStrategies(activeHolidays, holidayDates, budget) {
  const hasChristmas = activeHolidays.some((holiday) => holiday.name === "Christmas Day");
  if (hasChristmas) {
    ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"].forEach((dateString) => {
      addPTOIfPossible(parseISODate(dateString), "Holiday Season Stretch", budget, holidayDates);
    });
  }

  const hasIndependence = activeHolidays.some((holiday) => holiday.name.includes("Independence"));
  if (hasIndependence) {
    ["2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02"].forEach((dateString) => {
      addPTOIfPossible(parseISODate(dateString), "Summer Expansion", budget, holidayDates);
    });
  }
}

function addPTOIfPossible(date, reason, budget, holidayDates) {
  if (date.getFullYear() !== YEAR) {
    return;
  }

  const iso = formatISODate(date);
  const day = date.getDay();

  if (day === 0 || day === 6) {
    return;
  }

  if (holidayDates.has(iso)) {
    return;
  }

  if (suggestedPTO.includes(iso)) {
    appendToStrategy(reason, iso);
    return;
  }

  if (suggestedPTO.length >= budget) {
    return;
  }

  suggestedPTO.push(iso);
  appendToStrategy(reason, iso);
}

function appendToStrategy(reason, dateIso) {
  let strategy = strategies.find((item) => item.name === reason);
  if (!strategy) {
    strategy = {
      name: reason,
      dates: []
    };
    strategies.push(strategy);
  }

  if (!strategy.dates.includes(dateIso)) {
    strategy.dates.push(dateIso);
    strategy.dates.sort();
  }
}

function calculateOverviewMetrics(annualTotal) {
  const activeHolidays = getActiveHolidays();
  const offSet = buildOffdaySet(activeHolidays, suggestedPTO);
  const windows = getBreakWindows(offSet);

  const vacationDays = windows
    .filter((window) => window.length >= 3)
    .reduce((total, window) => total + window.length, 0);
  const longestBreak = windows.reduce((max, window) => Math.max(max, window.length), 0);
  const microBreaks = windows.filter((window) => window.length >= 3 && window.length <= 4).length;

  const used = suggestedPTO.length;
  const yieldScore = used ? vacationDays / used : 0;
  const unused = Math.max(annualTotal - used, 0);

  let unusedRisk = "Low";
  if (unused > 6) {
    unusedRisk = "High";
  } else if (unused > 3) {
    unusedRisk = "Medium";
  }

  return {
    yieldScore,
    longestBreak,
    microBreaks,
    unusedRisk,
    vacationDays
  };
}

function buildOffdaySet(activeHolidays, ptoDates) {
  const offSet = new Set();

  for (let month = 0; month < 12; month += 1) {
    const daysInMonth = new Date(YEAR, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(YEAR, month, day);
      if (date.getDay() === 0 || date.getDay() === 6) {
        offSet.add(formatISODate(date));
      }
    }
  }

  activeHolidays.forEach((holiday) => offSet.add(holiday.date));
  ptoDates.forEach((date) => offSet.add(date));

  return offSet;
}

function getBreakWindows(offSet) {
  const windows = [];
  let cursor = new Date(YEAR, 0, 1);
  const end = new Date(YEAR, 11, 31);

  while (cursor <= end) {
    const iso = formatISODate(cursor);
    if (!offSet.has(iso)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    const start = iso;
    let length = 0;
    while (cursor <= end && offSet.has(formatISODate(cursor))) {
      length += 1;
      cursor.setDate(cursor.getDate() + 1);
    }

    const endDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    windows.push({
      start,
      end: formatISODate(endDate),
      length
    });
  }

  return windows;
}

function updateEnergyLine(metrics) {
  if (!strategies.length) {
    energyLineEl.textContent = "Increase accrual or enable more holidays to generate vacation plays.";
    return;
  }

  const top = strategies[0];
  energyLineEl.textContent = `${top.name} is currently strongest: ${top.ptoDays} PTO day(s) unlock ${top.vacationDays} off day(s) with a ${metrics.yieldScore.toFixed(1)}x portfolio yield.`;
}

function renderSuggestions() {
  if (!strategies.length) {
    suggestionsList.innerHTML = '<div class="empty-state">No strategies yet. Increase PTO budget or add holidays.</div>';
    return;
  }

  suggestionsList.innerHTML = strategies
    .map((strategy) => {
      const activeClass = strategy.name === selectedStrategyName ? "active" : "";
      const range = formatDateRange(strategy.dates);

      return `
      <article class="suggestion-card ${activeClass}" data-strategy="${strategy.name}" tabindex="0" role="button" aria-pressed="${strategy.name === selectedStrategyName}">
        <div class="suggestion-top">
          <h4>${strategy.name}</h4>
          <span class="badge pto">${strategy.ptoDays} PTO</span>
        </div>
        <p class="suggestion-body">Spend ${strategy.ptoDays} PTO day(s) to access ${strategy.vacationDays} total off day(s), with a longest break of ${strategy.longest} day(s).</p>
        <div class="suggestion-meta">
          <span class="badge yield">Yield ${strategy.yieldScore.toFixed(1)}x</span>
          <span class="meta-pill">Window ${range}</span>
          <span class="meta-pill">${strategy.micro} micro-break(s)</span>
        </div>
      </article>
      `;
    })
    .join("");
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  const activeHolidays = getActiveHolidays();

  const holidayByDate = activeHolidays.reduce((map, holiday) => {
    map[holiday.date] = holiday.name;
    return map;
  }, {});

  const ptoSet = new Set(suggestedPTO);
  const selectedStrategy = strategies.find((strategy) => strategy.name === selectedStrategyName);
  const selectedSet = new Set(selectedStrategy ? selectedStrategy.dates : []);

  for (let month = 0; month < 12; month += 1) {
    const monthCard = document.createElement("article");
    monthCard.className = "month-card";

    const monthName = document.createElement("h4");
    monthName.textContent = MONTHS[month];
    monthCard.appendChild(monthName);

    const weekdayRow = document.createElement("div");
    weekdayRow.className = "weekday-row";

    WEEKDAYS.forEach((day) => {
      const dayNode = document.createElement("div");
      dayNode.className = "weekday";
      dayNode.textContent = day;
      weekdayRow.appendChild(dayNode);
    });

    monthCard.appendChild(weekdayRow);

    const grid = document.createElement("div");
    grid.className = "days-grid";

    const firstDay = new Date(YEAR, month, 1).getDay();
    const daysInMonth = new Date(YEAR, month + 1, 0).getDate();

    for (let slot = 0; slot < firstDay; slot += 1) {
      const empty = document.createElement("div");
      empty.className = "day empty";
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(YEAR, month, day);
      const iso = formatISODate(date);
      const node = document.createElement("div");
      node.className = "day";
      node.textContent = String(day);

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const holidayName = holidayByDate[iso];
      const isPTO = ptoSet.has(iso);
      const isFocus = selectedSet.has(iso);

      if (isWeekend) {
        node.classList.add("weekend");
      }

      if (holidayName) {
        node.classList.add("holiday");
        node.dataset.note = holidayName;
      }

      if (isPTO) {
        node.classList.add("pto-suggested");
      }

      if (isFocus) {
        node.classList.add("focus");

        const next = new Date(YEAR, month, day + 1);
        const nextIso = formatISODate(next);
        if (selectedSet.has(nextIso)) {
          node.classList.add("link-right");
        }

        if (!holidayName) {
          node.dataset.note = selectedStrategyName;
        }
      }

      grid.appendChild(node);
    }

    monthCard.appendChild(grid);
    calendarGrid.appendChild(monthCard);
  }
}

function formatDateRange(dateList) {
  if (!dateList.length) {
    return "-";
  }

  if (dateList.length === 1) {
    return shortenDate(dateList[0]);
  }

  const first = dateList[0];
  const last = dateList[dateList.length - 1];
  return `${shortenDate(first)}-${shortenDate(last)}`;
}

function shortenDate(isoDate) {
  const date = parseISODate(isoDate);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function parseISODate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatISODate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

init();
