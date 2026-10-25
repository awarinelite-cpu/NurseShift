import { useEffect } from 'react';
import Icon from './Icon';

export default function Sheet({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ns-sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="ns-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="ns-sheet">
        <div className="ns-sheet-head">
          <h2>{title}</h2>
          <button type="button" className="ns-icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="ns-sheet-body">{children}</div>
      </div>
    </div>
  );
}
