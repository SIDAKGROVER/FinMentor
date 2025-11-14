const http = require('http');
function req(opts, data) {
  return new Promise((res, rej) => {
    const r = http.request(opts, resp => {
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
    let s = await req({ hostname: '127.0.0.1', port: 5000, path: '/api/debug/status', method: 'GET' });
    console.log(JSON.stringify(s, null, 2));

    console.log('--- SIGNUP ---');
    const email = 'localdebug+' + Date.now() + '@example.com';
    const signupData = JSON.stringify({ name: 'Local Debug', email: email, password: 'secret123' });
    s = await req({ hostname: '127.0.0.1', port: 5000, path: '/api/auth/signup?debug=1', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(signupData) } }, signupData);
    console.log('EMAIL_USED:', email);
    console.log(JSON.stringify(s, null, 2));

    console.log('--- LOGIN ---');
    const loginData = JSON.stringify({ email: email, password: 'secret123' });
    s = await req({ hostname: '127.0.0.1', port: 5000, path: '/api/auth/login?debug=1', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) } }, loginData);
    console.log(JSON.stringify(s, null, 2));
  } catch (e) {
    console.error('ERROR', e.message);
  }
})();
