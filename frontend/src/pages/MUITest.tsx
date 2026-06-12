import React from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Stack, 
  Box,
  Container,
  Grid
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { showAlert } from '../config/alerts';

const MUITest: React.FC = () => {
  return (
    <Container maxWidth="lg" className="py-12 animate-in fade-in duration-700">
      <Box className="mb-12">
        <Typography variant="h3" className="text-primary mb-2 uppercase tracking-tighter">
          MUI + Tailwind Test
        </Typography>
        <Typography variant="body1" className="text-zinc-500 font-medium">
          Verificación de integración entre Material UI 9 y Tailwind CSS 4.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Componente 1: Botones con Tailwind */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent className="p-8">
              <Typography variant="h6" className="mb-6 uppercase text-zinc-400 tracking-widest">
                Botones y Estados
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" startIcon={<SaveIcon />}>
                  MUI Primary
                </Button>
                {/* Aquí probamos que Tailwind sobrescribe el color de MUI */}
                <Button 
                  variant="contained" 
                  className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl shadow-zinc-200"
                >
                  MUI with Tailwind
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Componente 2: Formulario con Tailwind */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent className="p-8">
              <Typography variant="h6" className="mb-6 uppercase text-zinc-400 tracking-widest">
                Inputs y Layout
              </Typography>
              <Stack spacing={3}>
                <TextField 
                  label="Nombre del Producto" 
                  fullWidth 
                  className="!bg-white"
                />
                <TextField 
                  label="Cantidad" 
                  type="number"
                  fullWidth 
                  className="!bg-white"
                />
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  className="mt-4 border-2 font-black"
                  onClick={() => showAlert.confirm('¿Estás seguro?', 'Esta acción no se puede deshacer', 'Sí, borrar')}
                >
                  Eliminar Registro
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Componente 3: SweetAlert2 Alertas */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent className="p-8">
              <Typography variant="h6" className="mb-6 uppercase text-zinc-400 tracking-widest">
                Sistema de Alertas (SweetAlert2)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => showAlert.success('¡Operación Exitosa!', 'Los datos se han guardado correctamente.')}
                >
                  Éxito
                </Button>
                <Button 
                  variant="contained" 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => showAlert.error('Error de Sistema', 'No se pudo conectar con el servidor.')}
                >
                  Error
                </Button>
                <Button 
                  variant="contained" 
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => showAlert.warning('Advertencia', 'Tu sesión está por expirar.')}
                >
                  Aviso
                </Button>
                <Button 
                  variant="contained" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => showAlert.toast('Notificación enviada', 'success')}
                >
                  Toast
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Componente 4: Utilidades de Tailwind en MUI Box */}
        <Grid size={{ xs: 12 }}>
          <Box className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[32px] p-12 text-center">
            <Typography variant="h4" className="text-primary font-black mb-4">
              ¿Funciona?
            </Typography>
            <Typography variant="body2" className="max-w-md mx-auto text-zinc-600 leading-relaxed uppercase tracking-tight font-bold">
              Si ves este cuadro con bordes redondeados grandes, fondo rosado suave (primary/5) y el texto en rojo, entonces Tailwind y MUI están trabajando juntos perfectamente.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MUITest;
