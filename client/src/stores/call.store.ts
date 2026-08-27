import { create } from 'zustand';
import { getSocket } from '@/lib/socket';
import { startRingtone, stopRingtone } from '@/lib/sound';

export type CallStatus = 'IDLE' | 'CALLING' | 'INCOMING' | 'CONNECTED';

interface CallState {
  status: CallStatus;
  isVideo: boolean;
  recipientId: string | null;
  recipientName: string | null;
  conversationId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isMuted: boolean;
  isCameraOff: boolean;

  initiateCall: (recipientId: string, recipientName: string, conversationId: string, isVideo: boolean) => Promise<void>;
  receiveIncomingCall: (fromUserId: string, fromUsername: string, conversationId: string, isVideo: boolean) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  setupSocketListeners: () => () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useCallStore = create<CallState>((set, get) => ({
  status: 'IDLE',
  isVideo: true,
  recipientId: null,
  recipientName: null,
  conversationId: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isMuted: false,
  isCameraOff: false,

  initiateCall: async (recipientId, recipientName, conversationId, isVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket().emit('call:ice-candidate', {
            toUserId: recipientId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      getSocket().emit('call:initiate', {
        recipientId,
        conversationId,
        isVideo,
      });

      getSocket().emit('call:offer', {
        recipientId,
        sdp: offer,
      });

      set({
        status: 'CALLING',
        isVideo,
        recipientId,
        recipientName,
        conversationId,
        localStream: stream,
        remoteStream,
        peerConnection: pc,
      });
    } catch (err) {
      console.error('Error initiating call:', err);
    }
  },

  receiveIncomingCall: (fromUserId, fromUsername, conversationId, isVideo) => {
    startRingtone();
    set({
      status: 'INCOMING',
      recipientId: fromUserId,
      recipientName: fromUsername,
      conversationId,
      isVideo,
    });
  },

  acceptCall: async () => {
    stopRingtone();
    const { recipientId, isVideo } = get();
    if (!recipientId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket().emit('call:ice-candidate', {
            toUserId: recipientId,
            candidate: event.candidate,
          });
        }
      };

      set({
        status: 'CONNECTED',
        localStream: stream,
        remoteStream,
        peerConnection: pc,
      });
    } catch (err) {
      console.error('Error accepting call:', err);
    }
  },

  rejectCall: () => {
    stopRingtone();
    const { recipientId } = get();
    if (recipientId) {
      getSocket().emit('call:reject', { callerId: recipientId });
    }
    get().endCall();
  },

  endCall: () => {
    stopRingtone();
    const { localStream, peerConnection, recipientId } = get();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (recipientId) {
      getSocket().emit('call:end', { otherUserId: recipientId });
    }

    set({
      status: 'IDLE',
      recipientId: null,
      recipientName: null,
      conversationId: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isCameraOff: false,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        set({ isMuted: !isMuted });
      }
    }
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff;
        set({ isCameraOff: !isCameraOff });
      }
    }
  },

  setupSocketListeners: () => {
    const socket = getSocket();

    const handleIncoming = ({ fromUserId, fromUsername, conversationId, isVideo }: any) => {
      get().receiveIncomingCall(fromUserId, fromUsername, conversationId, isVideo);
    };

    const handleOffer = async ({ fromUserId, sdp }: any) => {
      const { peerConnection } = get();
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('call:answer', { callerId: fromUserId, sdp: answer });
      }
    };

    const handleAnswer = async ({ sdp }: any) => {
      const { peerConnection } = get();
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        set({ status: 'CONNECTED' });
      }
    };

    const handleCandidate = async ({ candidate }: any) => {
      const { peerConnection } = get();
      if (peerConnection && candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
    };

    const handleEnded = () => {
      get().endCall();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleCandidate);
    socket.on('call:rejected', handleEnded);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleCandidate);
      socket.off('call:rejected', handleEnded);
      socket.off('call:ended', handleEnded);
    };
  },
}));
