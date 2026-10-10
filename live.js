import { activity } from '/__sdk/index.js';
import { streak } from './days.js';

export const GREEN = '#30d158';
export const ORANGE = '#ff9f0a';

/** What the closed island should show, or null for nothing. */
export function activityFor({ habits, history, today, options, text, secondary }) {
  if (!options.showInIsland || habits.length === 0) return null;
  const left = habits.filter((habit) => !history.get(habit.id).has(today));
  if (left.length) {
    return {
      leading: { icon: 'list-checks' },
      title: left[0].name.slice(0, 100),
      trailing: { text: `${habits.length - left.length}/${habits.length}`, color: secondary },
    };
  }
  if (options.hideWhenDone) return null;
  const best = Math.max(...habits.map((habit) => streak(history.get(habit.id), today)));
  return {
    leading: { icon: 'check-circle', color: GREEN },
    title: text.allDone,
    trailing: best >= 2 ? { icon: 'fire', text: String(best), color: ORANGE } : undefined,
  };
}

/** What the closed island shows, to skip sending the same activity again. */
let shown;

export function showActivity(next) {
  const key = JSON.stringify(next);
  if (key === shown) return;
  shown = key;
  (next ? activity.set(next) : activity.clear()).catch((error) => {
    shown = undefined;
    console.warn('could not update the live activity', error);
  });
}
