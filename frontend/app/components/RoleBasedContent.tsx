'use client';

import { useAuth } from '../hooks/useAuth';

interface RoleBasedContentProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente para mostrar contenido basado en roles
 * Renderiza children solo si el usuario tiene el rol especificado
 */
export function RoleBasedContent({ role, children, fallback = null }: RoleBasedContentProps) {
  const { user } = useAuth();
  
  if (!user?.roles?.includes(role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface ModuleAccessProps {
  module: keyof typeof MODULE_PERMISSIONS;
  permission: 'read' | 'write' | 'validate';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Definición de permisos por módulo según especificación
const MODULE_PERMISSIONS = {
  'configuracion-institucional': {
    read: ['ADMIN', 'PLANIF'] as string[], // Consulta
    write: ['ADMIN'] as string[], // Registrar/Editar instituciones, usuarios, roles
    validate: [] as string[] // No aplica validación
  },
  'gestion-objetivos': {
    read: ['ADMIN', 'PLANIF', 'VALID', 'AUDITOR'] as string[], // Consultar objetivos
    write: ['ADMIN', 'PLANIF'] as string[], // Registrar/Editar objetivos, metas, indicadores
    validate: ['VALID'] as string[] // Solo Autoridad Validadora puede aprobar/rechazar
  },
  'gestion-proyectos': {
    read: ['ADMIN', 'PLANIF', 'REVISOR', 'AUDITOR'] as string[], // Consultar proyectos
    write: ['ADMIN', 'PLANIF'] as string[], // Registrar/Editar proyectos, actividades, presupuesto
    validate: ['REVISOR'] as string[] // Solo Revisor Institucional puede aprobar/rechazar
  },
  'reportes': {
    read: ['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'AUDITOR'] as string[], // Todos tienen acceso
    write: [] as string[], // No aplica escritura para reportes
    validate: [] as string[] // No aplica validación para reportes
  },
  'auditoria': {
    read: ['AUDITOR'] as string[], // Solo auditor tiene acceso completo
    write: [] as string[], // No aplica escritura directa
    validate: [] as string[] // No aplica validación
  }
};

/**
 * Componente para mostrar contenido basado en permisos de módulo
 */
export function ModuleAccess({ module, permission, children, fallback = null }: ModuleAccessProps) {
  const { user } = useAuth();
  
  if (!user?.roles) {
    return <>{fallback}</>;
  }
  
  const allowedRoles = MODULE_PERMISSIONS[module]?.[permission] || [];
  const hasAccess = user.roles.some(role => allowedRoles.includes(role));
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface RoleInfoCardProps {
  className?: string;
}

/**
 * Componente que muestra información específica del rol del usuario
 */
export function RoleInfoCard({ className = "" }: RoleInfoCardProps) {
  const { user } = useAuth();
  
  if (!user?.roles) return null;
  
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          title: '👨‍💼 Administrador del Sistema',
          description: 'Configurar el sistema institucionalmente, gestionar usuarios y supervisar la planificación.',
          modules: [
            '📦 Módulo 1: Configuración Institucional',
            '📦 Módulo 2: Objetivos Estratégicos', 
            '📦 Módulo 3: Proyectos de Inversión',
            '📦 Módulo 4: Reportes'
          ],
          actions: [
            '🔧 Registrar, editar y eliminar instituciones',
            '🔧 Crear y administrar usuarios y roles',
            '🔧 Registrar, editar y consultar objetivos y proyectos',
            '🔧 Acceder a todos los reportes y exportaciones',
            '🔧 Supervisar estructura organizativa general del sistema'
          ],
          color: 'emerald'
        };
      case 'PLANIF':
        return {
          title: '🧑‍💼 Técnico Planificador',
          description: 'Registrar y gestionar toda la planificación estratégica (objetivos, metas, indicadores, proyectos, presupuesto).',
          modules: [
            '📦 Módulo 2: Objetivos Estratégicos',
            '📦 Módulo 3: Proyectos de Inversión',
            '📦 Módulo 4: Reportes',
            '📖 (Consulta limitada en Módulo 1)'
          ],
          actions: [
            '🔧 Registrar y editar objetivos, metas e indicadores',
            '🔧 Alinear objetivos al PND y ODS',
            '🔧 Crear y editar proyectos, actividades y presupuestos',
            '🔧 Enviar proyectos y objetivos a revisión/validación',
            '🔧 Generar y exportar reportes técnicos'
          ],
          color: 'blue'
        };
      case 'REVISOR':
        return {
          title: '🧑‍⚖ Revisor Institucional',
          description: 'Evaluar y decidir sobre la validez de los proyectos de inversión.',
          modules: [
            '📦 Módulo 3: Proyectos de Inversión',
            '📦 Módulo 4: Reportes'
          ],
          actions: [
            '🔧 Revisar proyectos enviados por técnicos',
            '🔧 Aprobar o rechazar proyectos',
            '🔧 Consultar y filtrar reportes de proyectos',
            '🔧 Exportar reportes de forma limitada'
          ],
          color: 'purple'
        };
      case 'VALID':
        return {
          title: '🧑‍⚖ Autoridad Validadora (Validador)',
          description: 'Evaluar y aprobar o rechazar los objetivos estratégicos institucionales.',
          modules: [
            '📦 Módulo 2: Objetivos Estratégicos',
            '📦 Módulo 4: Reportes'
          ],
          actions: [
            '🔧 Revisar objetivos estratégicos enviados por técnicos',
            '🔧 Aprobar o rechazar objetivos',
            '🔧 Consultar y filtrar reportes de objetivos',
            '🔧 Exportar reportes de forma limitada'
          ],
          color: 'orange'
        };
      case 'AUDITOR':
        return {
          title: '🕵 Auditor',
          description: 'Supervisar el uso del sistema, revisar actividades institucionales y validar el cumplimiento del plan.',
          modules: [
            '📦 Módulo 4: Reportes',
            '📦 (Futuro: Módulo 5 de Auditoría y Trazabilidad)'
          ],
          actions: [
            '🔧 Generar reportes técnicos completos',
            '🔧 Comparar y validar avances presupuestarios y de planificación',
            '🔧 Exportar reportes completos',
            '🔧 Auditar uso del sistema y acciones por rol (en futuras versiones)'
          ],
          color: 'red'
        };
      default:
        return null;
    }
  };
  
  const primaryRole = user.roles[0]; // Mostrar info del rol principal
  const roleInfo = getRoleInfo(primaryRole);
  
  if (!roleInfo) return null;
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {roleInfo.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          ✅ <strong>Propósito general:</strong> {roleInfo.description}
        </p>
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">📦 Módulos que usa:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {roleInfo.modules.map((module, index) => (
            <li key={index}>{module}</li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">🔧 Acciones que realiza:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {roleInfo.actions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default RoleBasedContent;
