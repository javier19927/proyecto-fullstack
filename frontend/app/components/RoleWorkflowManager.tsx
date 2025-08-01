'use client';

import { useAuth } from '../hooks/useAuth';
import ValidatorWorkflow from './ValidatorWorkflow';
import ReviewerWorkflow from './ReviewerWorkflow'; 
import AuditorComplianceTools from './AuditorComplianceTools';
import DecisionHistoryPanel from './DecisionHistoryPanel';
import PlannerTrackingPanel from './PlannerTrackingPanel';

interface RoleWorkflowManagerProps {
  className?: string;
}

/**
 * Componente que maneja los flujos de trabajo específicos según el rol del usuario
 * Implementa las funcionalidades específicas que deben cumplir cada rol
 */
export default function RoleWorkflowManager({ className = "" }: RoleWorkflowManagerProps) {
  const { user } = useAuth();

  if (!user) return null;

  const userRole = user.roles[0] || '';

  return (
    <div className={className}>
      {/* 🧑‍⚖ Autoridad Validadora - Validar objetivos estratégicos */}
      {userRole === 'VALID' && (
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  🧑‍⚖
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-orange-900">
                  Panel de Autoridad Validadora
                </h2>
                <p className="text-sm text-orange-700">
                  Evaluar y aprobar o rechazar objetivos estratégicos enviados por técnicos planificadores
                </p>
              </div>
            </div>
          </div>
          
          {/* Pestañas para Validador */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button className="w-1/2 py-4 px-1 text-center border-b-2 border-orange-500 font-medium text-sm text-orange-600">
                  📋 Objetivos Pendientes
                </button>
                <button className="w-1/2 py-4 px-1 text-center border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
                  📜 Historial de Decisiones
                </button>
              </nav>
            </div>
            <div className="p-6">
              <ValidatorWorkflow />
            </div>
          </div>
          
          {/* Panel de Historial para Validador */}
          <DecisionHistoryPanel userRole="VALID" />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Funcionalidades Específicas del Validador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900">✅ Puede realizar:</h4>
                <ul className="mt-2 text-sm text-green-800 space-y-1">
                  <li>• Revisar objetivos estratégicos enviados</li>
                  <li>• Aprobar objetivos con comentarios</li>
                  <li>• Rechazar objetivos con observaciones</li>
                  <li>• Consultar reportes de objetivos (limitado)</li>
                  <li>• Exportar reportes de objetivos (limitado)</li>
                  <li>• Ver historial de validaciones anteriores</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900">❌ No puede realizar:</h4>
                <ul className="mt-2 text-sm text-red-800 space-y-1">
                  <li>• Crear o editar objetivos</li>
                  <li>• Acceder a proyectos de inversión</li>
                  <li>• Gestionar usuarios o instituciones</li>
                  <li>• Ver reportes completos del sistema</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧑‍⚖ Revisor Institucional - Revisar proyectos de inversión */}
      {userRole === 'REVISOR' && (
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  🧑‍⚖
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-purple-900">
                  Panel de Revisor Institucional
                </h2>
                <p className="text-sm text-purple-700">
                  Evaluar y decidir sobre la validez de los proyectos de inversión
                </p>
              </div>
            </div>
          </div>
          
          {/* Pestañas para Revisor */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button className="w-1/2 py-4 px-1 text-center border-b-2 border-purple-500 font-medium text-sm text-purple-600">
                  🏗️ Proyectos Pendientes
                </button>
                <button className="w-1/2 py-4 px-1 text-center border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
                  📜 Historial de Decisiones
                </button>
              </nav>
            </div>
            <div className="p-6">
              <ReviewerWorkflow />
            </div>
          </div>
          
          {/* Panel de Historial para Revisor */}
          <DecisionHistoryPanel userRole="REVISOR" />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Funcionalidades Específicas del Revisor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900">✅ Puede realizar:</h4>
                <ul className="mt-2 text-sm text-green-800 space-y-1">
                  <li>• Revisar proyectos enviados por técnicos</li>
                  <li>• Aprobar proyectos de inversión</li>
                  <li>• Rechazar proyectos con observaciones</li>
                  <li>• Consultar reportes de proyectos</li>
                  <li>• Exportar reportes de proyectos (limitado)</li>
                  <li>• Ver historial de revisiones anteriores</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900">❌ No puede realizar:</h4>
                <ul className="mt-2 text-sm text-red-800 space-y-1">
                  <li>• Crear o editar proyectos</li>
                  <li>• Acceder a objetivos estratégicos</li>
                  <li>• Gestionar usuarios o instituciones</li>
                  <li>• Ver reportes completos del sistema</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧑‍💼 Técnico Planificador - Gestión completa de planificación */}
      {userRole === 'PLANIF' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  🧑‍💼
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-blue-900">
                  Panel de Técnico Planificador
                </h2>
                <p className="text-sm text-blue-700">
                  Registrar y gestionar toda la planificación estratégica
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📋 Gestión de Objetivos
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Registrar objetivos estratégicos</li>
                <li>• Definir metas e indicadores</li>
                <li>• Alinear objetivos al PND y ODS</li>
                <li>• Enviar objetivos a validación</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🏗️ Gestión de Proyectos
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Crear proyectos de inversión</li>
                <li>• Registrar actividades y presupuestos</li>
                <li>• Enviar proyectos a revisión</li>
                <li>• Gestionar cronogramas</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📊 Reportes y Análisis
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Generar reportes técnicos</li>
                <li>• Exportar datos completos</li>
                <li>• Analizar avances y métricas</li>
                <li>• Seguimiento de validaciones</li>
              </ul>
            </div>
          </div>
          
          {/* Panel de Seguimiento de Envíos */}
          <PlannerTrackingPanel />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-2xl mr-3">🎯</span>
                <div className="text-left">
                  <div className="font-medium text-blue-900">Nuevo Objetivo</div>
                  <div className="text-sm text-blue-700">Crear objetivo estratégico</div>
                </div>
              </button>
              
              <button className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-2xl mr-3">🏗️</span>
                <div className="text-left">
                  <div className="font-medium text-green-900">Nuevo Proyecto</div>
                  <div className="text-sm text-green-700">Crear proyecto de inversión</div>
                </div>
              </button>
              
              <button className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                <span className="text-2xl mr-3">📤</span>
                <div className="text-left">
                  <div className="font-medium text-yellow-900">Enviar Revisión</div>
                  <div className="text-sm text-yellow-700">Elementos pendientes</div>
                </div>
              </button>
              
              <button className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-2xl mr-3">📊</span>
                <div className="text-left">
                  <div className="font-medium text-purple-900">Ver Reportes</div>
                  <div className="text-sm text-purple-700">Análisis y métricas</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👨‍💼 Administrador del Sistema - Supervisión general */}
      {userRole === 'ADMIN' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  👨‍💼
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-indigo-900">
                  Panel de Administrador del Sistema
                </h2>
                <p className="text-sm text-indigo-700">
                  Configurar el sistema institucionalmente y supervisar la planificación
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🏢 Configuración
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Registrar instituciones</li>
                <li>• Gestionar usuarios</li>
                <li>• Administrar roles</li>
                <li>• Configurar sistema</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎯 Supervisión
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supervisar objetivos</li>
                <li>• Monitorear proyectos</li>
                <li>• Revisar validaciones</li>
                <li>• Control general</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📊 Reportes
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Todos los reportes</li>
                <li>• Exportación completa</li>
                <li>• Métricas del sistema</li>
                <li>• Análisis integral</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🔧 Administración
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Gestión de permisos</li>
                <li>• Estructura organizativa</li>
                <li>• Configuración avanzada</li>
                <li>• Mantenimiento</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 🕵 Auditor - Supervisión y auditoría del sistema */}
      {(userRole === 'AUDITOR' || userRole === 'CONSUL') && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  🕵
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-red-900">
                  Panel de Auditor del Sistema
                </h2>
                <p className="text-sm text-red-700">
                  Supervisar el uso del sistema y validar el cumplimiento del plan
                </p>
              </div>
            </div>
          </div>
          
          <AuditorComplianceTools />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Funcionalidades Específicas del Auditor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900">✅ Capacidades de Auditoría:</h4>
                <ul className="mt-2 text-sm text-green-800 space-y-1">
                  <li>• Generar reportes técnicos completos</li>
                  <li>• Comparar avances presupuestarios</li>
                  <li>• Validar cumplimiento de planificación</li>
                  <li>• Auditar uso del sistema por rol</li>
                  <li>• Exportar reportes completos</li>
                  <li>• Acceso a trazabilidad completa</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900">🔍 Supervisión Avanzada:</h4>
                <ul className="mt-2 text-sm text-red-800 space-y-1">
                  <li>• Monitoreo de actividades por usuario</li>
                  <li>• Análisis de patrones de uso</li>
                  <li>• Detección de anomalías</li>
                  <li>• Seguimiento de cambios críticos</li>
                  <li>• Validación de cumplimiento normativo</li>
                  <li>• Reportes de auditoría ejecutiva</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje para roles no reconocidos */}
      {!['ADMIN', 'PLANIF', 'REVISOR', 'VALID', 'AUDITOR', 'CONSUL'].includes(userRole) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🤷‍♂️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Rol no configurado
          </h3>
          <p className="text-gray-600">
            Su rol "{userRole}" no tiene funcionalidades específicas configuradas.
          </p>
        </div>
      )}
    </div>
  );
}
