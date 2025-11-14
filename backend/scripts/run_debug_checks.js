const https = require('https');
function req(opts, data) {
  return new Promise((res, rej) => {
    const r = https.request(opts, resp => {
      let b = '';
      resp.on('data', c => b += c);
      resp.on('end', () => res({ status: resp.statusCode, body: b }));
    });
    r.on('error', e => rej(e));
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  try {
    console.log('--- DEBUG STATUS ---');
    let s = await req({ hostname: 'finmentor.onrender.com', path: '/api/debug/status', method: 'GET' });
    console.log(JSON.stringify(s, null, 2));

    console.log('--- SIGNUP ---');
    const email = 'debug+' + Date.now() + '@example.com';
    const signupData = JSON.stringify({ name: 'Debug User', email: email, password: 'secret123' });
    s = await req({ hostname: 'finmentor.onrender.com', path: '/api/auth/signup?debug=1', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(signupData) } }, signupData);
    console.log('EMAIL_USED:', email);
    console.log(JSON.stringify(s, null, 2));

    console.log('--- LOGIN ---');
    const loginData = JSON.stringify({ email: email, password: 'secret123' });
    s = await req({ hostname: 'finmentor.onrender.com', path: '/api/auth/login?debug=1', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) } }, loginData);
    console.log(JSON.stringify(s, null, 2));
  } catch (e) {
    console.error('ERROR', e.message);
  }
})();
