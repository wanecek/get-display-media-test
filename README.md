# Test of navigator.getDisplayMedia Screenshare

## Steps to prepare

1. Clone the repository and cd into it
2. Install dependencies (`npm install`)

## Start the server

```bash
# Start the server
npm start
```

## Replicating the issues

In two different browser-tabs, open `https://localhost:3333` (you may need to confirm the use of self-signed certs). One of the tabs will be the reciever, and one the sender.

Depending on your network configuration, you could have these tabs on two different computers.

In one of the tabs, click the "Start sharing" button, and select your source (a `screen` or a `window`).
