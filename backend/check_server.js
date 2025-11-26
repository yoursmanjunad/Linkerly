const http = require('http');

const req = http.get('http://localhost:5000', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.resume();
});

req.on('error', (e) => {
  console.error(`PROBLEM: ${e.message}`);
});
