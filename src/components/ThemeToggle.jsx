import { useState } from 'react';

// Three looks, one tap each: light -> dark -> forest (green & gold) -> light.
// "forest" is dark plus its own colours, so both classes sit on <html>.
const ICON = { light: '🌙', dark: '🌿', forest: '☀️' }; // shows what the next tap switches to
const NEXT = { light: 'dark', dark: 'forest', forest: 'light' };
const NAME = { light: 'Light mode', dark: 'Dark mode', forest: 'Forest mode' };
const BAR = { light: '#0E4B40', dark: '#0B3A32', forest: '#0a1f1d' };

const current = () => {
  const c = document.documentElement.classList;
  return c.contains('forest') ? 'forest' : c.contains('dark') ? 'dark' : 'light';
};

export default function ThemeToggle() {
  const [mode, setMode] = useState(current);

  function toggle() {
    const next = NEXT[mode];
    setMode(next);
    const c = document.documentElement.classList;
    c.toggle('dark', next !== 'light');
    c.toggle('forest', next === 'forest');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[next]);
    try {
      localStorage.setItem('nurseshift_theme', next);
    } catch {
      /* storage unavailable: the choice just will not be remembered */
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${NAME[NEXT[mode]].toLowerCase()}`}
      title={NAME[NEXT[mode]]}
      onClick={toggle}
    >
      {ICON[mode]}
    </button>
  );
}
