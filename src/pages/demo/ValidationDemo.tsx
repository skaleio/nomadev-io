import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { ValidationSimulation } from './components/ValidationSimulation';
import { enableDemoMode } from '@/lib/demoMode';

const ValidationDemo: React.FC = () => {
  useDocumentTitle('Validador de Clientes - Demo');
  const navigate = useNavigate();

  useEffect(() => {
    enableDemoMode();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/interactive-demo')}
          className="border-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al demo principal
        </Button>
        <ValidationSimulation />
      </div>
    </DashboardLayout>
  );
};

export default ValidationDemo;
