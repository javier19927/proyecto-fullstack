'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ErrorHandler from '../components/ErrorHandler';
import PermissionIndicator from '../components/PermissionIndicator';
import { useAuth } from '../hooks/useAuth';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { buildApiUrl, buildHeaders } from '../utils/apiConfig';
import { logObjetivos, logger } from '../utils/logger';

interface Objetivo {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  tipo: string
  estado: 'BORRADOR' | 'EN_VALIDACION' | 'APROBADO' | 'RECHAZADO'
  area_responsable: string
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  porcentaje_avance: number
  fecha_inicio?: string
  fecha_fin?: string
  presupuesto?: number
  observaciones?: string
  pnd_nombre?: string
  ods_nombre?: string
  responsable_nombre?: string
  total_metas: number
  metas_completadas: number
}

interface PND {
  id: number
  idPND: string
  nombre: string
  descripcion?: string
}

interface ODS {
  id: number
  idODS: string
  numero: number
  nombre: string
  titulo: string
}

interface Meta {
  id: number
  codigo: string
  descripcion: string
  valor_inicial: number
  valor_meta: number
  valor_actual: number
  unidad_medida: string
  periodicidad: string
  estado: string
  responsable_nombre?: string
  total_indicadores?: number
}

interface Indicador {
  id: number
  idIndicador: string
  codigo: string
  nombre: string
  descripcion: string
  formula: string
  tipo: string
  unidadMedida: string
  frecuencia_medicion: string
  estado: string
  created_at: string
  updated_at: string
  responsable_nombre?: string
}

