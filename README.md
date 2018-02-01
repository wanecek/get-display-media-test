# Test of navigator.getDisplayMedia Screenshare

The purpose of this repository is to test the implementation of `navigator.getDisplayMedia` in MS Edge. It also constitutes two different, condensed scenarios relying on the feature, and compares it to `navigator.mediaDevices.getUserMedia`.

## Steps to prepare

1. Clone the repository and cd into it
2. Install dependencies using `npm install`

## Replicating the issues

In an attempt to future-proof a project for the support of `getDisplayMedia`, I've been playing around with the **experimental** implementation in the latest (as of 2018-02-01) stable release of MS Edge, but have been unsuccessful in getting it to work as expected (Edge 41.16299.15.0; EdgeHTML 16.16299; Two different PCs both running Windows 10).

To compare the result with that of `navigator.mediaDevices.getUserMedia`, modify the flag `USE_USER_MEDIA_AS_MEDIA_STREAM` in `./public/local-stream.html:53` or `./public/main.js:4`.

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

#### Outcome

So far, I have consistently been thrown the following error: (main.js:134:7 pointing to the start of the line adding the stream to the `peerConn`).

```json
{
  "description": "Could not complete the operation due to error c004e001.",
  "message": "Could not complete the operation due to error c004e001.",
  "number": -1073422335,
  "stack": "Error: Could not complete the operation due to error c004e001. at Anonymous Function (https://x.x.x.x:8000/public/main.js:134:7)"
}
```

## Assumptions made

1. Edge allows creating an objectURL for a `MediaStream`
1. Edge allows assigning an objectURL of a `MediaStream` as the `src` of an HTMLVideoElement
1. Edge supports ES6 syntax
1. Edge does not treat websites on self-signed certificates differently than authorized certificates, once the user has confirmed entering the site.
1. Edge should not treat `MediaStream` of `getDisplayMedia` differently than that of `getUserMedia`. So far, I've found this assumption to be false.
