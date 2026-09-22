import dayjs from 'dayjs';
import { showAlert } from '../config/alerts';

export interface TableColumnConfig {
  header: string;
  key?: string;
  width?: number; // ancho en puntos para Excel (ej: 120)
  align?: 'left' | 'center' | 'right';
  type?: 'string' | 'number' | 'currency' | 'date';
}

export interface ExportTableOptions {
  title: string;
  subtitle?: string;
  filename?: string;
  sheetName?: string;
  columns: TableColumnConfig[];
  data?: (string | number | boolean | null | undefined)[][];
  rows?: Record<string, any>[];
  totals?: (string | number | null | undefined)[];
  orientation?: 'landscape' | 'portrait';
}

/**
 * Normaliza los datos de entrada a una matriz bidimensional
 * Permite tanto el formato 2D ('data') como el formato de objetos con llaves ('rows')
 */
const extractDataMatrix = (
  columns: TableColumnConfig[],
  data?: (string | number | boolean | null | undefined)[][],
  rows?: Record<string, any>[]
): (string | number | boolean | null | undefined)[][] => {
  if (Array.isArray(data) && data.length > 0) {
    if (Array.isArray(data[0])) {
      return data;
    }
    return (data as any[]).map((rowObj) =>
      columns.map((col) => {
        const key = col.key || col.header;
        const val = rowObj[key];
        return val !== undefined ? val : '';
      })
    );
  }

  if (Array.isArray(rows) && rows.length > 0) {
    return rows.map((rowObj) =>
      columns.map((col) => {
        const key = col.key || col.header;
        const val = rowObj[key];
        return val !== undefined ? val : '';
      })
    );
  }

  return [];
};

/**
 * Limpia y escapa caracteres especiales para XML
 */
