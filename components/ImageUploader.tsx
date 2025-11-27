import React, { useRef } from 'react';
import { Upload, Camera } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  image: string | null;
  onImageUpload: (base64: string) => void;
  aspectRatio?: string; // e.g., 'aspect-[3/4]'
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  image, 
  onImageUpload,
  aspectRatio = 'aspect-[3/4]'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <p className="text-sm font-bold text-fashion-gray mb-2 uppercase tracking-wider">{label}</p>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative w-full ${aspectRatio} rounded-lg border-2 border-dashed 
          ${image ? 'border-fashion-gold' : 'border-gray-300 hover:border-fashion-gray'}
          transition-colors cursor-pointer overflow-hidden bg-white group shadow-sm
        `}
      >
        {image ? (
          <img 
            src={image} 
            alt={label} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-fashion-black transition-colors">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-xs uppercase font-medium">Carregar Imagem</span>
          </div>
        )}
        
        {/* Hover overlay for existing image */}
        {image && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <div className="text-white flex flex-col items-center">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-xs">Alterar</span>
             </div>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
};