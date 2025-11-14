// frontend/src/AgoraAudio.jsx
import React, { useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import axios from "axios";

// backendUrl defaults to VITE_BACKEND_URL from env (set in .env.production for production)
const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function AgoraAudio({ channel = "finmentor-channel", overrideAppId = "", backendUrl = DEFAULT_BACKEND_URL }) {
  const clientRef = useRef(null);
  const localTrackRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [warning, setWarning] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(() => localStorage.getItem('FINMENTOR_DEBUG_AGORA') === '1');
  const [debugInfo, setDebugInfo] = useState(null);

  // Produce a safe, redacted summary from the token_inspect payload
  const summarizeInspect = (d) => {
    if (!d) return null;
    const appIdHex = String(d.appIdHex || d.appId || '');
    const mask = (s) => {
      if (!s) return '';
      if (s.length <= 12) return s;
      return `${s.slice(0,6)}...${s.slice(-6)}`;
    };
    const items = (d.message && d.message.items) ? d.message.items.map(it => ({ expireTs: it.expireTs || it.expire || null })) : [];
    return {
      tokenVersion: d.tokenVersion || d.token || null,
      appIdHexMasked: mask(appIdHex),
      tokenBase64Length: d.tokenBase64Length || null,
      messageCount: d.message && d.message.count || 0,
      items
    };
  };

  const pushLog = (msg, obj) => {
    const entry = typeof obj !== "undefined" ? `${msg} ${JSON.stringify(obj)}` : msg;
    console.log(entry);
  };

  const startVoice = async () => {
    try {
      if (joined && clientRef.current) {
        // leave
        try {
          if (localTrackRef.current) {
            await localTrackRef.current.close();
            localTrackRef.current = null;
          }
          await clientRef.current.leave();
        } catch (e) { console.warn('Error leaving channel', e); }
        clientRef.current = null;
        setJoined(false);
        setWarning('');
        pushLog('Left channel');
        return;
      }

      setConnecting(true);
      setWarning('Joining...');
      pushLog('Fetching token from backend...');
      const resp = await axios.get(`${backendUrl}/api/agora/token?channel=${channel}`);
      const data = resp.data || {};
      const backendToken = data.token ?? null;
      const backendAppId = data.appId ?? null;
      const uid = data.uid ?? Math.floor(Math.random() * 999999);

      // allow a localStorage override if present (advanced)
      const tokenOverride = localStorage.getItem('FINMENTOR_AGORA_TOKEN_OVERRIDE') || null;
      const appIdOverride = overrideAppId || localStorage.getItem('FINMENTOR_AGORA_APPID') || null;
      const tokenToUse = tokenOverride || backendToken || null;
      const appIdToUse = backendAppId || appIdOverride || null;

      if (!appIdToUse) {
        setWarning('No Agora App ID configured on server.');
        setConnecting(false);
        pushLog('Aborting join: missing appId');
        return;
      }

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        pushLog('Event user-published', { uid: user.uid, mediaType });
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') user.audioTrack && user.audioTrack.play();
      });

      pushLog('Attempting client.join()', { appIdToUse, channel, tokenPresent: !!tokenToUse, uid });
      await client.join(appIdToUse, channel, tokenToUse, uid);
      pushLog('client.join() succeeded');

      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      localTrackRef.current = mic;
      await client.publish([mic]);
      setJoined(true);
      setWarning('');
      setConnecting(false);
      pushLog('Published mic');
    } catch (err) {
      // Log full error info for easier debugging (Axios provides response data)
      console.error('Agora init error:', err);
      if (err && err.response) {
        console.error('Backend response status:', err.response.status);
        console.error('Backend response data:', err.response.data);
        pushLog('Agora init error (backend)', { status: err.response.status, data: err.response.data });
      } else {
        pushLog('Agora init error', { message: err?.message, code: err?.code || null });
      }

      setWarning('Failed to join Agora channel. Allow microphone and check console for details.');
      setConnecting(false);
      // Do NOT auto-fetch or display full token_inspect in the UI on error.
      // For safety, we clear any previous debug info — use the manual button to fetch a redacted summary.
      setDebugInfo(null);
    }
  };

  return (
    <div className="agora-audio" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px' }}>
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 8 }}>
        <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="#fff" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 11C19 14.53 16.39 17.44 13 17.93V21M12 21H13M13 21H11M5 11C5 14.87 8.13 18 12 18C15.87 18 19 14.87 19 11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="8" r="1" fill="#333"/>
      </svg>
      <button onClick={startVoice} disabled={connecting} className="voice-btn">
        🎤 {connecting ? 'Connecting...' : (joined ? 'Leave voice chat' : 'Start voice chat now')}
      </button>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <label style={{ fontSize: 12, color: '#ddd' }}>
          <input type="checkbox" checked={debugEnabled} onChange={(e) => { setDebugEnabled(e.target.checked); localStorage.setItem('FINMENTOR_DEBUG_AGORA', e.target.checked ? '1' : '0'); if (!e.target.checked) setDebugInfo(null); }} /> Enable debug
        </label>
        <button style={{ fontSize: 12 }} onClick={async () => {
          // Manual fetch: log full inspect to console, show only redacted summary in UI
          try {
            const r = await axios.get(`${backendUrl}/api/agora/token_inspect?channel=${channel}&debug=1`);
            console.log('Full token inspect (console only):', r.data);
            setDebugInfo(summarizeInspect(r.data));
          } catch (e) {
            setDebugInfo({ error: String(e?.message || e) });
            console.warn('Token inspect manual failed:', e?.message || e);
          }
        }}>Fetch token inspect</button>
      </div>
      {warning && <div style={{ color: '#b44', fontSize: 13 }}>{warning}</div>}
      {debugInfo && (
        <div style={{ background: '#111', color: '#fff', padding: 8, borderRadius: 6, marginTop: 8, width: '100%', overflowX: 'auto', fontSize: 12 }}>
          {debugInfo.error ? (
            <div style={{ color: '#f88' }}>Inspect error: {String(debugInfo.error)}</div>
          ) : (
            <div style={{ fontSize: 13 }}>
              <div><strong>Token Version:</strong> {debugInfo.tokenVersion}</div>
              <div><strong>App ID:</strong> {debugInfo.appIdHexMasked}</div>
              <div><strong>Token length:</strong> {debugInfo.tokenBase64Length}</div>
              <div><strong>Message count:</strong> {debugInfo.messageCount}</div>
              {Array.isArray(debugInfo.items) && debugInfo.items.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <strong>Items (expiry timestamps):</strong>
                  <ul>
                    {debugInfo.items.map((it, i) => <li key={i}>{it.expireTs || 'n/a'}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
