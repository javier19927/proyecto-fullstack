'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ErrorHandler from '../components/ErrorHandler';
import PermissionIndicator from '../components/PermissionIndicator';
import { useAuth } from '../hooks/useAuth';
import { useErrorHandler } from '../hooks/useErrorHandler';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5002';

// Interfaces segun especificacion Modulo 3
interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_total: number;
  estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado';
  objetivo_nombre?: string;
  responsable_nombre?: string;
  supervisor_nombre?: string;
  institucion_nombre?: string;
  total_actividades?: number;
  total_presupuestos?: number;
  total_validaciones?: number;
  created_at: string;
  updated_at: string;
}

interface Actividad {
  id: number;
  codigo: string; // idActividad segun especificacion
  nombre: string; // nombreActividad segun especificacion
  descripcion: string;
  fecha_inicio_planificada: string; // fechaProgramada segun especificacion
  responsable?: string; // responsable segun especificacion
  tipo: 'PRINCIPAL' | 'SECUNDARIA';
  estado: string;
  porcentaje_avance: number;
  presupuesto: number;
  proyecto_id: number;
}

interface Presupuesto {
  id: number;
  idPresupuesto: string; // segun especificacion
  anio: number; // segun especificacion
  monto: number; // segun especificacion
  clasificacion_gasto?: string; // clasificacionGasto segun especificacion
  tipo: string;
  estado: string;
  proyecto_id: number;
}

interface Validacion {
  id: number;
  tipo: string;
  estado: 'APROBADO' | 'RECHAZADO';
  comentarios: string;
  fecha_validacion: string;
  validador_nombre?: string;
  validador_email?: string;
}

