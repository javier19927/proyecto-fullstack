'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface Objetivo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
  created_at: string;
  metas_count?: number;
  indicadores_count?: number;
}

interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
  presupuesto_total: number;
  created_at: string;
  actividades_count?: number;
}

interface PlannerWorkflowManagerProps {
  className?: string;
}

/**
 * Componente específico para TÉCNICO PLANIFICADOR
 * Implementa todas las funcionalidades específicas según especificaciones:
 * - Registrar y gestionar planificación estratégica (objetivos, metas, indicadores)
 * - Crear y editar proyectos, actividades y presupuestos
 * - Alinear objetivos al PND y ODS
 * - Enviar proyectos y objetivos a revisión/validación
 * - Generar y exportar reportes técnicos
 * 
 * Módulos que usa:
 * - Módulo 2: Objetivos Estratégicos
 * - Módulo 3: Proyectos de Inversión
 * - Módulo 4: Reportes
 * - Consulta limitada en Módulo 1
 */
export default function PlannerWorkflowManager({ className = "" }: PlannerWorkflowManagerProps) {
  const { user, token } = useAuth();
  const [objetivosBorrador, setObjetivosBorrador] = useState<Objetivo[]>([]);
  const [proyectosBorrador, setProyectosBorrador] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'objetivos' | 'proyectos'>('objetivos');

  useEffect(() => {
    if (user?.roles?.includes('PLANIF')) {
      cargarElementosBorrador();
    }
  }, [user]);

  const cargarElementosBorrador = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Cargar objetivos en borrador
      const objetivosResponse = await fetch(
        buildApiUrl('/api/objetivos?estado=BORRADOR'), 
        { headers: buildHeaders(token) }
      );
      
      if (objetivosResponse.ok) {
        const objetivosData = await objetivosResponse.json();
        setObjetivosBorrador(objetivosData.data || []);
      }

      // Cargar proyectos en borrador
      const proyectosResponse = await fetch(
        buildApiUrl('/api/proyectos?estado=Borrador'), 
        { headers: buildHeaders(token) }
      );
      
      if (proyectosResponse.ok) {
        const proyectosData = await proyectosResponse.json();
        setProyectosBorrador(proyectosData.data || []);
      }
    } catch (error) {
      console.error('Error cargando elementos borrador:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarObjetivoAValidacion = async (objetivoId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        buildApiUrl(`/api/objetivos/${objetivoId}/enviar-validacion`), 
        {
          method: 'PUT',
          headers: buildHeaders(token),
          body: JSON.stringify({ estado: 'EN_VALIDACION' })
        }
      );

      if (response.ok) {
        alert('✅ Objetivo enviado a validación exitosamente');
        await cargarElementosBorrador();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error enviando objetivo a validación:', error);
      alert('❌ Error enviando objetivo a validación');
    }
  };

  const enviarProyectoARevision = async (proyectoId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        buildApiUrl(`/api/proyectos/${proyectoId}/enviar-validacion`), 
        {
          method: 'PUT',
          headers: buildHeaders(token),
          body: JSON.stringify({ estado: 'Enviado' })
        }
      );

      if (response.ok) {
        alert('✅ Proyecto enviado a revisión exitosamente');
        await cargarElementosBorrador();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error enviando proyecto a revisión:', error);
      alert('❌ Error enviando proyecto a revisión');
    }
  };

  const puedeEnviarObjetivo = (objetivo: Objetivo) => {
    return objetivo.estado === 'BORRADOR' && (objetivo.metas_count || 0) > 0;
  };

  const puedeEnviarProyecto = (proyecto: Proyecto) => {
    return proyecto.estado === 'Borrador' && proyecto.presupuesto_total > 0 && (proyecto.actividades_count || 0) > 0;
  };

  const renderObjetivos = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Objetivos Estratégicos</h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {objetivosBorrador.length} en borrador
        </span>
      </div>

      {objetivosBorrador.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay objetivos en borrador</p>
          <a href="/gestion-objetivos" className="text-blue-600 hover:text-blue-800 underline">
            Crear nuevo objetivo
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {objetivosBorrador.map((objetivo) => (
            <div key={objetivo.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{objetivo.codigo}</h4>
                  <p className="text-gray-600 text-sm mt-1">{objetivo.nombre}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>📊 {objetivo.metas_count || 0} metas</span>
                    <span>📈 {objetivo.indicadores_count || 0} indicadores</span>
                    <span>📅 {new Date(objetivo.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {puedeEnviarObjetivo(objetivo) ? (
                    <button
                      onClick={() => enviarObjetivoAValidacion(objetivo.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      📤 Enviar a Validación
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm">
                      {(objetivo.metas_count || 0) === 0 ? 'Requiere metas' : 'No disponible'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProyectos = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Proyectos de Inversión</h3>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          {proyectosBorrador.length} en borrador
        </span>
      </div>

      {proyectosBorrador.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay proyectos en borrador</p>
          <a href="/gestion-proyectos" className="text-blue-600 hover:text-blue-800 underline">
            Crear nuevo proyecto
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {proyectosBorrador.map((proyecto) => (
            <div key={proyecto.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{proyecto.codigo}</h4>
                  <p className="text-gray-600 text-sm mt-1">{proyecto.nombre}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>💰 ${proyecto.presupuesto_total?.toLocaleString() || 0}</span>
                    <span>📋 {proyecto.actividades_count || 0} actividades</span>
                    <span>📅 {new Date(proyecto.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {puedeEnviarProyecto(proyecto) ? (
                    <button
                      onClick={() => enviarProyectoARevision(proyecto.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                    >
                      📤 Enviar a Revisión
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm">
                      {proyecto.presupuesto_total === 0 ? 'Requiere presupuesto' : 
                       (proyecto.actividades_count || 0) === 0 ? 'Requiere actividades' : 'No disponible'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!user?.roles?.includes('PLANIF')) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="bg-gray-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">
          🧑‍💼 Panel de Envíos - Técnico Planificador
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Envía objetivos a validación y proyectos a revisión
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('objetivos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'objetivos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 Objetivos Estratégicos
          </button>
          <button
            onClick={() => setActiveTab('proyectos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'proyectos'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏗️ Proyectos de Inversión
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'objetivos' ? renderObjetivos() : renderProyectos()}
      </div>
    </div>
  );
}
