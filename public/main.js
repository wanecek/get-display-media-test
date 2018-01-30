// @ts-check

const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

// Initiate WebSocket connection. This is used for sending and receiving SDP
// messages between the clients
const wsConn = new WebSocket(`wss://${window.location.host}`);

let localVideoStream; // MediaStream
let peerConn; // RTCPeerConnection

// DOM references
const videoElement = document.getElementById('video-playback');
const startCallButton = document.getElementById('start-call-button');
const endCallButton = document.getElementById('end-call-button');

/**
 * Functions for WebRTC communication
 * ============================================================= */

/**
 * Close PeerConnection and reset UI
 * @param {RTCPeerConnection} peerConnection
 */
function endCall(peerConnection) {
  peerConnection.close();
  peerConnection = null;
  startCallButton.removeAttribute('disabled');
  endCallButton.setAttribute('disabled', 'true');

  if (localVideoStream) {
    localVideoStream.getTracks().forEach(track => {
      track.stop();
    });
  }

  videoElement.src = '';
}

/**
 * Send offer SDP-message via WebSocket connection
 * @param {RTCPeerConnection} peerConnection
 */
function createAndSendOffer(peerConnection) {
  peerConnection.createOffer(offer => {
    peerConnection.setLocalDescription(
      offer,
      () => {
        wsConn.send(JSON.stringify({ sdp: offer }));
      },
      console.error
    );
  }, console.error);
}

/**
 * Send answer SDP-message via WebSocket connection
 * @param {RTCPeerConnection} peerConnection
 */
function createAndSendAnswer(peerConnection) {
  peerConnection.createAnswer(answer => {
    peerConnection.setLocalDescription(
      answer,
      () => {
        wsConn.send(JSON.stringify({ sdp: answer }));
      },
      console.error
    );
  }, console.error);
}

function prepareCall() {
  peerConn = new RTCPeerConnection(peerConnectionConfig);

  // send any ice candidates to the other peer
  peerConn.onicecandidate = evt => {
    if (!evt || !evt.candidate) return;
    wsConn.send(JSON.stringify({ candidate: evt.candidate }));
  };

  // once remote stream arrives, update UI and show it in the video element
  peerConn.onaddstream = evt => {
    // Update button states
    startCallButton.setAttribute('disabled', 'true');
    endCallButton.removeAttribute('disabled');
    // set remote video stream as source for video element
    videoElement.src = URL.createObjectURL(evt.stream);
  };
}

function answerCall() {
  prepareCall();
  setTimeout(() => createAndSendAnswer(peerConn), 1000); // "hack" to avoid race-condition
}

wsConn.onmessage = function onWsConnMessage(evt) {
  // if no peerConn is set, the client is receiving a call
  if (!peerConn) answerCall();
  const signal = JSON.parse(evt.data);
  if (signal.sdp) {
    console.log('Received SDP from remote peer.', signal.sdp);
    peerConn.setRemoteDescription(new RTCSessionDescription(signal.sdp));
  } else if (signal.candidate) {
    console.log('Received ICECandidate from remote peer.');
    peerConn.addIceCandidate(new RTCIceCandidate(signal.candidate));
  } else if (signal.closeConnection) {
    console.log('Received "closeConnection" signal from remote peer.');
    endCall(peerConn);
  }
};

function getDisplayMedia() {
  if ('getDisplayMedia' in navigator) {
    return navigator.getDisplayMedia({ video: true });
    // return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  // For firefox
  return navigator.mediaDevices.getUserMedia({
    video: { mediaSource: 'screen', width: 1920, height: 1080 },
  });
}

// Initiate a call, sharing the screen
function initiateCall() {
  prepareCall();
  getDisplayMedia()
    .then(stream => {
      peerConn.addStream(localVideoStream);
      createAndSendOffer(peerConn);
    })
    .catch(console.error);
}

function addEventListeners() {
  startCallButton.removeAttribute('disabled');
  startCallButton.addEventListener('click', initiateCall);
  endCallButton.addEventListener('click', () => {
    endCall(peerConn);
    wsConn.send(JSON.stringify({ closeConnection: true }));
  });
}

window.addEventListener('load', addEventListeners);
