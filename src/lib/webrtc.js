// Free public STUN servers only — no TURN, no paid relay service.
// This resolves each peer's public IP/port for NAT traversal, which is
// enough on most WiFi and many mobile connections. It will NOT work behind
// symmetric/carrier-grade NAT (common on some Nigerian mobile data
// connections), since that needs a TURN relay to punch through. If calls
// fail to connect specifically on mobile data, that's the likely cause —
// the fix later is adding a TURN server (coturn, self-hosted, or a paid
// service like Agora/Twilio), not a code bug.
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};
