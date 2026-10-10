import { addDays, keyToDate, streak } from './days.js';
import { MAX_NAME } from './store.js';

/** Days shown as dots, today included. */
const WEEK = 7;

function icon(name) {
  const element = document.createElement('span');
  element.className = `icon i-${name}`;
  return element;
}

function button(className, title, onClick, ...children) {
  const element = document.createElement('button');
  element.className = className;
  element.title = title;
  element.append(...children);
  element.addEventListener('click', onClick);
  return element;
}

function span(className, ...children) {
  const element = document.createElement('span');
  element.className = className;
  element.append(...children);
  return element;
}

function renameField(habit, on) {
  const field = document.createElement('input');
  field.className = 'rename';
  field.type = 'text';
  field.maxLength = MAX_NAME;
  field.autocomplete = 'off';
  field.spellcheck = false;
  field.value = habit.name;
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      on.renameDone(habit, field.value, true);
    } else if (event.key === 'Escape') {
      // Not prevented: the SDK hands the keyboard back on Esc.
      on.renameDone(habit, null);
    }
  });
  field.addEventListener('blur', () => on.renameDone(habit, field.value));
  return field;
}

function streakBadge(count, text) {
  const badge = span(count >= 2 ? 'streak hot' : 'streak');
  badge.title = text.streak(count);
  if (count >= 2) badge.append(icon('flame'));
  if (count > 0) badge.append(String(count));
  return badge;
}

function week(habit, days, view) {
  const { today, text, dateFormat, on } = view;
  const dots = span('week');
  for (let back = WEEK - 1; back >= 0; back--) {
    const day = addDays(today, -back);
    const done = days.has(day);
    const className = `day${done ? ' on' : ''}${back === 0 ? ' today' : ''}`;
    dots.append(button(className, text.day(dateFormat.format(keyToDate(day)), done), () => on.toggle(habit, day)));
  }
  return dots;
}

function actions(habit, view) {
  const { text, index, count, armed, on } = view;
  if (armed) return span('actions', button('confirm', text.confirmHint, () => on.remove(habit), text.confirmRemove));
  const up = button('action', text.moveUp, () => on.move(habit, -1), icon('up'));
  const down = button('action', text.moveDown, () => on.move(habit, 1), icon('down'));
  up.disabled = index === 0;
  down.disabled = index === count - 1;
  return span(
    'actions',
    button('action', text.rename, () => on.rename(habit), icon('pencil')),
    up,
    down,
    button('action delete', text.remove, () => on.arm(habit), icon('trash')),
  );
}

/**
 * One habit: today's check, the name, the streak and the last days as dots; with its menu open,
 * buttons to rename, move and delete it instead of the streak and the dots.
 */
export function buildRow(habit, days, view) {
  const { today, text, menuOpen, editing, on } = view;
  const doneToday = days.has(today);
  const item = document.createElement('li');
  item.className = `habit${doneToday ? ' done' : ''}${menuOpen ? ' menu-open' : ''}`;
  item.dataset.id = habit.id;

  const check = button('check', doneToday ? text.markNotDone : text.markDone, () => on.toggle(habit, today), icon('check'));
  check.setAttribute('aria-pressed', String(doneToday));
  item.append(check);

  if (editing) {
    item.append(renameField(habit, on));
    return item;
  }

  const name = span('name', habit.name);
  name.title = habit.name;
  item.append(name);
  if (menuOpen) item.append(actions(habit, view));
  else item.append(streakBadge(streak(days, today), text), week(habit, days, view));
  item.append(button('more', menuOpen ? text.close : text.more, () => on.menu(habit), icon(menuOpen ? 'close' : 'more')));
  return item;
}
