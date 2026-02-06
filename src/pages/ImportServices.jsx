import React from 'react';
import ImportServicesForm from '@/components/ImportServicesForm';
import { useQueryClient } from '@tanstack/react-query';

export default function ImportServices() {
  const queryClient = useQueryClient();

  const handleImportComplete = () => {
    // Refetch services data
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  return (
    <div className="space-y-6">
      <ImportServicesForm onImportComplete={handleImportComplete} />
    </div>
  );
}