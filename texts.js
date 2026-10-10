/** Russian plural form for `count`: one (1, 21), few (2–4, 22–24) or many (5–20, 25…). */
function ruPlural(count, one, few, many) {
  const tens = count % 100;
  const units = count % 10;
  if (tens >= 11 && tens <= 14) return many;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
}

/** The widget's own texts by language; the manifest translates its name and settings. */
export const TEXTS = {
  en: {
    title: 'Habits',
    add: 'Add a habit',
    full: (max) => `At most ${max} habits`,
    empty: 'No habits yet. Add one above.',
    loadFailed: 'Could not load the habits.',
    allDone: 'All done',
    notSaved: 'Not saved',
    markDone: 'Done today',
    markNotDone: 'Not done today',
    streak: (count) => (count === 0 ? 'No streak yet' : count === 1 ? '1 day in a row' : `${count} days in a row`),
    day: (date, done) => (done ? `${date}: done` : date),
    more: 'More',
    close: 'Close',
    rename: 'Rename',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Delete',
    confirmRemove: 'Delete?',
    confirmHint: 'Click again to delete the habit and its history',
  },
  ru: {
    title: 'Привычки',
    add: 'Добавить привычку',
    full: (max) => `Не больше ${max} привычек`,
    empty: 'Привычек пока нет. Добавьте выше.',
    loadFailed: 'Не удалось загрузить привычки.',
    allDone: 'Всё сделано',
    notSaved: 'Не сохранено',
    markDone: 'Сделано сегодня',
    markNotDone: 'Не сделано сегодня',
    streak: (count) =>
      count === 0 ? 'Серии пока нет' : `${count} ${ruPlural(count, 'день', 'дня', 'дней')} подряд`,
    day: (date, done) => (done ? `${date}: сделано` : date),
    more: 'Ещё',
    close: 'Закрыть',
    rename: 'Переименовать',
    moveUp: 'Выше',
    moveDown: 'Ниже',
    remove: 'Удалить',
    confirmRemove: 'Удалить?',
    confirmHint: 'Нажмите ещё раз, чтобы удалить привычку и её историю',
  },
};
