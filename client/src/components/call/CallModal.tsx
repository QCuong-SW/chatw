'use client';

import React, { useEffect, useRef } from 'react';
import { useCallStore } from '@/stores/call.store';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export function CallModal() {
  const {
    status,
    isVideo,
    recipientName,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    setupSocketListeners,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const cleanup = setupSocketListeners();
    return cleanup;
  }, [setupSocketListeners]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (status === 'IDLE') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Incoming Call Popup */}
      {status === 'INCOMING' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl text-white animate-bounce-short">
          <div className="w-20 h-20 rounded-full bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center mb-4 ring-8 ring-blue-500/10">
            {isVideo ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-bold">{recipientName || 'Incoming Caller'}</h3>
          <p className="text-sm text-slate-400 mt-1 mb-8">
            Incoming {isVideo ? 'video' : 'audio'} call...
          </p>
          <div className="flex justify-center gap-6">
            <Button
              onClick={rejectCall}
              size="icon"
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            <Button
              onClick={acceptCall}
              size="icon"
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 animate-pulse"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Calling & Connected States */}
      {(status === 'CALLING' || status === 'CONNECTED') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl relative">
          {/* Main Video Screen */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center">
            {isVideo ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Local Video Thumbnail */}
                <div className="absolute top-4 right-4 w-44 h-32 bg-slate-800 rounded-2xl overflow-hidden shadow-xl border-2 border-slate-700">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-white">
                <div className="w-24 h-24 rounded-full bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center mb-4 ring-8 ring-blue-500/10">
                  <Phone className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">{recipientName}</h3>
                <p className="text-sm text-slate-400 mt-2">
                  {status === 'CALLING' ? 'Calling...' : 'Voice Call in progress'}
                </p>
              </div>
            )}

            {status === 'CALLING' && isVideo && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                <p className="text-white text-lg font-medium animate-pulse">
                  Calling {recipientName}...
                </p>
              </div>
            )}
          </div>

          {/* Call Controls Bar */}
          <div className="h-20 bg-slate-900 px-6 flex items-center justify-center gap-4">
            <Button
              onClick={toggleMute}
              variant="outline"
              size="icon"
              className={`w-12 h-12 rounded-full border-slate-700 ${
                isMuted ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'text-white hover:bg-slate-800'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {isVideo && (
              <Button
                onClick={toggleCamera}
                variant="outline"
                size="icon"
                className={`w-12 h-12 rounded-full border-slate-700 ${
                  isCameraOff ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'text-white hover:bg-slate-800'
                }`}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>
            )}

            <Button
              onClick={endCall}
              size="icon"
              className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
