import { useTheme } from '@/hooks/useTheme';

interface ThemeLoaderProps {
  children: React.ReactNode;
}

export function ThemeLoader({ children }: ThemeLoaderProps) {
  const { isThemeReady, isLoading } = useTheme();

  // Block rendering until active theme is loaded — no fallback UI
  if (!isThemeReady) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#ccc', borderTopColor: '#333' }}
          />
          {!isLoading && (
            <p className="text-sm" style={{ color: '#666' }}>
              No active theme configured
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