export default function GestionProyectosPage() {
  const router = useRouter();
  const { user, loading: authLoading, permissions } = useAuth();
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'proyectos' | 'actividades' | 'presupuesto' | 'validacion'>('proyectos');

  // Controles de permisos segun la matriz de especificacion
  const canRegisterEdit = permissions.proyectosInversion.canRegisterEdit();
  const canValidate = permissions.proyectosInversion.canValidate();
  const canConsult = permissions.proyectosInversion.canConsult();
  const { error, errorType, handleError, clearError } = useErrorHandler();
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [success, setSuccess] = useState<string>('');

  // 🔹 1. Formulario para registrar proyecto nuevo
  const [formProyecto, setFormProyecto] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    monto: '',
    objetivo_id: '',
    responsable_id: '',
    supervisor_id: '',
    prioridad: 'MEDIA',
    ubicacion_geografica: '',
    beneficiarios_directos: '',
    beneficiarios_indirectos: ''
  });

  // 🔹 3. Formulario para registrar actividades del POA
  const [formActividad, setFormActividad] = useState({
    codigo: '', // idActividad segun especificacion
    nombre: '', // nombreActividad segun especificacion
    descripcion: '',
    fecha_inicio_planificada: '', // fechaProgramada segun especificacion
    responsable: '', // responsable segun especificacion
    tipo: 'PRINCIPAL',
    presupuesto: ''
  });

  // 🔹 4. Formulario para asignar presupuesto
  const [formPresupuesto, setFormPresupuesto] = useState({
    idPresupuesto: '', // segun especificacion
    anio: new Date().getFullYear().toString(), // segun especificacion
    monto: '', // segun especificacion
    clasificacion_gasto: '', // clasificacionGasto segun especificacion
    tipo: 'INICIAL'
  });

  // 🔹 6. Formulario para validacion
  const [formValidacion, setFormValidacion] = useState({
    estado: 'APROBADO' as 'APROBADO' | 'RECHAZADO',
    comentario: '' // segun especificacion
  });

  useEffect(() => {
    // Cargar datos iniciales cuando el usuario este autenticado
    if (user) {
      cargarProyectos();
    }
  }, [user]);

  // 🔹 7. Consultar, filtrar y monitorear proyectos
  const cargarProyectos = async (estado = 'todos') => {
    try {
      console.log('🔍 Cargando proyectos...');
      let url = `${API_BASE_URL}/api/proyectos`;
      
      if (estado !== 'todos') {
        url += `?estado=${estado}`;
      }

      console.log('🌐 URL de consulta:', url);
      
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(url, { headers });
      
      console.log('📊 Respuesta del servidor:', response.data);

      if (response.data.success) {
        console.log('✅ Proyectos cargados:', response.data.data.length);
        setProyectos(response.data.data);
      } else {
        console.log('❌ Error en respuesta:', response.data.error);
      }
    } catch (error) {
      console.error('❌ Error al cargar proyectos:', error);
      handleError(error, 'data');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 1. Registrar un proyecto nuevo (crearProyecto())
  const crearProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    clearError();
    setSuccess('');
    
    // Validaciones del lado del cliente
    if (!formProyecto.codigo.trim()) {
      handleError(new Error('El codigo del proyecto es obligatorio'), 'data');
      return;
    }
    
    if (!formProyecto.nombre.trim()) {
      handleError(new Error('El nombre del proyecto es obligatorio'), 'data');
      return;
    }
    
    if (!formProyecto.descripcion.trim()) {
      handleError(new Error('La descripcion del proyecto es obligatoria'), 'data');
      return;
    }
    
    if (!formProyecto.fecha_inicio) {
      handleError(new Error('La fecha de inicio es obligatoria'), 'data');
      return;
    }
    
    if (!formProyecto.fecha_fin) {
      handleError(new Error('La fecha de fin es obligatoria'), 'data');
      return;
    }
    
    if (new Date(formProyecto.fecha_fin) <= new Date(formProyecto.fecha_inicio)) {
      handleError(new Error('La fecha de fin debe ser posterior a la fecha de inicio'), 'data');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔹 [FRONTEND] Enviando datos de proyecto:', {
        ...formProyecto,
        monto: parseFloat(formProyecto.monto) || 0,
        beneficiarios_directos: parseInt(formProyecto.beneficiarios_directos) || 0,
        beneficiarios_indirectos: parseInt(formProyecto.beneficiarios_indirectos) || 0
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/proyectos`, {
        ...formProyecto,
        monto: parseFloat(formProyecto.monto) || 0,
        presupuesto_total: parseFloat(formProyecto.monto) || 0,
        beneficiarios_directos: parseInt(formProyecto.beneficiarios_directos) || 0,
        beneficiarios_indirectos: parseInt(formProyecto.beneficiarios_indirectos) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('✅ Proyecto creado exitosamente con estado Borrador');
        setMostrarFormulario(false);
        limpiarFormulario();
        cargarProyectos();
        console.log('✅ [FRONTEND] Proyecto creado:', response.data.data);
      }
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error al crear proyecto:', error);
      handleError(error, 'general');
    }
  };

  // 🔹 2. Editar proyecto existente (editarProyecto())
  const editarProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoSeleccionado) {
      console.error('❌ No hay proyecto seleccionado para editar');
      return;
    }

    console.log('🔹 [FRONTEND] Iniciando edición de proyecto:', {
      id: proyectoSeleccionado.id,
      formData: formProyecto
    });

    // Validaciones básicas
    if (!formProyecto.codigo || !formProyecto.nombre) {
      handleError(new Error('El código y nombre son obligatorios'), 'data');
      return;
    }
    
    if (!formProyecto.fecha_inicio || !formProyecto.fecha_fin) {
      handleError(new Error('Las fechas de inicio y fin son obligatorias'), 'data');
      return;
    }
    
    if (new Date(formProyecto.fecha_fin) <= new Date(formProyecto.fecha_inicio)) {
      handleError(new Error('La fecha de fin debe ser posterior a la fecha de inicio'), 'data');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('� [FRONTEND] Token encontrado:', !!token);
      
      const payload = {
        ...formProyecto,
        monto: parseFloat(formProyecto.monto) || 0,
        presupuesto_total: parseFloat(formProyecto.monto) || 0,
        beneficiarios_directos: parseInt(formProyecto.beneficiarios_directos) || 0,
        beneficiarios_indirectos: parseInt(formProyecto.beneficiarios_indirectos) || 0,
        // Convertir cadenas vacías a null para campos de ID
        objetivo_id: formProyecto.objetivo_id ? parseInt(formProyecto.objetivo_id) : null,
        responsable_id: formProyecto.responsable_id ? parseInt(formProyecto.responsable_id) : null,
        supervisor_id: formProyecto.supervisor_id ? parseInt(formProyecto.supervisor_id) : null
      };
      
      const url = `${API_BASE_URL}/api/proyectos/${proyectoSeleccionado.id}/editar`;
      
      console.log('🔹 [FRONTEND] Enviando PUT request:', {
        url,
        payload,
        headers: { Authorization: `Bearer ${token?.substring(0, 20)}...` }
      });
      
      const response = await axios.put(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔹 [FRONTEND] Respuesta del servidor:', response.data);

      if (response.data.success) {
        console.log('✅ [FRONTEND] Proyecto actualizado exitosamente');
        setSuccess('✅ Proyecto actualizado exitosamente');
        setMostrarFormulario(false);
        setModoEdicion(false);
        setProyectoSeleccionado(null); // Limpiar selección
        limpiarFormulario();
        await cargarProyectos(filtroEstado); // Recargar con el filtro actual
        console.log('🔄 [FRONTEND] Lista de proyectos recargada');
      } else {
        console.error('❌ [FRONTEND] Respuesta no exitosa:', response.data);
        handleError(new Error(response.data.message || 'Error al actualizar el proyecto'), 'general');
      }
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error al actualizar proyecto:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al actualizar el proyecto';
      handleError(new Error(errorMessage), 'general');
    }
  };

  // 🔹 2. Eliminar proyecto existente (eliminarProyecto())
  const eliminarProyecto = async (id: number) => {
    if (!confirm('¿Esta seguro de eliminar este proyecto?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`${API_BASE_URL}/api/proyectos/${id}/eliminar`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Proyecto eliminado exitosamente');
        cargarProyectos();
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      handleError(error, 'general');
    }
  };

  // 🔹 5. Enviar el proyecto a validacion
  const enviarAValidacion = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${API_BASE_URL}/api/proyectos/${id}/enviar-validacion`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Proyecto enviado a validacion exitosamente. Estado cambiado a Enviado.');
        cargarProyectos();
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      handleError(error, 'general');
    }
  };

  // 🔹 3. Registrar actividades del POA para el proyecto (registrarActividad())
  const registrarActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoSeleccionado) {
      console.error('❌ No hay proyecto seleccionado para registrar actividad');
      handleError(new Error('No hay proyecto seleccionado'), 'data');
      return;
    }

    // Validaciones
    if (!formActividad.codigo.trim()) {
      handleError(new Error('El código de actividad es obligatorio'), 'data');
      return;
    }

    if (!formActividad.nombre.trim()) {
      handleError(new Error('El nombre de actividad es obligatorio'), 'data');
      return;
    }

    if (!formActividad.fecha_inicio_planificada) {
      handleError(new Error('La fecha programada es obligatoria'), 'data');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('🔹 [FRONTEND] Registrando actividad:', {
        proyectoId: proyectoSeleccionado.id,
        payload: {
          idActividad: formActividad.codigo,
          nombreActividad: formActividad.nombre,
          fechaProgramada: formActividad.fecha_inicio_planificada,
          descripcion: formActividad.descripcion,
          tipo: formActividad.tipo,
          responsable: formActividad.responsable
        }
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/proyectos/${proyectoSeleccionado.id}/actividades/registrar`, {
        idActividad: formActividad.codigo, // segun especificacion
        nombreActividad: formActividad.nombre, // segun especificacion
        fechaProgramada: formActividad.fecha_inicio_planificada, // segun especificacion
        descripcion: formActividad.descripcion,
        tipo: formActividad.tipo,
        responsable: formActividad.responsable // segun especificacion
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔹 [FRONTEND] Respuesta del registro de actividad:', response.data);

      if (response.data.success) {
        setSuccess('✅ Actividad del POA registrada exitosamente al proyecto');
        setFormActividad({
          codigo: '',
          nombre: '',
          descripcion: '',
          fecha_inicio_planificada: '',
          responsable: '',
          tipo: 'PRINCIPAL',
          presupuesto: ''
        });
        await cargarActividades(proyectoSeleccionado.id);
        console.log('🔄 [FRONTEND] Actividades recargadas después del registro');
      } else {
        console.error('❌ [FRONTEND] Respuesta no exitosa:', response.data);
        handleError(new Error(response.data.message || 'Error al registrar actividad'), 'general');
      }
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error al registrar actividad:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al registrar actividad';
      handleError(new Error(errorMessage), 'general');
    }
  };

  // 🔹 4. Asignar presupuesto al proyecto (asignarPresupuesto())
  const asignarPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoSeleccionado) {
      console.error('❌ No hay proyecto seleccionado para asignar presupuesto');
      handleError(new Error('No hay proyecto seleccionado'), 'data');
      return;
    }

    // Validaciones
    if (!formPresupuesto.idPresupuesto.trim()) {
      handleError(new Error('El ID de presupuesto es obligatorio'), 'data');
      return;
    }

    if (!formPresupuesto.monto || parseFloat(formPresupuesto.monto) <= 0) {
      handleError(new Error('El monto debe ser mayor a 0'), 'data');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('🔹 [FRONTEND] Asignando presupuesto:', {
        proyectoId: proyectoSeleccionado.id,
        payload: formPresupuesto
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/proyectos/${proyectoSeleccionado.id}/presupuesto/asignar`, {
        idPresupuesto: formPresupuesto.idPresupuesto, // segun especificacion
        anio: parseInt(formPresupuesto.anio), // segun especificacion
        monto: parseFloat(formPresupuesto.monto), // segun especificacion
        clasificacionGasto: formPresupuesto.clasificacion_gasto, // segun especificacion
        tipo: formPresupuesto.tipo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔹 [FRONTEND] Respuesta de asignación de presupuesto:', response.data);

      if (response.data.success) {
        setSuccess('Presupuesto asignado exitosamente ');
        setFormPresupuesto({
          idPresupuesto: '',
          anio: new Date().getFullYear().toString(),
          monto: '',
          clasificacion_gasto: '',
          tipo: 'INICIAL'
        });
        await cargarPresupuestos(proyectoSeleccionado.id);
        console.log('🔄 [FRONTEND] Presupuestos recargados después de la asignación');
      } else {
        console.error('❌ [FRONTEND] Respuesta no exitosa:', response.data);
        handleError(new Error(response.data.message || 'Error al asignar presupuesto'), 'general');
      }
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error al asignar presupuesto:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al asignar presupuesto';
      handleError(new Error(errorMessage), 'general');
    }
  };

  // 🔹 6. Validar o rechazar el proyecto (validarProyecto())
  const validarProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoSeleccionado) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/api/proyectos/${proyectoSeleccionado.id}/validar`, {
        estado: formValidacion.estado, // segun especificacion
        comentario: formValidacion.comentario // segun especificacion
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(`Proyecto ${formValidacion.estado.toLowerCase()} exitosamente`);
        setFormValidacion({
          estado: 'APROBADO',
          comentario: ''
        });
        cargarProyectos();
        if (proyectoSeleccionado) {
          cargarValidaciones(proyectoSeleccionado.id); // Recargar validaciones
        }
        setProyectoSeleccionado(null);
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      handleError(error, 'general');
    }
  };

  // Cargar actividades del proyecto seleccionado
  const cargarActividades = async (proyectoId: number) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`🔹 [FRONTEND] Cargando actividades para proyecto ${proyectoId}`);
      
      const response = await axios.get(`${API_BASE_URL}/api/proyectos/${proyectoId}/actividades`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔹 [FRONTEND] Actividades cargadas:', response.data);

      if (response.data.success) {
        setActividades(response.data.data || []);
      } else {
        console.warn('🔸 [FRONTEND] No se pudieron cargar las actividades');
        setActividades([]);
      }
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error al cargar actividades:', error);
      setActividades([]);
      // No mostrar error crítico, solo log para debugging
    }
  };

  // Cargar presupuestos del proyecto seleccionado
  const cargarPresupuestos = async (proyectoId: number) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`🔹 [FRONTEND] Cargando presupuestos para proyecto ${proyectoId}`);
      
      // Cambiar la URL para usar la ruta correcta del backend
      const response = await axios.get(`${API_BASE_URL}/api/proyectos/presupuesto/revisar?proyectoId=${proyectoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔹 [FRONTEND] Presupuestos cargados:', response.data);

      if (response.data.success) {
        setPresupuestos(response.data.data || []);
      } else {
        console.warn('🔸 [FRONTEND] No se pudieron cargar los presupuestos');
        setPresupuestos([]);
      }
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error al cargar presupuestos:', error);
      setPresupuestos([]);
      // No mostrar error crítico, solo log para debugging
    }
  };

  // Cargar validaciones del proyecto seleccionado
  const cargarValidaciones = async (proyectoId: number) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`🔹 [FRONTEND] Cargando validaciones para proyecto ${proyectoId}`);
      
      const response = await axios.get(`${API_BASE_URL}/api/proyectos/${proyectoId}/validaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔹 [FRONTEND] Validaciones cargadas:', response.data);

      if (response.data.success) {
        setValidaciones(response.data.data || []);
      } else {
        console.warn('🔸 [FRONTEND] No se pudieron cargar las validaciones');
        setValidaciones([]);
      }
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error al cargar validaciones:', error);
      setValidaciones([]);
      // No mostrar error crítico, solo log para debugging
    }
  };

  const limpiarFormulario = () => {
    setFormProyecto({
      codigo: '',
      nombre: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      monto: '',
      objetivo_id: '',
      responsable_id: '',
      supervisor_id: '',
      prioridad: 'MEDIA',
      ubicacion_geografica: '',
      beneficiarios_directos: '',
      beneficiarios_indirectos: ''
    });
  };

  const abrirFormularioEdicion = (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
    
    // Formatear las fechas correctamente para el input type="date"
    const formatearFecha = (fecha: string) => {
      if (!fecha) return '';
      const fechaObj = new Date(fecha);
      return fechaObj.toISOString().split('T')[0];
    };
    
    setFormProyecto({
      codigo: proyecto.codigo || '',
      nombre: proyecto.nombre || '',
      descripcion: proyecto.descripcion || '',
      fecha_inicio: formatearFecha(proyecto.fecha_inicio),
      fecha_fin: formatearFecha(proyecto.fecha_fin),
      monto: proyecto.presupuesto_total ? proyecto.presupuesto_total.toString() : '0',
      objetivo_id: '', // Se mantendrá como cadena vacía para el formulario
      responsable_id: '', // Se mantendrá como cadena vacía para el formulario
      supervisor_id: '', // Se mantendrá como cadena vacía para el formulario
      prioridad: 'MEDIA',
      ubicacion_geografica: '',
      beneficiarios_directos: '',
      beneficiarios_indirectos: ''
    });
    setModoEdicion(true);
    setMostrarFormulario(true);
  };

  const seleccionarProyecto = (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
    cargarActividades(proyecto.id);
    cargarPresupuestos(proyecto.id);
    cargarValidaciones(proyecto.id);
    setTab('actividades'); // Cambiar automáticamente al tab de actividades
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Borrador': return 'bg-gray-100 text-gray-800';
      case 'Enviado': return 'bg-yellow-100 text-yellow-800';
      case 'Aprobado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Funciones de permisos integradas con el nuevo sistema
  const puedeEditarProyecto = (proyecto: Proyecto) => {
    return proyecto.estado === 'Borrador' && canRegisterEdit;
  };

  const puedeValidarProyecto = () => {
    return canValidate;
  };

  // Verificaciones de autenticacion y permisos
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando modulo de proyectos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!canConsult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder al modulo de Proyectos de Inversion.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Roles permitidos: Administrador, Tecnico (Planificador), Revisor
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚀 Modulo 3: Proyectos de Inversion
              </h1>
              <p className="text-gray-600">Gestion completa del ciclo de vida de proyectos</p>
              <div className="mt-3">
                <PermissionIndicator module="proyectosInversion" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                ← Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Alertas */}
        <ErrorHandler 
          error={error} 
          type={errorType} 
          compact={true}
        />

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setTab('proyectos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tab === 'proyectos'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Proyectos
            </button>
            {proyectoSeleccionado && (
              <>
                <button
                  onClick={() => setTab('actividades')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    tab === 'actividades'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📝 Actividades POA
                </button>
                <button
                  onClick={() => setTab('presupuesto')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    tab === 'presupuesto'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  💰 Presupuesto
                </button>
                {puedeValidarProyecto() && (
                  <button
                    onClick={() => setTab('validacion')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      tab === 'validacion'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    ✅ Validacion
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {tab === 'proyectos' && (
          <div>
            {/* Header de proyectos con filtros */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">Lista de Proyectos</h2>
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value);
                    cargarProyectos(e.target.value);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="borrador">Borrador</option>
                  <option value="pendiente">Enviado (Pendiente)</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              
              {canRegisterEdit && (
                <button
                  onClick={() => {
                    setMostrarFormulario(true);
                    setModoEdicion(false);
                    limpiarFormulario();
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  ➕ Nuevo Proyecto
                </button>
              )}
              
              {!canRegisterEdit && canConsult && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <span className="text-yellow-600 text-sm">
                      ⚠️ Solo tienes permisos de consulta en este modulo
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de proyectos */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {proyectos.map((proyecto) => (
                  <li key={proyecto.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {proyecto.codigo} - {proyecto.nombre}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(proyecto.estado)}`}>
                                {proyecto.estado}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                📅 {proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString() : 'N/A'} - {proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toLocaleDateString() : 'N/A'}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                💰 ${proyecto.presupuesto_total ? Number(proyecto.presupuesto_total).toLocaleString() : '0'}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                📊 {proyecto.total_actividades || 0} actividades, 
                                💵 {proyecto.total_presupuestos || 0} presupuestos,
                                ✅ {proyecto.total_validaciones || 0} validaciones
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => seleccionarProyecto(proyecto)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                           Ver Detalles
                        </button>
                        
                        {puedeEditarProyecto(proyecto) && (
                          <>
                            <button
                              onClick={() => abrirFormularioEdicion(proyecto)}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                            >
                               Editar
                            </button>
                            <button
                              onClick={() => eliminarProyecto(proyecto.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              🗑️ Eliminar
                            </button>
                          </>
                        )}
                        
                        {proyecto.estado === 'Borrador' && puedeEditarProyecto(proyecto) && (
                          <button
                            onClick={() => enviarAValidacion(proyecto.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                             Enviar a Validacion
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              {proyectos.length === 0 && (
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No hay proyectos para mostrar
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab de Actividades POA */}
        {tab === 'actividades' && proyectoSeleccionado && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                📝 Actividades POA - {proyectoSeleccionado.nombre}
              </h3>
            </div>

            {/* Formulario para registrar actividad */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Registrar Nueva Actividad</h4>
              <form onSubmit={registrarActividad} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ID Actividad *
                  </label>
                  <input
                    type="text"
                    value={formActividad.codigo}
                    onChange={(e) => setFormActividad({...formActividad, codigo: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre Actividad *
                  </label>
                  <input
                    type="text"
                    value={formActividad.nombre}
                    onChange={(e) => setFormActividad({...formActividad, nombre: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha Programada *
                  </label>
                  <input
                    type="date"
                    value={formActividad.fecha_inicio_planificada}
                    onChange={(e) => setFormActividad({...formActividad, fecha_inicio_planificada: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={formActividad.responsable}
                    onChange={(e) => setFormActividad({...formActividad, responsable: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    value={formActividad.tipo}
                    onChange={(e) => setFormActividad({...formActividad, tipo: e.target.value as 'PRINCIPAL' | 'SECUNDARIA'})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="PRINCIPAL">Principal</option>
                    <option value="SECUNDARIA">Secundaria</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripcion
                  </label>
                  <textarea
                    value={formActividad.descripcion}
                    onChange={(e) => setFormActividad({...formActividad, descripcion: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Registrar Actividad POA
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de actividades */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {actividades.map((actividad) => (
                  <li key={actividad.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-indigo-600">
                          {actividad.codigo} - {actividad.nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          📅 {new Date(actividad.fecha_inicio_planificada).toLocaleDateString()} | 
                          👤 {actividad.responsable || 'Sin asignar'} |
                          📊 {actividad.porcentaje_avance}% completado
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        actividad.tipo === 'PRINCIPAL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {actividad.tipo}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              
              {actividades.length === 0 && (
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No hay actividades registradas para este proyecto
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab de Presupuesto */}
        {tab === 'presupuesto' && proyectoSeleccionado && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                💰 Presupuesto - {proyectoSeleccionado.nombre}
              </h3>
            </div>

            {/* Formulario para asignar presupuesto */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Asignar Presupuesto</h4>
              <form onSubmit={asignarPresupuesto} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ID Presupuesto *
                  </label>
                  <input
                    type="text"
                    value={formPresupuesto.idPresupuesto}
                    onChange={(e) => setFormPresupuesto({...formPresupuesto, idPresupuesto: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ano *
                  </label>
                  <input
                    type="number"
                    value={formPresupuesto.anio}
                    onChange={(e) => setFormPresupuesto({...formPresupuesto, anio: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPresupuesto.monto}
                    onChange={(e) => setFormPresupuesto({...formPresupuesto, monto: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Clasificacion de Gasto
                  </label>
                  <input
                    type="text"
                    value={formPresupuesto.clasificacion_gasto}
                    onChange={(e) => setFormPresupuesto({...formPresupuesto, clasificacion_gasto: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Asignar Presupuesto
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de presupuestos */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {presupuestos.map((presupuesto) => (
                  <li key={presupuesto.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-indigo-600">
                          {presupuesto.idPresupuesto} - Ano {presupuesto.anio}
                        </p>
                        <p className="text-sm text-gray-500">
                          💰 ${presupuesto.monto.toLocaleString()} |
                          📋 {presupuesto.clasificacion_gasto || 'Sin clasificar'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        presupuesto.estado === 'ASIGNADO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {presupuesto.estado}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              
              {presupuestos.length === 0 && (
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No hay presupuestos asignados a este proyecto
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab de Validacion */}
        {tab === 'validacion' && proyectoSeleccionado && puedeValidarProyecto() && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                ✅ Validacion - {proyectoSeleccionado.nombre}
              </h3>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Informacion del Proyecto</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Codigo:</span> {proyectoSeleccionado.codigo}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span> 
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(proyectoSeleccionado.estado)}`}>
                      {proyectoSeleccionado.estado}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Monto:</span> ${proyectoSeleccionado.presupuesto_total ? Number(proyectoSeleccionado.presupuesto_total).toLocaleString() : '0'}
                  </div>
                  <div>
                    <span className="font-medium">Actividades:</span> {actividades.length}
                  </div>
                </div>
              </div>

              {proyectoSeleccionado.estado === 'Enviado' && (
                <form onSubmit={validarProyecto} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estado de Validacion *
                    </label>
                    <select
                      value={formValidacion.estado}
                      onChange={(e) => setFormValidacion({...formValidacion, estado: e.target.value as 'APROBADO' | 'RECHAZADO'})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="APROBADO">Aprobar</option>
                      <option value="RECHAZADO">Rechazar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Comentarios *
                    </label>
                    <textarea
                      value={formValidacion.comentario}
                      onChange={(e) => setFormValidacion({...formValidacion, comentario: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={4}
                      required
                      placeholder="Ingrese sus observaciones sobre la validacion del proyecto..."
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      {formValidacion.estado === 'APROBADO' ? '✅ Aprobar Proyecto' : '❌ Rechazar Proyecto'}
                    </button>
                  </div>
                </form>
              )}

              {proyectoSeleccionado.estado !== 'Enviado' && (
                <div className="text-center text-gray-500 py-8">
                  <p>Este proyecto no esta disponible para validacion.</p>
                  <p className="text-sm">Estado actual: {proyectoSeleccionado.estado}</p>
                </div>
              )}

              {/* Historial de Validaciones */}
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Historial de Validaciones</h4>
                {validaciones.length > 0 ? (
                  <div className="space-y-4">
                    {validaciones.map((validacion) => (
                      <div key={validacion.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              validacion.estado === 'APROBADO' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {validacion.estado === 'APROBADO' ? '✅ Aprobado' : '❌ Rechazado'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {validacion.tipo}
                            </span>
                          </div>
                          <span className="text-sm text-gray-400">
                            {new Date(validacion.fecha_validacion).toLocaleString()}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Validado por: {validacion.validador_nombre || 'Usuario no disponible'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Comentarios:</span>
                          <p className="mt-1">{validacion.comentarios || 'Sin comentarios'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p>No hay validaciones registradas para este proyecto.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de formulario de proyecto */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modoEdicion ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
              </h3>
              
              <form onSubmit={modoEdicion ? editarProyecto : crearProyecto} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Codigo *
                    </label>
                    <input
                      type="text"
                      value={formProyecto.codigo}
                      onChange={(e) => setFormProyecto({...formProyecto, codigo: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formProyecto.nombre}
                      onChange={(e) => setFormProyecto({...formProyecto, nombre: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={formProyecto.fecha_inicio}
                      onChange={(e) => setFormProyecto({...formProyecto, fecha_inicio: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha de Fin *
                    </label>
                    <input
                      type="date"
                      value={formProyecto.fecha_fin}
                      onChange={(e) => setFormProyecto({...formProyecto, fecha_fin: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Monto Estimado
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formProyecto.monto}
                      onChange={(e) => setFormProyecto({...formProyecto, monto: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prioridad
                    </label>
                    <select
                      value={formProyecto.prioridad}
                      onChange={(e) => setFormProyecto({...formProyecto, prioridad: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="ALTA">Alta</option>
                      <option value="MEDIA">Media</option>
                      <option value="BAJA">Baja</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descripcion *
                  </label>
                  <textarea
                    value={formProyecto.descripcion}
                    onChange={(e) => setFormProyecto({...formProyecto, descripcion: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setModoEdicion(false);
                      limpiarFormulario();
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    {modoEdicion ? 'Actualizar' : 'Crear'} Proyecto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
