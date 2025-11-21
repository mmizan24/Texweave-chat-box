import React, { useEffect, useRef, useState } from 'react';
import { connectToLiveSession, LiveSession } from '../services/geminiService';
import { createPcmBlob, decodeAudioData } from '../services/audioUtils';

const LiveSessionComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Refs for audio/video processing to avoid stale closures
  const sessionRef = useRef<LiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const startSession = async () => {
    try {
      setError(null);
      
      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 640, height: 360 } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // 2. Setup Audio Contexts
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      // 3. Connect to Gemini
      const session = await connectToLiveSession({
        onOpen: () => {
          console.log("Live Session Open");
          setIsConnected(true);
          startAudioInput(stream, audioCtx, session);
          startVideoInput(session);
        },
        onMessage: async (message) => {
           // Handle Audio Output from Model
           const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
           if (audioData) {
             await playAudioChunk(audioData);
           }
        },
        onError: (e) => {
          console.error("Live API Error", e);
          setError("Connection error. Please check console.");
          stopSession();
        },
        onClose: () => {
          console.log("Live Session Closed");
          stopSession();
        }
      });

      sessionRef.current = session;

    } catch (err: any) {
      console.error("Failed to start session:", err);
      setError("Failed to access camera/microphone or connect to API.");
    }
  };

  const startAudioInput = (stream: MediaStream, audioCtx: AudioContext, session: LiveSession) => {
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (isMuted) return; 
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      session.sendRealtimeInput({ media: pcmBlob });
    };

    source.connect(processor);
    processor.connect(audioCtx.destination); // Need to connect to destination for script processor to work, but mute it to avoid feedback if needed
    
    sourceNodeRef.current = source;
    inputProcessorRef.current = processor;
  };

  const startVideoInput = (session: LiveSession) => {
    // Send frames @ 1fps approx
    frameIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        session.sendRealtimeInput({
          media: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
      }
    }, 1000); 
  };

  const playAudioChunk = async (base64Audio: string) => {
    // We need a separate output context for playback often to match system rate (usually 44.1 or 48k) 
    // but decoding needs to happen carefully.
    const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }); 
    
    const uint8Array = new Uint8Array(atob(base64Audio).split('').map(char => char.charCodeAt(0)));
    const audioBuffer = await decodeAudioData(uint8Array, outputCtx, 24000, 1);
    
    const source = outputCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputCtx.destination);
    
    // Simple queueing logic
    const currentTime = outputCtx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
  };

  const stopSession = () => {
    if (sessionRef.current) {
      // sessionRef.current.close(); // SDK currently doesn't have explicit close method on session object easily accessible in types sometimes, but cleaning up local resources is key
      // Force refresh or just clean up:
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (inputProcessorRef.current) {
      inputProcessorRef.current.disconnect();
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    
    setIsConnected(false);
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => stopSession();
  }, []);

  return (
    <div className="h-full bg-slate-900 flex flex-col items-center justify-center relative p-4">
      {/* Main Video Feed */}
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        <video 
          ref={videoRef} 
          muted 
          playsInline 
          className="w-full h-full object-cover transform scale-x-[-1]" 
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isConnected && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <i className="fa-solid fa-video text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to join?</h3>
            <p className="text-slate-300 mb-6 max-w-md text-center">Start a live video session with the AI team assistant. It can see your camera and hear you.</p>
            <button 
              onClick={startSession}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all transform hover:scale-105"
            >
              Start Session
            </button>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-50">
            <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-4xl mb-4"></i>
            <p className="text-red-400 font-medium mb-4">{error}</p>
            <button onClick={startSession} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">Retry</button>
          </div>
        )}

        {isConnected && (
          <div className="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            LIVE
          </div>
        )}

        {/* AI Avatar Overlay (Simulated Participant) */}
        {isConnected && (
          <div className="absolute bottom-4 right-4 w-32 h-32 md:w-48 md:h-48 bg-slate-800 rounded-xl border border-slate-600 overflow-hidden shadow-lg">
            <img 
              src="https://cdn.dribbble.com/users/124059/screenshots/15348630/media/565671942e5519c9421a038a205df1d1.png?resize=400x300&vertical=center" 
              alt="AI" 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute bottom-0 left-0 w-full bg-black/50 p-1 text-xs text-white text-center">
              Gemini AI
            </div>
            {/* Audio Visualizer Effect Simulation */}
            <div className="absolute inset-0 flex items-center justify-center gap-1">
               <div className="w-1 h-4 bg-blue-400 animate-[bounce_1s_infinite]"></div>
               <div className="w-1 h-8 bg-blue-400 animate-[bounce_1.2s_infinite]"></div>
               <div className="w-1 h-5 bg-blue-400 animate-[bounce_0.8s_infinite]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isConnected && (
        <div className="mt-6 flex items-center gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
          >
            <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
          </button>
          
          <button 
            onClick={stopSession}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium shadow-lg flex items-center gap-2"
          >
            <i className="fa-solid fa-phone-slash"></i>
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveSessionComponent;