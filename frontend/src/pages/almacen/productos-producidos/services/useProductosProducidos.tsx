/**
 * useProductosProducidos.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Productos Producidos e Historial de Producción
 *
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                             │ Descripción                                             │
 * ├─────┼────────┼──────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/inventario/produccion/areas                          │ Listar áreas habilitadas para el usuario logueado       │
 * │  2  │ GET    │ /v1/inventario/produccion/almacenes                      │ Listar catálogo general de almacenes                    │
 * │  3  │ GET    │ /v1/inventario/produccion/almacenes-usuario              │ Listar almacenes asignados al usuario logueado          │
 * │  4  │ GET    │ /v1/inventario/produccion/almacenes/:id/recetas?tipo=X   │ Recetas con ingredientes y stock real según almacén     │
 * │  5  │ GET    │ /v1/inventario/produccion/productos-producidos           │ Historial de producción por almacén y rango de fechas   │
 * │  6  │ POST   │ /v1/inventario/produccion/registrar-productos            │ Registrar lote o masivo de producción                   │
 * └─────┴────────┴──────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Filtro de historial por almacén y rango de fechas en formato ISO (YYYY-MM-DD).
 * - Consulta de recetas dinámicas por almacén y discriminación por tipo (0 = Intermedios, 1 = Finales, null = Todos).
 * - Validación de stock de insumos en tiempo real antes de registrar la orden.
 * - Registro con array de productos producidos detallando cantidades, mermas y área de destino.
 */

import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface AreaItem {
  ID_AREA: number;
  NOMBRE: string;
  ESTADO?: number;
}

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION?: string;
  nombre?: string;
  ESTADO?: number;
}

export interface IngredienteReceta {
  ID_PRODUCTO?: number;
  ID_PRODUCTO_INTERMEDIO_ANTECESOR?: number;
  PRODUCTO?: string;
  CANTIDAD?: number;
  stock?: number;
  CANT_REC?: number;
  UNIDAD_MEDIDA?: string;
}

export interface RecetaProduccionItem {
  ID_PLANTA_RECETA: number;
  ID_PRODUCTO_INTERMEDIO?: number;
  ID_SUB_CATEGORIA_2?: number;
  PRODUCTO?: string;
  NOMBRE?: string;
  UNIDAD_MEDIDA?: string;
  CANTIDAD_ADECUACION?: number;
  CANTIDAD_ESTANDAR?: number;
  stock?: number;
  CANTIDAD?: number;
  CANT_PEDIDO?: number;
  ID_UNICO?: string;
  PRODUCTOS?: IngredienteReceta[];
  desperdicio?: number;
  produccion?: number;
}

export interface ProductoProducidoItem {
  ID_PRODUCCION?: number;
  ID_PLANTA_ALMACEN?: number;
  ALMACEN?: string;
  PRODUCTO?: string;
  NOMBRE_PRODUCTO?: string;
  CANTIDAD_PRODUCIDA?: number;
  CANTIDAD_DESPERDICIO?: number;
  UNIDAD_MEDIDA?: string;
  FECHA_REGISTRO?: string;
  HORA_REGISTRO?: string;
  USUARIO?: string;
  NOMBRE_USUARIO?: string;
  TIPO?: string;
  AREA?: string;
  ID_PRODUCTO_INTERMEDIO?: number;
  RECETA_INTERMEDIO?: string;
  RECETA: string;
}

export interface ProductoProduccionPayloadItem {
  id_planta_almacen: number;
  id_planta_receta: number;
  id_producto_intermedio: number;
  id_sub_categoria_2: number;
  cantidad_producida: number;
  cantidad_desperdicio?: number;
  detalle?: string;
  producto?: string;
  cant_AE?: number;
  imagen?: string;
  idEstado?: number;
}

export interface RegistrarProduccionPayload {
  id_area?: number;
  productos: ProductoProduccionPayloadItem[];
}

export const useProductosProducidosServices = () => {
  /**
   * 1. GET /v1/inventario/produccion/areas
   * Retorna las áreas asignadas al usuario.
   */
  const loadApiGetAreas = async () => {
    try {
      const res = await api.get<any>('/v1/inventario/produccion/areas');
      return res.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 2. GET /v1/inventario/produccion/almacenes
   * Catálogo general de almacenes.
   */
  const loadApiGetAlmacenes = async () => {
    try {
      const res = await api.get<any>('/v1/inventario/produccion/almacenes');
      return res.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 3. GET /v1/inventario/produccion/almacenes-usuario
   * Almacenes autorizados para el usuario autenticado.
   */
  const loadApiGetAlmacenesUsuario = async () => {
    try {
      const res = await api.get<any>('/v1/inventario/produccion/almacenes-usuario');
      return res.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 4. GET /v1/inventario/produccion/almacenes/:idAlmacen/recetas?tipo=X
   * Recetas e inventario disponible del almacén (tipo: 0=intermedio, 1=final, null=todos).
   */
  const loadApiGetRecetasByAlmacen = async (idAlmacen: number | string, tipo?: number | null) => {
    try {
      const params: any = {};
      if (tipo !== undefined && tipo !== null) {
        params.tipo = tipo;
      }
      const res = await api.get<any>(`/v1/inventario/produccion/almacenes/${idAlmacen}/recetas`, {
        params,
      });
      return res.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 5. GET /v1/inventario/produccion/productos-producidos?id_planta_almacen=X&fecha_inicio=Y&fecha_fin=Z
   * Historial de producción por almacén y rango de fechas.
   */
  const loadApiGetProductosProducidos = async (params: {
    id_planta_almacen?: number | string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => {
    try {
      const res = await api.get<any>('/v1/inventario/produccion/productos-producidos', {
        params,
      });
      return res.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 6. POST /v1/inventario/produccion/registrar-productos
   * Registra una orden de producción de recetas/productos.
   */
  const loadApiRegistrarProductosProducidos = async (payload: RegistrarProduccionPayload) => {
    try {
      const res = await api.post<any>('/v1/inventario/produccion/registrar-productos', payload);
      return res.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAreas,
    loadApiGetAlmacenes,
    loadApiGetAlmacenesUsuario,
    loadApiGetRecetasByAlmacen,
    loadApiGetProductosProducidos,
    loadApiRegistrarProductosProducidos,
  };
};
