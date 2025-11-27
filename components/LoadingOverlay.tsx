import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
      <div className="relative">
        <div className="absolute inset-0 bg-fashion-gold blur-lg opacity-20 rounded-full animate-pulse"></div>
        <Loader2 className="w-16 h-16 animate-spin text-fashion-gold relative z-10" />
      </div>
      <p className="mt-6 text-xl font-serif tracking-widest animate-pulse">{message}</p>
    </div>
  );
};