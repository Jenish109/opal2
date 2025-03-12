import React, { useState } from 'react';
import Modal from '../modal';
import VideoHandler from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

type Props = {
  trigger: React.ReactNode;
};

const VideoModal = ({ trigger }: Props) => {
  const { user } = useUser();
  const [videoFile, setVideoFile] = useState<File | Blob | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
  };

  const handleRecordingComplete = (blob: Blob) => {
    setVideoFile(blob);
  };

  const resetForm = () => {
    setVideoFile(null);
    setTitle('');
    setDescription('');
    setIsUploading(false);
    setIsModalOpen(false);
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error('Please select or record a video');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a video title');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a video description');
      return;
    }

    try {
      setIsUploading(true);

      // Create form data
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload video');
      }

      toast.success(data.message || 'Video uploaded successfully');
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      title="Upload or Record Video"
      description="Share your video with the world"
      trigger={trigger}
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
    >
      <div className="flex flex-col gap-6">
        <VideoHandler
          onVideoSelect={handleVideoSelect}
          onRecordingComplete={handleRecordingComplete}
        />
        {videoFile && (
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Video Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
            <textarea
              className="w-full p-2 rounded-md bg-transparent border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
              placeholder="Video Description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
            />
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-[#9D9D9D] hover:bg-[#8a8a8a] transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VideoModal; 