'use client';

import { useAuth } from '../hooks/useAuth';
import { hasModuleAccess } from '../utils/rolePermissions';

interface RoleSpecificNavigation {
  [key: string]: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
    description: string;
    badge?: string;
  }>;
}

/**
 * Navegación específica por rol según las especificaciones
 */
const ROLE_NAVIGATION: RoleSpecificNavigation = {
  // 👨‍💼 ADMINISTRADOR DEL SISTEMA
  ADMIN: [
    {
      id: 'configuracion',
      label: 'Configuración Institucional',
      icon: '⚙️',
      href: '/configuracion-institucional',
      description: 'Registrar, editar instituciones, crear usuarios y roles',
      badge: 'Módulo 1'
    },
    {
      id: 'supervision',
      label: 'Supervisión del Sistema',
      icon: '👁️',
      href: '/supervision-sistema',
      description: 'Supervisar estructura organizativa general',
      badge: 'Admin'
    },
    {
      id: 'objetivos',
      label: 'Objetivos Estratégicos',
      icon: '🎯',
      href: '/gestion-objetivos',
      description: 'Registrar, editar y consultar objetivos',
      badge: 'Módulo 2'
    },
    {
      id: 'proyectos',
      label: 'Proyectos de Inversión',
      icon: '🏗️',
      href: '/gestion-proyectos',
      description: 'Registrar, editar y consultar proyectos',
      badge: 'Módulo 3'
    },
    {
      id: 'reportes',
      label: 'Reportes Completos',
      icon: '📊',
      href: '/reportes',
      description: 'Acceder a todos los reportes y exportaciones',
      badge: 'Módulo 4'
    }
  ],

  // 🧑‍💼 TÉCNICO PLANIFICADOR
  PLANIF: [
    {
      id: 'dashboard',
      label: 'Panel de Planificación',
      icon: '📋',
      href: '/dashboard',
      description: 'Panel de seguimiento de planificación estratégica',
      badge: 'Principal'
    },
    {
      id: 'objetivos',
      label: 'Gestión de Objetivos',
      icon: '🎯',
      href: '/gestion-objetivos',
      description: 'Registrar, editar objetivos, metas e indicadores',
      badge: 'Módulo 2'
    },
    {
      id: 'alineacion',
      label: 'Alineación PND/ODS',
      icon: '🌐',
      href: '/alineacion-pnd-ods',
      description: 'Alinear objetivos al PND y ODS',
      badge: 'Estratégico'
    },
    {
      id: 'proyectos',
      label: 'Proyectos de Inversión',
      icon: '🏗️',
      href: '/gestion-proyectos',
      description: 'Crear y editar proyectos, actividades y presupuestos',
      badge: 'Módulo 3'
    },
    {
      id: 'envios',
      label: 'Envíos a Validación',
      icon: '📤',
      href: '/envios-validacion',
      description: 'Enviar proyectos y objetivos a revisión/validación',
      badge: 'Workflow'
    },
    {
      id: 'reportes',
      label: 'Reportes Técnicos',
      icon: '📈',
      href: '/reportes',
      description: 'Generar y exportar reportes técnicos',
      badge: 'Módulo 4'
    },
    {
      id: 'configuracion-consulta',
      label: 'Consulta Institucional',
      icon: '👁️',
      href: '/configuracion-institucional',
      description: 'Consulta limitada de configuración',
      badge: 'Solo consulta'
    }
  ],

  // 🧑‍⚖ REVISOR INSTITUCIONAL
  REVISOR: [
    {
      id: 'dashboard',
      label: 'Panel de Revisión',
      icon: '⚖️',
      href: '/dashboard',
      description: 'Panel específico para revisor institucional',
      badge: 'Principal'
    },
    {
      id: 'proyectos-revision',
      label: 'Proyectos para Revisar',
      icon: '📋',
      href: '/proyectos-revision',
      description: 'Revisar proyectos enviados por técnicos',
      badge: 'Módulo 3'
    },
    {
      id: 'historial-decisiones',
      label: 'Historial de Decisiones',
      icon: '📜',
      href: '/historial-decisiones',
      description: 'Consultar decisiones anteriores de proyectos',
      badge: 'Historial'
    },
    {
      id: 'reportes-proyectos',
      label: 'Reportes de Proyectos',
      icon: '📊',
      href: '/reportes?filter=proyectos',
      description: 'Consultar y filtrar reportes de proyectos',
      badge: 'Módulo 4'
    }
  ],

  // 🧑‍⚖ AUTORIDAD VALIDADORA
  VALID: [
    {
      id: 'dashboard',
      label: 'Panel de Validación',
      icon: '✅',
      href: '/dashboard',
      description: 'Panel específico para autoridad validadora',
      badge: 'Principal'
    },
    {
      id: 'objetivos-validacion',
      label: 'Objetivos para Validar',
      icon: '🎯',
      href: '/objetivos-validacion',
      description: 'Revisar objetivos estratégicos enviados por técnicos',
      badge: 'Módulo 2'
    },
    {
      id: 'historial-validaciones',
      label: 'Historial de Validaciones',
      icon: '📜',
      href: '/historial-validaciones',
      description: 'Consultar decisiones anteriores de objetivos',
      badge: 'Historial'
    },
    {
      id: 'reportes-objetivos',
      label: 'Reportes de Objetivos',
      icon: '📈',
      href: '/reportes?filter=objetivos',
      description: 'Consultar y filtrar reportes de objetivos',
      badge: 'Módulo 4'
    }
  ],

  // 🕵 AUDITOR
  AUDITOR: [
    {
      id: 'dashboard',
      label: 'Panel de Auditoría',
      icon: '🕵️',
      href: '/dashboard',
      description: 'Panel específico para auditor del sistema',
      badge: 'Principal'
    },
    {
      id: 'auditoria-avanzada',
      label: 'Herramientas de Auditoría',
      icon: '🔍',
      href: '/auditoria-avanzada',
      description: 'Supervisar uso del sistema y validar cumplimiento',
      badge: 'Módulo 5'
    },
    {
      id: 'trazabilidad',
      label: 'Trazabilidad del Sistema',
      icon: '🔗',
      href: '/trazabilidad',
      description: 'Auditar actividades institucionales por rol',
      badge: 'Auditoría'
    },
    {
      id: 'reportes-completos',
      label: 'Reportes Completos',
      icon: '📊',
      href: '/reportes',
      description: 'Generar reportes técnicos completos y comparativos',
      badge: 'Módulo 4'
    },
    {
      id: 'validacion-cumplimiento',
      label: 'Validación de Cumplimiento',
      icon: '✅',
      href: '/validacion-cumplimiento',
      description: 'Comparar y validar avances presupuestarios',
      badge: 'Análisis'
    }
  ]
};

