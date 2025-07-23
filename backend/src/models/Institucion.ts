/**
 * MODELO DE INSTITUCION - MODULO 1
 * Implementa todos los requerimientos segun especificacion
 */

import pool from '../database/connection';

export interface IInstitucion {
  id?: number;
  codigo: string; // Atributo requerido
  nombre: string; // Atributo requerido
  tipo: string; // Atributo requerido
  jerarquia: number; // Atributo requerido
  responsable?: number; // Opcional - relacion con Usuario
  sigla?: string;
  mision?: string;
  vision?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  web?: string;
  estado?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class Institucion {
  public id?: number;
  public codigo: string;
  public nombre: string;
  public tipo: string;
  public jerarquia: number;
  public responsable?: number; // Opcional - relacion con Usuario
  public sigla?: string;
  public mision?: string;
  public vision?: string;
  public direccion?: string;
  public telefono?: string;
  public email?: string;
  public web?: string;
  public estado: boolean;
  public created_at?: string;
  public updated_at?: string;

  constructor(data: IInstitucion) {
    this.id = data.id;
    this.codigo = data.codigo;
    this.nombre = data.nombre;
    this.tipo = data.tipo;
    this.jerarquia = data.jerarquia;
    this.responsable = data.responsable; // Puede ser undefined
    this.sigla = data.sigla;
    this.mision = data.mision;
    this.vision = data.vision;
    this.direccion = data.direccion;
    this.telefono = data.telefono;
    this.email = data.email;
    this.web = data.web;
    this.estado = data.estado ?? true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * METODO REQUERIDO: registrarInstitucion()
   * Registra una nueva institucion en el sistema
   */
  async registrarInstitucion(): Promise<Institucion> {
    try {
      // Validar atributos requeridos (responsable es opcional)
      if (!this.codigo || !this.nombre || !this.tipo || !this.jerarquia) {
        throw new Error('Los campos codigo, nombre, tipo y jerarquia son obligatorios');
      }

      // Verificar que el codigo no este en uso
      const codigoCheck = await pool.query(
        'SELECT id FROM institucion WHERE codigo = $1', 
        [this.codigo]
      );

      if (codigoCheck.rows.length > 0) {
        throw new Error('El codigo ya esta registrado en el sistema');
      }

      // Verificar que el responsable exista y este activo (solo si se proporciona)
      if (this.responsable) {
        const responsableCheck = await pool.query(
          'SELECT id FROM usuario WHERE id = $1 AND estado = true', 
          [this.responsable]
        );

        if (responsableCheck.rows.length === 0) {
          throw new Error('El usuario responsable no existe o esta inactivo');
        }
      }

      const query = `
        INSERT INTO institucion (
          codigo, nombre, sigla, tipo, mision, vision,
          direccion, telefono, email, web, jerarquia, 
          responsable, estado, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())
        RETURNING *
      `;
      
      const values = [
        this.codigo, this.nombre, this.sigla, this.tipo, this.mision, this.vision,
        this.direccion, this.telefono, this.email, this.web, this.jerarquia, 
        this.responsable || null // Permitir null para responsable
      ];

      const result = await pool.query(query, values);
      
      // Actualizar la instancia con los datos guardados
      Object.assign(this, result.rows[0]);
      
      return this;
    } catch (error) {
      throw new Error(`Error al registrar institucion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * METODO REQUERIDO: activarInstitucion()
   * Activa una institucion en el sistema
   */
  async activarInstitucion(usuarioId: number): Promise<Institucion> {
    try {
      if (!this.id) {
        throw new Error('ID de institucion requerido para activar');
      }

      const query = `
        UPDATE institucion SET 
          estado = true,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [this.id]);

      if (result.rows.length === 0) {
        throw new Error('Institucion no encontrada');
      }

      // Actualizar la instancia
      Object.assign(this, result.rows[0]);

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_nuevos)
        VALUES ('ACTIVAR', 'institucion', $1, $2, NOW(), $3)
      `, [this.id, usuarioId, JSON.stringify(result.rows[0])]);

      return this;
    } catch (error) {
      throw new Error(`Error al activar institucion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * METODO REQUERIDO: inactivarInstitucion()
   * Inactiva una institucion en el sistema
   */
  async inactivarInstitucion(usuarioId: number): Promise<Institucion> {
    try {
      if (!this.id) {
        throw new Error('ID de institucion requerido para inactivar');
      }

      const query = `
        UPDATE institucion SET 
          estado = false,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [this.id]);

      if (result.rows.length === 0) {
        throw new Error('Institucion no encontrada');
      }

      // Actualizar la instancia
      Object.assign(this, result.rows[0]);

      // Registrar en auditoria
      await pool.query(`
        INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, fecha_accion, datos_nuevos)
        VALUES ('INACTIVAR', 'institucion', $1, $2, NOW(), $3)
      `, [this.id, usuarioId, JSON.stringify(result.rows[0])]);

      return this;
    } catch (error) {
      throw new Error(`Error al inactivar institucion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Metodo estatico para obtener una institucion por ID
   */
  static async obtenerPorId(id: number): Promise<Institucion | null> {
    try {
      const query = `
        SELECT 
          i.*,
          u.nombre || ' ' || u.apellido as responsable_nombre,
          u.email as responsable_email
        FROM institucion i
        LEFT JOIN usuario u ON i.responsable = u.id
        WHERE i.id = $1
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new Institucion(result.rows[0]);
    } catch (error) {
      throw new Error(`Error al obtener institucion: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Metodo estatico para obtener todas las instituciones activas
   */
  static async obtenerTodas(): Promise<Institucion[]> {
    try {
      const query = `
        SELECT 
          i.*,
          u.nombre || ' ' || u.apellido as responsable_nombre,
          COUNT(sub_i.id) as sub_instituciones
        FROM institucion i
        LEFT JOIN usuario u ON i.responsable = u.id
        LEFT JOIN institucion sub_i ON sub_i.responsable = i.id AND sub_i.estado = true
        WHERE i.estado = true
        GROUP BY i.id, u.nombre, u.apellido
        ORDER BY i.jerarquia, i.nombre
      `;

      const result = await pool.query(query);
      
      return result.rows.map(row => new Institucion(row));
    } catch (error) {
      throw new Error(`Error al obtener instituciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Validar datos de la institucion
   */
  validar(): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar atributos requeridos segun especificacion (responsable es opcional)
    if (!this.codigo) {
      errores.push('El codigo es obligatorio');
    }

    if (!this.nombre) {
      errores.push('El nombre es obligatorio');
    }

    if (!this.tipo) {
      errores.push('El tipo es obligatorio');
    }

    if (!this.jerarquia || this.jerarquia < 1) {
      errores.push('La jerarquia debe ser un numero mayor a 0');
    }

    // Responsable es opcional, pero si se proporciona debe ser valido
    // Esta validacion se hace en el metodo registrarInstitucion()

    // Validaciones de formato
    if (this.email && !/\S+@\S+\.\S+/.test(this.email)) {
      errores.push('El formato del email es invalido');
    }

    if (this.web && !this.web.startsWith('http')) {
      errores.push('La URL del sitio web debe comenzar con http:// o https://');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}
