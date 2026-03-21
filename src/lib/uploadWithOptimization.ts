import { supabase } from '@/integrations/supabase/client';
import { processImageForUpload, uploadOptimizedImages } from './imageOptimizer';

const BUCKET = 'product-images';

/**
 * Upload an image with automatic WebP optimization and multiple sizes.
 * Returns the public URL of the original image (base reference).
 * Optimized variants (300/600/1200 in webp+jpg) are uploaded alongside.
 */
export async function uploadOptimizedImage(
  file: File,
  folder: string,
  options?: {
    fileNamePrefix?: string;
    skipOptimization?: boolean;
    onProgress?: (step: string, percent: number) => void;
  }
): Promise<string> {
  const baseName = `${options?.fileNamePrefix || 'img'}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const basePath = `${folder}/${baseName}`;

  // For non-image files or if optimization is skipped, do simple upload
  if (options?.skipOptimization || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/x-icon') {
    const ext = file.name.split('.').pop() || 'bin';
    const filePath = `${basePath}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
      upsert: true,
      cacheControl: '31536000',
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return publicUrl;
  }

  // Process image into optimized variants
  const processed = await processImageForUpload(file, options?.onProgress);

  // Upload all variants
  await uploadOptimizedImages(supabase, BUCKET, basePath, processed);

  // Return the original's public URL as the canonical reference
  const originalImg = processed.find(p => p.suffix === 'original');
  const ext = originalImg?.format === 'png' ? 'png' : 'jpg';
  const originalPath = `${basePath}.${ext}`;
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(originalPath);

  return publicUrl;
}