const escapeXml = (unsafe: string | number | null | undefined): string => {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * 1. Exporta a Excel con diseño corporativo Capresso usando XML Spreadsheet 2003 (.xls)
 */
export const exportTableToExcel = ({
  title,
  subtitle,
  filename,
  sheetName,
  columns,
  data,
  rows,
  totals,
}: ExportTableOptions) => {
  const finalData = extractDataMatrix(columns, data, rows);

  if (!finalData || finalData.length === 0) {
    showAlert.warning('Advertencia', 'No hay datos disponibles para exportar.');
    return;
  }

  const dateNow = dayjs().format('DD/MM/YYYY HH:mm');
  const dateFile = dayjs().format('YYYY-MM-DD_HHmm');
  const actualFilename = filename || `${title.toLowerCase().replace(/\s+/g, '_')}_${dateFile}`;
  const totalColumns = columns.length;
  const actualSheetName = (sheetName || 'Reporte').slice(0, 30);

  // Generación de Columnas XML
  const columnsXml = columns
    .map((col) => `<Column ss:Width="${col.width ? col.width * 7 : 110}"/>`)
    .join('\n   ');

  // Cabeceras de Columna
  const headersXml = columns
    .map((col) => {
      const align = col.align === 'left' ? 'HeaderLeft' : col.align === 'right' ? 'HeaderRight' : 'HeaderCenter';
      return `<Cell ss:StyleID="${align}"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`;
    })
    .join('\n    ');

  // Filas de Datos
  const rowsXml = finalData
    .map((row) => {
      const cells = row
        .map((val, cIdx) => {
          const colConfig = columns[cIdx] || { align: 'left', type: 'string' };
          const align = colConfig.align || 'left';
          const isNum = typeof val === 'number' || (colConfig.type === 'number' || colConfig.type === 'currency');
          const cleanNum = Number(val);
          const isNumericValid = !isNaN(cleanNum) && typeof val !== 'boolean' && val !== '' && val != null;

          let styleId = 'DataCellLeft';
          if (colConfig.type === 'currency' && isNumericValid) {
            styleId = 'DataCellCurrency';
          } else if (isNumericValid && isNum) {
            styleId = align === 'right' ? 'DataCellNumberRight' : 'DataCellNumberCenter';
          } else if (align === 'center') {
            styleId = 'DataCellCenter';
          } else if (align === 'right') {
            styleId = 'DataCellRight';
          }

          if (isNumericValid && (isNum || colConfig.type === 'currency')) {
            return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${cleanNum}</Data></Cell>`;
          }

          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
        })
        .join('');

      return `\n    <Row ss:Height="20">${cells}\n    </Row>`;
    })
    .join('');

  // Fila de Totales si existe
  let totalsXml = '';
  if (totals && totals.length > 0) {
    const totalCells = totals
      .map((val, cIdx) => {
        const colConfig = columns[cIdx] || {};
        const isNum = typeof val === 'number' || (colConfig.type === 'number' || colConfig.type === 'currency');
        const cleanNum = Number(val);
        const isNumericValid = !isNaN(cleanNum) && typeof val !== 'boolean' && val !== '' && val != null;

        if (cIdx === 0 && (val == null || val === '')) {
          return `<Cell ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL</Data></Cell>`;
        }

        if (isNumericValid && (isNum || colConfig.type === 'currency')) {
          const style = colConfig.type === 'currency' ? 'TotalCurrency' : 'TotalNumber';
          return `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${cleanNum}</Data></Cell>`;
        }

        return `<Cell ss:StyleID="TotalLabel"><Data ss:Type="String">${escapeXml(val || '')}</Data></Cell>`;
      })
      .join('');

    totalsXml = `\n    <Row ss:Height="24">${totalCells}\n    </Row>`;
  }

  const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Capresso Sistema</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#18181B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Título Principal Rojo Capresso -->
  <Style ss:ID="TitleStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="13" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9D0013" ss:Pattern="Solid"/>
  </Style>
  <!-- Subtítulo / Metadatos -->
  <Style ss:ID="SubtitleStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4D4D8"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#52525B" ss:Bold="1"/>
   <Interior ss:Color="#F4F4F5" ss:Pattern="Solid"/>
  </Style>
  <!-- Cabeceras Oscuras -->
  <Style ss:ID="HeaderCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#18181B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#18181B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:Indent="1" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#18181B" ss:Pattern="Solid"/>
  </Style>
  <!-- Celdas de Datos -->
  <Style ss:ID="DataCellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#18181B"/>
  </Style>
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#18181B"/>
  </Style>
  <Style ss:ID="DataCellRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#18181B"/>
  </Style>
  <Style ss:ID="DataCellNumberRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#18181B"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="DataCellNumberCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#18181B"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="DataCellCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#9D0013" ss:Bold="1"/>
   <NumberFormat ss:Format="&quot;Bs. &quot;#,##0.00"/>
  </Style>
  <!-- Totales -->
  <Style ss:ID="TotalLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#18181B" ss:Bold="1"/>
   <Interior ss:Color="#F4F4F5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#18181B" ss:Bold="1"/>
   <Interior ss:Color="#F4F4F5" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="TotalCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9D0013" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;Bs. &quot;#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(actualSheetName)}">
  <Table ss:DefaultRowHeight="18">
   ${columnsXml}

   <!-- Título Principal -->
   <Row ss:Height="28">
    <Cell ss:MergeAcross="${totalColumns - 1}" ss:StyleID="TitleStyle">
     <Data ss:Type="String">${escapeXml(title)} - CAPRESSO</Data>
    </Cell>
   </Row>

   <!-- Subtítulo / Metadatos -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="${totalColumns - 1}" ss:StyleID="SubtitleStyle">
     <Data ss:Type="String">${escapeXml(subtitle || `GENERADO: ${dateNow}`)}   |   TOTAL REGISTROS: ${finalData.length}</Data>
    </Cell>
   </Row>

   <!-- Cabeceras de Columna -->
   <Row ss:Height="24">
    ${headersXml}
   </Row>

   <!-- Filas de Datos -->
   ${rowsXml}

   <!-- Fila de Totales -->
   ${totalsXml}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitPane>
    <SplitPaneNumber>2</SplitPaneNumber>
    <SplitPaneState>1</SplitPaneState>
   </SplitPane>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob(['\uFEFF' + excelXml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${actualFilename}.xls`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url);
  }, 1500);

  showAlert.toast('Archivo Excel exportado con éxito');
};

/**
 * 2. Genera una vista de impresión PDF limpia, elegante y amigable
 */
export const exportTableToPdf = ({
  title,
  subtitle,
  columns,
  data,
  rows,
  totals,
  orientation = 'landscape',
}: ExportTableOptions) => {
  const finalData = extractDataMatrix(columns, data, rows);

  if (!finalData || finalData.length === 0) {
    showAlert.warning('Advertencia', 'No hay datos disponibles para exportar.');
    return;
  }

  const dateNow = dayjs().format('DD/MM/YYYY HH:mm');

  // Cabeceras HTML
  const theadHtml = columns
    .map(
      (col) =>
        `<th style="text-align: ${col.align || 'left'};">${escapeXml(col.header)}</th>`
    )
    .join('');

  // Filas HTML
  const tbodyHtml = finalData
    .map((row, rIdx) => {
      const isEven = rIdx % 2 === 0;
      const bg = isEven ? '#ffffff' : '#fafafa';
      const cells = row
        .map((val, cIdx) => {
          const colConfig = columns[cIdx] || { align: 'left' };
          const align = colConfig.align || 'left';
          const isCurrency = colConfig.type === 'currency';
          const formattedVal =
            isCurrency && typeof val === 'number'
              ? `Bs. ${val.toFixed(2)}`
              : escapeXml(val);

          const style = `text-align: ${align}; ${
            isCurrency ? 'font-weight: 700; color: #9d0013;' : ''
          }`;
          return `<td style="${style}">${formattedVal}</td>`;
        })
        .join('');

      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join('');

  // Totales HTML
  let tfootHtml = '';
  if (totals && totals.length > 0) {
    const totalCells = totals
      .map((val, cIdx) => {
        const colConfig = columns[cIdx] || { align: 'left' };
        const align = colConfig.align || 'left';
        const isCurrency = colConfig.type === 'currency';
        const formattedVal =
          isCurrency && typeof val === 'number'
            ? `Bs. ${val.toFixed(2)}`
            : val == null || val === ''
            ? cIdx === 0
              ? 'TOTAL'
              : ''
            : escapeXml(val);

        return `<th style="text-align: ${align}; font-weight: 800; ${
          isCurrency ? 'color: #9d0013;' : ''
        }">${formattedVal}</th>`;
      })
      .join('');

    tfootHtml = `<tfoot><tr style="background-color: #f4f4f5; border-top: 2px solid #18181b;">${totalCells}</tr></tfoot>`;
  }

  const printHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(title)}</title>
  <style>
    @page {
      size: A4 ${orientation};
      margin: 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #18181b;
      margin: 0;
      padding: 0;
      font-size: 10px;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #9d0013;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 900;
      color: #9d0013;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .page-title {
      font-size: 12px;
      font-weight: 800;
      color: #18181b;
      text-transform: uppercase;
      margin: 2px 0 0 0;
    }
    .meta-info {
      font-size: 8px;
      color: #71717a;
      text-align: right;
      font-weight: 600;
      text-transform: uppercase;
    }
    .subtitle-badge {
      font-size: 9px;
      background-color: #f4f4f5;
      padding: 4px 8px;
      border-radius: 6px;
      margin-bottom: 10px;
      font-weight: 700;
      color: #3f3f46;
      border-left: 3px solid #9d0013;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    th {
      background-color: #18181b;
      color: #ffffff;
      padding: 6px 8px;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #27272a;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #e4e4e7;
      font-size: 9px;
    }
    .footer {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #a1a1aa;
      border-top: 1px solid #e4e4e7;
      padding-top: 6px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div>
      <h1 class="brand-title">CAPRESSO CAFÉ</h1>
      <h2 class="page-title">${escapeXml(title)}</h2>
    </div>
    <div class="meta-info">
      <div>Fecha de Emisión: <strong>${dateNow}</strong></div>
      <div>Total Registros: <strong>${finalData.length}</strong></div>
    </div>
  </div>

  ${
    subtitle
      ? `<div class="subtitle-badge">${escapeXml(subtitle)}</div>`
      : ''
  }

  <table>
    <thead>
      <tr>${theadHtml}</tr>
    </thead>
    <tbody>
      ${tbodyHtml}
    </tbody>
    ${tfootHtml}
  </table>

  <div class="footer">
    <span>Sistema de Gestión de Almacenes - Capresso</span>
    <span>Página 1</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  } else {
    showAlert.error(
      'Ventana Bloqueada',
      'Por favor permita las ventanas emergentes para generar la vista previa del PDF.'
    );
  }
};
