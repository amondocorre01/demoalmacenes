import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Autocomplete,
  TextField
} from '@mui/material';

export const Dashboard: React.FC = () => {
  const weeklyStats = [
    { day: 'LUN', actual: 45, objective: 60 },
    { day: 'MAR', actual: 30, objective: 45 },
    { day: 'MIÉ', actual: 75, objective: 85 },
    { day: 'JUE', actual: 40, objective: 55 },
    { day: 'VIE', actual: 80, objective: 90 },
  ];

  const criticalIngredients = [
    {
      name: 'Aceite Vegetal',
      percentage: 25,
      req: '120 L',
      stock: '30 L',
      status: 'URGENTE',
      color: '#0ea5e9',
      icon: 'water_drop'
    },
    {
      name: 'Harina de Trigo (Extra)',
      percentage: 2,
      req: '500 KG',
      stock: '10 KG',
      status: 'CRITICO',
      color: '#ef4444',
      icon: 'bakery_dining',
      alert: 'Riesgo de parada de línea'
    },
    {
      name: 'Azúcar Granulada',
      percentage: 100,
      req: '100 KG',
      stock: '100 KG',
      status: 'OPTIMO',
      color: '#10b981',
      icon: 'restaurant_menu',
      info: 'Insumo garantizado'
    },
  ];

  return (
    <Box
      sx={{
        maxWidth: 'auto',
        mx: 'auto',
        p: { xs: 1, md: 1 },
        minHeight: { lg: 'calc(100vh - 128px)' },
        display: { lg: 'flex' },
        flexDirection: { lg: 'column' },
      }}
    >
      {/* Top Alert Banner */}
      <Box
        sx={{
          bgcolor: '#b91c1c',
          borderRadius: '1rem',
          p: { xs: 1, lg: 1.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white',
          mb: { xs: 1.5, lg: 2 },
          boxShadow: '0 6px 20px -10px rgba(185, 28, 28, 0.3)',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, lg: 1.5 } }}>
          <Box sx={{
            width: { xs: 32, lg: 36 },
            height: { xs: 32, lg: 36 },
            borderRadius: '8px',
            bgcolor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined text-white text-base lg:text-lg">report</span>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', tracking: '0.05em', fontSize: { xs: '0.65rem', lg: '0.75rem' } }}>Verificación de Inventario</Typography>
            <Typography sx={{ fontSize: '8px', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', tracking: '0.1em' }}>Última sincronización: hace 30 días</Typography>
          </Box>
        </Box>
        <button className="bg-white text-[#b91c1c] px-3 lg:px-4 py-1 lg:py-1.5 rounded-md font-black text-[8px] uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs">visibility</span>
          <span className="hidden sm:inline">Ir a verificar</span>
        </button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 420px' },
          gap: { xs: 1.5, lg: 2 },
          flex: 1,
        }}
      >

        {/* Main Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Alerts Section */}
          <Box sx={{ mb: { xs: 2, lg: 3 }, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontSize: { xs: '16px', lg: '18px' }, fontWeight: 900, color: 'zinc.900', textTransform: 'uppercase', tracking: '-0.02em', lineHeight: 1 }}>Alertas por Almacén</Typography>
                <Typography sx={{ fontSize: '8px', fontWeight: 700, color: 'zinc.400', textTransform: 'uppercase', tracking: '0.1em', mt: 0.2 }}>Control de Stock y Abastecimiento</Typography>
              </Box>
              <IconButton size="small" sx={{ bgcolor: 'zinc.100', borderRadius: '6px', p: 0.5 }}>
                <span className="material-symbols-outlined text-zinc-500 text-xs">filter_list</span>
              </IconButton>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {/* Card 1 */}
              <Box sx={{ bgcolor: 'white', borderRadius: '1.25rem', p: { xs: 1.5, lg: 2 }, borderLeft: '4px solid #ef4444', position: 'relative', boxShadow: '0 2px 10px -5px rgba(0,0,0,0.05)' }}>
                <Typography sx={{ fontSize: '7px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', mb: 0.2 }}>Expirado</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                  <Typography sx={{ fontSize: { xs: '12px', lg: '14px' }, fontWeight: 900, color: 'zinc.900', textTransform: 'uppercase', tracking: '-0.02em', flex: 1, mr: 1, lineHeight: 1.1 }}>Torta de Chocolate</Typography>
                  <Typography sx={{ fontSize: { xs: '16px', lg: '18px' }, fontWeight: 900, color: 'zinc.900' }}>15<span className="text-[9px] text-zinc-400 ml-0.5">u</span></Typography>
                </Box>
                <Typography sx={{ fontSize: '9px', fontWeight: 600, color: 'zinc.400', mt: 0.2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span className="material-symbols-outlined text-[11px]">inventory_2</span> Almacén de Repostería
                </Typography>
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'zinc.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '7px', fontWeight: 900, color: 'zinc.300', textTransform: 'uppercase' }}>Retiro: <span className="text-zinc-900">15 u</span></Typography>
                  <Typography sx={{ fontSize: '7px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase' }}>BAJO</Typography>
                </Box>
              </Box>

              {/* Card 2 */}
              <Box sx={{ bgcolor: 'white', borderRadius: '1.25rem', p: { xs: 1.5, lg: 2 }, borderLeft: '4px solid #f59e0b', position: 'relative', boxShadow: '0 2px 10px -5px rgba(0,0,0,0.05)' }}>
                <Typography sx={{ fontSize: '7px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', mb: 0.2 }}>Vencimiento</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                  <Typography sx={{ fontSize: { xs: '12px', lg: '14px' }, fontWeight: 900, color: 'zinc.900', textTransform: 'uppercase', tracking: '-0.02em', flex: 1, mr: 1, lineHeight: 1.1 }}>Panini Cubano</Typography>
                  <Typography sx={{ fontSize: { xs: '16px', lg: '18px' }, fontWeight: 900, color: 'zinc.900' }}>240<span className="text-[9px] text-zinc-400 ml-0.5">u</span></Typography>
                </Box>
                <Typography sx={{ fontSize: '9px', fontWeight: 600, color: 'zinc.400', mt: 0.2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span className="material-symbols-outlined text-[11px]">ac_unit</span> Cámara Refrigeración
                </Typography>
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'zinc.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '7px', fontWeight: 900, color: 'zinc.300', textTransform: 'uppercase' }}>Faltan: <span className="text-zinc-900">1 día</span></Typography>
                  <Typography sx={{ fontSize: '7px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase' }}>SALIDA</Typography>
                </Box>
              </Box>

              {/* Card 3 */}
              <Box sx={{ bgcolor: 'white', borderRadius: '1.25rem', p: { xs: 1.5, lg: 2 }, borderLeft: '4px solid #ef4444', position: 'relative', boxShadow: '0 2px 10px -5px rgba(0,0,0,0.05)' }}>
                <Typography sx={{ fontSize: '7px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', mb: 0.2 }}>Stock Bajo</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                  <Typography sx={{ fontSize: { xs: '12px', lg: '14px' }, fontWeight: 900, color: 'zinc.900', textTransform: 'uppercase', tracking: '-0.02em', flex: 1, mr: 1, lineHeight: 1.1 }}>Torta zanahoria RI</Typography>
                  <Typography sx={{ fontSize: { xs: '16px', lg: '18px' }, fontWeight: 900, color: 'zinc.900' }}>42<span className="text-[9px] text-zinc-400 ml-0.5">u</span></Typography>
                </Box>
                <Typography sx={{ fontSize: '9px', fontWeight: 600, color: 'zinc.400', mt: 0.2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span className="material-symbols-outlined text-[11px]">warehouse</span> Almacén Central
                </Typography>
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'zinc.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '7px', fontWeight: 900, color: 'zinc.300', textTransform: 'uppercase' }}>Repos: <span className="text-zinc-900">+58 u</span></Typography>
                  <Typography sx={{ fontSize: '7px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase' }}>COMPRA</Typography>
                </Box>
              </Box>

              {/* More Alerts Card */}
              <Box sx={{ bgcolor: '#f4f4f5', borderRadius: '1.25rem', p: { xs: 1.5, lg: 2 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed', borderColor: 'zinc.200' }}>
                <Typography sx={{ fontSize: '12px', color: 'zinc.300', mb: 0 }}>...</Typography>
                <Typography sx={{ fontSize: '8px', fontWeight: 800, color: 'zinc.500', textTransform: 'uppercase', textAlign: 'center' }}>Aceite y 6 alertas más</Typography>
                <button className="mt-0.5 text-[7px] font-black text-primary uppercase tracking-widest hover:underline">Ver todas</button>
              </Box>
            </Box>
          </Box>

          {/* Weekly Performance Section */}
          <Box sx={{ bgcolor: '#f4f4f5', borderRadius: '1.5rem', p: { xs: 2, lg: 2.5 }, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexShrink: 0 }}>
              <Box>
                <Typography sx={{ fontSize: { xs: '14px', lg: '16px' }, fontWeight: 900, color: 'zinc.900', textTransform: 'uppercase', tracking: '-0.02em' }}>Rendimiento Semanal</Typography>
                <Typography sx={{ fontSize: '8px', fontWeight: 700, color: 'zinc.400', textTransform: 'uppercase', tracking: '0.1em' }}>Industrial vs Objetivo</Typography>
              </Box>
              <Autocomplete
                size="small"
                options={['Insumos Críticos', 'General']}
                defaultValue="Insumo..."
                renderInput={(params) => <TextField {...params} sx={{ width: { xs: 100, sm: 130 }, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: 'white', fontSize: '9px', fontWeight: 700, p: '2px !important' } }} />}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flex: 1, minHeight: 0, px: 1, gap: { xs: 1, sm: 2 }, pb: 0.5 }}>
              {weeklyStats.map((s, i) => (
                <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, height: '100%', justifyContent: 'end' }}>
                  <Box sx={{ width: '100%', position: 'relative', height: '100%', display: 'flex', alignItems: 'end', justifyContent: 'center', gap: 0.3 }}>
                    {/* Objective Bar (ghost) */}
                    <Box sx={{ width: { xs: 12, sm: 16, lg: 20 }, height: `${s.objective}%`, bgcolor: 'rgba(185, 28, 28, 0.1)', borderRadius: '4px 4px 0 0', position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
                    {/* Actual Bar */}
                    <Box sx={{ width: { xs: 12, sm: 16, lg: 20 }, height: `${s.actual}%`, bgcolor: '#b91c1c', borderRadius: '4px 4px 0 0', position: 'relative', zIndex: 1 }} />
                  </Box>
                  <Typography sx={{ fontSize: '7px', fontWeight: 900, color: 'zinc.400' }}>{s.day}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Sidebar Column */}
        <Box
          sx={{
            bgcolor: '#f4f4f5',
            borderRadius: '1.5rem',
            p: 2.5,
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexShrink: 0 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 900, color: 'zinc.900', textTransform: 'uppercase', tracking: '-0.02em' }}>Capacidad Crítica</Typography>
            <IconButton size="small" sx={{ p: 0.2 }}><span className="material-symbols-outlined text-sm">more_vert</span></IconButton>
          </Box>

          <Box sx={{ flex: 1 }}>
            {criticalIngredients.map((item, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: { xs: 1, lg: 1.5 }, alignItems: 'start', mb: 0.5 }}>
                  <Box sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    bgcolor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined text-xs" style={{ color: item.color }}>{item.icon}</span>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '10px', fontWeight: 900, color: 'zinc.900', lineHeight: 1 }}>{item.name}</Typography>
                      <Typography sx={{ fontSize: '11px', fontWeight: 900, color: 'zinc.900' }}>{item.percentage}%</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '7px', fontWeight: 800, color: 'zinc.400', textTransform: 'uppercase' }}>
                      REQ: {item.req} <span className="mx-0.5">•</span> <span style={{ color: item.percentage < 50 ? '#ef4444' : 'inherit' }}>STOCK: {item.stock}</span>
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ position: 'relative', pt: 0.2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'white',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: item.color,
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    {item.alert && <span className="material-symbols-outlined text-[8px] text-[#ef4444]">report</span>}
                    <Typography sx={{ fontSize: '7px', fontWeight: 700, color: 'zinc.400', fontStyle: 'italic' }}>
                      {item.alert || item.info || 'Stock bajo'}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '7px', fontWeight: 900, color: item.color, textTransform: 'uppercase', tracking: '0.1em' }}>{item.status}</Typography>
                </Box>
                {idx < criticalIngredients.length - 1 && <Box sx={{ my: 1.5, borderBottom: '1px solid', borderColor: 'zinc.200' }} />}
              </Box>
            ))}
          </Box>
        </Box>

      </Box>
    </Box>
  );
};


