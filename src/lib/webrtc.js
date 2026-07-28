// Free public STUN servers only — no TURN, no paid relay service.
// This resolves each peer's public IP/port for NAT traversal, which is
// enough on most WiFi and many mobile connections. It will NOT work behind
// symmetric/carrier-grade NAT (common on some Nigerian mobile data
// connections), since that needs a TURN relay to punch through. If calls
// fail to connect specifically on mobile data, that's the likely cause —
// the fix later is adding a TURN server (coturn, self-hosted, or a paid
// service like Twilio/Cloudflare TURN, Agora), not a code bug.
//
// To add TURN later: set VITE_TURN_URL, VITE_TURN_USERNAME, and
// VITE_TURN_CREDENTIAL in .env.local (never hardcode credentials in this
// file), then uncomment the block below. Credentials from coturn's
// static-auth-secret setup expire, so if you self-host, generate them
// server-side per call rather than using one long-lived pair here.
const turnUrl = import.meta.env.VITE_TURN_URL;
const turnUsername = import.meta.env.VITE_TURN_USERNAME;
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    ...(turnUrl ? [{ urls: turnUrl, username: turnUsername, credential: turnCredential }] : []),
  ],
};
