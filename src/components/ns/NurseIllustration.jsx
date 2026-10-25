// A drawn portrait for the landing screen, so no stock photo has to ship with the app.
export default function NurseIllustration() {
  return (
    <svg viewBox="0 0 320 340" className="ns-hero-art" role="img" aria-label="Smiling nurse in navy scrubs with a stethoscope">
      <defs>
        <linearGradient id="nsArc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1FA98D" />
          <stop offset="1" stopColor="#0B4D47" />
        </linearGradient>
        <linearGradient id="nsScrub" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24456F" />
          <stop offset="1" stopColor="#162E4F" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="190" r="140" fill="url(#nsArc)" opacity="0.55" />
      <path d="M40 340c0-70 52-104 120-104s120 34 120 104z" fill="url(#nsScrub)" />
      <path d="M128 236l32 46 32-46" fill="#1B3A63" />
      <rect x="143" y="196" width="34" height="46" rx="14" fill="#7A4A32" />
      <ellipse cx="160" cy="146" rx="52" ry="60" fill="#8B563A" />
      <path d="M104 142c-6-52 28-84 62-84 40 0 62 34 54 84-8-26-22-44-56-44-30 0-48 18-60 44z" fill="#1A1210" />
      <circle cx="160" cy="46" r="22" fill="#1A1210" />
      <path d="M104 142c-4 30 2 54 12 70-12-6-20-30-20-60 0-12 4-22 8-10z" fill="#1A1210" />
      <path d="M216 142c4 30-2 54-12 70 12-6 20-30 20-60 0-12-4-22-8-10z" fill="#1A1210" />
      <ellipse cx="141" cy="150" rx="5" ry="6" fill="#1A1210" />
      <ellipse cx="179" cy="150" rx="5" ry="6" fill="#1A1210" />
      <path d="M136 176c10 14 38 14 48 0-4 20-44 20-48 0z" fill="#fff" />
      <path d="M134 176c12 20 40 20 52 0" fill="none" stroke="#4A2616" strokeWidth="3" strokeLinecap="round" />
      <path d="M118 238c-8 30-4 60 14 74" fill="none" stroke="#C9D3DC" strokeWidth="5" strokeLinecap="round" />
      <path d="M202 238c8 30 4 60-14 74" fill="none" stroke="#C9D3DC" strokeWidth="5" strokeLinecap="round" />
      <circle cx="160" cy="316" r="9" fill="#C9D3DC" />
      <path d="M62 340c4-44 28-62 56-70M258 340c-4-44-28-62-56-70" fill="none" stroke="#162E4F" strokeWidth="26" strokeLinecap="round" opacity="0.0" />
    </svg>
  );
}
