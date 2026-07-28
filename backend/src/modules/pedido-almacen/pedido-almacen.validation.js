const { z } = require('zod');

const listarProductosQuery = z.object({
    id_almacen: z.coerce.number().int().positive('id_almacen es requerido'),
    id_almacen_solicitante: z.coerce.number().int().positive('id_almacen_solicitante es requerido'),
    tipo: z.string().optional().default('all')
}).passthrough().refine(
  (data) => data.id_almacen !== data.id_almacen_solicitante,
  {
    message: "id_almacen y id_almacen_solicitante deben ser distintos",
    path: ["id_almacen_solicitante"],
  }
);

const solicitudProductoItem = z.object({
    cantidad: z.number().nonnegative().optional().default(0),
    id_producto_detalle: z.number().int().nonnegative().optional().default(0),
    id_producto_intermedio: z.number().int().nonnegative().optional().default(0),
    id_unidad: z.number().int().nonnegative().optional().default(0)
}).passthrough();

const crearSolicitudBody = z.object({
    id_almacen_solicitante: z.number().int().positive('id_almacen_solicitante es requerido'),
    id_almacen_destino: z.number().int().positive('id_almacen_destino es requerido'),
    fecha_entrega: z.string().min(1, 'fecha_entrega es requerida'),
    productos: z.array(solicitudProductoItem).min(1, 'Se requiere al menos un producto')
}).passthrough().refine(
  (data) => data.id_almacen_destino !== data.id_almacen_solicitante,
  {
    message: "id_almacen_destino y id_almacen_solicitante deben ser distintos",
    path: ["id_almacen_solicitante"],
  }
);

const listarSolicitudesQuery = z.object({
    id_almacen_solicitante: z.coerce.number().int().positive('id_almacen_solicitante es requerido'),
    id_almacen_destino: z.coerce.number().int().nonnegative().optional().default(0),
    fecha_inicio: z.coerce.string().optional().default(''),
    fecha_fin: z.coerce.string().optional().default('')
}).passthrough();

const idParam = z.object({
    id: z.coerce.number().int().positive('ID de solicitud requerido')
});

const editarSolicitudBody = z.object({
    id_documento: z.number().int().positive('id_documento es requerido'),
    productos: z.array(solicitudProductoItem).min(1, 'Se requiere al menos un producto')
}).passthrough();

const enviarRecibirItem = z.object({
    id_detalle: z.number().int().positive(),
    cantidad_enviada: z.number().nonnegative().optional().default(0),
    cantidad_aceptada: z.number().nonnegative().optional().default(0)
}).passthrough();

const enviarSolicitudBody = z.object({
    id_documento: z.number().int().positive(),
    detalles: z.array(enviarRecibirItem).min(1, 'Se requiere al menos un detalle')
}).passthrough();

const recibirSolicitudBody = z.object({
    id_documento: z.number().int().positive(),
    detalles: z.array(enviarRecibirItem).min(1, 'Se requiere al menos un detalle')
}).passthrough();

module.exports = {
    listarProductosQuery,
    crearSolicitudBody,
    listarSolicitudesQuery,
    idParam,
    editarSolicitudBody,
    enviarSolicitudBody,
    recibirSolicitudBody
};