interface RoleSpecificNavigationProps {
  className?: string;
}

/**
 * Componente de navegación específica por rol
 * Muestra solo las opciones relevantes para cada rol según especificaciones
 */
export default function RoleSpecificNavigation({ className = "" }: RoleSpecificNavigationProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  // Obtener el rol principal del usuario (el primero de la lista)
  const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
  
  // Mapear roles del sistema para consistencia
  const roleMapping: Record<string, string> = {
    'VALIDADOR': 'VALID',
    'AUDITOR': 'AUDITOR',
    'ADMIN': 'ADMIN',
    'PLANIF': 'PLANIF',
    'REVISOR': 'REVISOR',
    'CONSUL': 'CONSUL'
  };
  
  const mappedRole = primaryRole ? (roleMapping[primaryRole] || primaryRole) : null;
  
  if (!mappedRole || !ROLE_NAVIGATION[mappedRole]) {
    return null;
  }

  const navigationItems = ROLE_NAVIGATION[mappedRole];

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      ADMIN: 'Administrador del Sistema',
      PLANIF: 'Técnico Planificador',
      REVISOR: 'Revisor Institucional',
      VALID: 'Autoridad Validadora',
      AUDITOR: 'Auditor del Sistema'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      ADMIN: 'blue',
      PLANIF: 'green',
      REVISOR: 'purple',
      VALID: 'orange',
      AUDITOR: 'red'
    };
    return roleColors[role] || 'gray';
  };

  const roleColor = getRoleColor(mappedRole);

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header del rol */}
      <div className={`bg-${roleColor}-50 border-b border-${roleColor}-200 px-6 py-4 rounded-t-lg`}>
        <div className="flex items-center">
          <div className={`w-10 h-10 bg-${roleColor}-100 rounded-lg flex items-center justify-center mr-3`}>
            {mappedRole === 'ADMIN' && '👨‍💼'}
            {mappedRole === 'PLANIF' && '🧑‍💼'}
            {mappedRole === 'REVISOR' && '🧑‍⚖'}
            {mappedRole === 'VALID' && '🧑‍⚖'}
            {mappedRole === 'AUDITOR' && '🕵️'}
          </div>
          <div>
            <h2 className={`text-lg font-semibold text-${roleColor}-900`}>
              {getRoleName(mappedRole)}
            </h2>
            <p className={`text-sm text-${roleColor}-700`}>
              Navegación específica para tu rol
            </p>
          </div>
        </div>
      </div>

      {/* Lista de navegación */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navigationItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="group block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {item.label}
                    </h3>
                    {item.badge && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${roleColor}-100 text-${roleColor}-800`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 group-hover:text-gray-700">
                    {item.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className={`bg-${roleColor}-50 border-t border-${roleColor}-200 px-6 py-3 rounded-b-lg`}>
        <p className={`text-xs text-${roleColor}-700`}>
          📋 Tienes acceso a {navigationItems.length} módulos según tu rol de {getRoleName(mappedRole)}
        </p>
      </div>
    </div>
  );
}
