import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface PedidoSucursalItem {
  id_producto_detalle?: number;
  cantidad_solicitada?: number;
  cantidad_enviada?: number;
  estado?: number;
}

export interface ConsolidadoItem {
  id_sub_categoria_2: number;
  Categoria: string;
  SubCategoria: string;
  Producto: string;
  Turno: string;
  idTurno: number;
  btnProducto?: number;
  Stock?: number;
  Vencimiento?: string;
  Total: number;
  Total_enviado?: number;
  producible?: number;
  estadoStock?: boolean;
  pedido_principal?: number;
  turnoSol?: string | null;
  [key: string]: any;
}

export interface ListarPedidosResponse {
  success?: boolean;
  status?: boolean;
  cabecera2?: string[];
  estado_planta?: boolean;
  cabecera: string[];
  sucursal?: string;
  sucursales?: Record<string, string>;
  sucursales2?: Record<string, number>;
  consolidados: ConsolidadoItem[];
  turnosPedido?: Record<string, string[]>;
}

export const usePedidosSucursalesParaAlmacenServices = () => {
  const loadApiListarPedidos = async (params: {
    fecha_reporte: string;
    tipo_reporte: string;
    sucursal?: number;
    tipo?: number;
    producible?: number;
    filtrar_restante?: number;
    filtrar_total?: number;
  }): Promise<ListarPedidosResponse | undefined> => {
    try {
      const response = await api.get<ListarPedidosResponse>('/v1/pedidos-sucursal/listar-pedidos', {
        params: {
          fecha_reporte: params.fecha_reporte,
          tipo_reporte: params.tipo_reporte === 'TODOS' ? 'ALL' : params.tipo_reporte,
          sucursal: params.sucursal !== undefined ? params.sucursal : 0,
          tipo: params.tipo !== undefined ? params.tipo : 0,
          producible: params.producible !== undefined ? params.producible : 1,
          filtrar_restante: params.filtrar_restante !== undefined ? params.filtrar_restante : 0,
          filtrar_total: params.filtrar_total !== undefined ? params.filtrar_total : 0,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      return undefined;
    }
  };

  const loadApiGuardarCambios = async (payload: {
    fecha: string;
    sucursales: Record<string, any[]>;
  }): Promise<any> => {
    try {
      const response = await api.patch<any>('/v1/pedidos-sucursal/guardar-cambios', payload);
      return response.data;
    } catch (error) {
      handleApiError(error);
      return undefined;
    }
  };

  return {
    loadApiListarPedidos,
    loadApiGuardarCambios,
  };
};

export default usePedidosSucursalesParaAlmacenServices;
