# Test of navigator.getDisplayMedia Screenshare

The purpose of this repository is to test the use of `navigator.getDisplayMedia` in MS Edge.

## Steps to prepare

1. Clone the repository and cd into it
2. Install dependencies using `npm install`

## Replicating the issues

### Start the server

```bash
npm start
```

The port of the server can be changed in `./server.js` by changing the `PORT` constant.

### Basic test

Open `https://localhost:8000/local-stream.html`. You will need to confirm the use of self-signed certs. Try clicking "Share Screen".

#### Expected Result of Basic test

A video appears in the middle of the screen, reflecting the content of the getDisplayMedia `MediaStream`.

### Test with WebRTC streams

Open `https://localhost:8000/local-stream.html` in two different tabs. One of the tabs will be the reciever, and one the transmitter. You will need to confirm the use of self-signed certs. In one of the tabs,try clicking the "Share Screen" button. This is now the transmitting tab.

#### Expected Result

A video appears in the middle of the tab of the receiving tab, reflecting the content of the getDisplayMedia `MediaStream`.

## Assumptions made

1. Edge allows creating an objectURL for a `MediaStream`
1. Edge allows assigning an objectURL of a `MediaStream` as the `src` of an HTMLVideoElement
1. Edge supports ES6 syntax
1. Edge does not treat websites on self-signed certificates differently than authorized certificates, once the user has confirmed entering the site.
1. Edge should not treat `MediaStream` of `getDisplayMedia` differently than that of `getUserMedia`. To test this, change the flag `USE_USER_MEDIA_AS_MEDIA_STREAM` in `./public/main.js:4` and run the test with WebRTC streams again. I've found this assumption to be false.
