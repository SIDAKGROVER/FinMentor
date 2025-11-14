// backend/scripts/gen_and_inspect_token.js
// Simple script to generate an Agora RTC token using the project's builder
// and print an inspect-style JSON output similar to /api/agora/token_inspect.

require('dotenv').config();
const { generateAgoraRtcToken } = require('../agoraToken');

const channel = process.argv[2] || 'finmentor-channel';
const uid = process.argv[3] ? Number(process.argv[3]) : Math.floor(Math.random() * 900000) + 1000;

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERTIFICATE;

if (!APP_ID) {
  console.error('AGORA_APP_ID missing in env. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE when running this script.');
  process.exit(2);
}

const token = generateAgoraRtcToken(APP_ID, APP_CERT, channel, uid);
console.log('Generated token:', token);

if (!token) {
  console.error('No token generated (tokenless mode or error).');
  process.exit(1);
}

try {
  const prefix = token.slice(0,3);
  const base64 = token.slice(3);
  const buf = Buffer.from(base64, 'base64');

  const signature = buf.slice(0, 32);
  const appIdBuf = buf.slice(32, 48);
  const channelCrc = buf.readUInt32BE(48);
  const uidCrc = buf.readUInt32BE(52);
  const messageBuf = buf.slice(56);

  const msg = {};
  if (messageBuf.length >= 2) {
    const count = messageBuf.readUInt16BE(0);
    msg.count = count;
    let off = 2;
    msg.items = [];
    for (let i = 0; i < count; i++) {
      if (off + 6 <= messageBuf.length) {
        const p = messageBuf.readUInt16BE(off); off += 2;
        const exp = messageBuf.readUInt32BE(off); off += 4;
        msg.items.push({ privilege: p, expireTs: exp });
      }
    }
  }

  const out = {
    tokenVersion: prefix,
    tokenBase64Length: base64.length,
    signatureHex: signature.toString('hex'),
    appIdHex: appIdBuf.toString('hex'),
    appIdAscii: appIdBuf.toString('ascii'),
    channelCrc,
    uidCrc,
    message: msg,
    rawHex: buf.toString('hex')
  };

  console.log('\nToken inspect result:');
  console.log(JSON.stringify(out, null, 2));
} catch (err) {
  console.error('Token inspect failed:', err);
  process.exit(3);
}
