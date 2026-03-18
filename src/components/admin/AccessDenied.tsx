import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  message?: string;
}

export function AccessDenied({ message = "Bu sahifani ko'rish uchun ruxsatingiz yo'q" }: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Ruxsat yo'q</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <Button variant="outline" onClick={() => navigate('/admin')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Bosh sahifaga qaytish
      </Button>
    </div>
  );
}
