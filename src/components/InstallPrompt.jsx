import { useEffect, useState } from 'react';

// Shows an "Install app" pill when the browser says NurseShift can be installed.
export default function InstallPrompt() {
  const [evt, setEvt] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setEvt(e);
    };
    const onInstalled = () => setEvt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!evt) return null;

  async function install() {
    evt.prompt();
    await evt.userChoice.catch(() => {});
    setEvt(null);
  }

  return (
    <button type="button" className="install-pill clock-btn" onClick={install}>
      ⬇ Install app
    </button>
  );
}
