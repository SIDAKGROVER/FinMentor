// decode_token.js
const token = process.env.TOKEN;
if(!token){ console.error('Set TOKEN env var to the full Agora token string (including 006 prefix)'); process.exit(1); }
const raw = token.replace(/^006/, '');
const buf = Buffer.from(raw, 'base64');
console.log('buffer length:', buf.length);
console.log('raw hex:', buf.toString('hex'));
console.log('raw ascii (printable only):', [...buf].map(x=> (x>=32 && x<127)?String.fromCharCode(x):'.').join(''));
const sig = buf.slice(0,32);
console.log('signature (hex):', sig.toString('hex'));
const appIdBuf = buf.slice(32,48);
console.log('appId bytes (hex):', appIdBuf.toString('hex'));
console.log('appId bytes (ascii):', appIdBuf.toString('ascii'));
const channelCrc = buf.readUInt32BE(48);
const uidCrc = buf.readUInt32BE(52);
console.log('channel CRC32:', channelCrc);
console.log('uid CRC32:', uidCrc);
const msg = buf.slice(56);
console.log('message (hex):', msg.toString('hex'));
if(msg.length >= 2){
  const count = msg.readUInt16BE(0);
  console.log('message count:', count);
  let off = 2;
  for(let i=0;i<count;i++){
    if(off+6 <= msg.length){
      const p = msg.readUInt16BE(off); off += 2;
      const exp = msg.readUInt32BE(off); off += 4;
      console.log(` message item ${i}: privilege=${p} expireTs=${exp}`);
    }
  }
}
