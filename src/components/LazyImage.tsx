import { useState, useRef, useEffect, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrls } from '@/lib/imageOptimizer';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  sizes?: string;
  priority?: boolean;
}

const variantAvailabilityCache = new Map<string, boolean>();

const isOptimizedCandidate = (url: string) =>
  Boolean(url) && url.includes('/storage/') && /\.(jpg|jpeg|png)$/.test(url);

const getProbeVariantUrl = (url: string): string | null => {
  const match = url.match(/^(.+)\.[^.]+$/);
  if (!match) return null;
  return `${match[1]}-600.webp`;
};

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  placeholder = '/placeholder.svg',
  className,
  wrapperClassName,
  sizes: sizesProp,
  priority = false,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const [hasOptimizedVariants, setHasOptimizedVariants] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const finalSizes = sizesProp || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  const imgSrc = error ? placeholder : (src || placeholder);

  const optimized = useMemo(() => {
    if (!isOptimizedCandidate(imgSrc)) return null;
    return getOptimizedImageUrls(imgSrc);
  }, [imgSrc]);

  useEffect(() => {
    let cancelled = false;
    setHasOptimizedVariants(false);

    if (!optimized?.webpSrcSet) return;

    const probeUrl = getProbeVariantUrl(imgSrc);
    if (!probeUrl) return;

    const cachedValue = variantAvailabilityCache.get(probeUrl);
    if (cachedValue !== undefined) {
      setHasOptimizedVariants(cachedValue);
      return;
    }

    const probeImage = new Image();
    probeImage.onload = () => {
      variantAvailabilityCache.set(probeUrl, true);
      if (!cancelled) setHasOptimizedVariants(true);
    };
    probeImage.onerror = () => {
      variantAvailabilityCache.set(probeUrl, false);
      if (!cancelled) setHasOptimizedVariants(false);
    };
    probeImage.src = probeUrl;

    return () => {
      cancelled = true;
      probeImage.onload = null;
      probeImage.onerror = null;
    };
  }, [imgSrc, optimized?.webpSrcSet]);

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden bg-muted', wrapperClassName)}
    >
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {isInView && hasOptimizedVariants && optimized?.webpSrcSet ? (
        <picture>
          <source
            type="image/webp"
            srcSet={optimized.webpSrcSet}
            sizes={finalSizes}
          />
          <source
            type="image/jpeg"
            srcSet={optimized.srcSet}
            sizes={finalSizes}
          />
          <img
            src={optimized.fallbackSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            {...props}
          />
        </picture>
      ) : isInView ? (
        <img
          src={imgSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      ) : null}
    </div>
  );
});

interface ThumbnailImageProps extends LazyImageProps {
  size?: 'sm' | 'md' | 'lg';
}

export const ThumbnailImage = memo(function ThumbnailImage({
  src,
  size = 'md',
  className,
  ...props
}: ThumbnailImageProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-full h-full',
    lg: 'w-full h-full',
  };

  const sizesMap = {
    sm: '48px',
    md: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
    lg: '(max-width: 640px) 100vw, 50vw',
  };

  return (
    <LazyImage
      src={src}
      sizes={sizesMap[size]}
      className={cn('object-cover', sizeClasses[size], className)}
      {...props}
    />
  );
});

export const HeroImage = memo(function HeroImage({
  src,
  className,
  ...props
}: LazyImageProps) {
  return (
    <LazyImage
      src={src}
      priority
      sizes="100vw"
      className={cn('object-cover', className)}
      {...props}
    />
  );
});
