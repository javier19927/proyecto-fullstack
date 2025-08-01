'use client';

import { useEffect, useState } from 'react';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface PND {
  id: number;
  idPND: string;
  nombre: string;
  descripcion?: string;
}

interface ODS {
  id: number;
  idODS: string;
  numero: number;
  nombre: string;
  titulo: string;
}

interface PNDODSAlignmentSelectorProps {
  selectedPND?: string;
  selectedODS?: string;
  onPNDChange: (pndId: string, pndNombre: string) => void;
  onODSChange: (odsId: string, odsNombre: string) => void;
  token: string;
  className?: string;
  required?: boolean;
}

/**
 * Componente específico para TÉCNICO PLANIFICADOR
 * Permite alinear objetivos al PND y ODS según especificación del rol
 */
export default function PNDODSAlignmentSelector({
  selectedPND,
  selectedODS,
  onPNDChange,
  onODSChange,
  token,
  className = "",
  required = false
}: PNDODSAlignmentSelectorProps) {
  const [pndList, setPndList] = useState<PND[]>([]);
  const [odsList, setOdsList] = useState<ODS[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPNDInfo, setShowPNDInfo] = useState(false);
  const [showODSInfo, setShowODSInfo] = useState(false);

  useEffect(() => {
    loadAlignmentOptions();
  }, []);

  const loadAlignmentOptions = async () => {
    try {
      // Cargar lista de PND
      const pndResponse = await fetch(buildApiUrl('/api/pnd/all'), {
        headers: buildHeaders(token)
      });
      
      if (pndResponse.ok) {
        const pndData = await pndResponse.json();
        setPndList(pndData.data || []);
      }

      // Cargar lista de ODS
      const odsResponse = await fetch(buildApiUrl('/api/ods/all'), {
        headers: buildHeaders(token)
      });
      
      if (odsResponse.ok) {
        const odsData = await odsResponse.json();
        setOdsList(odsData.data || []);
      }
    } catch (error) {
      console.error('Error cargando opciones de alineación:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePNDSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const pndId = event.target.value;
    const pnd = pndList.find(p => p.id.toString() === pndId);
    onPNDChange(pndId, pnd?.nombre || '');
  };

  const handleODSSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const odsId = event.target.value;
    const ods = odsList.find(o => o.id.toString() === odsId);
    onODSChange(odsId, ods ? `${ods.numero}. ${ods.titulo}` : '');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sección PND */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-blue-900">
            🎯 Alineación al Plan Nacional de Desarrollo (PND)
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowPNDInfo(!showPNDInfo)}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            ℹ️ ¿Qué es el PND?
          </button>
        </div>
        
        {showPNDInfo && (
          <div className="mb-3 p-3 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
            <strong>Plan Nacional de Desarrollo:</strong> Instrumento de planificación que establece los objetivos, políticas, estrategias, programas y proyectos de desarrollo del país para un período determinado.
          </div>
        )}

        <select
          value={selectedPND || ''}
          onChange={handlePNDSelection}
          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          required={required}
          disabled={loading}
        >
          <option value="">Seleccione una alineación al PND...</option>
          {pndList.map((pnd) => (
            <option key={pnd.id} value={pnd.id.toString()}>
              {pnd.idPND} - {pnd.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Sección ODS */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-green-900">
            🌍 Alineación a los Objetivos de Desarrollo Sostenible (ODS)
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowODSInfo(!showODSInfo)}
            className="text-green-600 hover:text-green-800 text-xs"
          >
            ℹ️ ¿Qué son los ODS?
          </button>
        </div>
        
        {showODSInfo && (
          <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded text-xs text-green-800">
            <strong>ODS:</strong> Los 17 Objetivos de Desarrollo Sostenible son un llamado universal a la acción para poner fin a la pobreza, proteger el planeta y mejorar las vidas y perspectivas de las personas en todo el mundo.
          </div>
        )}

        <select
          value={selectedODS || ''}
          onChange={handleODSSelection}
          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          required={required}
          disabled={loading}
        >
          <option value="">Seleccione una alineación a los ODS...</option>
          {odsList.map((ods) => (
            <option key={ods.id} value={ods.id.toString()}>
              ODS {ods.numero}: {ods.titulo}
            </option>
          ))}
        </select>
      </div>

      {/* Ayuda contextual para TÉCNICO PLANIFICADOR */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-600">💡</span>
          </div>
          <div className="ml-2">
            <h4 className="text-sm font-medium text-yellow-900">Guía de Alineación</h4>
            <p className="text-xs text-yellow-800 mt-1">
              Como <strong>Técnico Planificador</strong>, debe asegurar que todos los objetivos estén correctamente alineados tanto al PND como a los ODS. Esta alineación es fundamental para la coherencia estratégica institucional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
