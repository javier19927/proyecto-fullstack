'use client';

import { useState } from 'react';

interface SendToValidationButtonProps {
  itemId: number;
  itemType: 'objetivo' | 'proyecto';
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export default function SendToValidationButton({
  itemId,
  itemType,
  currentStatus,
  onStatusChange,
  disabled = false
}: SendToValidationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const canSendToValidation = currentStatus === 'BORRADOR';

  const handleSendToValidation = async () => {
    if (!canSendToValidation || disabled) return;

    setIsLoading(true);
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onStatusChange('EN_VALIDACION');
    } catch (error) {
      console.error('Error sending to validation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canSendToValidation) {
    return null;
  }

  return (
    <button
      onClick={handleSendToValidation}
      disabled={disabled || isLoading}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${disabled || isLoading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-yellow-600 hover:bg-yellow-700 text-white'
        }
      `}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Enviando...</span>
        </div>
      ) : (
        `Enviar ${itemType} a Validación`
      )}
    </button>
  );
}
