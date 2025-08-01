'use client';

import { useState } from 'react';

interface ValidationActionButtonsProps {
  itemId: number;
  itemType: 'objetivo' | 'proyecto';
  currentStatus: string;
  onValidate: (id: number, action: 'APROBAR' | 'RECHAZAR', observaciones?: string) => Promise<void>;
  userRole: string;
  className?: string;
}

export default function ValidationActionButtons({
  itemId,
  itemType,
  currentStatus,
  onValidate,
  userRole,
  className = ""
}: ValidationActionButtonsProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'APROBAR' | 'RECHAZAR' | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  // Determinar si el usuario puede validar este item
  const canValidate = () => {
    if (itemType === 'objetivo' && userRole === 'VALID' && currentStatus === 'EN_VALIDACION') {
      return true;
    }
    if (itemType === 'proyecto' && userRole === 'REVISOR' && currentStatus === 'ENVIADO') {
      return true;
    }
    return false;
  };

  const handleActionClick = (action: 'APROBAR' | 'RECHAZAR') => {
    setSelectedAction(action);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;
    
    setLoading(true);
    try {
      await onValidate(itemId, selectedAction, observaciones);
      setShowModal(false);
      setObservaciones('');
      setSelectedAction(null);
    } catch (error) {
      console.error('Error en validación:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setObservaciones('');
    setSelectedAction(null);
  };

  if (!canValidate()) {
    return null;
  }

  return (
    <>
      <div className={`flex space-x-2 ${className}`}>
        <button
          onClick={() => handleActionClick('APROBAR')}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Aprobar
        </button>
        
        <button
          onClick={() => handleActionClick('RECHAZAR')}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Rechazar
        </button>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedAction === 'APROBAR' ? 'Aprobar' : 'Rechazar'} {itemType}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                ¿Está seguro que desea {selectedAction === 'APROBAR' ? 'aprobar' : 'rechazar'} este {itemType}?
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones {selectedAction === 'RECHAZAR' ? '(requeridas)' : '(opcionales)'}
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Ingrese las observaciones para ${selectedAction === 'APROBAR' ? 'la aprobación' : 'el rechazo'}...`}
                required={selectedAction === 'RECHAZAR'}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || (selectedAction === 'RECHAZAR' && !observaciones.trim())}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  selectedAction === 'APROBAR'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                }`}
              >
                {loading ? 'Procesando...' : `${selectedAction === 'APROBAR' ? 'Aprobar' : 'Rechazar'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
