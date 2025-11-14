// backend/agoraToken.js
// Server-side Agora token utilities.
// - If AGORA_APP_CERTIFICATE is not present, tokenless mode returns null.
// - If `agora-access-token` is installed and certificate is provided,
//   this file will generate short-lived RTC/RTM tokens.

function generateAgoraRtcToken(appId, appCertificate, channelName, uid, opts = {}) {
  if (!appId) throw new Error('Agora App ID is required');

  // Tokenless mode when no certificate provided
  if (!appCertificate) return null;

  // Try to use the official token builder if available
  try {
    const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
    const role = (opts.role && opts.role === 'subscriber') ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const expireSeconds = Number(opts.expireSeconds || 3600);
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireSeconds;

    // buildTokenWithUid supports numeric uid; for string uid you can use buildTokenWithUserAccount
    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpireTime);
    return token;
  } catch (err) {
    // If builder not installed or failed, fall back to tokenless mode but log helpful message
    console.warn('agora-access-token not available or failed to build token:', err.message || err);
    return null;
  }
}

function generateAgoraRtmToken(appId, appCertificate, userAccount, opts = {}) {
  if (!appId) throw new Error('Agora App ID is required');
  if (!appCertificate) return null;

  try {
    const { RtmTokenBuilder, RtmRole } = require('agora-access-token');
    const expireSeconds = Number(opts.expireSeconds || 3600);
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireSeconds;
    const token = RtmTokenBuilder.buildToken(appId, appCertificate, userAccount, RtmRole.RTM_ROLE_USER, privilegeExpireTime);
    return token;
  } catch (err) {
    console.warn('agora-access-token not available or failed to build RTM token:', err.message || err);
    return null;
  }
}

const crypto = require('crypto');

// CRC32 implementation (small, self-contained)
function crc32(buf) {
  const table = crc32.table || (crc32.table = makeTable());
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeTable() {
  let c;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

function writeUInt16BE(buf, offset, val) {
  buf.writeUInt16BE(val, offset);
}

function writeUInt32BE(buf, offset, val) {
  buf.writeUInt32BE(val, offset);
}

function buildMessage(mapPrivileges) {
  // privilege map: { privilege: expireTs }
  // message format: number of items (uint16) followed by (uint16 privilege, uint32 expire)
  const count = Object.keys(mapPrivileges).length;
  const buf = Buffer.alloc(2 + count * 6);
  buf.writeUInt16BE(count, 0);
  let off = 2;
  for (const [k, v] of Object.entries(mapPrivileges)) {
    buf.writeUInt16BE(Number(k), off); off += 2;
    buf.writeUInt32BE(Number(v), off); off += 4;
  }
  return buf;
}

class AccessToken {
  constructor(appId, appCertificate) {
    this.appId = appId;
    this.appCertificate = appCertificate;
    this.version = '006';
  }

  build(channelName, uidOrAccount, role, privilegeExpireTs) {
    // uidOrAccount: number or string
    // App ID is a 32-character hex string; decode it to raw bytes
    const appIdHex = String(this.appId || '').replace(/-/g, '');
    const appIdBuf = Buffer.from(appIdHex, 'hex');
    const channelBuf = Buffer.from(channelName || '', 'utf8');

    // uidOrAccount: if numeric (rtc uid), encode as 4-byte BE integer for signature input
    // if string (user account), encode as UTF-8 bytes
    let uidBuf;
    const uidStr = String(uidOrAccount || '0');
    if (/^\d+$/.test(uidStr)) {
      uidBuf = Buffer.alloc(4);
      uidBuf.writeUInt32BE(Number(uidStr));
    } else {
      uidBuf = Buffer.from(uidStr, 'utf8');
    }

    const salt = crypto.randomBytes(4).readUInt32BE(0);
    const ts = Math.floor(Date.now() / 1000);

    const message = buildMessage({ 1: privilegeExpireTs }); // use privilege key 1 for join channel

    // build signature: HMAC-SHA256 over (appId + channel + uid + salt + ts + message)
    const signInput = Buffer.concat([
      appIdBuf,
      channelBuf,
      uidBuf,
      Buffer.alloc(4), // salt placeholder
      Buffer.alloc(4), // ts placeholder
      message
    ]);

    signInput.writeUInt32BE(salt, appIdBuf.length + channelBuf.length + uidBuf.length);
    signInput.writeUInt32BE(ts, appIdBuf.length + channelBuf.length + uidBuf.length + 4);

    const signature = crypto.createHmac('sha256', this.appCertificate).update(signInput).digest();

    // Build content buffer as in Agora dynamic key v3: signature + appId + crc(channel) + crc(uid) + message
    const channelCrc = crc32(Buffer.from(channelName || '', 'utf8')) >>> 0;
    const uidCrc = crc32(Buffer.from(String(uidOrAccount), 'utf8')) >>> 0;

    const content = Buffer.concat([
      signature,
      appIdBuf,
      Buffer.alloc(4), // channel crc
      Buffer.alloc(4), // uid crc
      message
    ]);

    content.writeUInt32BE(channelCrc, signature.length + appIdBuf.length);
    content.writeUInt32BE(uidCrc, signature.length + appIdBuf.length + 4);

    const token = this.version + content.toString('base64');
    return token;
  }
}

function generateAgoraRtcToken(appId, appCertificate, channelName, uid, opts = {}) {
  if (!appId) throw new Error('Agora App ID is required');
  if (!appCertificate) return null;

  try {
    const role = opts.role === 'subscriber' ? 1 : 2; // simple mapping; not used in this minimal builder
    const expireSeconds = Number(opts.expireSeconds || 3600);
    const privilegeExpireTs = Math.floor(Date.now() / 1000) + expireSeconds;

    const tokenBuilder = new AccessToken(appId, appCertificate);
    const token = tokenBuilder.build(channelName, uid, role, privilegeExpireTs);
    return token;
  } catch (err) {
    console.error('generateAgoraRtcToken error:', err);
    return null;
  }
}

function generateAgoraRtmToken(appId, appCertificate, userAccount, opts = {}) {
  if (!appId) throw new Error('Agora App ID is required');
  if (!appCertificate) return null;
  try {
    const expireSeconds = Number(opts.expireSeconds || 3600);
    const privilegeExpireTs = Math.floor(Date.now() / 1000) + expireSeconds;
    const tokenBuilder = new AccessToken(appId, appCertificate);
    const token = tokenBuilder.build('', userAccount, 0, privilegeExpireTs);
    return token;
  } catch (err) {
    console.error('generateAgoraRtmToken error:', err);
    return null;
  }
}

module.exports = { generateAgoraRtcToken, generateAgoraRtmToken };
