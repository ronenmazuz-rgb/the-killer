'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket';

// ICE servers נטענים דינמית מהשרת (כולל TURN credentials מ-Metered.ca)
const FALLBACK_ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

async function fetchIceServers(): Promise<RTCConfiguration> {
  try {
    const res = await fetch('/api/ice-servers');
    if (!res.ok) throw new Error('failed');
    const iceServers = await res.json();
    return { iceServers };
  } catch {
    return FALLBACK_ICE;
  }
}

export function useWebRTC(roomCode: string | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const initialized = useRef(false);
  const iceConfigRef = useRef<RTCConfiguration>(FALLBACK_ICE);

  // ICE servers נטענים בתוך ה-effect של האיתות (ראה למטה)

  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const existing = peerConnections.current.get(peerId);
    if (existing && existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
      return existing;
    }

    const socket = getSocket();
    const pc = new RTCPeerConnection(iceConfigRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(peerId, stream);
          return next;
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', { to: peerId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peerConnections.current.delete(peerId);
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  }, []);

  const initiateOffer = useCallback(async (peerId: string) => {
    const socket = getSocket();
    try {
      const pc = createPeerConnection(peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:offer', { to: peerId, offer });
    } catch (err) {
      console.error('Error initiating offer to', peerId, err);
    }
  }, [createPeerConnection]);

  // Get user media
  useEffect(() => {
    if (!roomCode) return;

    let cancelled = false;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          localStreamRef.current = stream;
          setLocalStream(stream);
          setMediaError('מצלמה לא זמינה - מיקרופון בלבד');
        } catch {
          setMediaError('לא ניתן לגשת למצלמה או מיקרופון');
        }
      }
    }

    initMedia();

    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  // Signal readiness and set up listeners once stream is available (or failed)
  useEffect(() => {
    if (!roomCode || initialized.current) return;
    if (localStream === null && mediaError === null) return; // wait for media init

    initialized.current = true;
    const socket = getSocket();

    // טען ICE servers (כולל TURN) לפני שמודיעים שמוכנים לחיבור
    fetchIceServers().then((config) => {
      iceConfigRef.current = config;
      socket.emit('webrtc:join', { roomCode });
    });

    const handlePeerJoined = ({ peerId }: { peerId: string }) => {
      initiateOffer(peerId);
    };

    const handleOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      try {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { to: from, answer });
      } catch (err) {
        console.error('Error handling offer from', from, err);
      }
    };

    const handleAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      try {
        const pc = peerConnections.current.get(from);
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('Error handling answer from', from, err);
      }
    };

    const handleIceCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      try {
        const pc = peerConnections.current.get(from);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate from', from, err);
      }
    };

    const handlePlayerLeft = ({ playerId }: { playerId: string }) => {
      const pc = peerConnections.current.get(playerId);
      if (pc) { pc.close(); peerConnections.current.delete(playerId); }
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(playerId);
        return next;
      });
    };

    socket.on('webrtc:peer-joined', handlePeerJoined);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('room:player-left', handlePlayerLeft);

    return () => {
      socket.off('webrtc:peer-joined', handlePeerJoined);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('room:player-left', handlePlayerLeft);
    };
  }, [roomCode, localStream, mediaError, initiateOffer, createPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      initialized.current = false;
    };
  }, []);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMicOn((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOn((prev) => !prev);
  }, []);

  return { localStream, remoteStreams, mediaError, isMicOn, isCameraOn, toggleMic, toggleCamera };
}
