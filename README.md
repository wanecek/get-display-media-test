# Test of navigator.getDisplayMedia Screenshare

The purpose of this repository is to test the implementation of `navigator.getDisplayMedia`
in MS Edge. It contains two different, condensed scenarios relying on the feature,
and allows mocking `navigator.getDisplayMedia` with `navigator.mediaDevices.getUserMedia`.

## Steps to prepare

1. Clone the repository and cd into it
2. Install dependencies using `npm install`

## Replicating the issues

To compare the result with that of `navigator.getUserMedia`, toggle the flag
`USE_USER_MEDIA_AS_MEDIA_STREAM` in `./public/local-stream.html:54` or `./public/rtc-stream.js:4`.

### Start the server

```bash
npm start
```

The port of the server can be configured through the `PORT` env variable, or by explicitly changing the `PORT` constant in `./server.js:15`.

### Basic test

Open `https://localhost:8000/local-stream.html`. You will need to confirm the use of self-signed certs. Try clicking "Share Screen".

#### Expected Result of Basic test

A video appears in the middle of the screen, reflecting the content of the getDisplayMedia `MediaStream`.

#### Outcome on Edge 42.17134.1.0 with EdgeHTML 17.17134

A `MediaStreamError` (`AbortError`) is thrown:

```javascript
[object MediaStreamError]: { constraintName: null, message, null, name: "AbortError" }
```

This has been reported in [Issue #17357055](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/17357055/) on [issues.microsoftedge.com](http://issues.microsoftedge.com/).

### Test with WebRTC streams

Open `https://localhost:8000/rtc-stream.html` in two different tabs. One of the tabs will be the reciever, and one the transmitter. You will need to confirm the use of self-signed certs. In one of the tabs,try clicking the "Share Screen" button. This is now the transmitting tab.

#### Expected Result

A video appears in the middle of the tab of the receiving tab, reflecting the content of the getDisplayMedia `MediaStream`.

#### Outcome on Edge 41.16299.15.0 with EdgeHTML 16.16299

The following error is consistently thrown the following at main.js:134:7 pointing to the start of the line adding the stream to the `peerConn`:

```json
{
  "description": "Could not complete the operation due to error c004e001.",
  "message": "Could not complete the operation due to error c004e001.",
  "number": -1073422335,
  "stack": "Error: Could not complete the operation due to error c004e001. at Anonymous Function (https://x.x.x.x:8000/public/main.js:134:7)"
}
```

#### Outcome on Edge 42.17134.1.0 with EdgeHTML 17.17134

Same error as in the basic test for these versions (`MediaStreamError` - `AbortError`).

## Assumptions made

1. Edge allows creating an objectURL for a `MediaStream`
1. Edge allows assigning an objectURL of a `MediaStream` as the `src` of an HTMLVideoElement
1. Edge supports relevant ES6 syntax
1. Edge does not treat websites on self-signed certificates differently than authorized certificates, once the user has confirmed entering the site.
1. Edge should not treat `MediaStream` of `getDisplayMedia` differently than that of `getUserMedia`. So far, I've found this assumption to be false.
