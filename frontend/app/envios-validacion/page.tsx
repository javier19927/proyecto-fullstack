'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import { PlanifierOnly } from '../components/PermissionGate';
import PlannerWorkflowManager from '../components/PlannerWorkflowManager';

export default function EnviosValidacionPage() {
  return (
    <ProtectedRoute>
      <PlanifierOnly>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <span className="text-2xl">🧑‍💼</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Envíos a Validación y Revisión
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Panel para enviar objetivos estratégicos a validación y proyectos de inversión a revisión
                  </p>
                </div>
              </div>
            </div>

            {/* Workflow Manager */}
            <PlannerWorkflowManager />

            {/* Información Adicional */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información sobre Objetivos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  🎯 Proceso de Validación de Objetivos
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• Los objetivos deben tener al menos una meta definida</p>
                  <p>• Cada meta debe tener indicadores asociados</p>
                  <p>• Una vez enviados, serán revisados por la Autoridad Validadora</p>
                  <p>• El validador puede aprobar o rechazar con observaciones</p>
                  <p>• Los objetivos rechazados regresan a estado borrador</p>
                </div>
              </div>

              {/* Información sobre Proyectos */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">
                  🏗️ Proceso de Revisión de Proyectos
                </h3>
                <div className="space-y-2 text-sm text-purple-800">
                  <p>• Los proyectos deben tener presupuesto asignado</p>
                  <p>• Deben contar con al menos una actividad planificada</p>
                  <p>• Una vez enviados, serán revisados por el Revisor Institucional</p>
                  <p>• El revisor puede aprobar o rechazar con observaciones</p>
                  <p>• Los proyectos rechazados regresan a estado borrador</p>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">📊 Flujo de Trabajo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">1</div>
                  <div className="text-sm opacity-90">Crear y Completar</div>
                  <div className="text-xs opacity-75 mt-1">
                    Objetivos con metas/indicadores<br/>
                    Proyectos con actividades/presupuesto
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">2</div>
                  <div className="text-sm opacity-90">Enviar</div>
                  <div className="text-xs opacity-75 mt-1">
                    Objetivos → Autoridad Validadora<br/>
                    Proyectos → Revisor Institucional
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">3</div>
                  <div className="text-sm opacity-90">Seguimiento</div>
                  <div className="text-xs opacity-75 mt-1">
                    Aprobado → Continúa<br/>
                    Rechazado → Corregir y reenviar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PlanifierOnly>
    </ProtectedRoute>
  );
}
