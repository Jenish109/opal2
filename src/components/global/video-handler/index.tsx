import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadIcon } from 'lucide-react';
import VideoRecorderIcon from '@/components/icons/video-recorder';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

type Props = {
  onVideoSelect: (file: File) => void;
  onRecordingComplete: (blob: Blob) => void;
};

const VideoHandler = ({ onVideoSelect, onRecordingComplete }: Props) => {
  const { user } = useUser();
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        onVideoSelect(file);
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setVideoPreview(previewUrl);
      } else {
        toast.error('Please select a valid video file');
      }
    }
  };

  const handleVideoClick = () => {
    if (videoPreviewRef.current) {
      if (isPlaying) {
        videoPreviewRef.current.pause();
      } else {
        videoPreviewRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const startRecording = async () => {
    try {
      // Request screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      setStream(displayStream);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = displayStream;
      }

      const mediaRecorder = new MediaRecorder(displayStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onRecordingComplete(blob);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(blob);
        setVideoPreview(previewUrl);
        
        // Stop all tracks
        displayStream.getTracks().forEach(track => track.stop());
        setStream(null);
        
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      // Set recording to stop when screen share is ended by the user
      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          stopRecording();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing screen capture:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Screen recording permission was denied');
      } else {
        toast.error('Failed to start screen recording');
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Cleanup function to revoke object URLs
  React.useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept="video/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <Button
          className="bg-[#9D9D9D] flex items-center gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon size={20} />
          <span className="flex items-center gap-2">Upload</span>
        </Button>
        <Button
          className="bg-[#9D9D9D] flex items-center gap-2"
          onClick={isRecording ? stopRecording : startRecording}
        >
          <VideoRecorderIcon />
          <span className="flex items-center gap-2">
            {isRecording ? 'Stop Recording' : 'Record Screen'}
          </span>
        </Button>
      </div>
      <div className="mt-4">
        {stream ? (
          // Live preview during recording
          <div className="relative">
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              className="w-full max-w-lg aspect-video rounded-lg"
            />
            <p className="text-sm text-gray-400 mt-2">
              {isRecording ? 'Recording in progress... Click Stop Recording when finished.' : 'Preview'}
            </p>
          </div>
        ) : videoPreview ? (
          // Preview after recording/upload
          <div className="relative">
            <video
              ref={videoPreviewRef}
              src={videoPreview}
              className="w-full max-w-lg aspect-video rounded-lg cursor-pointer"
              onClick={handleVideoClick}
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity">
              <button 
                className="p-3 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-all"
                onClick={handleVideoClick}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VideoHandler; 