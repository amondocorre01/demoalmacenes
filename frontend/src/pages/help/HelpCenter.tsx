import React, { useState } from 'react';
import { 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Typography, 
  TextField, 
  InputAdornment, 
  Box,
  Card
} from '@mui/material';
import { 
  Search as SearchIcon, 
  ExpandMore as ExpandMoreIcon,
  Inventory as InventoryIcon,
  SwapHoriz as TransferIcon,
  FactCheck as RequestIcon,
  Settings as ConfigIcon,
  SupportAgent as SupportIcon
} from '@mui/icons-material';

interface HelpItem {
  question: string;
  answer: string;
  category: string;
}

const helpData: HelpItem[] = [
  {
    category: 'Inventario',
    question: '¿Cómo realizo una declaración de inventario?',
    answer: 'Diríjase al módulo de "Almacén > Control e Inventario > Declaración". Allí podrá ingresar las cantidades físicas contadas en su almacén. El sistema comparará automáticamente estos datos con el stock teórico para detectar desviaciones.'
  },
  {
    category: 'Transferencias',
    question: '¿Cuál es la diferencia entre transferencia de Almacén e Insumos?',
    answer: 'La transferencia de Almacén se utiliza para productos terminados o bases de producción, mientras que la de Insumos está destinada específicamente a materia prima directa. Ambas controlan que no se transfiera más del stock disponible.'
  },
  {
    category: 'Pedidos',
    question: '¿Cómo apruebo una solicitud de sucursal?',
    answer: 'En el módulo de "Pedidos Consolidados", podrá visualizar todas las solicitudes pendientes. Una vez revisadas, puede utilizar el botón de "Aceptación por Sucursal" para validar que el stock esté listo para despacho.'
  },
  {
    category: 'Configuración',
    question: '¿Cómo agrego un nuevo producto al catálogo?',
    answer: 'Vaya a "Configuración > Maestros > Registro de Producto". Asegúrese de definir correctamente la unidad de medida y el grupo al que pertenece para que el sistema pueda rastrear su stock adecuadamente.'
  },
  {
    category: 'Soporte',
    question: '¿Qué hacer si encuentro una inconsistencia en el stock?',
    answer: 'Primero, verifique si hay transferencias o ingresos manuales pendientes de procesar. Si la inconsistencia persiste, realice una "Verificación de Inventario" para ajustar los niveles de stock con la aprobación del supervisor.'
  }
];

const HelpCenter: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredHelp = helpData.filter(item => 
    item.question.toLowerCase().includes(search.toLowerCase()) ||
    item.answer.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [
    { name: 'Inventario', icon: <InventoryIcon />, color: 'bg-blue-500' },
    { name: 'Transferencias', icon: <TransferIcon />, color: 'bg-emerald-500' },
    { name: 'Pedidos', icon: <RequestIcon />, color: 'bg-amber-500' },
    { name: 'Configuración', icon: <ConfigIcon />, color: 'bg-indigo-500' },
    { name: 'Soporte', icon: <SupportIcon />, color: 'bg-rose-500' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50/50 animate-in fade-in duration-500 px-6 py-10 md:px-12 md:py-16">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto w-full text-center mb-16">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Centro de Asistencia</p>
        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tighter uppercase mb-8">
          ¿En qué podemos <span className="text-primary">ayudarte?</span>
        </h1>
        
        <div className="relative max-w-2xl mx-auto">
          <TextField
            fullWidth
            placeholder="Busca por palabra clave, módulo o duda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'zinc.400' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '2rem',
                  bgcolor: 'white',
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
                  '& fieldset': { border: 'none' },
                  px: 2
                }
              }
            }}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar pr-2">
        {/* Category Grid */}
        {!search && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
            {categories.map((cat) => (
              <button 
                key={cat.name}
                onClick={() => setSearch(cat.name)}
                className="group flex flex-col items-center p-6 bg-white rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200 transition-all active:scale-[0.98]"
              >
                <div className={`w-12 h-12 ${cat.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* FAQ Section */}
        <div className="space-y-4">
          <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Preguntas Frecuentes</p>
          
          {filteredHelp.length > 0 ? (
            filteredHelp.map((item, index) => (
              <Accordion 
                key={index}
                sx={{ 
                  borderRadius: '1.5rem !important', 
                  border: '1px solid #f4f4f5',
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  mb: 2,
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                  sx={{ p: 3 }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black bg-zinc-100 text-zinc-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {item.category}
                    </span>
                    <Typography className="font-bold text-zinc-900 uppercase text-xs tracking-tight">
                      {item.question}
                    </Typography>
                  </div>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 4, pb: 4, pt: 0 }}>
                  <Typography className="text-zinc-500 text-sm leading-relaxed border-l-4 border-primary/20 pl-4 py-2">
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <span className="material-symbols-outlined text-6xl mb-4 text-zinc-200">sentiment_dissatisfied</span>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">No encontramos resultados para tu búsqueda</p>
            </div>
          )}
        </div>

        {/* Support Footer */}
        <Card sx={{ mt: 10, p: 4, borderRadius: '2.5rem', bgcolor: 'zinc.900', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div>
              <p className="text-2xl font-black tracking-tighter uppercase mb-2">¿Aún tienes dudas?</p>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Nuestro equipo de soporte técnico está disponible para ayudarte.</p>
            </div>
            <button className="bg-primary hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95 flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">chat</span>
              Contactar Soporte
            </button>
          </div>
          {/* Abstract Bg decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;
