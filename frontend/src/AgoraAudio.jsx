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
  // debug UI removed for production

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

      // Show a shorter, user-friendly message. If backend/error mentions a limit, show that specifically.
      const errMessage = (err && (err?.response?.data?.error || err?.message || '')) + '';
      if (/limit|max participants|quota|exceed/i.test(errMessage)) {
        setWarning('Limit reached with Agora');
      } else {
        setWarning('Joining Error');
      }
      setConnecting(false);
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
      {/* debug controls removed */}
      {warning && <div style={{ color: '#b44', fontSize: 13 }}>{warning}</div>}
      {/* debug info removed */}
    </div>
  );
}
