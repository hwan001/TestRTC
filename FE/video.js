const socket = new WebSocket("wss://testrtc.avgmax.team/signaling");

const pendingCandidates = []; // ICE 후보 임시 저장용 큐
let localStream = null;
let peer = null;
let myId = "";
let targetId = "";

socket.onmessage = async (event) => {
	const data = JSON.parse(event.data);

	if (!peer) {
		await setupPeerAndMedia();
	}

    console.log(data.type);

	switch (data.type) {
		case "offer":
			await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
			const answer = await peer.createAnswer();
			await peer.setLocalDescription(answer);
            
            console.log(data.type + ", " + answer + ", " + data.from);

			sendSignal({ type: "answer", sdp: answer, to: data.from });

			// remoteDescription 설정 끝났으므로 후보 처리
			while (pendingCandidates.length > 0) {
				const candidate = pendingCandidates.shift();
				await peer.addIceCandidate(candidate);
			}
			break;

		case "answer":
			await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));

			while (pendingCandidates.length > 0) {
				const candidate = pendingCandidates.shift();
				await peer.addIceCandidate(candidate);
			}
			break;

		case "ice":
			if (data.candidate) {
				const candidate = new RTCIceCandidate(data.candidate);
				if (peer.remoteDescription) {
					await peer.addIceCandidate(candidate);
				} else {
					pendingCandidates.push(candidate); 
				}
			}
			break;
	}
};

function sendSignal(msg) {
	socket.send(JSON.stringify({ ...msg, from: myId }));
}

async function join() {
  myId = document.getElementById("userId").value;
  targetId = document.getElementById("targetId").value;
  sendSignal({ type: "join", from: myId });
  alert("join 성공");
}

async function setupPeerAndMedia() {
	peer = new RTCPeerConnection({
		iceServers: [
			{ urls: "stun:stun.l.google.com:19302" },{
				urls: "turn:services.avgmax.in:3478",
				username: "webrtc",
				credential: "pass123",
			},{
				urls: "turn:192.168.11.8:3478",
				username: "webrtc",
				credential: "pass123",
			},
		],
	});

	peer.onicecandidate = (e) => {
		if (e.candidate) {
            console.log("onicecatidate:", e.candidate);
			sendSignal({ type: "ice", candidate: e.candidate, to: targetId });
		}
	};

	peer.ontrack = (e) => {
        console.log("ontrack:", e.candidate);
		document.getElementById("remoteVideo").srcObject = e.streams[0];
	};

	if (!localStream) {
		try {
			localStream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});

			document.getElementById("localVideo").srcObject = localStream;

			localStream.getTracks().forEach((track) => {
				peer.addTrack(track, localStream);
			});
		} catch (err) {
			console.error("getUserMedia 실패:", err);
            alert("getUserMedia 실패:", err);
		}
	}
}

async function startCall() {
	if (!myId || !targetId) {
		alert("먼저 Join을 눌러 ID를 설정하세요.");
		return;
	}

	if (!peer) {
		await setupPeerAndMedia();
	}

	const offer = await peer.createOffer();
	await peer.setLocalDescription(offer);
	sendSignal({ type: "offer", sdp: offer, to: targetId });
    alert("startCall 성공");
}
