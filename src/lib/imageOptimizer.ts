import imageCompression from 'browser-image-compression';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface OptimizedImageSet {
  original: string;
  small: string;   // 300px
  medium: string;  // 600px  
  large: string;   // 1200px
  webp: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface ProcessedImage {
  file: File;
  width: number;
  suffix: string;
  format: string;
}

const IMAGE_SIZES = [
  { width: 300, suffix: 'sm' },
  { width: 600, suffix: 'md' },
  { width: 1200, suffix: 'lg' },
] as const;

/**
 * Compress and resize an image file to a target width
 */
async function compressAndResize(
  file: File,
  maxWidth: number,
  format: 'webp' | 'jpeg' = 'webp',
  quality: number = 0.8
): Promise<File> {
  const options = {
    maxWidthOrHeight: maxWidth,
    maxSizeMB: format === 'webp' ? 0.3 : 0.5,
    useWebWorker: true,
    fileType: format === 'webp' ? 'image/webp' as const : 'image/jpeg' as const,
    initialQuality: quality,
  };

  const compressed = await imageCompression(file, options);
  
  // Rename the file with size suffix
  const ext = format === 'webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const newName = `${baseName}-${maxWidth}.${ext}`;
  
  return new File([compressed], newName, { type: compressed.type });
}

/**
 * Convert a file to WebP using canvas
 */
async function convertToWebP(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context unavailable'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('WebP conversion failed'));
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    
    img.src = url;
  });
}

/**
 * Process a single image into multiple optimized versions.
 * Returns an array of files ready for upload.
 */
export async function processImageForUpload(
  file: File,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  const totalSteps = IMAGE_SIZES.length * 2 + 1; // webp + jpg for each size, plus original
  let currentStep = 0;

  const report = (step: string) => {
    currentStep++;
    onProgress?.(step, Math.round((currentStep / totalSteps) * 100));
  };

  // Generate WebP versions at each size
  for (const size of IMAGE_SIZES) {
    try {
      const webpFile = await compressAndResize(file, size.width, 'webp', 0.82);
      results.push({ file: webpFile, width: size.width, suffix: size.suffix, format: 'webp' });
      report(`WebP ${size.width}px`);
    } catch (e) {
      console.warn(`WebP ${size.width}px failed, skipping`, e);
      report(`WebP ${size.width}px (skipped)`);
    }
  }

  // Generate JPEG fallbacks at each size
  for (const size of IMAGE_SIZES) {
    try {
      const jpgFile = await compressAndResize(file, size.width, 'jpeg', 0.85);
      results.push({ file: jpgFile, width: size.width, suffix: size.suffix, format: 'jpeg' });
      report(`JPEG ${size.width}px`);
    } catch (e) {
      console.warn(`JPEG ${size.width}px failed, skipping`, e);
      report(`JPEG ${size.width}px (skipped)`);
    }
  }

  // Keep compressed original as fallback
  try {
    const originalCompressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.9,
    });
    results.push({ 
      file: new File([originalCompressed], file.name, { type: originalCompressed.type }),
      width: 1920, 
      suffix: 'original', 
      format: file.type.includes('png') ? 'png' : 'jpeg' 
    });
    report('Original (compressed)');
  } catch {
    results.push({ file, width: 1920, suffix: 'original', format: file.type.includes('png') ? 'png' : 'jpeg' });
    report('Original');
  }

  return results;
}

/**
 * Upload all processed image variants to Supabase Storage
 * Returns the base path (without size suffix) for constructing URLs
 */
export async function uploadOptimizedImages(
  supabaseClient: any,
  bucket: string,
  basePath: string,
  processedImages: ProcessedImage[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<string> {
  let uploaded = 0;
  
  for (const img of processedImages) {
    const ext = img.format === 'webp' ? 'webp' : img.format === 'png' ? 'png' : 'jpg';
    const filePath = img.suffix === 'original' 
      ? `${basePath}.${ext}`
      : `${basePath}-${img.width}.${ext}`;

    const { error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, img.file, { 
        upsert: true,
        contentType: img.file.type,
        cacheControl: '31536000', // 1 year cache
      });

    if (error) {
      console.warn(`Upload failed for ${filePath}:`, error.message);
    }
    
    uploaded++;
    onProgress?.(uploaded, processedImages.length);
  }

  return basePath;
}

/**
 * Get the public URL for an optimized image from Supabase Storage
 */
export function getStoragePublicUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Given a base image URL from Supabase storage, generate optimized srcSet URLs.
 * If the image has optimized variants uploaded, returns proper srcset.
 */
export function getOptimizedImageUrls(originalUrl: string): {
  srcSet: string;
  webpSrcSet: string;
  fallbackSrc: string;
  sizes: string;
} {
  if (!originalUrl || !originalUrl.includes('/storage/') || originalUrl.startsWith('data:')) {
    return { srcSet: '', webpSrcSet: '', fallbackSrc: originalUrl, sizes: '' };
  }

  // Extract base path from URL: remove extension
  const urlParts = originalUrl.match(/^(.+?)(\.[^.]+)$/);
  if (!urlParts) {
    return { srcSet: '', webpSrcSet: '', fallbackSrc: originalUrl, sizes: '' };
  }

  const basePath = urlParts[1];
  const originalExt = urlParts[2]; // .jpg, .png, etc.

  // Build WebP srcset
  const webpSrcSet = IMAGE_SIZES
    .map(size => `${basePath}-${size.width}.webp ${size.width}w`)
    .join(', ');

  // Build JPEG/PNG fallback srcset
  const srcSet = IMAGE_SIZES
    .map(size => `${basePath}-${size.width}.jpg ${size.width}w`)
    .join(', ');

  const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return { srcSet, webpSrcSet, fallbackSrc: originalUrl, sizes };
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}
