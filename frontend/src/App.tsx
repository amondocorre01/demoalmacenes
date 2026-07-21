import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { InventarioAlmacen } from './pages/InventarioAlmacen';
import MUITest from './pages/MUITest';




// Almacen Pages
import ListaAlmacenes from './pages/almacen/lista-almacenes/ListaAlmacenes';
import CrearReceta from './pages/almacen/crear-receta/CrearReceta';
import AsignarProducto from './pages/almacen/asignar-producto/AsignarProducto';
import PedidosConsolidados from './pages/almacen/pedidos-consolidados-almacen/PedidosConsolidadosAlmacen';
import TransferenciaAlmacen from './pages/almacen/transferencia-almacen/TransferenciaAlmacen';
import TransferenciaInsumos from './pages/almacen/transferencia-insumos/TransferenciaInsumos';
import DevolucionAlmacen from './pages/almacen/devolucion-almacen/DevolucionAlmacen';
import DeclaracionInventario from './pages/almacen/declaracion-inventario/DeclaracionInventario';
import VerificacionInventario from './pages/almacen/verificacion-inventario/VerificacionInventario';
import DesperdicioInsumos from './pages/almacen/desperdicio-insumos/DesperdicioInsumos';
import DesperdicioManual from './pages/almacen/desperdicio-manual/DesperdicioManual';
import SolicitudesAlmacen from './pages/almacen/solicitudes-almacen/SolicitudesAlmacen';
import PreRegistroProductos from './pages/almacen/pre-registro-productos/PreRegistroProductos';
import ReposicionProductosVencidos from './pages/almacen/reposicion-productos-vencidos/ReposicionProductosVencidos';
import ListaPreciosInsumos from './pages/almacen/lista-precios-insumos/ListaPreciosInsumos';
import ProductosIntermedios from './pages/almacen/productos-intermedios/ProductosIntermedios';
import ProductosProducidos from './pages/almacen/productos-producidos/ProductosProducidos';
import ListaGeneralRecetas from './pages/almacen/lista-general-recetas/ListaGeneralRecetas';
import HistorialProductos from './pages/almacen/historial-productos/HistorialProductos';
import IngresoManualStock from './pages/almacen/ingreso-manual-stock/IngresoManualStock';
import RetirarInsumos from './pages/almacen/retirar-insumos/RetirarInsumos';
import RecetasIntermedias from './pages/almacen/recetas-intermedias/RecetasIntermedias';
import ConfigReposicion from './pages/almacen/config-reposicion/ConfigReposicion';
import ConfigDeclaracion from './pages/almacen/config-declaracion/ConfigDeclaracion';
import RegistroProducto from './pages/almacen/registro-producto/RegistroProducto';
import GuiaRegistroProducto from './pages/almacen/registro-producto/GuiaRegistroProducto';
import RegistroGrupoProducto from './pages/almacen/registro-grupo-producto/RegistroGrupoProducto';
import RegistroFacturasInsumos from './pages/almacen/registro-facturas-insumos/RegistroFacturasInsumos';
import RegistroProduccion from './pages/almacen/registro-produccion/RegistroProduccion';

import PedidosConsolidadosAlmacen from './pages/almacen/pedidos-consolidados-almacen/PedidosConsolidadosAlmacen';
import HelpCenter from './pages/help/HelpCenter';
import AuthCallback from './pages/auth/Callback';


// Placeholder for pages that are not yet migrated
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <p className="text-4xl font-bold text-zinc-200 dark:text-zinc-800 tracking-tighter uppercase">{title}</p>
    <p className="text-zinc-400 dark:text-zinc-600 mt-4 italic uppercase tracking-[0.2em] text-[10px] font-black">Módulo en proceso de migración</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/auth/callback" element={<AuthCallback />} />



          {/* ALMACÉN: CONFIGURACIÓN */}
          <Route path="/almacen/crear" element={<ListaAlmacenes />} />
          <Route path="/almacen/crear-receta" element={<CrearReceta />} />
          <Route path="/almacen/asignar-producto" element={<AsignarProducto />} />
          <Route path="/almacen/recetas-intermedias" element={<RecetasIntermedias />} />
          <Route path="/almacen/lista-recetas" element={<ListaGeneralRecetas />} />
          <Route path="/almacen/productos-intermedios" element={<ProductosIntermedios />} />

          {/* ALMACÉN: OPERACIONES */}
          <Route path="/almacen/pedidos-consolidados-almacen" element={<PedidosConsolidadosAlmacen />} />
          <Route path="/almacen/solicitud" element={<SolicitudesAlmacen />} />
          <Route path="/almacen/transferencia" element={<TransferenciaAlmacen />} />
          <Route path="/almacen/transferencia-insumos" element={<TransferenciaInsumos />} />
          <Route path="/almacen/devolucion" element={<DevolucionAlmacen />} />
          <Route path="/almacen/registro-produccion" element={<RegistroProduccion />} />

          {/* ALMACÉN: CONTROL E INVENTARIO */}
          <Route path="/almacen/inventario" element={<InventarioAlmacen />} />
          <Route path="/almacen/productos-producidos" element={<ProductosProducidos />} />
          <Route path="/almacen/historial" element={<HistorialProductos />} />
          <Route path="/almacen/declaracion" element={<DeclaracionInventario />} />
          <Route path="/almacen/verificacion" element={<VerificacionInventario />} />
          <Route path="/almacen/insertar-insumos" element={<IngresoManualStock />} />
          <Route path="/almacen/retirar-insumos" element={<RetirarInsumos />} />

          {/* AUDITORÍA, MERMAS Y REPOSICIÓN */}
          <Route path="/almacen/config-reposicion-area" element={<ConfigReposicion />} />
          <Route path="/auditoria/reposicion-vencidos-almacen" element={<ReposicionProductosVencidos />} />
          <Route path="/auditoria/desperdicio-vencidos-almacen" element={<DesperdicioInsumos />} />
          <Route path="/auditoria/desperdicio-manual-almacen" element={<DesperdicioManual />} />

          {/* COMPRAS Y PROVEEDORES */}
          <Route path="/compras/lista-precios" element={<ListaPreciosInsumos />} />

          {/* CONFIGURACIÓN Y MAESTROS */}
          <Route path="/config/registro-producto" element={<RegistroProducto />} />
          <Route path="/config/guia-registro" element={<GuiaRegistroProducto />} />
          <Route path="/config/pre-registro" element={<PreRegistroProductos />} />
          <Route path="/config/registro-grupo" element={<RegistroGrupoProducto />} />

          {/* Test Route */}
          <Route path="/test-mui" element={<MUITest />} />

          {/* Fallback route */}
          <Route path="*" element={<PlaceholderPage title="Página no encontrada" />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;




