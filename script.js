/**
 * 2026 PTO Maximizer Logic
 */

const DEFAULT_FEDERAL_HOLIDAYS = [
    { id: 'h1', date: '2026-01-01', name: "New Year's Day" },
    { id: 'h2', date: '2026-01-19', name: "Martin Luther King, Jr. Day" },
    { id: 'h3', date: '2026-02-16', name: "Presidents' Day" },
    { id: 'h4', date: '2026-05-25', name: "Memorial Day" },
    { id: 'h5', date: '2026-06-19', name: "Juneteenth" },
    { id: 'h6', date: '2026-07-03', name: "Independence Day (Observed)" },
    { id: 'h7', date: '2026-09-07', name: "Labor Day" },
    { id: 'h8', date: '2026-10-12', name: "Columbus Day" },
    { id: 'h9', date: '2026-11-11', name: "Veterans Day" },
    { id: 'h10', date: '2026-11-26', name: "Thanksgiving Day" },
    { id: 'h11', date: '2026-12-25', name: "Christmas Day" }
];

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// State
let accrualRate = 1.5;
let aggressiveness = 2;
let observedHolidays = []; // IDs of standard holidays
let customHolidays = [];    // Array of {name, date}
let suggestedPTO = [];
let strategies = [];

// DOM Elements
const accrualInput = document.getElementById('accrual-rate');
const aggressivenessInput = document.getElementById('aggressiveness');
const aggressivenessLabel = document.getElementById('aggressiveness-label');
const annualTotalEl = document.getElementById('annual-total');
const ptoRemainingEl = document.getElementById('pto-remaining');
const ptoUsedEl = document.getElementById('pto-used');
const calendarGrid = document.getElementById('calendar-grid');
const suggestionsList = document.getElementById('suggestions-list');
const holidayToggleList = document.getElementById('holiday-toggle-list');
const customHolidaysList = document.getElementById('custom-holidays-list');
const customHName = document.getElementById('custom-h-name');
const customHDate = document.getElementById('custom-h-date');
const addCustomHBtn = document.getElementById('add-custom-h');

/**
 * Initialize App
 */
function init() {
    loadState();

    accrualInput.addEventListener('input', handleAccrualChange);
    aggressivenessInput.addEventListener('input', handleAggressivenessChange);
    addCustomHBtn.addEventListener('click', handleAddCustomHoliday);

    renderHolidayControls();
    updateDashboard();
}

function loadState() {
    const saved = localStorage.getItem('pto-planner-state');
    if (saved) {
        const state = JSON.parse(saved);
        accrualRate = state.accrualRate || 1.5;
        aggressiveness = state.aggressiveness || 2;
        observedHolidays = state.observedHolidays || DEFAULT_FEDERAL_HOLIDAYS.map(h => h.id);
        customHolidays = state.customHolidays || [];

        accrualInput.value = accrualRate;
        aggressivenessInput.value = aggressiveness;
        const labels = ["Low", "Medium", "High"];
        aggressivenessLabel.textContent = labels[aggressiveness - 1];
    } else {
        observedHolidays = DEFAULT_FEDERAL_HOLIDAYS.map(h => h.id);
    }
}

function saveState() {
    const state = {
        accrualRate,
        aggressiveness,
        observedHolidays,
        customHolidays
    };
    localStorage.setItem('pto-planner-state', JSON.stringify(state));
}

function handleAccrualChange(e) {
    accrualRate = parseFloat(e.target.value) || 0;
    saveState();
    updateDashboard();
}

function handleAggressivenessChange(e) {
    aggressiveness = parseInt(e.target.value);
    const labels = ["Low", "Medium", "High"];
    aggressivenessLabel.textContent = labels[aggressiveness - 1];
    saveState();
    updateDashboard();
}

function handleAddCustomHoliday() {
    const name = customHName.value.trim();
    const date = customHDate.value;
    if (name && date) {
        customHolidays.push({ name, date, id: 'c' + Date.now() });
        customHName.value = '';
        customHDate.value = '';
        saveState();
        renderHolidayControls();
        updateDashboard();
    }
}

function toggleHoliday(id) {
    if (observedHolidays.includes(id)) {
        observedHolidays = observedHolidays.filter(h => h !== id);
    } else {
        observedHolidays.push(id);
    }
    saveState();
    updateDashboard();
}

function removeCustomHoliday(id) {
    customHolidays = customHolidays.filter(h => h.id !== id);
    saveState();
    renderHolidayControls();
    updateDashboard();
}

function renderHolidayControls() {
    // Standard Holidays
    holidayToggleList.innerHTML = DEFAULT_FEDERAL_HOLIDAYS.map(h => `
        <label class="holiday-toggle-item">
            <input type="checkbox" ${observedHolidays.includes(h.id) ? 'checked' : ''} 
                   onchange="toggleHoliday('${h.id}')">
            <span>${h.name}</span>
        </label>
    `).join('');

    // Custom Holidays
    customHolidaysList.innerHTML = customHolidays.map(h => `
        <div class="custom-h-item">
            <span>${h.name} (${h.date})</span>
            <button class="remove-btn" onclick="removeCustomHoliday('${h.id}')">&times;</button>
        </div>
    `).join('');
}

function getActiveHolidays() {
    const standard = DEFAULT_FEDERAL_HOLIDAYS.filter(h => observedHolidays.includes(h.id));
    return [...standard, ...customHolidays];
}

