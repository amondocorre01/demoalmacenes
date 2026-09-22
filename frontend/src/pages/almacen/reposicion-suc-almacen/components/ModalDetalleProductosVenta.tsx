import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { VentaReposicionItem, ProductoVentaItem } from '../services/useReposicionSucAlmacenProd';

interface ModalDetalleProductosVentaProps {
  open: boolean;
  onClose: () => void;
  venta: VentaReposicionItem | null;
}

export const ModalDetalleProductosVenta: React.FC<ModalDetalleProductosVentaProps> = ({
  open,
  onClose,
  venta,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!venta) return null;

  const productos: ProductoVentaItem[] = Array.isArray(venta.PRODUCTOS)
    ? venta.PRODUCTOS
    : [];

  // Formato seguro de fecha y hora
  const formatDateTimeDisplay = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      let datePart = '';
      let timePart = '';
      if (dateString.includes('T')) {
        const [d, t] = dateString.split('T');
        datePart = d;
        timePart = t.replace('Z', '').split('.')[0];
      } else if (dateString.includes(' ')) {
        const [d, t] = dateString.split(' ');
        datePart = d;
        timePart = t.split('.')[0];
      } else {
        datePart = dateString;
      }
      const [year, month, day] = datePart.split('-');
      const formattedDate = year && month && day ? `${day}/${month}/${year}` : datePart;
      return timePart ? `${formattedDate} ${timePart.substring(0, 5)}` : formattedDate;
    } catch {
      return dateString;
    }
  };

  const sucursalName =
    venta.NOMBRE_LISTA_PRECIOS || venta.SUCURSAL || venta.CANAL_VENTA || 'Sucursal';
  const empleadoName =
    venta.NOMBRE_COMPLETO || venta.EMPLEADO || venta.EMPLEADO_ASUMIDO || 'Sin Asignar';
  const fechaDisplay = formatDateTimeDisplay(
    venta.FECHA_REGISTRO || venta.FECHA_VENTA || venta.FECHA || venta.fecha
  );

  const totalCalculado = productos.reduce((acc, curr) => {
    const totalItem =
      curr.TOTAL != null
        ? Number(curr.TOTAL)
        : Number(curr.CANTIDAD || curr.cantidad || 0) *
        Number(curr.PRECIO || curr.PRECIO_VENTA || curr.PRECIO_UNITARIO || curr.precio || 0);
    return acc + (isNaN(totalItem) ? 0 : totalItem);
  }, 0);

  const totalFinal =
    venta.TOTAL != null
      ? Number(venta.TOTAL)
      : venta.TOTAL_VENTA != null
        ? Number(venta.TOTAL_VENTA)
        : totalCalculado;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Zoom}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : undefined,
            m: isMobile ? 0 : 2,
            borderRadius: isMobile ? 0 : '1.75rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            bgcolor: 'var(--surface, #ffffff)',
            color: 'var(--on-surface, #18181b)',
            border: isMobile ? 'none' : '1px solid var(--border-outline-variant, #e4e4e7)',
          },
        },
      }}
    >
      {/* ── Encabezado Estándar ── */}
      <DialogTitle
        sx={{
          p: 2,
          px: 3,
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">receipt_long</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                GESTIÓN DE REPOSICIONES
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                DETALLE DE PRODUCTOS DE LA VENTA
              </h2>
            </div>
          </div>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'var(--on-surface-variant)',
              bgcolor: 'var(--surface-variant, #f4f4f5)',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </IconButton>
        </div>
      </DialogTitle>

      {/* ── Cuerpo del Modal ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-4">
          {/* Tarjeta de Resumen de Venta */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800/80 pb-2">
              <span className="material-symbols-outlined text-lg">storefront</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                INFORMACIÓN GENERAL DE LA VENTA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 block">
                  Canal / Sucursal
                </span>
                <span className="font-bold text-on-surface uppercase">{sucursalName}</span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 block">
                  Fecha Registro
                </span>
                <span className="font-bold text-on-surface">{fechaDisplay}</span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 block">
                  Responsable Asignado
                </span>
                <span
                  className={`font-black uppercase ${empleadoName === 'Sin Asignar'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                >
                  {empleadoName}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 block">
                  Total Venta
                </span>
                <span className="font-black text-primary text-sm">
                  Bs. {totalFinal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/40 dark:border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  LISTADO DE PRODUCTOS ({productos.length})
                </span>
              </div>
            </div>

            {productos.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                <span className="material-symbols-outlined text-3xl block mb-1 text-zinc-300 dark:text-zinc-600">
                  remove_shopping_cart
                </span>
                <p className="text-xs font-bold uppercase tracking-wider">
                  No se encontraron productos registrados en esta venta
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-zinc-100/70 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                      <td className="w-1 pl-4 pr-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        N°
                      </td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Producto / Detalle
                      </td>
                      <td className="w-24 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                        Cantidad
                      </td>
                      <td className="w-28 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                        P. Unitario
                      </td>
                      <td className="w-28 pr-4 pl-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                        Subtotal
                      </td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                    {productos.map((prod, pIdx) => {
                      const prodName =
                        prod.PRODUCTO_UNICO || `Producto #${pIdx + 1}`;
                      const qty = Number(prod.CANTIDAD ?? prod.cantidad ?? 0);
                      const price = Number(
                        prod.PRECIO ?? prod.PRECIO_VENTA ?? prod.PRECIO_UNITARIO ?? prod.precio ?? 0
                      );
                      const subtotal =
                        prod.TOTAL != null
                          ? Number(prod.TOTAL)
                          : prod.total != null
                            ? Number(prod.total)
                            : qty * price;
                      const unit = prod.UNIDAD_MEDIDA || prod.MEDIDA || 'UND';

                      return (
                        <tr
                          key={pIdx}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="pl-4 pr-2 py-2 font-black text-xs text-primary whitespace-nowrap">
                            {pIdx + 1}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-bold text-on-surface uppercase block">
                              {prodName}
                            </span>
                            {unit && (
                              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                                Unidad: {unit}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black text-xs">
                              {qty}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                            Bs. {price.toFixed(2)}
                          </td>
                          <td className="pr-4 pl-3 py-2 text-right font-black text-on-surface whitespace-nowrap">
                            Bs. {subtotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100/80 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-800 font-headline">
                      <td colSpan={4} className="pl-4 py-2.5 text-right font-black uppercase text-xs tracking-wider text-on-surface">
                        Total General:
                      </td>
                      <td className="pr-4 py-2.5 text-right font-black text-primary text-sm whitespace-nowrap">
                        Bs. {totalFinal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* ── Pie de Modal Estándar ── */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'var(--background, #fafafa)',
          borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
