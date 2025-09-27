import { useState, useCallback } from 'react';

interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

/**
 * Custom hook for optimizing images before upload
 */
export function useImageOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeImage = useCallback(async (
    file: File, 
    options: OptimizeImageOptions = {}
  ): Promise<File> => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    setIsOptimizing(true);

    try {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name, {
                  type: `image/${format}`,
                  lastModified: Date.now(),
                });
                resolve(optimizedFile);
              } else {
                resolve(file); // Fallback to original file
              }
              setIsOptimizing(false);
            },
            `image/${format}`,
            quality
          );
        };

        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Image optimization failed:', error);
      setIsOptimizing(false);
      return file; // Return original file on error
    }
  }, []);

  return { optimizeImage, isOptimizing };
}
