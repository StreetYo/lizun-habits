import { keyboard, language, ready, settings } from '/__sdk/index.js';
import { dayKey, nextRollover } from './days.js';
import { activityFor, showActivity } from './live.js';
import { buildRow } from './row.js';
import * as store from './store.js';
import { TEXTS } from './texts.js';

/** How long "Delete?" waits for the second click. */
const ARM_TIME = 3000;
/** Long timers drift while the computer sleeps, so the day is checked at least this often. */
const MAX_WAIT = 60 * 60 * 1000;

const title = document.getElementById('title');
const status = document.getElementById('status');
const input = document.getElementById('add');
const list = document.getElementById('list');
const empty = document.getElementById('empty');

/** Texts in Lizun's language, or in English for a language the widget does not know. */
let text = TEXTS.en;
let dateFormat;
let options;
/** Color for secondary text, from the island theme. */
let secondary;

/** @type {{ id: string, name: string, created: number }[]} */
let habits = [];
/** @type {Map<string, Set<string>>} checked days by habit id */
let history = new Map();
/** The current day, `YYYY-MM-DD`. */
let today;
let loaded = false;
let loadFailed = false;

/** The habit whose menu is open, the one waiting for a second delete click, the one being renamed. */
let menuId = null;
let armedId = null;
let armTimer;
let editingId = null;

function setLanguage(code) {
  text = TEXTS[code] ?? TEXTS.en;
  try {
    dateFormat = new Intl.DateTimeFormat(code, { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    dateFormat = new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}

function disarm() {
  clearTimeout(armTimer);
  armedId = null;
}

const on = {
  toggle(habit, day) {
    const days = history.get(habit.id);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    store.saveHistory(habit.id, days);
    render();
  },
  menu(habit) {
    menuId = menuId === habit.id ? null : habit.id;
    disarm();
    render();
  },
  rename(habit) {
    menuId = null;
    disarm();
    editingId = habit.id;
    renderList();
    const field = list.querySelector('.rename');
    field?.focus();
    field?.select();
  },
  /** `value` null cancels; `release` hands the keyboard back, for Enter. */
  renameDone(habit, value, release = false) {
    if (editingId !== habit.id) return;
    editingId = null;
    const name = value?.trim().slice(0, store.MAX_NAME);
    if (name && name !== habit.name) {
      habit.name = name;
      store.saveHabits(habits);
    }
    render();
    if (release) keyboard.release();
  },
  move(habit, step) {
    const from = habits.indexOf(habit);
    const to = from + step;
    if (to < 0 || to >= habits.length) return;
    [habits[from], habits[to]] = [habits[to], habits[from]];
    store.saveHabits(habits);
    render();
    list.querySelector(`[data-id="${habit.id}"]`)?.scrollIntoView({ block: 'nearest' });
  },
  arm(habit) {
    disarm();
    armedId = habit.id;
    armTimer = setTimeout(() => {
      armedId = null;
      render();
    }, ARM_TIME);
    render();
  },
  remove(habit) {
    disarm();
    menuId = null;
    habits = habits.filter((h) => h !== habit);
    history.delete(habit.id);
    store.saveHabits(habits);
    store.removeHistory(habit.id);
    render();
  },
};

function renderList() {
  const scroll = list.scrollTop;
  list.replaceChildren(
    ...habits.map((habit, index) =>
      buildRow(habit, history.get(habit.id), {
        today,
        text,
        dateFormat,
        index,
        count: habits.length,
        menuOpen: menuId === habit.id,
        armed: armedId === habit.id,
        editing: editingId === habit.id,
        on,
      }),
    ),
  );
  list.scrollTop = scroll;
}

function render() {
  showActivity(activityFor({ habits, history, today, options, text, secondary }));

  const done = habits.filter((habit) => history.get(habit.id).has(today)).length;
  const allDone = habits.length > 0 && done === habits.length;
  title.textContent = text.title;
  status.textContent = store.hasFailed()
    ? text.notSaved
    : allDone
      ? text.allDone
      : habits.length
        ? `${done}/${habits.length}`
        : '';
  status.classList.toggle('error', store.hasFailed());
  status.classList.toggle('done', allDone && !store.hasFailed());

  input.disabled = !loaded;
  input.placeholder = habits.length >= store.MAX_HABITS ? text.full(store.MAX_HABITS) : text.add;
  empty.hidden = habits.length > 0;
  empty.textContent = loadFailed ? text.loadFailed : text.empty;

  // The field being typed in would lose its text and focus; the list is drawn when the rename ends.
  if (!editingId) renderList();
}

/** Moves to the new day when it has begun. */
function checkDay() {
  const key = dayKey(new Date(), options.dayStartHour);
  if (key === today) return;
  today = key;
  render();
}

let dayTimer;

/** Wakes up just after the next day begins (or within the hour, whichever comes first). */
function scheduleDayCheck() {
  clearTimeout(dayTimer);
  const now = new Date();
  const wait = Math.min(nextRollover(now, options.dayStartHour) - now + 500, MAX_WAIT);
  dayTimer = setTimeout(() => {
    checkDay();
    scheduleDayCheck();
  }, wait);
}

// Enter adds the habit and keeps the field ready for the next one; Enter in an empty field, or
// Esc, hands the keyboard back to the app you were working in.
input.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const name = input.value.trim().slice(0, store.MAX_NAME);
  if (!name) {
    keyboard.release();
    return;
  }
  input.value = '';
  if (habits.length >= store.MAX_HABITS) return;
  const habit = { id: store.newId(), name, created: Date.now() };
  habits = [...habits, habit];
  history.set(habit.id, new Set());
  store.saveHabits(habits);
  render();
  list.lastElementChild?.scrollIntoView({ block: 'nearest' });
});

// A click anywhere outside the open menu closes it. Capture runs before the clicked button's own
// handler, which still runs and can open another menu.
document.addEventListener(
  'click',
  (event) => {
    if (!menuId || event.target.closest?.('.menu-open')) return;
    menuId = null;
    disarm();
    render();
  },
  true,
);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && menuId) {
    menuId = null;
    disarm();
    render();
  }
  checkDay();
  scheduleDayCheck();
});

const context = await ready();
setLanguage(context.language);
language.subscribe((next) => {
  setLanguage(next);
  render();
});
options = context.settings;
secondary = context.theme.textSecondary;
settings.subscribe((next) => {
  options = next;
  checkDay();
  scheduleDayCheck();
  render();
});
store.onSaveStatus(render);

today = dayKey(new Date(), options.dayStartHour);
try {
  ({ habits, history } = await store.load());
  loaded = true;
} catch (error) {
  // Saving over history that could not be read would lose it, so the widget stays read-only.
  console.warn('could not load the habits', error);
  loadFailed = true;
}
render();
scheduleDayCheck();
