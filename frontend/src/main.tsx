import React from 'react'
import ReactDOM from 'react-dom/client'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import CssBaseline from '@mui/material/CssBaseline'
import { NotificationProvider } from './context/NotificationContext'

// Configurar el idioma de las fechas a español
dayjs.locale('es');
import App from './App'
import theme from './theme'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <CssBaseline />
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
)

