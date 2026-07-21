export type TipoNotificacion = 'info' | 'exito' | 'alerta' | 'pedido' | 'documento' | 'prueba' | 'produccion';

export interface Notificacion {
    ID_NOTIFICACION: number;
    TIPO: TipoNotificacion;
    TITULO: string;
    MENSAJE: string;
    REFERENCIA_ID: number | null;
    REFERENCIA_MODULO: string | null;
    ID_USUARIO_DESTINO: number;
    ID_USUARIO_ORIGEN: number;
    LEIDA: boolean;
    FECHA_REGISTRO: string;
}

export interface NuevaNotificacion {
    ID_NOTIFICACION: number;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    referenciaId: number | null;
    referenciaModulo: string | null;
    timestamp: string;
    usuarioOrigen: number;
    sistemaOrigen?: string;
}
