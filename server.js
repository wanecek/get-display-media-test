const express = require('express');
const fs = require('fs');
const https = require('https');
const WebSocketServer = require('ws').Server;

const app = express();
const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
  passphrase: '123456789',
};

// use express static to deliver resources HTML, CSS, JS, etc)
// from the public folder
app.use(express.static('public'));

app.use(function httpsRedirectMiddleware(req, res, next) {
  if (req.headers['x-forwarded-proto'] === 'http') {
    res.redirect('https://' + req.get('Host') + req.url);
  } else {
    next();
  }
});

// start server (listen on port 443 - SSL)
const sslSrv = https.createServer(options, app).listen(3333);
console.log('The HTTPS server is up and running');

// create the WebSocket server
const wss = new WebSocketServer({ server: sslSrv });
console.log('WebSocket Secure server is up and running.');

wss.on('connection', function onWsConnection(client) {
  console.log('A new WebSocket client was connected.');
  client.on('message', function onIncomingWsMessage(message) {
    /** broadcast message to all clients */
    wss.broadcast(message, client);
  });
});

// broadcasting the message to all WebSocket clients.
wss.broadcast = function onWsBroadcast(data, exclude) {
  let client = null;
  const n = this.clients
    ? this.clients.length
    : 0;

  if (n < 1) return;

  console.log('Broadcasting message to all ' + n + ' WebSocket clients.');

  for (let i = 0; i < n; i += 1) {
    client = this.clients[i];
    // don't send the message to the sender...
    if (client === exclude) continue;
    if (client.readyState === client.OPEN) client.send(data);
    else console.error('Error: the client state is ' + client.readyState);
  }
};
