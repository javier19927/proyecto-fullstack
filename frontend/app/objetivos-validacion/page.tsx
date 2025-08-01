'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import { ValidatorOnly } from '../components/PermissionGate';

interface Objetivo {
  id: number;
  nombre: string;
  descripcion: string;
  institucion_nombre: string;
  estado: 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO';
  fecha_creacion: string;
  fecha_validacion?: string;
  comentario_validacion?: string;
  creado_por: string;
  metas_count: number;
  indicadores_count: number;
  alineacion_pnd?: string;
  alineacion_ods?: string;
}

interface FiltrosAvanzados {
  busqueda: string;
  institucion: string;
  fechaInicio: string;
  fechaFin: string;
  creador: string;
  alineacionPnd: string;
  alineacionOds: string;
}

interface ValidacionData {
  decision: 'VALIDADO' | 'RECHAZADO';
  comentario: string;
}

/**
 * Página específica para la Autoridad Validadora
 * Permite validar (aprobar/rechazar) objetivos estratégicos enviados por técnicos
 * Solo accesible para usuarios con rol VALID
 */
export default function ValidacionObjetivosPage() {
  const { user, token } = useAuth();
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [validando, setValidando] = useState<number | null>(null);
  const [modalValidacion, setModalValidacion] = useState<{ show: boolean; objetivo: Objetivo | null }>({
    show: false,
    objetivo: null
  });
  const [formValidacion, setFormValidacion] = useState<ValidacionData>({
    decision: 'VALIDADO',
    comentario: ''
  });
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO'>('PENDIENTE');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState<FiltrosAvanzados>({
    busqueda: '',
    institucion: '',
    fechaInicio: '',
    fechaFin: '',
    creador: '',
    alineacionPnd: '',
    alineacionOds: ''
  });

  // Listas para los filtros desplegables
  const [instituciones, setInstituciones] = useState<{id: number, nombre: string}[]>([]);
  const [creadores, setCreadores] = useState<{id: number, nombre: string}[]>([]);

  useEffect(() => {
    if (token) {
      cargarObjetivos();
      cargarOpcionesFiltros();
    }
  }, [token]);

  const cargarObjetivos = async () => {
    try {
      const response = await fetch(
        buildApiUrl('/api/objetivos/pendientes-validacion'),
        { headers: buildHeaders(token!) }
      );

      if (response.ok) {
        const data = await response.json();
        setObjetivos(data.data || []);
      } else {
        console.error('Error al cargar objetivos');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarOpcionesFiltros = async () => {
    try {
      // Cargar instituciones
      const instResponse = await fetch(
        buildApiUrl('/api/instituciones'),
        { headers: buildHeaders(token!) }
      );
      if (instResponse.ok) {
        const instData = await instResponse.json();
        setInstituciones(instData.data || []);
      }

      // Cargar creadores (usuarios técnicos)
      const userResponse = await fetch(
        buildApiUrl('/api/usuarios/tecnicos'),
        { headers: buildHeaders(token!) }
      );
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCreadores(userData.data || []);
      }
    } catch (error) {
      console.error('Error al cargar opciones de filtros:', error);
    }
  };

  const abrirModalValidacion = (objetivo: Objetivo) => {
    setModalValidacion({ show: true, objetivo });
    setFormValidacion({ decision: 'VALIDADO', comentario: '' });
  };

  const cerrarModal = () => {
    setModalValidacion({ show: false, objetivo: null });
    setFormValidacion({ decision: 'VALIDADO', comentario: '' });
  };

  const procesarValidacion = async () => {
    if (!modalValidacion.objetivo) return;

    // Validar que se proporcione comentario para rechazos
    if (formValidacion.decision === 'RECHAZADO' && !formValidacion.comentario.trim()) {
      alert('Debe proporcionar un comentario para el rechazo');
      return;
    }

    setValidando(modalValidacion.objetivo.id);
    
    try {
      const response = await fetch(
        buildApiUrl(`/api/objetivos/${modalValidacion.objetivo.id}/validar`),
        {
          method: 'POST',
          headers: buildHeaders(token!),
          body: JSON.stringify({
            decision: formValidacion.decision,
            comentario: formValidacion.comentario,
            validado_por: user?.id
          })
        }
      );

      if (response.ok) {
        // Actualizar la lista de objetivos
        await cargarObjetivos();
        cerrarModal();
        
        // Mostrar mensaje de éxito
        const mensaje = formValidacion.decision === 'VALIDADO' ? 'validado' : 'rechazado';
        alert(`Objetivo ${mensaje} exitosamente`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error al validar objetivo:', error);
      alert('Error al procesar la validación');
    } finally {
      setValidando(null);
    }
  };

  const obtenerObjetivosFiltrados = () => {
    let objetivosFiltrados = objetivos;

    // Filtro por estado
    if (filtroEstado !== 'TODOS') {
      objetivosFiltrados = objetivosFiltrados.filter(obj => obj.estado === filtroEstado);
    }

    // Filtros avanzados
    if (filtrosAvanzados.busqueda) {
      const busqueda = filtrosAvanzados.busqueda.toLowerCase();
      objetivosFiltrados = objetivosFiltrados.filter(obj => 
        obj.nombre.toLowerCase().includes(busqueda) ||
        obj.descripcion.toLowerCase().includes(busqueda) ||
        obj.institucion_nombre.toLowerCase().includes(busqueda)
      );
    }

    if (filtrosAvanzados.institucion) {
      objetivosFiltrados = objetivosFiltrados.filter(obj => 
        obj.institucion_nombre === filtrosAvanzados.institucion
      );
    }

    if (filtrosAvanzados.creador) {
      objetivosFiltrados = objetivosFiltrados.filter(obj => 
        obj.creado_por === filtrosAvanzados.creador
      );
    }

    if (filtrosAvanzados.fechaInicio) {
      objetivosFiltrados = objetivosFiltrados.filter(obj => 
        new Date(obj.fecha_creacion) >= new Date(filtrosAvanzados.fechaInicio)
      );
    }

    if (filtrosAvanzados.fechaFin) {
      objetivosFiltrados = objetivosFiltrados.filter(obj => 
        new Date(obj.fecha_creacion) <= new Date(filtrosAvanzados.fechaFin)
      );
    }

    if (filtrosAvanzados.alineacionPnd) {
      objetivosFiltrados = objetivosFiltrados.filter(obj => 
        obj.alineacion_pnd === filtrosAvanzados.alineacionPnd
      );
    }

    if (filtrosAvanzados.alineacionOds) {
      objetivosFiltrados = objetivosFiltrados.filter(obj => 
        obj.alineacion_ods === filtrosAvanzados.alineacionOds
      );
    }

    return objetivosFiltrados;
  };

  const limpiarFiltros = () => {
    setFiltrosAvanzados({
      busqueda: '',
      institucion: '',
      fechaInicio: '',
      fechaFin: '',
      creador: '',
      alineacionPnd: '',
      alineacionOds: ''
    });
    setFiltroEstado('TODOS');
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'VALIDADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ValidatorOnly>
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                🧑‍⚖ Validación de Objetivos Estratégicos
              </h1>
              <p className="text-orange-100 mt-2 text-lg">
                Como Autoridad Validadora, evalúa y decide sobre la validez de los objetivos estratégicos
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {objetivos.filter(o => o.estado === 'PENDIENTE').length}
              </div>
              <div className="text-orange-100 text-lg">Pendientes de Validación</div>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {objetivos.filter(o => o.estado === 'PENDIENTE').length}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {objetivos.filter(o => o.estado === 'VALIDADO').length}
            </div>
            <div className="text-sm text-gray-600">Validados</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {objetivos.filter(o => o.estado === 'RECHAZADO').length}
            </div>
            <div className="text-sm text-gray-600">Rechazados</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {objetivos.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow">
          {/* Filtros básicos por estado */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['TODOS', 'PENDIENTE', 'VALIDADO', 'RECHAZADO'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroEstado === estado
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {estado === 'TODOS' ? 'Todos' : estado}
                {estado !== 'TODOS' && (
                  <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                    {objetivos.filter(o => o.estado === estado).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Botón para mostrar/ocultar filtros avanzados */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <span>{mostrarFiltrosAvanzados ? '📁' : '🔍'}</span>
              <span>{mostrarFiltrosAvanzados ? 'Ocultar' : 'Mostrar'} Filtros Avanzados</span>
            </button>
            
            {(Object.values(filtrosAvanzados).some(v => v) || filtroEstado !== 'PENDIENTE') && (
              <button
                onClick={limpiarFiltros}
                className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
              >
                <span>🗑️</span>
                <span>Limpiar Filtros</span>
              </button>
            )}
          </div>

          {/* Filtros avanzados */}
          {mostrarFiltrosAvanzados && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Buscador */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre, descripción o institución..."
                    value={filtrosAvanzados.busqueda}
                    onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, busqueda: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Filtro por institución */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institución
                  </label>
                  <select
                    value={filtrosAvanzados.institucion}
                    onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, institucion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Todas las instituciones</option>
                    {instituciones.map(inst => (
                      <option key={inst.id} value={inst.nombre}>{inst.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por creador */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Creado por
                  </label>
                  <select
                    value={filtrosAvanzados.creador}
                    onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, creador: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Todos los creadores</option>
                    {creadores.map(creador => (
                      <option key={creador.id} value={creador.nombre}>{creador.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Fecha inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={filtrosAvanzados.fechaInicio}
                    onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, fechaInicio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Fecha fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={filtrosAvanzados.fechaFin}
                    onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, fechaFin: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Alineación PND */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alineación PND
                  </label>
                  <select
                    value={filtrosAvanzados.alineacionPnd}
                    onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, alineacionPnd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Todas las alineaciones PND</option>
                    <option value="Pilar 1">Pilar 1</option>
                    <option value="Pilar 2">Pilar 2</option>
                    <option value="Pilar 3">Pilar 3</option>
                    <option value="Pilar 4">Pilar 4</option>
                    <option value="Pilar 5">Pilar 5</option>
                  </select>
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="mt-4 text-sm text-gray-600">
                Mostrando {obtenerObjetivosFiltrados().length} de {objetivos.length} objetivos
              </div>
            </div>
          )}
        </div>

        {/* Lista de objetivos */}
        <div className="space-y-4">
          {obtenerObjetivosFiltrados().length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay objetivos {filtroEstado !== 'TODOS' ? filtroEstado.toLowerCase() : ''} para mostrar
              </h3>
              <p className="text-gray-600">
                {filtroEstado === 'PENDIENTE' 
                  ? "Cuando los técnicos planificadores envíen objetivos para validación, aparecerán aquí."
                  : "Cambia el filtro para ver objetivos en otros estados."
                }
              </p>
            </div>
          ) : (
            obtenerObjetivosFiltrados().map((objetivo) => (
              <div 
                key={objetivo.id} 
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-orange-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {objetivo.nombre}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(objetivo.estado)}`}>
                        {objetivo.estado}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-lg">{objetivo.descripcion}</p>

                    {/* Información detallada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-500">Institución:</span>
                        <p className="font-semibold text-gray-900">{objetivo.institucion_nombre}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-500">Creado por:</span>
                        <p className="font-semibold text-gray-900">{objetivo.creado_por}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-500">Fecha de creación:</span>
                        <p className="font-semibold text-gray-900">{formatearFecha(objetivo.fecha_creacion)}</p>
                      </div>
                      {objetivo.alineacion_pnd && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="text-sm font-medium text-blue-600">Alineación PND:</span>
                          <p className="font-semibold text-blue-900">{objetivo.alineacion_pnd}</p>
                        </div>
                      )}
                      {objetivo.alineacion_ods && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <span className="text-sm font-medium text-green-600">Alineación ODS:</span>
                          <p className="font-semibold text-green-900">{objetivo.alineacion_ods}</p>
                        </div>
                      )}
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-purple-600">Metas e Indicadores:</span>
                        <p className="font-semibold text-purple-900">
                          {objetivo.metas_count} metas, {objetivo.indicadores_count} indicadores
                        </p>
                      </div>
                    </div>
                    
                    {/* Información del objetivo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-700">Institución:</span>
                        <span className="ml-2 text-gray-600">{objetivo.institucion_nombre}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Creado por:</span>
                        <span className="ml-2 text-gray-600">{objetivo.creado_por}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Fecha de creación:</span>
                        <span className="ml-2 text-gray-600">{formatearFecha(objetivo.fecha_creacion)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Metas e indicadores:</span>
                        <span className="ml-2 text-gray-600">
                          {objetivo.metas_count} metas, {objetivo.indicadores_count} indicadores
                        </span>
                      </div>
                    </div>

                    {/* Alineaciones PND/ODS */}
                    {(objetivo.alineacion_pnd || objetivo.alineacion_ods) && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Alineaciones:</h4>
                        {objetivo.alineacion_pnd && (
                          <div className="mb-2">
                            <span className="font-medium text-blue-700">Plan Nacional de Desarrollo:</span>
                            <span className="ml-2 text-blue-600">{objetivo.alineacion_pnd}</span>
                          </div>
                        )}
                        {objetivo.alineacion_ods && (
                          <div>
                            <span className="font-medium text-green-700">Objetivos de Desarrollo Sostenible:</span>
                            <span className="ml-2 text-green-600">{objetivo.alineacion_ods}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Comentario de validación */}
                    {objetivo.comentario_validacion && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Comentario de validación:</h4>
                        <p className="text-gray-700">{objetivo.comentario_validacion}</p>
                        {objetivo.fecha_validacion && (
                          <p className="text-xs text-gray-500 mt-2">
                            Validado el {formatearFecha(objetivo.fecha_validacion)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="ml-6 flex flex-col space-y-3">
                    {objetivo.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => abrirModalValidacion(objetivo)}
                        disabled={validando === objetivo.id}
                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium transition-colors"
                      >
                        {validando === objetivo.id ? 'Procesando...' : 'Validar Objetivo'}
                      </button>
                    )}
                    
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                      Ver Detalles Completos
                    </button>
                    
                    {objetivo.estado !== 'PENDIENTE' && (
                      <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                        Ver Historial
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de validación */}
        {modalValidacion.show && modalValidacion.objetivo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Validar Objetivo
                </h3>
                <button
                  onClick={cerrarModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{modalValidacion.objetivo.nombre}</h4>
                <p className="text-sm text-gray-600 mt-1">{modalValidacion.objetivo.institucion_nombre}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decisión de Validación
                  </label>
                  <select
                    value={formValidacion.decision}
                    onChange={(e) => setFormValidacion(prev => ({ 
                      ...prev, 
                      decision: e.target.value as 'VALIDADO' | 'RECHAZADO' 
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="VALIDADO">✅ Validar y Aprobar</option>
                    <option value="RECHAZADO">❌ Rechazar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentario {formValidacion.decision === 'RECHAZADO' ? '(Obligatorio)' : '(Opcional)'}
                  </label>
                  <textarea
                    value={formValidacion.comentario}
                    onChange={(e) => setFormValidacion(prev => ({ ...prev, comentario: e.target.value }))}
                    placeholder={
                      formValidacion.decision === 'VALIDADO' 
                        ? "Comentarios adicionales sobre la validación del objetivo..."
                        : "Especifica los motivos del rechazo y las correcciones necesarias..."
                    }
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                  {formValidacion.decision === 'RECHAZADO' && (
                    <p className="text-sm text-red-600 mt-1">
                      * Debe proporcionar una justificación para el rechazo
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cerrarModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarValidacion}
                  disabled={
                    validando === modalValidacion.objetivo.id ||
                    (formValidacion.decision === 'RECHAZADO' && !formValidacion.comentario.trim())
                  }
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
                >
                  {validando === modalValidacion.objetivo.id 
                    ? 'Procesando...' 
                    : `Confirmar ${formValidacion.decision === 'VALIDADO' ? 'Validación' : 'Rechazo'}`
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ValidatorOnly>
  );
}
