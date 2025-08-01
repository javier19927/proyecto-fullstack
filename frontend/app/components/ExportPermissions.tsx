'use client';

import { useAuth } from '../hooks/useAuth';

interface ExportPermissionsProps {
  userRole: string;
  reportType: 'objetivos' | 'proyectos' | 'comparativo' | 'auditoria' | 'general';
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente que controla las capacidades de exportación según el rol del usuario
 * Implementa la diferenciación entre exportación completa vs limitada
 */
export default function ExportPermissions({ 
  userRole, 
  reportType, 
  children, 
  className = "" 
}: ExportPermissionsProps) {
  const { user } = useAuth();
  
  // Definir qué roles pueden hacer exportación completa vs limitada
  const getExportCapabilities = () => {
    switch (reportType) {
      case 'objetivos':
        return {
          canExportComplete: ['ADMIN', 'PLANIF', 'AUDITOR'].includes(userRole),
          canExportLimited: ['VALID'].includes(userRole),
          canExport: ['ADMIN', 'PLANIF', 'VALID', 'AUDITOR'].includes(userRole)
        };
        
      case 'proyectos':
        return {
          canExportComplete: ['ADMIN', 'PLANIF', 'AUDITOR'].includes(userRole),
          canExportLimited: ['REVISOR'].includes(userRole),
          canExport: ['ADMIN', 'PLANIF', 'REVISOR', 'AUDITOR'].includes(userRole)
        };
        
      case 'comparativo':
      case 'auditoria':
        return {
          canExportComplete: ['AUDITOR'].includes(userRole),
          canExportLimited: false,
          canExport: ['AUDITOR'].includes(userRole)
        };
        
      case 'general':
        return {
          canExportComplete: ['ADMIN', 'PLANIF', 'AUDITOR'].includes(userRole),
          canExportLimited: ['REVISOR', 'VALID'].includes(userRole),
          canExport: ['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'AUDITOR'].includes(userRole)
        };
        
      default:
        return {
          canExportComplete: false,
          canExportLimited: false,
          canExport: false
        };
    }
  };

  const capabilities = getExportCapabilities();

  // Si no tiene permisos de exportación, no renderizar nada
  if (!capabilities.canExport) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Información sobre capacidades de exportación */}
      <div className="text-xs text-gray-600 mb-2">
        {capabilities.canExportComplete && (
          <div className="flex items-center text-green-600">
            <span className="mr-1">✅</span>
            <span>Exportación completa disponible</span>
          </div>
        )}
        {capabilities.canExportLimited && !capabilities.canExportComplete && (
          <div className="flex items-center text-orange-600">
            <span className="mr-1">⚠️</span>
            <span>Exportación limitada disponible</span>
          </div>
        )}
      </div>

      {/* Renderizar los controles de exportación */}
      {children}

      {/* Leyenda sobre limitaciones */}
      {capabilities.canExportLimited && !capabilities.canExportComplete && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
          <strong>Exportación Limitada:</strong> Su rol permite exportar reportes con información resumida y sin datos sensibles.
        </div>
      )}
    </div>
  );
}

interface RoleBasedExportButtonProps {
  userRole: string;
  reportType: 'objetivos' | 'proyectos' | 'comparativo' | 'auditoria' | 'general';
  onExportComplete?: () => void;
  onExportLimited?: () => void;
  format: 'pdf' | 'excel';
  loading?: boolean;
  className?: string;
}

/**
 * Botón de exportación que se adapta a los permisos del rol
 */
