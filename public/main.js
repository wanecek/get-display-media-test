// Set this flag to true if you want to use the more widely-implemented
// navigator.mediaDevices.getUserMedia instead of navigator.getDisplayMedia as
// the source of the MediaStream to add to the RTCPeerConnection
const USE_USER_MEDIA_AS_MEDIA_STREAM = false;

// Initiate a WebSocket connection used for sending and receiving WebRTC-related
// messages between the clients (signaling)
const signalingChannel = new WebSocket(`wss://${window.location.host}`);
// Free-to-use stun servers used in establishing an RTCPeerConnection
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};
// DOM references
const videoElement = document.getElementById('video-playback');
const startCallButton = document.getElementById('share-screen-button');
// RTCPeerConnection
let peerConn;

/**
 * Send offer SDP-message via WebSocket connection
 * @param {RTCPeerConnection} peerConnection
 */
function createAndSendOffer(peerConnection) {
  peerConnection.createOffer(offer => {
    peerConnection.setLocalDescription(
      offer,
      () => signalingChannel.send(JSON.stringify(offer)),
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
      () => signalingChannel.send(JSON.stringify(answer)),
      console.error
    );
  }, console.error);
}

/**
 * Create a connection with attached callbacks, forwarding any ice candidates
 * and displaying any received video-stream in the <video> element
 * @param {RTCConfiguration} config
 * @returns {RTCPeerConnection}
 */
function createPeerConnection(config) {
  const connection = new RTCPeerConnection(config);

  // send any ice candidates to the other peer
  connection.onicecandidate = evt => {
    if (!evt || !evt.candidate) return;
    signalingChannel.send(JSON.stringify(evt.candidate));
  };

  // once remote stream arrives, update UI and show it in the video element
  connection.onaddstream = evt => {
    startCallButton.setAttribute('disabled', 'true');
    // set remote video stream as source for video element
    videoElement.src = URL.createObjectURL(evt.stream);
  };

  return connection;
}

signalingChannel.onmessage = function onWsConnMessage(evt) {
  // if no peerConn is set the client is set, we should answer with an adp message
  if (!peerConn) {
    peerConn = createPeerConnection(rtcConfiguration);
    setTimeout(() => createAndSendAnswer(peerConn), 1000);
  }

  const signal = JSON.parse(evt.data);
  if ('sdp' in signal) {
    console.log('Received SDP from remote peer.', signal);
    peerConn.setRemoteDescription(new RTCSessionDescription(signal));
  } else if ('candidate' in signal) {
    console.log('Received ICECandidate from remote peer.');
    peerConn.addIceCandidate(new RTCIceCandidate(signal));
  }
};

/**
 * Generate a MediaStream sharing the screen
 * @returns {Promise<MediaStream>}
 */
function getDisplayMedia() {
  if ('getDisplayMedia' in navigator) {
    return navigator.getDisplayMedia({ video: true });
  }

  return Promise.reject(
    new Error('getDisplayMedia is not supported by your browser')
  );
}

/**
 * Generate a MediaStream sharing the screen
 * @returns {Promise<MediaStream>}
 */
function getUserMedia() {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
}

/**
 * Generate a MediaStream sharing the screen
 * @returns {Promise<MediaStream>}
 */
function getMediaStream() {
  return USE_USER_MEDIA_AS_MEDIA_STREAM ? getUserMedia() : getDisplayMedia();
}

// Initiate a call, sharing the screen
function initiateCall() {
  const peerConnection = createPeerConnection(rtcConfiguration);
  // Store a reference to the peer connection
  peerConn = peerConnection;
  getMediaStream()
    .then(stream => {
      // expose stream to global object for debugging in Edge
      window.stream = stream;
      // Add stream to the peerConnection
      peerConnection.addStream(stream);
      // broadcast offer to other clients on the signalingChannel
      createAndSendOffer(peerConnection);
    })
    .catch(console.error);
}

window.addEventListener('load', function addEventListeners() {
  startCallButton.addEventListener('click', initiateCall);
});
