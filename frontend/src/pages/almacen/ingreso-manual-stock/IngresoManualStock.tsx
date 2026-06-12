import { Autocomplete, TextField, IconButton, Box as MuiBox, createTheme, ThemeProvider, Tooltip, Zoom } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState, useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button } from '../../../components/common/Button';

const IngresoManualStock: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>({ id: 2, name: 'ESENCIAS' });
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs('2023-11-24'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  const warehouses = [
    { id: 1, name: 'ALMACÉN CENTRAL - CDMX' },
    { id: 2, name: 'ESENCIAS' },
    { id: 3, name: 'PLANTA DE TORREFACTO - VERACRUZ' },
    { id: 4, name: 'BODEGA LOGÍSTICA SUR' }
  ];

  const stats = [
    { label: 'Ingresos de Hoy', value: '12', trend: '+2%', icon: 'login', color: 'bg-emerald-500' },
    { label: 'Volumen Total Ingresado', value: '840.00', trend: 'Estable', icon: 'package_2', color: 'bg-primary' },
  ];

  const history = useMemo(() => [
    { product: 'CARAMELO-RI', detail: 'CARAMELO-RI', qty: 5.00, unit: 'Unidad', expiry: '2025-02-15', user: 'HV', username: 'HELEN V SIÑANI VERA', icon: 'fastfood' },
    { product: 'CANELA-RF', detail: 'CANELA-RF', qty: 5.00, unit: 'Unidad', expiry: '2025-01-27', user: 'HV', username: 'HELEN V SIÑANI VERA', icon: 'eco' },
    { product: 'ACEITE', detail: 'ACEITE DE 20 LT', qty: 2.00, unit: 'Mililitro', expiry: '2025-01-27', user: 'HV', username: 'HELEN V SIÑANI VERA', icon: 'opacity' },
  ], []);

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'product',
        header: 'Insumo / Producto',
        size: 200,
        Cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
              <span className="material-symbols-outlined text-xl">{row.original.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-zinc-900 uppercase leading-none">{row.original.product}</span>
              <span className="text-[8px] font-bold text-zinc-400 mt-1 uppercase truncate max-w-[180px]">{row.original.detail}</span>
            </div>
          </div>
        )
      },
      {
        accessorKey: 'qty',
        header: 'Cant. Ingresada',
        size: 120,
        Cell: ({ cell, row }) => (
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-zinc-900">{cell.getValue<number>().toFixed(2)}</span>
            <span className="text-[8px] font-black text-zinc-400 uppercase bg-zinc-100 px-1.5 py-0.5 rounded">{row.original.unit}</span>
          </div>
        )
      },
      {
        accessorKey: 'expiry',
        header: 'Vencimiento',
        Cell: ({ cell }) => {
          const isExpired = dayjs(cell.getValue<string>()).isBefore(dayjs());
          return (
            <div className="flex flex-col">
              <span className={`text-[10px] font-black tracking-widest ${isExpired ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded' : 'text-zinc-500'}`}>
                {cell.getValue<string>()}
              </span>
            </div>
          );
        }
      },
      {
        accessorKey: 'username',
        header: 'Registrado por',
        Cell: ({ cell, row }) => (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-black text-zinc-500">
              {row.original.user}
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">{cell.getValue<string>()}</span>
          </div>
        )
      }
    ],
    [],
  );

  const tableTheme = useMemo(
    () =>
      createTheme({
        palette: { primary: { main: '#9d0013' }, background: { default: '#fff' } },
        typography: { fontFamily: 'inherit' },
        components: {
          MuiTableCell: {
            styleOverrides: {
              root: { padding: '14px 16px', borderBottom: '1px solid #f4f4f5' },
              head: { backgroundColor: '#fafafa', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#71717a' }
            }
          }
        }
      }),
    [],
  );

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-12">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 -mt-4 px-4">
        <div className="lg:col-span-5">
          <p className="text-3xl font-black text-zinc-900 tracking-tight uppercase leading-none">Ingreso Manual de Stock</p>
          <p className="text-zinc-500 font-medium mt-3 text-sm italic uppercase tracking-wider">Control de inventario local para entradas manuales no programadas.</p>
          
          <div className="flex gap-3 mt-8">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="!rounded-2xl h-12 !px-8 shadow-xl shadow-primary/20"
              icon="add_box"
            >
              Nuevo Ingreso
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between group hover:border-emerald-500/20 transition-all cursor-default">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.color} text-white flex items-center justify-center shadow-lg shadow-black/5`}>
                  <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                </div>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.trend}</span>
              </div>
              <div>
                <p className="text-2xl font-black text-zinc-900 leading-none">{stat.value}</p>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4">
        <div className="bg-white p-4 rounded-[1.5rem] border border-zinc-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Autocomplete
              value={selectedWarehouse}
              onChange={(_, nv) => setSelectedWarehouse(nv)}
              options={warehouses}
              getOptionLabel={(o: any) => o.name}
              renderInput={(params) => (
                <TextField {...params} placeholder="Filtrar por Almacén..." variant="standard" InputProps={{ ...params.InputProps, disableUnderline: true }}
                  sx={{ bgcolor: 'zinc.50', px: 3, py: 1, borderRadius: '16px', '& .MuiInputBase-input': { fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' } }}
                />
              )}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex gap-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
              <DatePicker value={startDate} onChange={setStartDate} slotProps={{ textField: { size: 'small', variant: 'standard', InputProps: { disableUnderline: true }, sx: { width: '130px', px: 2, '& .MuiInputBase-input': { fontSize: '11px', fontWeight: '900' } } } }} />
              <div className="w-px h-6 bg-zinc-200 self-center"></div>
              <DatePicker value={endDate} onChange={setEndDate} slotProps={{ textField: { size: 'small', variant: 'standard', InputProps: { disableUnderline: true }, sx: { width: '130px', px: 2, '& .MuiInputBase-input': { fontSize: '11px', fontWeight: '900' } } } }} />
            </div>
            <button className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg">
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="px-4">
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-2">
            <ThemeProvider theme={tableTheme}>
              <MRTTableContainer history={history} columns={columns} />
            </ThemeProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

const MRTTableContainer: React.FC<{ history: any[], columns: any[] }> = ({ history, columns }) => {
  const table = useMaterialReactTable({
    columns,
    data: history,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: true,
    enableSorting: true,
    enableTopToolbar: false,
    muiTablePaperProps: { elevation: 0, sx: { borderRadius: '24px' } },
    initialState: { density: 'compact', pagination: { pageSize: 10, pageIndex: 0 } }
  });
  return <MaterialReactTable table={table} />;
};

export default IngresoManualStock;
