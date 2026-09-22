import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { showAlert } from '../../../../config/alerts';

interface ExportExcelParams {
  consolidados: any[];
  cabecera: string[];
  getBranchLabel: (col: string) => string;
  selectedDate: Dayjs | null;
  selectedTurno: string;
}

/**
 * Exporta los datos consolidados con el diseño visual corporativo de Capresso
 * utilizando formato XML Spreadsheet 2003 (.xls) con estilos completos.
 */
export const exportExcelConsolidado = ({
  consolidados,
  cabecera,
  getBranchLabel,
  selectedDate,
  selectedTurno,
}: ExportExcelParams) => {
  if (!consolidados || consolidados.length === 0) {
    showAlert.warning('Advertencia', 'No hay datos disponibles para exportar.');
    return;
  }

  const fechaStr = selectedDate ? selectedDate.format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY');
  const fechaFile = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
  const totalColumns = cabecera.length + 4; // Producto, Turno, ...Sucursales, Total, Stock

  // Totales acumulados
  const totalsPerBranch: Record<string, number> = {};
  cabecera.forEach((c) => {
    totalsPerBranch[c] = 0;
  });
  let grandTotal = 0;
  let totalStock = 0;

  // Generación de filas de datos
  const dataRowsXml = consolidados
    .map((row) => {
      let rowSum = 0;
      const branchCells = cabecera
        .map((col) => {
          const cell = row[col];
          const mostrarEnviada =
            cell &&
            (cell.estado !== 11 ||
              cell.cantidad_enviada > 0 ||
              cell.cantidad_enviada !== cell.cantidad_solicitada);
          const val = cell ? (mostrarEnviada ? cell.cantidad_enviada : cell.cantidad_solicitada) : 0;
          const numVal = isNaN(Number(val)) ? 0 : Number(val);

          rowSum += numVal;
          totalsPerBranch[col] = (totalsPerBranch[col] || 0) + numVal;

          return `<Cell ss:StyleID="DataCellNumber"><Data ss:Type="Number">${numVal}</Data></Cell>`;
        })
        .join('');

      grandTotal += rowSum;
      const stockVal = isNaN(Number(row.Stock)) ? 0 : Number(row.Stock);
      totalStock += stockVal;

      const productName = (row.Producto || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const turnoName = (row.Turno || 'PERECEDERO').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      return `
      <Row ss:Height="22">
        <Cell ss:StyleID="DataCellProduct"><Data ss:Type="String">${productName}</Data></Cell>
        <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${turnoName}</Data></Cell>
        ${branchCells}
        <Cell ss:StyleID="TotalCell"><Data ss:Type="Number">${rowSum}</Data></Cell>
        <Cell ss:StyleID="StockCell"><Data ss:Type="Number">${stockVal}</Data></Cell>
      </Row>`;
    })
    .join('');

  // Celdas de totales por sucursal
  const branchTotalsCells = cabecera
    .map(
      (col) =>
        `<Cell ss:StyleID="SummaryTotalNumber"><Data ss:Type="Number">${totalsPerBranch[col] || 0}</Data></Cell>`
    )
    .join('');

  // Estructura XML Spreadsheet 2003 compatible con Microsoft Excel
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
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#18181B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Estilo Título Principal Capresso -->
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
  <!-- Estilo Subtítulo / Metadatos -->
  <Style ss:ID="SubtitleStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4D4D8"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#4B5563" ss:Bold="1"/>
   <Interior ss:Color="#F4F4F5" ss:Pattern="Solid"/>
  </Style>
  <!-- Estilo Cabeceras de Columna Oscuras -->
  <Style ss:ID="HeaderStyle">
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
  <Style ss:ID="HeaderProductStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3F3F46"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#18181B" ss:Pattern="Solid"/>
  </Style>
  <!-- Estilos de Celdas de Datos -->
  <Style ss:ID="DataCellProduct">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#18181B" ss:Bold="1"/>
  </Style>
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#71717A"/>
  </Style>
  <Style ss:ID="DataCellNumber">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#18181B"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="TotalCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#9D0013" ss:Bold="1"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="StockCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E4E7"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#047857" ss:Bold="1"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <!-- Estilos de Resumen / Total General -->
  <Style ss:ID="SummaryTotalLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#18181B" ss:Bold="1"/>
   <Interior ss:Color="#F4F4F5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SummaryTotalNumber">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#18181B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#18181B" ss:Bold="1"/>
   <Interior ss:Color="#F4F4F5" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="SummaryGrandTotal">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#7F000F"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9D0013" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="SummaryStockTotal">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#065F46"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#065F46"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#065F46"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#065F46"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Consolidado">
  <Table ss:DefaultRowHeight="20">
   <!-- Configuración de Anchos de Columna -->
   <Column ss:Width="220"/>
   <Column ss:Width="100"/>
   ${cabecera.map(() => '<Column ss:Width="95"/>').join('\n   ')}
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>

   <!-- Fila 1: Título Principal Rojo Capresso -->
   <Row ss:Height="30">
    <Cell ss:MergeAcross="${totalColumns - 1}" ss:StyleID="TitleStyle">
     <Data ss:Type="String">CONSOLIDADO DE PEDIDOS DE SUCURSALES - CAPRESSO</Data>
    </Cell>
   </Row>

   <!-- Fila 2: Subtítulo con Metadatos -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="${totalColumns - 1}" ss:StyleID="SubtitleStyle">
     <Data ss:Type="String">FECHA DE PEDIDO: ${fechaStr}   |   TURNO: ${selectedTurno}   |   TOTAL PRODUCTOS: ${consolidados.length}</Data>
    </Cell>
   </Row>

   <!-- Fila 3: Cabeceras de Columnas Oscuras -->
   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderProductStyle"><Data ss:Type="String">PRODUCTO / INSUMO</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">TURNO</Data></Cell>
    ${cabecera
      .map(
        (col) =>
          `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${getBranchLabel(col).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</Data></Cell>`
      )
      .join('\n    ')}
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">TOTAL</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">STOCK</Data></Cell>
   </Row>

   <!-- Filas de Datos -->
   ${dataRowsXml}

   <!-- Fila 4: Resumen / Total General -->
   <Row ss:Height="24">
    <Cell ss:StyleID="SummaryTotalLabel"><Data ss:Type="String">TOTAL GENERAL</Data></Cell>
    <Cell ss:StyleID="SummaryTotalNumber"><Data ss:Type="String">-</Data></Cell>
    ${branchTotalsCells}
    <Cell ss:StyleID="SummaryGrandTotal"><Data ss:Type="Number">${grandTotal}</Data></Cell>
    <Cell ss:StyleID="SummaryStockTotal"><Data ss:Type="Number">${totalStock}</Data></Cell>
   </Row>
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

  // Generar y descargar el archivo .xls
  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Consolidado_Pedidos_${fechaFile}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showAlert.toast('Archivo Excel exportado con éxito');
};

export default exportExcelConsolidado;