export default function GestionObjetivosPage() {
  const { user, token, loading: isLoading, permissions } = useAuth()
  const router = useRouter()

  // Estados principales
  const [activeTab, setActiveTab] = useState(() => {
    // Si es VALIDADOR, empezar en la pestana de validacion
    return user?.roles?.includes('VALIDADOR') ? 'validacion' : 'objetivos'
  })
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [pndList, setPndList] = useState<PND[]>([])
  const [odsList, setOdsList] = useState<ODS[]>([])
  const [loading, setLoading] = useState(false)
  const { error, errorType, handleError, clearError } = useErrorHandler()

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    area_responsable: '',
    responsable_id: '',
    pnd_id: '',
    ods_id: '',
    tipo: ''
  })

  // Estados para formularios
  const [showObjetivoForm, setShowObjetivoForm] = useState(false)
  const [showMetaForm, setShowMetaForm] = useState(false)
  const [showIndicadorForm, setShowIndicadorForm] = useState(false)
  const [showEditIndicadorForm, setShowEditIndicadorForm] = useState(false)
  const [objetivoSeleccionado, setObjetivoSeleccionado] = useState<Objetivo | null>(null)
  const [metaSeleccionada, setMetaSeleccionada] = useState<Meta | null>(null)
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState<Indicador | null>(null)

  // Estados para metas e indicadores
  const [metas, setMetas] = useState<Meta[]>([])
  const [indicadores, setIndicadores] = useState<Indicador[]>([])
  const [metaSeleccionadaIndicadores, setMetaSeleccionadaIndicadores] = useState<Meta | null>(null)

  // Estados del formulario de objetivo
  const [formObjetivo, setFormObjetivo] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'ESTRATEGICO',
    area_responsable: '',
    prioridad: 'MEDIA' as 'ALTA' | 'MEDIA' | 'BAJA',
    fecha_inicio: '',
    fecha_fin: '',
    presupuesto: '',
    pnd_id: '',
    ods_id: ''
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      cargarDatos()
    }
  }, [user, isLoading, router])

  const cargarDatos = async () => {
    setLoading(true)
    logger.info('Objetivos', 'Iniciando carga de datos del modulo')
    try {
      await Promise.all([
        cargarObjetivos(),
        cargarPND(),
        cargarODS()
      ])
      logger.operationSuccess('Objetivos', 'Carga de datos del modulo')
    } catch (error) {
      logger.error('Objetivos', 'Error al cargar datos del modulo', error)
      handleError(error, 'data')
    } finally {
      setLoading(false)
    }
  }

  const cargarObjetivos = async () => {
    try {
      logger.debug('Objetivos', 'Iniciando carga de objetivos', { filtros })
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const endpoint = params.toString() 
        ? `/api/objetivos/filtrar?${params.toString()}`
        : '/api/objetivos'

      const response = await fetch(buildApiUrl(endpoint), {
        headers: buildHeaders(token)
      })

      if (response.ok) {
        const data = await response.json()
        setObjetivos(data.data || [])
        logger.operationSuccess('Objetivos', `Objetivos cargados: ${data.data?.length || 0}`)
      } else {
        logObjetivos.error('cargar', `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      logObjetivos.error('cargar', error)
    }
  }

  const cargarPND = async () => {
    try {
      logger.debug('Objetivos', 'Cargando lista PND')
      console.log('🔍 [DEBUG] Cargando PND - Token:', token ? 'Presente' : 'Ausente')
      console.log('🔍 [DEBUG] URL PND:', buildApiUrl('/api/objetivos/pnd'))
      console.log('🔍 [DEBUG] Headers:', buildHeaders(token))
      
      const response = await fetch(buildApiUrl('/api/objetivos/pnd'), {
        headers: buildHeaders(token)
      })

      console.log('🔍 [DEBUG] Respuesta PND Status:', response.status)
      console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [DEBUG] Datos PND recibidos:', data)
        console.log('🔍 [DEBUG] Array PND:', data.data)
        console.log('🔍 [DEBUG] Cantidad PND:', data.data?.length)
        setPndList(data.data || [])
        logger.operationSuccess('Objetivos', `PND cargados: ${data.data?.length || 0}`)
      } else {
        const errorText = await response.text()
        console.error('❌ [ERROR] PND Response:', response.status, errorText)
        console.error('❌ [ERROR] Response URL:', response.url)
        logObjetivos.error('pnd', `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ [ERROR] Excepcion al cargar PND:', error)
      if (error instanceof Error) {
        console.error('❌ [ERROR] Stack trace:', error.stack)
      }
      logObjetivos.error('pnd', error)
    }
  }

  const cargarODS = async () => {
    try {
      logger.debug('Objetivos', 'Cargando lista ODS')
      console.log('🔍 [DEBUG] Cargando ODS - Token:', token ? 'Presente' : 'Ausente')
      console.log('🔍 [DEBUG] URL ODS:', buildApiUrl('/api/objetivos/ods'))
      
      const response = await fetch(buildApiUrl('/api/objetivos/ods'), {
        headers: buildHeaders(token)
      })

      console.log('🔍 [DEBUG] Respuesta ODS Status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [DEBUG] Datos ODS recibidos:', data)
        setOdsList(data.data || [])
        logger.operationSuccess('Objetivos', `ODS cargados: ${data.data?.length || 0}`)
      } else {
        const errorText = await response.text()
        console.error('❌ [ERROR] ODS Response:', response.status, errorText)
        logObjetivos.error('ods', `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ [ERROR] Excepcion al cargar ODS:', error)
      logObjetivos.error('ods', error)
    }
  }

  const crearObjetivo = async () => {
    try {
      console.log('🔍 [DEBUG] Iniciando creacion de objetivo...');
      console.log('🔍 [DEBUG] Form data:', formObjetivo);
      console.log('🔍 [DEBUG] User:', user);
      console.log('🔍 [DEBUG] Token:', token ? 'Presente' : 'Ausente');
      
      const objetivoData = {
        ...formObjetivo,
        presupuesto: formObjetivo.presupuesto ? parseFloat(formObjetivo.presupuesto) : null,
        responsable_id: user?.id
      };
      
      console.log('🔍 [DEBUG] Datos a enviar:', objetivoData);
      console.log('🔍 [DEBUG] URL:', buildApiUrl('/api/objetivos/crear'));
      console.log('🔍 [DEBUG] Headers:', buildHeaders(token));
      
      logObjetivos.crear(objetivoData);
      
      const response = await fetch(buildApiUrl('/api/objetivos/crear'), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(objetivoData)
      })

      console.log('🔍 [DEBUG] Response status:', response.status);
      console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [DEBUG] Response data:', data);
        setObjetivos(prev => [data.data, ...prev])
        setShowObjetivoForm(false)
        resetFormObjetivo()
        clearError()
        logger.operationSuccess('Objetivos', 'Objetivo creado', { id: data.data.id, codigo: data.data.codigo })
      } else {
        const errorText = await response.text()
        console.error('❌ [ERROR] Response error:', errorText);
        try {
          const errorData = JSON.parse(errorText)
          handleError(new Error(errorData.error || 'Error al crear el objetivo'), 'data')
          logObjetivos.error('crear', errorData)
        } catch {
          handleError(new Error(`Error HTTP ${response.status}: ${errorText}`), 'data')
          logObjetivos.error('crear', { status: response.status, text: errorText })
        }
      }
    } catch (error) {
      console.error('❌ [ERROR] Exception en crearObjetivo:', error);
      if (error instanceof Error) {
        console.error('❌ [ERROR] Stack trace:', error.stack);
      }
      logObjetivos.error('crear', error)
      handleError(new Error('Error al crear el objetivo'), 'network')
    }
  }

  const enviarAValidacion = async (objetivoId: number) => {
    try {
      logObjetivos.validar(objetivoId.toString(), 'ENVIAR_A_VALIDACION');
      
      const response = await fetch(buildApiUrl(`/api/objetivos/${objetivoId}/enviar-validacion`), {
        method: 'PUT',
        headers: buildHeaders(token)
      })

      if (response.ok) {
        await cargarObjetivos()
        clearError()
        logger.operationSuccess('Objetivos', 'Objetivo enviado a validacion', { id: objetivoId })
      } else {
        const errorData = await response.json()
        handleError(new Error(errorData.error || 'Error al enviar a validacion'), 'data')
        logObjetivos.error('enviar-validacion', errorData)
      }
    } catch (error) {
      logObjetivos.error('enviar-validacion', error)
      handleError(new Error('Error al enviar a validacion'), 'network')
    }
  }

  const validarObjetivo = async (objetivoId: number, estado: 'APROBADO' | 'RECHAZADO', observaciones?: string) => {
    try {
      logObjetivos.validar(objetivoId.toString(), estado);
      
      const endpoint = estado === 'APROBADO' 
        ? `/api/objetivos/${objetivoId}/aprobar`
        : `/api/objetivos/${objetivoId}/rechazar`

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify({ observaciones })
      })

      if (response.ok) {
        await cargarObjetivos()
        clearError()
        logger.operationSuccess('Objetivos', `Objetivo ${estado.toLowerCase()}`, { id: objetivoId, observaciones })
      } else {
        const errorData = await response.json()
        handleError(new Error(errorData.error || `Error al ${estado.toLowerCase()} objetivo`), 'data')
        logObjetivos.error(`validar-${estado.toLowerCase()}`, errorData)
      }
    } catch (error) {
      logObjetivos.error(`validar-${estado.toLowerCase()}`, error)
      handleError(new Error(`Error al ${estado.toLowerCase()} el objetivo`), 'network')
    }
  }

  const asociarPNDyODS = async (objetivoId: number, pnd_id?: string, ods_id?: string) => {
    try {
      const response = await fetch(buildApiUrl(`/api/objetivos/${objetivoId}/asociar-pnd-ods`), {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify({ pnd_id, ods_id })
      })

      if (response.ok) {
        await cargarObjetivos()
        clearError()
      } else {
        const errorData = await response.json()
        handleError(new Error(errorData.error || 'Error al asociar PND/ODS'), 'data')
      }
    } catch (error) {
      console.error('Error al asociar PND/ODS:', error)
      handleError(new Error('Error al asociar PND/ODS'), 'network')
    }
  }

  const resetFormObjetivo = () => {
    setFormObjetivo({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'ESTRATEGICO',
      area_responsable: '',
      prioridad: 'MEDIA',
      fecha_inicio: '',
      fecha_fin: '',
      presupuesto: '',
      pnd_id: '',
      ods_id: ''
    })
  }

  // ============================================
  // FUNCIONES PARA GESTION DE METAS
  // ============================================

  const cargarMetas = async (objetivoId: number) => {
    try {
      console.log('🔍 [DEBUG] Cargando metas para objetivo:', objetivoId);
      const response = await fetch(buildApiUrl(`/api/objetivos/${objetivoId}/metas`), {
        headers: buildHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Metas cargadas:', data.data);
        setMetas(data.data || []);
        logger.operationSuccess('Objetivos', `Metas cargadas: ${data.data?.length || 0}`);
      } else {
        console.error('❌ [ERROR] Error al cargar metas:', response.status);
        handleError(new Error('Error al cargar las metas'), 'data');
      }
    } catch (error) {
      console.error('❌ [ERROR] Exception al cargar metas:', error);
      handleError(error, 'network');
    }
  };

  const crearMeta = async (metaData: any) => {
    try {
      if (!objetivoSeleccionado) {
        alert('Selecciona un objetivo primero');
        return;
      }

      console.log('🔍 [DEBUG] Datos del formulario:', formMeta);
      console.log('🔍 [DEBUG] Creando meta:', metaData);
      console.log('🔍 [DEBUG] Objetivo seleccionado:', objetivoSeleccionado);
      console.log('🔍 [DEBUG] Usuario:', user);
      console.log('🔍 [DEBUG] Token presente:', !!token);
      
      const payload = {
        ...metaData,
        responsable_id: user?.id
      };
      
      console.log('🔍 [DEBUG] Payload a enviar:', payload);
      console.log('🔍 [DEBUG] URL del endpoint:', buildApiUrl(`/api/objetivos/${objetivoSeleccionado.id}/metas`));

      const response = await fetch(buildApiUrl(`/api/objetivos/${objetivoSeleccionado.id}/metas`), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
      });

      console.log('🔍 [DEBUG] Response status:', response.status);
      console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Meta creada exitosamente:', data);
        setMetas(prev => [data.data, ...prev]);
        setShowMetaForm(false);
        resetFormMeta();
        clearError();
        logger.operationSuccess('Objetivos', 'Meta creada', { id: data.data.id });
        alert('Meta creada exitosamente');
      } else {
        const errorText = await response.text();
        console.error('❌ [ERROR] Error del servidor:', errorText);
        console.error('❌ [ERROR] Status:', response.status);
        console.error('❌ [ERROR] Status Text:', response.statusText);
        
        try {
          const errorData = JSON.parse(errorText);
          alert(`Error al crear meta: ${errorData.error || errorText}`);
        } catch {
          alert(`Error al crear meta: HTTP ${response.status} - ${errorText}`);
        }
        
        handleError(new Error('Error al crear la meta'), 'data');
      }
    } catch (error) {
      console.error('❌ [ERROR] Exception al crear meta:', error);
      console.error('❌ [ERROR] Stack trace:', error instanceof Error ? error.stack : 'No stack available');
      alert(`Error de conexion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      handleError(error, 'network');
    }
  };

  // Estados para formulario de meta
  const [formMeta, setFormMeta] = useState({
    codigo: '',
    descripcion: '',
    valor_inicial: '',
    valor_meta: '',
    unidad_medida: '',
    periodicidad: 'ANUAL'
  });

  // Estados para formulario de indicador
  const [formIndicador, setFormIndicador] = useState({
    idIndicador: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    formula: '',
    tipo: 'CUANTITATIVO',
    unidadMedida: '',
    frecuencia_medicion: 'TRIMESTRAL'
  });

  const [formEditIndicador, setFormEditIndicador] = useState({
    idIndicador: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    formula: '',
    tipo: 'CUANTITATIVO',
    unidadMedida: '',
    frecuencia_medicion: 'TRIMESTRAL'
  });

  const resetFormMeta = () => {
    setFormMeta({
      codigo: '',
      descripcion: '',
      valor_inicial: '',
      valor_meta: '',
      unidad_medida: '',
      periodicidad: 'ANUAL'
    });
    setMetaSeleccionada(null);
  };

  const resetFormIndicador = () => {
    setFormIndicador({
      idIndicador: '',
      codigo: '',
      nombre: '',
      descripcion: '',
      formula: '',
      tipo: 'CUANTITATIVO',
      unidadMedida: '',
      frecuencia_medicion: 'TRIMESTRAL'
    });
  };

  const iniciarEdicionIndicador = (indicador: Indicador) => {
    setIndicadorSeleccionado(indicador);
    setFormEditIndicador({
      idIndicador: indicador.idIndicador,
      codigo: indicador.codigo,
      nombre: indicador.nombre,
      descripcion: indicador.descripcion || '',
      formula: indicador.formula || '',
      tipo: indicador.tipo || 'CUANTITATIVO',
      unidadMedida: indicador.unidadMedida || '',
      frecuencia_medicion: indicador.frecuencia_medicion || 'TRIMESTRAL'
    });
    setShowEditIndicadorForm(true);
  };

  const getEstadoMetaColor = (estado: string) => {
    switch (estado) {
      case 'BORRADOR': return 'bg-gray-100 text-gray-800'
      case 'ACTIVA': return 'bg-blue-100 text-blue-800'
      case 'COMPLETADA': return 'bg-green-100 text-green-800'
      case 'SUSPENDIDA': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELADA': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  };

  // ============================================
  // FUNCIONES PARA EDITAR Y ACTUALIZAR METAS
  // ============================================

  const editarMeta = async (meta: Meta) => {
    try {
      console.log('🔍 [DEBUG] Editando meta:', meta);
      
      // Cargar datos de la meta en el formulario
      setFormMeta({
        codigo: meta.codigo,
        descripcion: meta.descripcion,
        valor_inicial: meta.valor_inicial?.toString() || '0',
        valor_meta: meta.valor_meta.toString(),
        unidad_medida: meta.unidad_medida,
        periodicidad: meta.periodicidad
      });
      
      // Marcar que estamos editando
      setMetaSeleccionada(meta);
      setShowMetaForm(true);
      
    } catch (error) {
      console.error('❌ [ERROR] Error al preparar edicion de meta:', error);
      alert('Error al cargar los datos de la meta para edicion');
    }
  };

  const actualizarMeta = async (metaData: any) => {
    try {
      if (!metaSeleccionada) {
        alert('No hay meta seleccionada para actualizar');
        return;
      }

      console.log('🔍 [DEBUG] Actualizando meta:', metaData);
      console.log('🔍 [DEBUG] Meta seleccionada:', metaSeleccionada);

      const response = await fetch(buildApiUrl(`/api/objetivos/metas/${metaSeleccionada.id}`), {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify(metaData)
      });

      console.log('🔍 [DEBUG] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Meta actualizada exitosamente:', data);
        
        // Actualizar la lista de metas
        setMetas(prev => prev.map(m => m.id === metaSeleccionada.id ? data.data : m));
        setShowMetaForm(false);
        setMetaSeleccionada(null);
        resetFormMeta();
        clearError();
        logger.operationSuccess('Objetivos', 'Meta actualizada', { id: data.data.id });
        alert('Meta actualizada exitosamente');
      } else {
        const errorText = await response.text();
        console.error('❌ [ERROR] Error del servidor:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          alert(`Error al actualizar meta: ${errorData.error || errorText}`);
        } catch {
          alert(`Error al actualizar meta: HTTP ${response.status} - ${errorText}`);
        }
        
        handleError(new Error('Error al actualizar la meta'), 'data');
      }
    } catch (error) {
      console.error('❌ [ERROR] Exception al actualizar meta:', error);
      alert(`Error de conexion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      handleError(error, 'network');
    }
  };

  const actualizarValorMeta = async (metaId: number, nuevoValor: number) => {
    try {
      console.log('🔍 [DEBUG] Actualizando valor de meta:', { metaId, nuevoValor });

      const response = await fetch(buildApiUrl(`/api/objetivos/metas/${metaId}/actualizar-valor`), {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify({ valor_actual: nuevoValor })
      });

      console.log('🔍 [DEBUG] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Valor de meta actualizado exitosamente:', data);
        
        // Actualizar la lista de metas
        setMetas(prev => prev.map(m => m.id === metaId ? data.data : m));
        clearError();
        logger.operationSuccess('Objetivos', 'Valor de meta actualizado', { id: metaId, valor: nuevoValor });
        alert('Valor de meta actualizado exitosamente');
      } else {
        const errorText = await response.text();
        console.error('❌ [ERROR] Error del servidor:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          alert(`Error al actualizar valor: ${errorData.error || errorText}`);
        } catch {
          alert(`Error al actualizar valor: HTTP ${response.status} - ${errorText}`);
        }
        
        handleError(new Error('Error al actualizar el valor de la meta'), 'data');
      }
    } catch (error) {
      console.error('❌ [ERROR] Exception al actualizar valor de meta:', error);
      alert(`Error de conexion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      handleError(error, 'network');
    }
  };

  // Funcion para cargar indicadores de una meta
  const cargarIndicadores = async (metaId: number) => {
    try {
      console.log('🔍 [DEBUG] Cargando indicadores para meta:', metaId);

      const response = await fetch(buildApiUrl(`/api/objetivos/metas/${metaId}/indicadores`), {
        method: 'GET',
        headers: buildHeaders(token)
      });

      console.log('🔍 [DEBUG] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SUCCESS] Indicadores cargados:', data);
        setIndicadores(data.data || []);
        clearError();
        logger.operationSuccess('Objetivos', 'Indicadores cargados', { metaId, total: data.data?.length || 0 });
      } else {
        const errorText = await response.text();
        console.error('❌ [ERROR] Error del servidor:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          alert(`Error al cargar indicadores: ${errorData.error || errorText}`);
        } catch {
          alert(`Error al cargar indicadores: HTTP ${response.status} - ${errorText}`);
        }
        
        handleError(new Error('Error al cargar los indicadores'), 'data');
      }
    } catch (error) {
      console.error('❌ [ERROR] Exception al cargar indicadores:', error);
      alert(`Error de conexion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      handleError(error, 'network');
    }
  };

  // Funcion para crear un indicador
  const crearIndicador = async () => {
    try {
      console.log('🔍 [DEBUG] Creando indicador:', formIndicador);

      if (!metaSeleccionadaIndicadores) {
        alert('Error: No hay una meta seleccionada');
        return;
      }

      // Validaciones basicas
      if (!formIndicador.idIndicador || !formIndicador.codigo || !formIndicador.nombre) {
        alert('Error: Todos los campos obligatorios deben estar completos');
        return;
      }

      const indicadorData = {
        ...formIndicador,
        meta_id: metaSeleccionadaIndicadores.id,
        responsable_id: user?.id // Asignar al usuario actual como responsable
      };

      console.log('🔍 [DEBUG] Datos del indicador a enviar:', indicadorData);

      const response = await fetch(buildApiUrl('/api/objetivos/indicadores'), {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(indicadorData)
      });

      console.log('🔍 [DEBUG] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SUCCESS] Indicador creado:', data);
        
        // Recargar indicadores
        await cargarIndicadores(metaSeleccionadaIndicadores.id);
        
        // Limpiar formulario y cerrar modal
        resetFormIndicador();
        setShowIndicadorForm(false);
        clearError();
        logger.operationSuccess('Objetivos', 'Indicador creado', { id: data.data.id, nombre: data.data.nombre });
        alert('Indicador creado exitosamente');
      } else {
        const errorText = await response.text();
        console.error('❌ [ERROR] Error del servidor:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          alert(`Error al crear indicador: ${errorData.error || errorText}`);
        } catch {
          alert(`Error al crear indicador: HTTP ${response.status} - ${errorText}`);
        }
        
        handleError(new Error('Error al crear el indicador'), 'data');
      }
    } catch (error) {
      console.error('❌ [ERROR] Exception al crear indicador:', error);
      alert(`Error de conexion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      handleError(error, 'network');
    }
  };

  // Función para editar un indicador
  const editarIndicador = async () => {
    try {
      console.log('🔍 [DEBUG] Editando indicador:', formEditIndicador);

      if (!indicadorSeleccionado) {
        alert('Error: No hay un indicador seleccionado');
        return;
      }

      // Validaciones básicas
      if (!formEditIndicador.idIndicador || !formEditIndicador.nombre) {
        alert('Error: Los campos obligatorios deben estar completos');
        return;
      }

      const indicadorData = {
        idIndicador: formEditIndicador.idIndicador,
        nombre: formEditIndicador.nombre,
        unidadMedida: formEditIndicador.unidadMedida,
        descripcion: formEditIndicador.descripcion,
        formula: formEditIndicador.formula,
        tipo: formEditIndicador.tipo
      };

      console.log('🔍 [DEBUG] Datos del indicador a actualizar:', indicadorData);

      const response = await fetch(buildApiUrl(`/api/objetivos/indicadores/${indicadorSeleccionado.id}`), {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify(indicadorData)
      });

      console.log('🔍 [DEBUG] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SUCCESS] Indicador editado:', data);
        
        // Recargar indicadores para la meta actual
        if (metaSeleccionadaIndicadores) {
          await cargarIndicadores(metaSeleccionadaIndicadores.id);
        }
        
        // Limpiar formulario y cerrar modal
        setShowEditIndicadorForm(false);
        setIndicadorSeleccionado(null);
        clearError();
        logger.operationSuccess('Objetivos', 'Indicador editado', { id: data.data.id, nombre: data.data.nombre });
        alert('Indicador editado exitosamente');
      } else {
        const errorText = await response.text();
        console.error('❌ [ERROR] Error del servidor:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          alert(`Error al editar indicador: ${errorData.error || errorText}`);
        } catch {
          alert(`Error al editar indicador: HTTP ${response.status} - ${errorText}`);
        }
        
        handleError(new Error('Error al editar el indicador'), 'data');
      }
    } catch (error) {
      console.error('❌ [ERROR] Exception al editar indicador:', error);
      alert(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      handleError(error, 'network');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'BORRADOR': return 'bg-gray-100 text-gray-800'
      case 'EN_VALIDACION': return 'bg-yellow-100 text-yellow-800'
      case 'APROBADO': return 'bg-green-100 text-green-800'
      case 'RECHAZADO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'bg-red-100 text-red-800'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800'
      case 'BAJA': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Verificar permisos segun la matriz de especificacion
  const canRegisterEdit = permissions.gestionObjetivos.canRegisterEdit()
  const canValidate = permissions.gestionObjetivos.canValidate() // VALIDADOR puede validar objetivos
  const canConsult = permissions.gestionObjetivos.canConsult()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!canConsult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder al modulo de Gestion de Objetivos.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Roles permitidos: Administrador, Tecnico (Planificador), Validador
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.roles?.includes('VALIDADOR') 
                  ? '🧑‍⚖️ Modulo 2: Validacion de Objetivos Estrategicos'
                  : '🎯 Modulo 2: Gestion de Objetivos Estrategicos'
                }
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {user.roles?.includes('VALIDADOR')
                  ? 'Validar objetivos estrategicos enviados para aprobacion'
                  : 'Gestionar objetivos estrategicos alineados al PND y ODS'
                }
              </p>
              <div className="mt-3">
                <PermissionIndicator module="gestionObjetivos" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                ← Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pestanas */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {/* Para VALIDADOR: solo mostrar objetivos y validacion */}
            {user.roles?.includes('VALIDADOR') ? (
              <>
                <button
                  onClick={() => setActiveTab('objetivos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'objetivos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🎯 Ver Objetivos
                </button>
                <button
                  onClick={() => setActiveTab('validacion')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'validacion'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🧑‍⚖️ Centro de Validacion
                </button>
              </>
            ) : (
              /* Para otros roles: mostrar todas las pestanas */
              ['objetivos', 'metas', 'indicadores', 'validacion'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'objetivos' && '🎯 Objetivos Estrategicos'}
                  {tab === 'metas' && '📊 Metas'}
                  {tab === 'indicadores' && '📈 Indicadores'}
                  {tab === 'validacion' && '✅ Validacion'}
                </button>
              ))
            )}
          </nav>
        </div>

        {/* Mensajes de error */}
        <ErrorHandler 
          error={error} 
          type={errorType} 
          compact={true}
        />

        {/* Contenido segun pestana activa */}
        {activeTab === 'objetivos' && (
          <div>
            {/* Filtros y acciones */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Todos los estados</option>
                    {user.roles?.includes('VALIDADOR') ? (
                      /* Para VALIDADOR: solo estados relevantes para validacion */
                      <>
                        <option value="EN_VALIDACION">En Validacion</option>
                        <option value="APROBADO">Aprobado</option>
                        <option value="RECHAZADO">Rechazado</option>
                      </>
                    ) : (
                      /* Para otros roles: todos los estados */
                      <>
                        <option value="BORRADOR">Borrador</option>
                        <option value="EN_VALIDACION">En Validacion</option>
                        <option value="APROBADO">Aprobado</option>
                        <option value="RECHAZADO">Rechazado</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area Responsable
                  </label>
                  <input
                    type="text"
                    value={filtros.area_responsable}
                    onChange={(e) => setFiltros({...filtros, area_responsable: e.target.value})}
                    placeholder="Filtrar por area..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={cargarObjetivos}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    🔍 Filtrar
                  </button>
                  {canRegisterEdit && !user.roles?.includes('VALIDADOR') && (
                    <button
                      onClick={() => setShowObjetivoForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      ➕ Nuevo Objetivo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de objetivos */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Objetivos Estrategicos ({objetivos.length})
                </h3>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando objetivos...</p>
                </div>
              ) : objetivos.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>📋 No hay objetivos registrados</p>
                  {canRegisterEdit && (
                    <button
                      onClick={() => setShowObjetivoForm(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Crear el primer objetivo
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {objetivos.map((objetivo) => (
                    <div key={objetivo.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {objetivo.codigo} - {objetivo.nombre}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(objetivo.estado)}`}>
                              {objetivo.estado}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(objetivo.prioridad)}`}>
                              {objetivo.prioridad}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{objetivo.descripcion}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Area:</span>
                              <p className="text-gray-900">{objetivo.area_responsable}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Responsable:</span>
                              <p className="text-gray-900">{objetivo.responsable_nombre}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">PND:</span>
                              <p className="text-gray-900">{objetivo.pnd_nombre || 'No asignado'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">ODS:</span>
                              <p className="text-gray-900">{objetivo.ods_nombre || 'No asignado'}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                            <span>📊 {objetivo.total_metas} metas</span>
                            <span>✅ {objetivo.metas_completadas} completadas</span>
                            <span>📈 {objetivo.porcentaje_avance}% avance</span>
                          </div>
                        </div>

                        <div className="ml-6 flex flex-col space-y-2">
                          {/* Boton Ver Metas - disponible para todos */}
                          <button
                            onClick={() => {
                              setObjetivoSeleccionado(objetivo);
                              cargarMetas(objetivo.id);
                              setActiveTab('metas');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            📊 Ver Metas
                          </button>
                          
                          {/* Boton Ver Detalle - disponible para VALIDADOR en cualquier estado */}
                          {user.roles?.includes('VALIDADOR') && (
                            <button
                              onClick={() => {
                                setObjetivoSeleccionado(objetivo)
                                // Aqui podrias mostrar un modal con detalles completos
                                alert(`Detalles del objetivo: ${objetivo.nombre}\n\nDescripcion: ${objetivo.descripcion}\nEstado: ${objetivo.estado}\nResponsable: ${objetivo.responsable_nombre}\nArea: ${objetivo.area_responsable}`)
                              }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm font-medium"
                            >
                              ✔️ Ver Detalle
                            </button>
                          )}
                          
                          {/* Enviar a validacion - solo para planificadores */}
                          {objetivo.estado === 'BORRADOR' && canRegisterEdit && !user.roles?.includes('VALIDADOR') && (
                            <button
                              onClick={() => enviarAValidacion(objetivo.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                            >
                               Enviar a Validacion
                            </button>
                          )}
                          
                          {/* Botones de validacion - solo para validadores */}
                          {objetivo.estado === 'EN_VALIDACION' && canValidate && (
                            <div className="space-y-1">
                              <button
                                onClick={() => validarObjetivo(objetivo.id, 'APROBADO')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                              >
                                ✅ Aprobar Objetivo
                              </button>
                              <button
                                onClick={() => {
                                  const observaciones = prompt('Observaciones para el rechazo (obligatorio):')
                                  if (observaciones && observaciones.trim()) {
                                    validarObjetivo(objetivo.id, 'RECHAZADO', observaciones)
                                  } else if (observaciones !== null) {
                                    alert('Las observaciones son obligatorias para rechazar un objetivo.')
                                  }
                                }}
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                              >
                                ❌ Rechazar Objetivo
                              </button>
                              <button
                                onClick={() => {
                                  const comentario = prompt('Agregar comentario al objetivo:')
                                  if (comentario && comentario.trim()) {
                                    // Funcion para agregar comentarios pendiente
                                    alert('Comentario agregado: ' + comentario)
                                  }
                                }}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                              >
                                💬 Agregar Comentario
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestana de Metas */}
        {activeTab === 'metas' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">📊 Gestion de Metas</h3>
              {objetivoSeleccionado && canRegisterEdit && (
                <button
                  onClick={() => setShowMetaForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                >
                  <span className="mr-2">➕</span>
                  Nueva Meta
                </button>
              )}
            </div>

            {!objetivoSeleccionado ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un Objetivo</h3>
                <p className="text-gray-500">Para gestionar metas, primero selecciona un objetivo de la lista en la pestana "Objetivos Estrategicos".</p>
                <button
                  onClick={() => setActiveTab('objetivos')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Ver Objetivos
                </button>
              </div>
            ) : (
              <div>
                {/* Informacion del objetivo seleccionado */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">{objetivoSeleccionado.codigo}</h4>
                      <p className="text-blue-700 font-semibold">{objetivoSeleccionado.nombre}</p>
                      <p className="text-blue-600 text-sm mt-1">{objetivoSeleccionado.descripcion}</p>
                    </div>
                    <button
                      onClick={() => setObjetivoSeleccionado(null)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Cambiar Objetivo
                    </button>
                  </div>
                </div>

                {/* Estadisticas de metas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-600">{metas.length}</div>
                    <div className="text-sm text-gray-800 font-medium">Total Metas</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {metas.filter(m => m.estado === 'ACTIVA').length}
                    </div>
                    <div className="text-sm text-blue-800 font-medium">Activas</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metas.filter(m => m.estado === 'COMPLETADA').length}
                    </div>
                    <div className="text-sm text-green-800 font-medium">Completadas</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {metas.filter(m => m.estado === 'BORRADOR').length}
                    </div>
                    <div className="text-sm text-yellow-800 font-medium">Borradores</div>
                  </div>
                </div>

                {/* Lista de metas */}
                {metas.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay metas registradas</h3>
                    <p className="text-gray-500 mb-4">
                      Este objetivo aun no tiene metas definidas. Las metas son fundamentales para medir el progreso.
                    </p>
                    {canRegisterEdit && (
                      <button
                        onClick={() => setShowMetaForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Crear Primera Meta
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metas.map(meta => (
                      <div key={meta.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{meta.codigo}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoMetaColor(meta.estado)}`}>
                                {meta.estado}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-3">{meta.descripcion}</p>
                            
                            {/* Progreso visual */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progreso</span>
                                <span>{meta.valor_actual || 0} / {meta.valor_meta} {meta.unidad_medida}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${Math.min(100, ((meta.valor_actual || 0) / meta.valor_meta) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {((meta.valor_actual || 0) / meta.valor_meta * 100).toFixed(1)}% completado
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Valor Inicial:</span>
                                <span className="ml-2 text-gray-600">{meta.valor_inicial} {meta.unidad_medida}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Meta:</span>
                                <span className="ml-2 text-gray-600">{meta.valor_meta} {meta.unidad_medida}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Periodicidad:</span>
                                <span className="ml-2 text-gray-600">{meta.periodicidad}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Responsable:</span>
                                <span className="ml-2 text-gray-600">{meta.responsable_nombre || 'No asignado'}</span>
                              </div>
                            </div>

                            {(meta.total_indicadores || 0) > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <span className="text-sm text-gray-600">
                                  📈 {meta.total_indicadores} indicador{meta.total_indicadores !== 1 ? 'es' : ''} asociado{meta.total_indicadores !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-6 flex flex-col space-y-2">
                            <button
                              onClick={() => {
                                setMetaSeleccionadaIndicadores(meta);
                                cargarIndicadores(meta.id);
                                setActiveTab('indicadores');
                              }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              📈 Ver Indicadores
                            </button>
                            {canRegisterEdit && (
                              <>
                                <button
                                  onClick={() => editarMeta(meta)}
                                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                   Editar
                                </button>
                                <button
                                  onClick={() => {
                                    const nuevoValor = prompt(`Actualizar valor actual de la meta (${meta.unidad_medida}):`, meta.valor_actual?.toString() || '0');
                                    if (nuevoValor !== null && !isNaN(Number(nuevoValor))) {
                                      actualizarValorMeta(meta.id, Number(nuevoValor));
                                    } else if (nuevoValor !== null) {
                                      alert('Por favor ingresa un numero valido');
                                    }
                                  }}
                                  className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                  📊 Actualizar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'indicadores' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="mr-2">📈</span>
                Gestion de Indicadores
              </h3>
              {metaSeleccionadaIndicadores && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Meta: {metaSeleccionadaIndicadores.codigo}
                </div>
              )}
            </div>

            {!metaSeleccionadaIndicadores ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una Meta</h3>
                <p className="text-gray-500 mb-4">Para gestionar indicadores, primero selecciona una meta desde la pestana "Metas"</p>
                <button
                  onClick={() => setActiveTab('metas')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Ver Metas
                </button>
              </div>
            ) : (
              <div>
                {/* Informacion de la meta seleccionada */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-blue-900 mb-2">
                        {metaSeleccionadaIndicadores.codigo} - {metaSeleccionadaIndicadores.descripcion}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-700">Valor Actual:</span>
                          <span className="ml-2 text-blue-600">
                            {metaSeleccionadaIndicadores.valor_actual || 0} {metaSeleccionadaIndicadores.unidad_medida}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Meta:</span>
                          <span className="ml-2 text-blue-600">
                            {metaSeleccionadaIndicadores.valor_meta} {metaSeleccionadaIndicadores.unidad_medida}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Progreso:</span>
                          <span className="ml-2 text-blue-600">
                            {((metaSeleccionadaIndicadores.valor_actual || 0) / metaSeleccionadaIndicadores.valor_meta * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMetaSeleccionadaIndicadores(null);
                        setIndicadores([]);
                      }}
                      className="ml-4 text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Lista de indicadores */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">
                      Indicadores ({indicadores.length})
                    </h4>
                    {canRegisterEdit && (
                      <button
                        onClick={() => setShowIndicadorForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                      >
                        ➕ Nuevo Indicador
                      </button>
                    )}
                  </div>

                  {indicadores.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-400 mb-3">
                        <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay indicadores</h3>
                      <p className="text-gray-500 mb-4">Esta meta aun no tiene indicadores asociados</p>
                      {canRegisterEdit && (
                        <button
                          onClick={() => setShowIndicadorForm(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Crear Primer Indicador
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {indicadores.map((indicador) => (
                        <div key={indicador.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h5 className="text-lg font-medium text-gray-900">
                                  {indicador.codigo} - {indicador.nombre}
                                </h5>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  indicador.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                                  indicador.estado === 'INACTIVO' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {indicador.estado}
                                </span>
                              </div>
                              
                              <p className="text-gray-600 mb-3">{indicador.descripcion}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Tipo:</span>
                                  <span className="ml-2 text-gray-600">{indicador.tipo}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Unidad:</span>
                                  <span className="ml-2 text-gray-600">{indicador.unidadMedida}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Frecuencia:</span>
                                  <span className="ml-2 text-gray-600">{indicador.frecuencia_medicion}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Responsable:</span>
                                  <span className="ml-2 text-gray-600">{indicador.responsable_nombre || 'No asignado'}</span>
                                </div>
                              </div>
                              
                              {indicador.formula && (
                                <div className="mt-3 p-2 bg-white rounded border">
                                  <span className="font-medium text-gray-700">Formula:</span>
                                  <span className="ml-2 text-gray-600 font-mono text-sm">{indicador.formula}</span>
                                </div>
                              )}
                            </div>
                            
                            {canRegisterEdit && (
                              <div className="ml-4 flex flex-col space-y-2">
                                <button
                                  onClick={() => iniciarEdicionIndicador(indicador)}
                                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                   Editar
                                </button>
                                <button
                                  onClick={() => {
                                    // TODO: Implementar eliminacion de indicador
                                    alert('Funcionalidad de eliminacion en desarrollo');
                                  }}
                                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'validacion' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="mr-2">🧑‍⚖️</span>
                Centro de Validacion de Objetivos Estrategicos
              </h3>
              {user.roles?.includes('VALIDADOR') && (
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  Acceso de Validacion
                </div>
              )}
            </div>
            
            {canValidate ? (
              <div>
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {objetivos.filter(obj => obj.estado === 'EN_VALIDACION').length}
                    </div>
                    <div className="text-sm text-blue-800 font-medium">Objetivos Pendientes</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {objetivos.filter(obj => obj.estado === 'APROBADO').length}
                    </div>
                    <div className="text-sm text-green-800 font-medium">Objetivos Aprobados</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {objetivos.filter(obj => obj.estado === 'RECHAZADO').length}
                    </div>
                    <div className="text-sm text-red-800 font-medium">Objetivos Rechazados</div>
                  </div>
                </div>

                <h4 className="text-md font-medium text-gray-800 mb-4">📋 Objetivos Pendientes por Validar:</h4>
                <div className="space-y-4">
                  {objetivos.filter(obj => obj.estado === 'EN_VALIDACION').map(objetivo => (
                    <div key={objetivo.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{objetivo.codigo}</h4>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              EN VALIDACION
                            </span>
                          </div>
                          <h5 className="text-lg font-semibold text-gray-800 mb-2">{objetivo.nombre}</h5>
                          <p className="text-gray-600 text-sm mb-3">{objetivo.descripcion}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Responsable:</span>
                              <span className="ml-2 text-gray-600">{objetivo.responsable_nombre}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Area:</span>
                              <span className="ml-2 text-gray-600">{objetivo.area_responsable}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Tipo:</span>
                              <span className="ml-2 text-gray-600">{objetivo.tipo}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Prioridad:</span>
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(objetivo.prioridad)}`}>
                                {objetivo.prioridad}
                              </span>
                            </div>
                          </div>

                          {(objetivo.pnd_nombre || objetivo.ods_nombre) && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {objetivo.pnd_nombre && (
                                  <div>
                                    <span className="font-medium text-gray-700">Alineacion PND:</span>
                                    <span className="ml-2 text-blue-600">{objetivo.pnd_nombre}</span>
                                  </div>
                                )}
                                {objetivo.ods_nombre && (
                                  <div>
                                    <span className="font-medium text-gray-700">Alineacion ODS:</span>
                                    <span className="ml-2 text-green-600">{objetivo.ods_nombre}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-6 flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              setObjetivoSeleccionado(objetivo)
                              // Aqui podrias mostrar un modal con mas detalles
                            }}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            ✔️ Ver Detalle
                          </button>
                          <button
                            onClick={() => validarObjetivo(objetivo.id, 'APROBADO')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            ✅ Aprobar Objetivo
                          </button>
                          <button
                            onClick={() => {
                              const observaciones = prompt('Observaciones para el rechazo (obligatorio):')
                              if (observaciones && observaciones.trim()) {
                                validarObjetivo(objetivo.id, 'RECHAZADO', observaciones)
                              } else if (observaciones !== null) {
                                alert('Las observaciones son obligatorias para rechazar un objetivo.')
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            ❌ Rechazar Objetivo
                          </button>
                          <button
                            onClick={() => {
                              const comentario = prompt('Agregar comentario:')
                              if (comentario && comentario.trim()) {
                                // Aqui implementarias la funcion para agregar comentarios
                                alert('Funcion de comentarios pendiente de implementar')
                              }
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            💬 Agregar Comentario
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {objetivos.filter(obj => obj.estado === 'EN_VALIDACION').length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">🎯</div>
                      <p className="text-gray-500 text-lg">No hay objetivos pendientes de validacion.</p>
                      <p className="text-gray-400 text-sm mt-2">Todos los objetivos estan al dia.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🚫</div>
                <p className="text-gray-500 text-lg">No tienes permisos para validar objetivos.</p>
                <p className="text-gray-400 text-sm mt-2">Solo los usuarios con rol VALIDADOR pueden realizar esta accion.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para crear objetivo */}
      {showObjetivoForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  ➕ Nuevo Objetivo Estrategico
                </h3>
                <button
                  onClick={() => {
                    setShowObjetivoForm(false)
                    resetFormObjetivo()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Codigo *
                    </label>
                    <input
                      type="text"
                      value={formObjetivo.codigo}
                      onChange={(e) => setFormObjetivo({...formObjetivo, codigo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Ej: OBJ-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formObjetivo.tipo}
                      onChange={(e) => setFormObjetivo({...formObjetivo, tipo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="ESTRATEGICO">Estrategico</option>
                      <option value="OPERATIVO">Operativo</option>
                      <option value="TACTICO">Tactico</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formObjetivo.nombre}
                    onChange={(e) => setFormObjetivo({...formObjetivo, nombre: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Nombre del objetivo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripcion
                  </label>
                  <textarea
                    value={formObjetivo.descripcion}
                    onChange={(e) => setFormObjetivo({...formObjetivo, descripcion: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Descripcion detallada del objetivo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area Responsable
                    </label>
                    <input
                      type="text"
                      value={formObjetivo.area_responsable}
                      onChange={(e) => setFormObjetivo({...formObjetivo, area_responsable: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Area responsable"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={formObjetivo.prioridad}
                      onChange={(e) => setFormObjetivo({...formObjetivo, prioridad: e.target.value as 'ALTA' | 'MEDIA' | 'BAJA'})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="ALTA">Alta</option>
                      <option value="MEDIA">Media</option>
                      <option value="BAJA">Baja</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alineacion PND
                    </label>
                    <select
                      value={formObjetivo.pnd_id}
                      onChange={(e) => setFormObjetivo({...formObjetivo, pnd_id: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar PND</option>
                      {pndList.map(pnd => (
                        <option key={pnd.id} value={pnd.id}>
                          {pnd.idPND} - {pnd.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alineacion ODS
                    </label>
                    <select
                      value={formObjetivo.ods_id}
                      onChange={(e) => setFormObjetivo({...formObjetivo, ods_id: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar ODS</option>
                      {odsList.map(ods => (
                        <option key={ods.id} value={ods.id}>
                          ODS {ods.numero} - {ods.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={formObjetivo.fecha_inicio}
                      onChange={(e) => setFormObjetivo({...formObjetivo, fecha_inicio: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={formObjetivo.fecha_fin}
                      onChange={(e) => setFormObjetivo({...formObjetivo, fecha_fin: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Presupuesto
                  </label>
                  <input
                    type="number"
                    value={formObjetivo.presupuesto}
                    onChange={(e) => setFormObjetivo({...formObjetivo, presupuesto: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowObjetivoForm(false)
                      resetFormObjetivo()
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={crearObjetivo}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Crear Objetivo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar meta */}
      {showMetaForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {metaSeleccionada ? ' Editar Meta' : '➕ Nueva Meta'} para: {objetivoSeleccionado?.nombre}
                </h3>
                <button
                  onClick={() => {
                    setShowMetaForm(false)
                    setMetaSeleccionada(null)
                    resetFormMeta()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Codigo *
                    </label>
                    <input
                      type="text"
                      value={formMeta.codigo}
                      onChange={(e) => setFormMeta({...formMeta, codigo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Ej: META-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad de Medida *
                    </label>
                    <input
                      type="text"
                      value={formMeta.unidad_medida}
                      onChange={(e) => setFormMeta({...formMeta, unidad_medida: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Ej: porcentaje, cantidad, horas"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripcion *
                  </label>
                  <textarea
                    value={formMeta.descripcion}
                    onChange={(e) => setFormMeta({...formMeta, descripcion: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Descripcion detallada de la meta"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Inicial
                    </label>
                    <input
                      type="number"
                      value={formMeta.valor_inicial}
                      onChange={(e) => setFormMeta({...formMeta, valor_inicial: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Meta *
                    </label>
                    <input
                      type="number"
                      value={formMeta.valor_meta}
                      onChange={(e) => setFormMeta({...formMeta, valor_meta: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="100"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Periodicidad
                    </label>
                    <select
                      value={formMeta.periodicidad}
                      onChange={(e) => setFormMeta({...formMeta, periodicidad: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="DIARIA">Diaria</option>
                      <option value="SEMANAL">Semanal</option>
                      <option value="MENSUAL">Mensual</option>
                      <option value="TRIMESTRAL">Trimestral</option>
                      <option value="SEMESTRAL">Semestral</option>
                      <option value="ANUAL">Anual</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informacion de la Meta</h4>
                  <div className="text-sm text-blue-700">
                    <p><strong>Objetivo:</strong> {objetivoSeleccionado?.codigo} - {objetivoSeleccionado?.nombre}</p>
                    <p><strong>Area:</strong> {objetivoSeleccionado?.area_responsable}</p>
                    <p><strong>Responsable:</strong> {user?.nombre} ({user?.email})</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMetaForm(false)
                      setMetaSeleccionada(null)
                      resetFormMeta()
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🔍 [DEBUG] Formulario actual:', formMeta);
                      console.log('🔍 [DEBUG] Meta seleccionada:', metaSeleccionada);
                      
                      // Validaciones mejoradas
                      if (!formMeta.codigo.trim()) {
                        alert('El codigo es obligatorio');
                        return;
                      }
                      if (!formMeta.descripcion.trim()) {
                        alert('La descripcion es obligatoria');
                        return;
                      }
                      if (!formMeta.valor_meta || isNaN(parseFloat(formMeta.valor_meta))) {
                        alert('El valor meta debe ser un numero valido');
                        return;
                      }
                      if (!formMeta.unidad_medida.trim()) {
                        alert('La unidad de medida es obligatoria');
                        return;
                      }
                      
                      const valorInicial = formMeta.valor_inicial ? parseFloat(formMeta.valor_inicial) : 0;
                      const valorMeta = parseFloat(formMeta.valor_meta);
                      
                      if (isNaN(valorInicial)) {
                        alert('El valor inicial debe ser un numero valido');
                        return;
                      }
                      
                      if (valorMeta <= 0) {
                        alert('El valor meta debe ser mayor a 0');
                        return;
                      }
                      
                      const metaData = {
                        codigo: formMeta.codigo.trim(),
                        descripcion: formMeta.descripcion.trim(),
                        valor_inicial: valorInicial,
                        valor_meta: valorMeta,
                        unidad_medida: formMeta.unidad_medida.trim(),
                        periodicidad: formMeta.periodicidad
                      };
                      
                      if (metaSeleccionada) {
                        console.log('🔍 [DEBUG] Datos validados para actualizar meta:', metaData);
                        actualizarMeta(metaData);
                      } else {
                        console.log('🔍 [DEBUG] Datos validados para crear meta:', metaData);
                        crearMeta(metaData);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {metaSeleccionada ? 'Actualizar Meta' : 'Crear Meta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar indicador */}
      {showIndicadorForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  ➕ Nuevo Indicador para: {metaSeleccionadaIndicadores?.codigo}
                </h3>
                <button
                  onClick={() => {
                    setShowIndicadorForm(false);
                    resetFormIndicador();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Indicador *
                    </label>
                    <input
                      type="text"
                      value={formIndicador.idIndicador}
                      onChange={(e) => setFormIndicador({...formIndicador, idIndicador: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: IND-001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Codigo *
                    </label>
                    <input
                      type="text"
                      value={formIndicador.codigo}
                      onChange={(e) => setFormIndicador({...formIndicador, codigo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: IND-EFIC-PROC"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formIndicador.nombre}
                    onChange={(e) => setFormIndicador({...formIndicador, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Eficiencia de Procesos"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripcion
                  </label>
                  <textarea
                    value={formIndicador.descripcion}
                    onChange={(e) => setFormIndicador({...formIndicador, descripcion: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe el objetivo del indicador..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formIndicador.tipo}
                      onChange={(e) => setFormIndicador({...formIndicador, tipo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CUANTITATIVO">Cuantitativo</option>
                      <option value="CUALITATIVO">Cualitativo</option>
                      <option value="PROCESO">Proceso</option>
                      <option value="RESULTADO">Resultado</option>
                      <option value="IMPACTO">Impacto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad de Medida
                    </label>
                    <input
                      type="text"
                      value={formIndicador.unidadMedida}
                      onChange={(e) => setFormIndicador({...formIndicador, unidadMedida: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Porcentaje, Puntos, Numero"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia de Medicion
                  </label>
                  <select
                    value={formIndicador.frecuencia_medicion}
                    onChange={(e) => setFormIndicador({...formIndicador, frecuencia_medicion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    Formula (Opcional)
                  </label>
                  <textarea
                    value={formIndicador.formula}
                    onChange={(e) => setFormIndicador({...formIndicador, formula: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: (Procesos completados / Procesos iniciados) * 100"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowIndicadorForm(false);
                      resetFormIndicador();
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🔍 [DEBUG] Datos del formulario de indicador:', formIndicador);
                      crearIndicador();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Crear Indicador
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar indicador */}
      {showEditIndicadorForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                   Editar Indicador: {indicadorSeleccionado?.codigo}
                </h3>
                <button
                  onClick={() => {
                    setShowEditIndicadorForm(false);
                    setIndicadorSeleccionado(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Indicador *
                    </label>
                    <input
                      type="text"
                      value={formEditIndicador.idIndicador}
                      onChange={(e) => setFormEditIndicador({...formEditIndicador, idIndicador: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: IND-001"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código
                    </label>
                    <input
                      type="text"
                      value={formEditIndicador.codigo}
                      onChange={(e) => setFormEditIndicador({...formEditIndicador, codigo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: IND-SATISF-001"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Indicador *
                  </label>
                  <input
                    type="text"
                    value={formEditIndicador.nombre}
                    onChange={(e) => setFormEditIndicador({...formEditIndicador, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre descriptivo del indicador"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formEditIndicador.descripcion}
                    onChange={(e) => setFormEditIndicador({...formEditIndicador, descripcion: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción detallada del indicador"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      value={formEditIndicador.tipo}
                      onChange={(e) => setFormEditIndicador({...formEditIndicador, tipo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="CUANTITATIVO">Cuantitativo</option>
                      <option value="CUALITATIVO">Cualitativo</option>
                      <option value="PROCESO">Proceso</option>
                      <option value="RESULTADO">Resultado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida
                    </label>
                    <input
                      type="text"
                      value={formEditIndicador.unidadMedida}
                      onChange={(e) => setFormEditIndicador({...formEditIndicador, unidadMedida: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Porcentaje, Número, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fórmula de Cálculo
                  </label>
                  <textarea
                    value={formEditIndicador.formula}
                    onChange={(e) => setFormEditIndicador({...formEditIndicador, formula: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Fórmula o metodología de cálculo"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditIndicadorForm(false);
                      setIndicadorSeleccionado(null);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🔍 [DEBUG] Datos del formulario de edición:', formEditIndicador);
                      editarIndicador();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Actualizar Indicador
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
