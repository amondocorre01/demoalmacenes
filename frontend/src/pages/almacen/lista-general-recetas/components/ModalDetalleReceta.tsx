/**
 * ModalDetalleReceta.tsx
 * 
 * Modal para visualizar la Ficha Técnica completa y detallada de una receta intermedia,
 * mostrando métricas de producción (duración, merma, rendimiento estándar y de adecuación),
 * notas operativas y la lista completa de insumos y materias primas hasta el último nivel.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';

export interface ProductoRecetaItem {
  ID_RECETA_INTERMEDIO: number;
  ID_PRODUCTO_INTERMEDIO: number;
  ID_PRODUCTO: number;
  CANTIDAD: number;
  ESTADO: number | boolean;
  ID_PRODUCTO_INTERMEDIO_ANTECESOR?: number;
  ID_UNIDAD_MEDIDA?: number;
  NUM_RECETA?: number;
  ID_PLANTA_RI_PI?: number;
  UNIDAD_MEDIDA?: string;
  PRODUCTO: string;
}

export interface RecetaCompletaItem {
  ID_PRODUCTO_INTERMEDIO: number;
  NOMBRE: string;
  ESTADO?: boolean | number;
  DURACION?: number;
  PORCENTAJE_DESPERDICIO?: number;
  PROD_PRIMARIO?: boolean | number;
  NOTA?: string;
  ESTADO_PRODUCCION?: boolean | number;
  REQUIERE_LOTEO?: boolean | number | null;
  CANTIDAD_ESTANDAR?: number;
  ID_UNIDAD_MEDIDA_ESTANDAR?: number;
  CANTIDAD_ADECUACION?: number;
  ID_UNIDAD_MEDIDA_ADECUACION?: number;
  ID_PLANTA_RI_PI?: number;
  NUM_RECETA?: number;
  UNIDAD_MEDIDA_E?: string;
  UNIDAD_MEDIDA_A?: string;
  PRODUCTOS_RECETA?: ProductoRecetaItem[];
}

interface ModalDetalleRecetaProps {
  open: boolean;
  onClose: () => void;
  receta: RecetaCompletaItem | null;
  almacenNombre?: string;
}

export const ModalDetalleReceta: React.FC<ModalDetalleRecetaProps> = ({
  open,
  onClose,
  receta,
  almacenNombre,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!receta) return null;

  const productosReceta = Array.isArray(receta.PRODUCTOS_RECETA) ? receta.PRODUCTOS_RECETA : [];
  const activeIngredientes = productosReceta.filter((p) => p.ESTADO === 1 || p.ESTADO === true);

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
              <span className="material-symbols-outlined text-xl">menu_book</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                FICHA TÉCNICA DE RECETA {receta.NUM_RECETA ? `— VERSIÓN #${receta.NUM_RECETA}` : ''}
              </p>
              <h2 className="text-base sm:text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline truncate max-w-[280px] sm:max-w-[450px]">
                {receta.NOMBRE}
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

      {/* ── Cuerpo de Información ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-4 font-body">
          {/* 1. Tarjeta de Métricas Clave de la Receta */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">tune</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  PARÁMETROS DE PRODUCCIÓN & RENDIMIENTO
                </span>
              </div>
              {almacenNombre && (
                <span className="text-[9px] font-bold text-zinc-500 uppercase">
                  Almacén: <strong className="text-on-surface">{almacenNombre}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Duración */}
              <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Duración
                </p>
                <p className="text-xs font-black text-on-surface mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                  {receta.DURACION ?? 0} min
                </p>
              </div>

              {/* Merma / Desperdicio */}
              <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Desperdicio / Merma
                </p>
                <p className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_down</span>
                  {receta.PORCENTAJE_DESPERDICIO ?? 0}%
                </p>
              </div>

              {/* Rendimiento Estándar */}
              <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Cant. Estándar
                </p>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">scale</span>
                  {receta.CANTIDAD_ESTANDAR ?? 0} {receta.UNIDAD_MEDIDA_E || ''}
                </p>
              </div>

              {/* Cantidad Adecuación */}
              <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Cant. Adecuación
                </p>
                <p className="text-xs font-black text-primary mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">straighten</span>
                  {receta.CANTIDAD_ADECUACION ?? 0} {receta.UNIDAD_MEDIDA_A || ''}
                </p>
              </div>
            </div>

            {/* Badges de clasificación */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                  receta.PROD_PRIMARIO
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                }`}
              >
                {receta.PROD_PRIMARIO ? '⭐ Producto Primario' : 'Intermedio Secundario'}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                  receta.ESTADO
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                {receta.ESTADO ? 'Activo en Almacén' : 'Inactivo'}
              </span>

              {receta.REQUIERE_LOTEO !== null && receta.REQUIERE_LOTEO !== undefined && (
                <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  {receta.REQUIERE_LOTEO ? 'Requiere Loteo' : 'Sin Loteo'}
                </span>
              )}
            </div>

            {/* Nota operativa */}
            {receta.NOTA && (
              <div className="p-2.5 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/20">
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
                  Nota / Instrucciones de Elaboración:
                </p>
                <p className="text-xs text-on-surface font-medium">{receta.NOTA}</p>
              </div>
            )}
          </div>

          {/* 2. Tabla de Insumos y Materias Primas */}
          <div className="bg-surface dark:bg-zinc-900 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-850/50 border-b border-outline-variant/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                <span className="text-[10px] font-black uppercase tracking-wider font-headline">
                  COMPOSICIÓN DE INGREDIENTES & INSUMOS ({productosReceta.length})
                </span>
              </div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase">
                Activos: <strong className="text-primary">{activeIngredientes.length}</strong> de {productosReceta.length}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50/70 dark:bg-zinc-850/70 border-b border-outline-variant/40 sticky top-0 z-10 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    <th className="pl-4 pr-2 py-2 whitespace-nowrap">N°</th>
                    <th className="px-3 py-2">Insumo / Materia Prima</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Cantidad</th>
                    <th className="px-3 py-2 whitespace-nowrap">Unidad</th>
                    <th className="px-3 py-2 text-center whitespace-nowrap">Tipo</th>
                    <th className="pr-4 pl-2 py-2 text-center whitespace-nowrap">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {productosReceta.length > 0 ? (
                    productosReceta.map((p, idx) => {
                      const isSubReceta = (p.ID_PRODUCTO_INTERMEDIO_ANTECESOR && p.ID_PRODUCTO_INTERMEDIO_ANTECESOR > 0) || Number(p.ID_PRODUCTO) === 0;
                      const isActivo = p.ESTADO === 1 || p.ESTADO === true;

                      return (
                        <tr
                          key={p.ID_RECETA_INTERMEDIO || idx}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="pl-4 pr-2 py-2.5 font-black text-xs text-primary whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-bold text-on-surface uppercase text-xs">
                              {p.PRODUCTO}
                            </p>
                            {isSubReceta && (
                              <p className="text-[9px] font-bold text-primary flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[11px]">schema</span>
                                Sub-receta Intermedia
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-black text-xs text-on-surface whitespace-nowrap">
                            {Number(p.CANTIDAD || 0).toLocaleString('es-BO', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 3,
                            })}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-surface-variant text-on-surface-variant border border-outline-variant/60">
                              {p.UNIDAD_MEDIDA || 'Unidad'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                isSubReceta
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                              }`}
                            >
                              {isSubReceta ? 'Intermedio' : 'Materia Prima'}
                            </span>
                          </td>
                          <td className="pr-4 pl-2 py-2.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                isActivo
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-zinc-500/10 text-zinc-500'
                              }`}
                            >
                              {isActivo ? 'Incluido' : 'Opcional'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest"
                      >
                        Sin ingredientes registrados en esta receta
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
          Cerrar Ficha
        </Button>
      </DialogActions>
    </Dialog>
  );
};
