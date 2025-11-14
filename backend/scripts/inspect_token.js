const http = require('http');
const APP_ID = process.env.AGORA_APP_ID || 'UNKNOWN';

function parseToken(token) {
  if (!token) return null;
  if (token.startsWith('006')) token = token.slice(3);
  const buf = Buffer.from(token, 'base64');
  // Signature is 32 bytes (HMAC-SHA256)
  const sig = buf.slice(0, 32);
  // appId bytes next: unknown length; try to find next parts
  // We'll attempt to read next 32 bytes as appId (if ASCII hex) or 16 bytes as raw
  const rest = buf.slice(32);
  return { sig: sig.toString('hex'), restHex: rest.toString('hex'), restAscii: rest.toString('utf8') };
}

http.get('http://127.0.0.1:5000/api/agora/token?channel=finmentor-channel', res=>{
  let d='';
  res.on('data',c=>d+=c);
  res.on('end',()=>{
    try{
      const j = JSON.parse(d);
      console.log('Configured AGORA_APP_ID:', APP_ID);
      console.log('Token (short):', j.token ? j.token.slice(0,60)+'...' : null);
      const parsed = parseToken(j.token);
      console.log('Parsed signature (hex):', parsed.sig);
      console.log('Parsed rest (hex):', parsed.restHex.slice(0,128));
      console.log('Parsed rest (ascii preview):', parsed.restAscii.slice(0,128));
      console.log('Backend response object:', j);
    }catch(e){
      console.error('Failed to parse response', e, d);
    }
  });
}).on('error',e=>console.error('ERR',e));
