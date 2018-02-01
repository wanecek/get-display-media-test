/**
 * Starts up a WebSocket and a HTTP Server
 *
 * The express HTTP server will expose the HTML and Javascript
 * from the ./public directory
 *
 * The WebSocket server acts as a signaling server for the WebRTC communication,
 * and will relay messages from the sender to the other clients.
 */
const express = require('express');
const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const PORT = 8000;

const app = express();
const serverOptions = {
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

const httpsServer = https.createServer(serverOptions, app).listen(PORT);
const url = 'https://localhost:' + PORT;
console.log('HTTPS server is up and running on ' + url);

// Start up the WebSocket server
const wssServer = new WebSocket.Server({ server: httpsServer });
console.log('WebSocket Secure server is up and running.');

wssServer.on('connection', function onWsConnection(client) {
  console.log(
    'A new WebSocket client was connected. Clients connected:',
    this.clients.size
  );

  // Listen to messages from the connected client
  client.on('message', function onIncomingWsMessage(message) {
    console.log('Relaying message', message);
    wssServer.broadcast(message, client);
  });
});

// broadcasting the message to all WebSocket clients.
wssServer.broadcast = function onWsBroadcast(data, exclude) {
  const numberOfClients = this.clients ? this.clients.size : 0;

  // If there's only 1 or 0 clients connected there's no need to broadcast
  if (numberOfClients < 2) return;

  console.log(
    'Broadcasting message to ' + numberOfClients + ' WebSocket clients.'
  );

  this.clients.forEach(function broadCastToClient(client) {
    // Avoid sending back the message to the sender
    if (client === exclude) return;
    if (client.readyState === client.OPEN) client.send(data);
    else console.error('Error: the client state is ' + client.readyState);
  });
};