export function RoleBasedExportButton({
  userRole,
  reportType,
  onExportComplete,
  onExportLimited,
  format,
  loading = false,
  className = ""
}: RoleBasedExportButtonProps) {
  const getExportCapabilities = () => {
    switch (reportType) {
      case 'objetivos':
        return {
          canExportComplete: ['ADMIN', 'PLANIF', 'AUDITOR'].includes(userRole),
          canExportLimited: ['VALID'].includes(userRole),
          canExport: ['ADMIN', 'PLANIF', 'VALID', 'AUDITOR'].includes(userRole)
        };
        
      case 'proyectos':
        return {
          canExportComplete: ['ADMIN', 'PLANIF', 'AUDITOR'].includes(userRole),
          canExportLimited: ['REVISOR'].includes(userRole),
          canExport: ['ADMIN', 'PLANIF', 'REVISOR', 'AUDITOR'].includes(userRole)
        };
        
      case 'comparativo':
      case 'auditoria':
        return {
          canExportComplete: ['AUDITOR'].includes(userRole),
          canExportLimited: false,
          canExport: ['AUDITOR'].includes(userRole)
        };
        
      case 'general':
        return {
          canExportComplete: ['ADMIN', 'PLANIF', 'AUDITOR'].includes(userRole),
          canExportLimited: ['REVISOR', 'VALID'].includes(userRole),
          canExport: ['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'AUDITOR'].includes(userRole)
        };
        
      default:
        return {
          canExportComplete: false,
          canExportLimited: false,
          canExport: false
        };
    }
  };

  const capabilities = getExportCapabilities();

  if (!capabilities.canExport) {
    return null;
  }

  const handleExport = () => {
    if (capabilities.canExportComplete && onExportComplete) {
      onExportComplete();
    } else if (capabilities.canExportLimited && onExportLimited) {
      onExportLimited();
    }
  };

  const getButtonText = () => {
    const formatIcon = format === 'pdf' ? '📄' : '📊';
    const formatText = format.toUpperCase();
    
    if (capabilities.canExportComplete) {
      return `${formatIcon} Exportar ${formatText} Completo`;
    } else if (capabilities.canExportLimited) {
      return `${formatIcon} Exportar ${formatText} Limitado`;
    }
    return `${formatIcon} Exportar ${formatText}`;
  };

  const getButtonClass = () => {
    let baseClass = `inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${className}`;
    
    if (capabilities.canExportComplete) {
      baseClass += ' bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300';
    } else if (capabilities.canExportLimited) {
      baseClass += ' bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-300';
    } else {
      baseClass += ' bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300';
    }
    
    return baseClass;
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={getButtonClass()}
      title={capabilities.canExportLimited && !capabilities.canExportComplete ? 
        'Exportación limitada según su rol' : 
        'Exportación completa disponible'
      }
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Exportando...
        </>
      ) : (
        getButtonText()
      )}
    </button>
  );
}

interface RoleBasedReportFiltersProps {
  userRole: string;
  reportType: 'objetivos' | 'proyectos' | 'comparativo' | 'auditoria' | 'general';
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  className?: string;
}

/**
 * Filtros de reporte que se adaptan según el rol del usuario
 */
export function RoleBasedReportFilters({
  userRole,
  reportType,
  filters,
  onFiltersChange,
  className = ""
}: RoleBasedReportFiltersProps) {
  
  const getAvailableFilters = () => {
    const baseFilters = ['fecha_inicio', 'fecha_fin', 'estado'];
    
    switch (userRole) {
      case 'ADMIN':
        // ADMIN ve todos los filtros
        return [...baseFilters, 'institucion', 'responsable', 'area', 'tipo', 'presupuesto'];
        
      case 'PLANIF':
        // PLANIF ve filtros relacionados con su trabajo
        return [...baseFilters, 'area', 'tipo', 'prioridad'];
        
      case 'REVISOR':
        // REVISOR ve solo filtros de proyectos que debe revisar
        return reportType === 'proyectos' ? 
          [...baseFilters, 'presupuesto', 'fecha_revision'] : 
          baseFilters;
          
      case 'VALID':
        // VALID ve solo filtros de objetivos que debe validar
        return reportType === 'objetivos' ? 
          [...baseFilters, 'prioridad', 'alineacion_pnd', 'alineacion_ods'] : 
          baseFilters;
          
      case 'AUDITOR':
        // AUDITOR ve todos los filtros para auditoría
        return [...baseFilters, 'institucion', 'responsable', 'area', 'tipo', 'presupuesto', 'validador', 'usuario_creador'];
        
      default:
        return baseFilters;
    }
  };

  const availableFilters = getAvailableFilters();

  const handleFilterChange = (filterName: string, value: any) => {
    onFiltersChange({
      ...filters,
      [filterName]: value
    });
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {availableFilters.includes('fecha_inicio') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={filters.fecha_inicio || ''}
            onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      
      {availableFilters.includes('fecha_fin') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Fin
          </label>
          <input
            type="date"
            value={filters.fecha_fin || ''}
            onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {availableFilters.includes('estado') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={filters.estado || ''}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="EN_VALIDACION">En Validación</option>
            <option value="ENVIADO">Enviado</option>
            <option value="APROBADO">Aprobado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>
      )}

      {availableFilters.includes('institucion') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Institución
          </label>
          <select
            value={filters.institucion || ''}
            onChange={(e) => handleFilterChange('institucion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las instituciones</option>
            {/* Aquí se cargarían las instituciones desde la API */}
          </select>
        </div>
      )}

      {/* Nota sobre filtros disponibles según rol */}
      <div className="col-span-full">
        <div className="text-xs text-gray-500 mt-2">
          <strong>Filtros disponibles para su rol ({userRole}):</strong> {availableFilters.join(', ')}
        </div>
      </div>
    </div>
  );
}
