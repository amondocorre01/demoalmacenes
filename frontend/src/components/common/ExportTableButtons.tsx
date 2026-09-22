import React from 'react';

interface ExportTableButtonsProps {
  onExportExcel: () => void;
  onExportPdf?: () => void;
  disabled?: boolean;
  titleExcel?: string;
  titlePdf?: string;
  showPdf?: boolean;
  className?: string;
}

/**
 * Componente estandarizado de botones de exportación a Excel y PDF
 * para cabeceras de tablas y listados de registros.
 */
export const ExportTableButtons: React.FC<ExportTableButtonsProps> = ({
  onExportExcel,
  onExportPdf,
  disabled = false,
  titleExcel = 'Exportar a Excel (.xls)',
  titlePdf = 'Exportar / Imprimir PDF',
  showPdf = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      {/* Botón Exportar a Excel */}
      <button
        type="button"
        onClick={onExportExcel}
        disabled={disabled}
        title={titleExcel}
        className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/10 hover:bg-emerald-600 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer shrink-0 shadow-sm disabled:opacity-40 disabled:pointer-events-none"
      >
        <span className="material-symbols-outlined text-2xl">grid_on</span>
      </button>

      {/* Botón Exportar a PDF */}
      {showPdf && onExportPdf && (
        <button
          type="button"
          onClick={onExportPdf}
          disabled={disabled}
          title={titlePdf}
          className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/10 hover:bg-rose-600 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer shrink-0 shadow-sm disabled:opacity-40 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
        </button>
      )}
    </div>
  );
};

export default ExportTableButtons;
