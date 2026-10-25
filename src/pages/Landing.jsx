import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ns/Icon';
import NurseIllustration from '../components/ns/NurseIllustration';

const SLIDES = [
  'Connecting qualified nurses with trusted healthcare facilities across Nigeria.',
  'Browse open shifts near you and claim the ones that fit your week.',
  'Clock in, clock out and track every naira you earn in one place.',
  'Every nurse is license-checked, so facilities can book with confidence.',
];

export default function Landing() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="ns-landing">
      <div className="ns-landing-top">
        <div className="ns-logo">
          <Icon name="logo" size={46} strokeWidth={2.2} className="ns-logo-mark" />
          <span>Nurse<b>Shift</b></span>
        </div>
        <p className="ns-landing-tag">Flexible Shifts. Healthier Communities.</p>
      </div>

      <NurseIllustration />

      <div className="ns-landing-bottom">
        <p className="ns-landing-copy" aria-live="polite">{SLIDES[slide]}</p>
        <div className="ns-dots" role="tablist" aria-label="Highlights">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={`Highlight ${i + 1}`}
              className={i === slide ? 'on' : ''}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>
        <Link to="/signup" className="ns-btn ns-btn-green ns-btn-block">
          Get Started <Icon name="arrowRight" size={18} />
        </Link>
        <p className="ns-landing-login">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </main>
  );
}