function updateDashboard() {
    const annualTotal = accrualRate * 12;
    annualTotalEl.textContent = annualTotal.toFixed(1);

    calculateOptimalPTO(annualTotal);

    ptoUsedEl.textContent = suggestedPTO.length;
    ptoRemainingEl.textContent = (annualTotal - suggestedPTO.length).toFixed(1);

    renderSuggestions();
    renderCalendar();
}

/**
 * Strategy Engine: Finds best ways to use PTO
 */
function calculateOptimalPTO(budget) {
    suggestedPTO = [];
    strategies = [];

    const activeHolidays = getActiveHolidays();

    // Level 1 Strategy: Always include Bridge Days (Holiday on Tue or Thu)
    activeHolidays.forEach(h => {
        const date = new Date(h.date + 'T00:00:00');
        const dayOfWeek = date.getDay();

        if (dayOfWeek === 2) {
            const bridgeDate = new Date(date);
            bridgeDate.setDate(date.getDate() - 1);
            addPTOIfPossible(bridgeDate, `Bridge for ${h.name}`, budget);
        } else if (dayOfWeek === 4) {
            const bridgeDate = new Date(date);
            bridgeDate.setDate(date.getDate() + 1);
            addPTOIfPossible(bridgeDate, `Bridge for ${h.name}`, budget);
        }
    });

    // Level 2 Strategy: Extended weekends for Mon/Fri holidays
    if (aggressiveness >= 2) {
        activeHolidays.forEach(h => {
            const date = new Date(h.date + 'T00:00:00');
            const dayOfWeek = date.getDay();

            if (dayOfWeek === 1) {
                const fri = new Date(date);
                fri.setDate(date.getDate() - 3);
                addPTOIfPossible(fri, `4-Day ${h.name} Weekend`, budget);
            } else if (dayOfWeek === 5) {
                const mon = new Date(date);
                mon.setDate(date.getDate() + 3);
                addPTOIfPossible(mon, `4-Day ${h.name} Weekend`, budget);
            }
        });

        // Thanksgiving Friday (Only if Thanksgiving is active)
        const thanksgiving = activeHolidays.find(h => h.name === "Thanksgiving Day");
        if (thanksgiving) {
            const fri = new Date(thanksgiving.date + 'T00:00:00');
            fri.setDate(fri.getDate() + 1);
            addPTOIfPossible(fri, "Thanksgiving Break", budget);
        }
    }

    // Level 3 Strategy: Full Week Straddles
    if (aggressiveness >= 3) {
        // Christmas / New Year Stretch (Only if Christmas is active)
        if (activeHolidays.some(h => h.name === "Christmas Day")) {
            const winterDates = ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31'];
            winterDates.forEach(d => {
                addPTOIfPossible(new Date(d + 'T00:00:00'), "Holiday Season Mega-Break", budget);
            });
        }

        // Independence Day week (Only if active)
        if (activeHolidays.some(h => h.name.includes("Independence"))) {
            const july4thWeek = ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02'];
            july4thWeek.forEach(d => {
                addPTOIfPossible(new Date(d + 'T00:00:00'), "Summer Week Off", budget);
            });
        }
    }
}

function addPTOIfPossible(date, reason, budget) {
    const dStr = formatDate(date);
    if (!suggestedPTO.includes(dStr) && suggestedPTO.length < Math.floor(budget)) {
        suggestedPTO.push(dStr);

        // Find if this strategy already exists in list
        let strategy = strategies.find(s => s.name === reason);
        if (!strategy) {
            strategy = { name: reason, dates: [], savings: 0 };
            strategies.push(strategy);
        }
        strategy.dates.push(dStr);
    }
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * UI Rendering
 */
function renderSuggestions() {
    if (strategies.length === 0) {
        suggestionsList.innerHTML = '<div class="empty-state">Adjust your accrual to see more strategies!</div>';
        return;
    }

    suggestionsList.innerHTML = strategies.map(s => `
        <div class="suggestion-card">
            <div class="suggestion-header">
                <span class="suggestion-title">${s.name}</span>
                <span class="suggestion-badge">${s.dates.length} Days</span>
            </div>
            <div class="suggestion-info">
                Use <strong>${s.dates.length}</strong> day(s) to get a longer break.
            </div>
        </div>
    `).join('');
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    const activeHolidays = getActiveHolidays();

    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';

        const monthName = document.createElement('div');
        monthName.className = 'month-name';
        monthName.textContent = MONTHS[month];
        monthContainer.appendChild(monthName);

        const weekdayHeader = document.createElement('div');
        weekdayHeader.className = 'weekday-header';
        WEEKDAYS.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'weekday';
            dayEl.textContent = day;
            weekdayHeader.appendChild(dayEl);
        });
        monthContainer.appendChild(weekdayHeader);

        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';

        const firstDay = new Date(2026, month, 1).getDay();
        const daysInMonth = new Date(2026, month + 1, 0).getDate();

        // Empty slots for start of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            daysGrid.appendChild(emptyDay);
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.textContent = day;

            const date = new Date(2026, month, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const holiday = activeHolidays.find(h => h.date === dateStr);
            const isPTO = suggestedPTO.includes(dateStr);

            if (isWeekend) dayEl.classList.add('weekend');
            if (holiday) {
                dayEl.classList.add('holiday');
                dayEl.setAttribute('data-holiday', holiday.name);
            }
            if (isPTO) dayEl.classList.add('pto-suggested');

            daysGrid.appendChild(dayEl);
        }

        monthContainer.appendChild(daysGrid);
        calendarGrid.appendChild(monthContainer);
    }
}

// Start
init();
