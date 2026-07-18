const http = require('http');

const urls = [
  'http://localhost:3000/lms/login',
  'http://localhost:3000/mentor/login',
  'http://localhost:3000/admin/dashboard',
  'http://localhost:3000/dashboard/overview'
];

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`URL: ${url} -> Status: ${res.statusCode} | Headers: ${JSON.stringify(res.headers.location || '')}`);
      resolve();
    }).on('error', (err) => {
      console.log(`URL: ${url} -> Error: ${err.message}`);
      resolve();
    });
  });
}

async function run() {
  for (const url of urls) {
    await checkUrl(url);
  }
}

run();
