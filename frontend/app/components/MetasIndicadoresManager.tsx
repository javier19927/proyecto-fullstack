'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';

interface Meta {
  id: number;
  objetivo_id: number;
  codigo: string;
  descripcion: string;
  valor_inicial: number;
  valor_meta: number;
  valor_actual: number;
  unidad_medida: string;
  periodicidad: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  estado: 'ACTIVA' | 'PAUSADA' | 'COMPLETADA' | 'CANCELADA';
  fecha_inicio: string;
  fecha_fin: string;
  responsable_id?: number;
  responsable_nombre?: string;
  objetivo_codigo?: string;
  objetivo_nombre?: string;
  total_indicadores?: number;
  porcentaje_avance?: number;
}

interface Indicador {
  id: number;
  meta_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  formula: string;
  tipo: 'CUANTITATIVO' | 'CUALITATIVO';
  unidad_medida: string;
  frecuencia_medicion: 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  valor_linea_base: number;
  valor_meta: number;
  valor_actual: number;
  estado: 'ACTIVO' | 'PAUSADO' | 'COMPLETADO' | 'CANCELADO';
  responsable_id?: number;
  responsable_nombre?: string;
  meta_codigo?: string;
  porcentaje_cumplimiento?: number;
}

interface Objetivo {
  id: number;
  codigo: string;
  nombre: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface MetasIndicadoresManagerProps {
  className?: string;
}

export default function MetasIndicadoresManager({ className = "" }: MetasIndicadoresManagerProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'metas' | 'indicadores'>('metas');
  const [metas, setMetas] = useState<Meta[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para formularios
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [showIndicadorForm, setShowIndicadorForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [editingIndicador, setEditingIndicador] = useState<Indicador | null>(null);

  // Estados para filtros
  const [filtroMetas, setFiltroMetas] = useState({
    objetivo_id: '',
    estado: '',
    responsable_id: '',
    periodicidad: ''
  });

  const [filtroIndicadores, setFiltroIndicadores] = useState({
    meta_id: '',
    estado: '',
    tipo: '',
    responsable_id: ''
  });

  // Formulario de Meta
  const [formMeta, setFormMeta] = useState({
    objetivo_id: '',
    codigo: '',
    descripcion: '',
    valor_inicial: 0,
    valor_meta: 0,
    unidad_medida: '',
    periodicidad: 'ANUAL' as 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
    fecha_inicio: '',
    fecha_fin: '',
    responsable_id: ''
  });

  // Formulario de Indicador
  const [formIndicador, setFormIndicador] = useState({
    meta_id: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    formula: '',
    tipo: 'CUANTITATIVO' as 'CUANTITATIVO' | 'CUALITATIVO',
    unidad_medida: '',
    frecuencia_medicion: 'MENSUAL' as 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
    valor_linea_base: 0,
    valor_meta: 0,
    responsable_id: ''
  });

  useEffect(() => {
    if (token && user) {
      cargarDatos();
    }
  }, [token, user]);

  useEffect(() => {
    if (activeTab === 'metas') {
      cargarMetas();
    } else {
      cargarIndicadores();
    }
  }, [activeTab, filtroMetas, filtroIndicadores]);

  const cargarDatos = async () => {
    await Promise.all([
      cargarObjetivos(),
      cargarUsuarios(),
      cargarMetas(),
      cargarIndicadores()
    ]);
  };

  const cargarObjetivos = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(
        buildApiUrl('/api/objetivos/listado-simple'),
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        setObjetivos(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando objetivos:', error);
    }
  };

  const cargarUsuarios = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(
        buildApiUrl('/api/usuarios/listado-simple'),
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const cargarMetas = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filtroMetas).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        buildApiUrl(`/api/metas?${queryParams}`),
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMetas(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarIndicadores = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filtroIndicadores).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        buildApiUrl(`/api/indicadores?${queryParams}`),
        { headers: buildHeaders(token) }
      );
      
      if (response.ok) {
        const data = await response.json();
        setIndicadores(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando indicadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    try {
      const url = editingMeta 
        ? `/api/metas/${editingMeta.id}`
        : '/api/metas';
      
      const method = editingMeta ? 'PUT' : 'POST';

      const response = await fetch(buildApiUrl(url), {
        method,
        headers: buildHeaders(token),
        body: JSON.stringify(formMeta)
      });

      if (response.ok) {
        setShowMetaForm(false);
        setEditingMeta(null);
        resetFormMeta();
        cargarMetas();
      }
    } catch (error) {
      console.error('Error guardando meta:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarIndicador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    try {
      const url = editingIndicador 
        ? `/api/indicadores/${editingIndicador.id}`
        : '/api/indicadores';
      
      const method = editingIndicador ? 'PUT' : 'POST';

      const response = await fetch(buildApiUrl(url), {
        method,
        headers: buildHeaders(token),
        body: JSON.stringify(formIndicador)
      });

      if (response.ok) {
        setShowIndicadorForm(false);
        setEditingIndicador(null);
        resetFormIndicador();
        cargarIndicadores();
      }
    } catch (error) {
      console.error('Error guardando indicador:', error);
    } finally {
      setLoading(false);
    }
  };

  const editarMeta = (meta: Meta) => {
    setEditingMeta(meta);
    setFormMeta({
      objetivo_id: meta.objetivo_id.toString(),
      codigo: meta.codigo,
      descripcion: meta.descripcion,
      valor_inicial: meta.valor_inicial,
      valor_meta: meta.valor_meta,
      unidad_medida: meta.unidad_medida,
      periodicidad: meta.periodicidad,
      fecha_inicio: meta.fecha_inicio.split('T')[0],
      fecha_fin: meta.fecha_fin.split('T')[0],
      responsable_id: meta.responsable_id?.toString() || ''
    });
    setShowMetaForm(true);
  };

  const editarIndicador = (indicador: Indicador) => {
    setEditingIndicador(indicador);
    setFormIndicador({
      meta_id: indicador.meta_id.toString(),
      codigo: indicador.codigo,
      nombre: indicador.nombre,
      descripcion: indicador.descripcion,
      formula: indicador.formula,
      tipo: indicador.tipo,
      unidad_medida: indicador.unidad_medida,
      frecuencia_medicion: indicador.frecuencia_medicion,
      valor_linea_base: indicador.valor_linea_base,
      valor_meta: indicador.valor_meta,
      responsable_id: indicador.responsable_id?.toString() || ''
    });
    setShowIndicadorForm(true);
  };

  const resetFormMeta = () => {
    setFormMeta({
      objetivo_id: '',
      codigo: '',
      descripcion: '',
      valor_inicial: 0,
      valor_meta: 0,
      unidad_medida: '',
      periodicidad: 'ANUAL',
      fecha_inicio: '',
      fecha_fin: '',
      responsable_id: ''
    });
  };

  const resetFormIndicador = () => {
    setFormIndicador({
      meta_id: '',
      codigo: '',
      nombre: '',
      descripcion: '',
      formula: '',
      tipo: 'CUANTITATIVO',
      unidad_medida: '',
      frecuencia_medicion: 'MENSUAL',
      valor_linea_base: 0,
      valor_meta: 0,
      responsable_id: ''
    });
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
      case 'ACTIVO':
        return 'bg-green-100 text-green-800';
      case 'PAUSADA':
      case 'PAUSADO':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETADA':
      case 'COMPLETADO':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELADA':
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calcularPorcentajeAvance = (valorActual: number, valorMeta: number) => {
    if (valorMeta === 0) return 0;
    return Math.min(100, Math.round((valorActual / valorMeta) * 100));
  };

  // Solo permitir acceso a ADMIN y PLANIF
  if (!user?.roles?.some(role => ['ADMIN', 'PLANIF'].includes(role))) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acceso restringido. Solo administradores y planificadores pueden gestionar metas e indicadores.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Navegación de Pestañas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('metas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 Gestión de Metas ({metas.length})
          </button>
          <button
            onClick={() => setActiveTab('indicadores')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'indicadores'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Gestión de Indicadores ({indicadores.length})
          </button>
        </nav>
      </div>

      {/* Pestana de Metas */}
      {activeTab === 'metas' && (
        <div className="space-y-6">
          {/* Header con botón crear y filtros */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Metas</h2>
            <button
              onClick={() => {
                resetFormMeta();
                setEditingMeta(null);
                setShowMetaForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ➕ Nueva Meta
            </button>
          </div>

          {/* Filtros para Metas */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filtroMetas.objetivo_id}
                onChange={(e) => setFiltroMetas(prev => ({ ...prev, objetivo_id: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos los objetivos</option>
                {objetivos.map(objetivo => (
                  <option key={objetivo.id} value={objetivo.id}>
                    {objetivo.codigo} - {objetivo.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filtroMetas.estado}
                onChange={(e) => setFiltroMetas(prev => ({ ...prev, estado: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVA">Activa</option>
                <option value="PAUSADA">Pausada</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>

              <select
                value={filtroMetas.periodicidad}
                onChange={(e) => setFiltroMetas(prev => ({ ...prev, periodicidad: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas las periodicidades</option>
                <option value="MENSUAL">Mensual</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>

              <select
                value={filtroMetas.responsable_id}
                onChange={(e) => setFiltroMetas(prev => ({ ...prev, responsable_id: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos los responsables</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Metas */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Objetivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metas.map((meta) => (
                    <tr key={meta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {meta.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {meta.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {meta.objetivo_codigo} - {meta.objetivo_nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${calcularPorcentajeAvance(meta.valor_actual, meta.valor_meta)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {calcularPorcentajeAvance(meta.valor_actual, meta.valor_meta)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {meta.valor_actual} / {meta.valor_meta} {meta.unidad_medida}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado(meta.estado)}`}>
                          {meta.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {meta.responsable_nombre || 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editarMeta(meta)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ✏️
                          </button>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500 text-xs">
                            {meta.total_indicadores || 0} indicadores
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña de Indicadores */}
      {activeTab === 'indicadores' && (
        <div className="space-y-6">
          {/* Header con botón crear y filtros */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Indicadores</h2>
            <button
              onClick={() => {
                resetFormIndicador();
                setEditingIndicador(null);
                setShowIndicadorForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              ➕ Nuevo Indicador
            </button>
          </div>

          {/* Filtros para Indicadores */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filtroIndicadores.meta_id}
                onChange={(e) => setFiltroIndicadores(prev => ({ ...prev, meta_id: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas las metas</option>
                {metas.map(meta => (
                  <option key={meta.id} value={meta.id}>
                    {meta.codigo} - {meta.descripcion}
                  </option>
                ))}
              </select>

              <select
                value={filtroIndicadores.tipo}
                onChange={(e) => setFiltroIndicadores(prev => ({ ...prev, tipo: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="CUANTITATIVO">Cuantitativo</option>
                <option value="CUALITATIVO">Cualitativo</option>
              </select>

              <select
                value={filtroIndicadores.estado}
                onChange={(e) => setFiltroIndicadores(prev => ({ ...prev, estado: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="PAUSADO">Pausado</option>
                <option value="COMPLETADO">Completado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>

              <select
                value={filtroIndicadores.responsable_id}
                onChange={(e) => setFiltroIndicadores(prev => ({ ...prev, responsable_id: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos los responsables</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Indicadores */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumplimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {indicadores.map((indicador) => (
                    <tr key={indicador.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {indicador.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {indicador.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {indicador.meta_codigo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          indicador.tipo === 'CUANTITATIVO' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {indicador.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${calcularPorcentajeAvance(indicador.valor_actual, indicador.valor_meta)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {calcularPorcentajeAvance(indicador.valor_actual, indicador.valor_meta)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {indicador.valor_actual} / {indicador.valor_meta} {indicador.unidad_medida}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado(indicador.estado)}`}>
                          {indicador.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editarIndicador(indicador)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ✏️
                          </button>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500 text-xs">
                            {indicador.responsable_nombre || 'Sin asignar'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulario de Meta */}
      {showMetaForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <form onSubmit={guardarMeta} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingMeta ? 'Editar Meta' : 'Nueva Meta'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMetaForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objetivo *
                  </label>
                  <select
                    value={formMeta.objetivo_id}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, objetivo_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar objetivo</option>
                    {objetivos.map(objetivo => (
                      <option key={objetivo.id} value={objetivo.id}>
                        {objetivo.codigo} - {objetivo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formMeta.codigo}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, codigo: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={formMeta.descripcion}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, descripcion: e.target.value }))}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMeta.valor_inicial}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, valor_inicial: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Meta *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMeta.valor_meta}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, valor_meta: parseFloat(e.target.value) || 0 }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de Medida *
                  </label>
                  <input
                    type="text"
                    value={formMeta.unidad_medida}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, unidad_medida: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Periodicidad *
                  </label>
                  <select
                    value={formMeta.periodicidad}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, periodicidad: e.target.value as any }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    value={formMeta.fecha_inicio}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin *
                  </label>
                  <input
                    type="date"
                    value={formMeta.fecha_fin}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsable
                  </label>
                  <select
                    value={formMeta.responsable_id}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, responsable_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMetaForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editingMeta ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Formulario de Indicador */}
      {showIndicadorForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <form onSubmit={guardarIndicador} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingIndicador ? 'Editar Indicador' : 'Nuevo Indicador'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIndicadorForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta *
                  </label>
                  <select
                    value={formIndicador.meta_id}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, meta_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar meta</option>
                    {metas.map(meta => (
                      <option key={meta.id} value={meta.id}>
                        {meta.codigo} - {meta.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formIndicador.codigo}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, codigo: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formIndicador.nombre}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={formIndicador.descripcion}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, descripcion: e.target.value }))}
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fórmula de Cálculo *
                  </label>
                  <textarea
                    value={formIndicador.formula}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, formula: e.target.value }))}
                    required
                    rows={2}
                    placeholder="Ej: (Valor actual / Valor meta) * 100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formIndicador.tipo}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, tipo: e.target.value as any }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="CUANTITATIVO">Cuantitativo</option>
                    <option value="CUALITATIVO">Cualitativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de Medida *
                  </label>
                  <input
                    type="text"
                    value={formIndicador.unidad_medida}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, unidad_medida: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia de Medición *
                  </label>
                  <select
                    value={formIndicador.frecuencia_medicion}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, frecuencia_medicion: e.target.value as any }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="DIARIA">Diaria</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSUAL">Mensual</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Línea Base
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formIndicador.valor_linea_base}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, valor_linea_base: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Meta *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formIndicador.valor_meta}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, valor_meta: parseFloat(e.target.value) || 0 }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsable
                  </label>
                  <select
                    value={formIndicador.responsable_id}
                    onChange={(e) => setFormIndicador(prev => ({ ...prev, responsable_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sin asignar</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowIndicadorForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editingIndicador ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
