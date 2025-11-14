const { generateAgoraRtcToken } = require('../agoraToken');
let officialBuilder;
try {
  officialBuilder = require('agora-access-token');
} catch (e) {
  console.warn('agora-access-token not installed or failed to load:', e.message || e);
}

const APP_ID = process.env.AGORA_APP_ID || '4a410e05b4554ec1a81555f44bc3228e';
const APP_CERT = process.env.AGORA_APP_CERTIFICATE || '02f9818234cb497d8ec7770cec6ffb82';
const channel = 'finmentor-channel';
const uid = 12345;

console.log('App ID:', APP_ID);
console.log('App Cert length:', APP_CERT.length);

if (officialBuilder) {
  try {
    const { RtcTokenBuilder, RtcRole } = officialBuilder;
    const role = RtcRole.PUBLISHER || 1;
    const expireSeconds = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireSeconds;
    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERT, channel, uid, role, privilegeExpireTime);
    console.log('Official package token:', token.slice(0,40) + '...');
  } catch (e) {
    console.error('Official builder failed:', e);
  }
}

try {
  const token2 = generateAgoraRtcToken(APP_ID, APP_CERT, channel, uid, { expireSeconds: 3600 });
  console.log('Custom builder token:', token2.slice(0,40) + '...');
} catch (e) {
  console.error('Custom builder failed:', e);
}
