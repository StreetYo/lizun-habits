import { storage } from '/__sdk/index.js';

/** A list short enough to read at a glance in the island. */
export const MAX_HABITS = 12;
export const MAX_NAME = 60;

/** About ten years of checks a habit: some 48 KB, well under the 1 MB of one stored value. */
const MAX_DAYS = 3660;

/** The list of habits: `[{ id, name, created }]`, `created` a timestamp in ms. */
const HABITS_KEY = 'habits';
/** One key per habit with its checked days, sorted `YYYY-MM-DD` strings, so a check rewrites only that habit. */
const historyKey = (id) => `history.${id}`;

const ID = /^[a-z0-9]{1,24}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function validHabit(habit) {
  return habit && typeof habit.id === 'string' && ID.test(habit.id) && typeof habit.name === 'string';
}

/** The habits and a `Map` of id to the `Set` of its checked days. Rejects when storage fails. */
export async function load() {
  const stored = await storage.get(HABITS_KEY);
  const habits = (Array.isArray(stored) ? stored.filter(validHabit) : [])
    .slice(0, MAX_HABITS)
    .map(({ id, name, created }) => ({ id, name: name.slice(0, MAX_NAME), created: Number(created) || Date.now() }));
  const lists = await Promise.all(habits.map((habit) => storage.get(historyKey(habit.id))));
  const history = new Map(
    habits.map((habit, index) => {
      const days = Array.isArray(lists[index]) ? lists[index].filter((day) => typeof day === 'string' && DAY.test(day)) : [];
      return [habit.id, new Set(days)];
    }),
  );
  return { habits, history };
}

/** Keys whose last write failed; the widget says "Not saved" while there are any. */
const failing = new Set();
let onChange = () => {};

export const hasFailed = () => failing.size > 0;

/** Called when saving starts or stops failing. */
export function onSaveStatus(listener) {
  onChange = listener;
}

/** Writes to one key go one after another, so a quick double toggle cannot land out of order. */
const queues = new Map();

function write(key, run) {
  const queue = (queues.get(key) ?? Promise.resolve()).then(run).then(
    () => failing.delete(key) && onChange(),
    (error) => {
      console.warn(`could not save ${key}`, error);
      if (!failing.has(key)) {
        failing.add(key);
        onChange();
      }
    },
  );
  queues.set(key, queue);
}

export function saveHabits(habits) {
  const value = habits.map(({ id, name, created }) => ({ id, name, created }));
  write(HABITS_KEY, () => storage.set(HABITS_KEY, value));
}

export function saveHistory(id, days) {
  const value = [...days].sort().slice(-MAX_DAYS);
  write(historyKey(id), () => storage.set(historyKey(id), value));
}

export function removeHistory(id) {
  write(historyKey(id), () => storage.remove(historyKey(id)));
}
