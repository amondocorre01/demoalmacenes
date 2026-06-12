import React, { useState } from 'react';
import { Search, Filter, Download, Plus, MoreVertical, Package } from 'lucide-react';
import { Button } from '../components/common/Button';
import ModalConvertirProductos from './components/ModalConvertirProductos';
import dayjs from 'dayjs';

const almacenes = [
  { ID_PLANTA_ALMACEN: 1, DESCRICION: 'BIZCOCHOS' },
  { ID_PLANTA_ALMACEN: 2, DESCRICION: 'CHEESECAKE' },
  { ID_PLANTA_ALMACEN: 3, DESCRICION: 'ESENCIAS' },
  { ID_PLANTA_ALMACEN: 4, DESCRICION: 'FRUTAS' },
  { ID_PLANTA_ALMACEN: 5, DESCRICION: 'GALLETAS' },
  { ID_PLANTA_ALMACEN: 6, DESCRICION: 'PANADERIA' },
  { ID_PLANTA_ALMACEN: 7, DESCRICION: 'PANINIS' },
  { ID_PLANTA_ALMACEN: 8, DESCRICION: 'PIES' },
  { ID_PLANTA_ALMACEN: 14, DESCRICION: 'PLANTA-ALMACEN' },
  { ID_PLANTA_ALMACEN: 9, DESCRICION: 'POLVOS' },
  { ID_PLANTA_ALMACEN: 13, DESCRICION: 'SUPERVISIÓN' },
  { ID_PLANTA_ALMACEN: 11, DESCRICION: 'TIRAMISU' },
  { ID_PLANTA_ALMACEN: 12, DESCRICION: 'TORTAS' }
];

export const InventarioAlmacen = () => {
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorías');

  const [products, setProducts] = useState([
    { id: '1', name: 'Sandía', sku: 'CAP-SND-01', stock: 150.0, medida: 'Kilogramos', category: 'Frutas', status: 'En Stock' },
    { id: '2', name: 'Maracuyá', sku: 'CAP-MRC-02', stock: 85.5, medida: 'Kilogramos', category: 'Frutas', status: 'En Stock' },
    { id: '3', name: 'Mango', sku: 'CAP-MNG-03', stock: 120.0, medida: 'Kilogramos', category: 'Frutas', status: 'En Stock' },
    { id: '4', name: 'Pulpa de Sandía', sku: 'CAP-PLS-01', stock: 10.0, medida: 'Litros', category: 'Refrigerados', status: 'En Stock' },
    { id: '5', name: 'Pulpa de Maracuyá', sku: 'CAP-PLM-02', stock: 5.0, medida: 'Litros', category: 'Refrigerados', status: 'En Stock' },
    { id: '6', name: 'Pulpa de Mango', sku: 'CAP-PLG-03', stock: 8.0, medida: 'Litros', category: 'Refrigerados', status: 'En Stock' },
    { id: '7', name: 'Harina de Trigo', sku: 'CAP-HRN-04', stock: 450.0, medida: 'Kilogramos', category: 'Insumos Secos', status: 'En Stock' },
    { id: '8', name: 'Azúcar Refinada', sku: 'CAP-AZU-05', stock: 3.5, medida: 'Kilogramos', category: 'Insumos Secos', status: 'Stock Bajo' },
    { id: '9', name: 'Leche Entera', sku: 'CAP-LCH-06', stock: 0.0, medida: 'Litros', category: 'Refrigerados', status: 'Agotado' }
  ]);

  const [history, setHistory] = useState([
    {
      id: 'h1',
      almacen: 'PLANTA-ALMACEN',
      productoSaliente: 'Sandía',
      medidaSalida: 'Kilogramos',
      cantidadSalida: 25.0,
      productoIngreso: 'Pulpa de Sandía',
      medidaIngreso: 'Litros',
      cantidadIngreso: 12.5,
      fechaRegistro: '2026-05-24'
    },
    {
      id: 'h2',
      almacen: 'FRUTAS',
      productoSaliente: 'Maracuyá',
      medidaSalida: 'Kilogramos',
      cantidadSalida: 15.0,
      productoIngreso: 'Pulpa de Maracuyá',
      medidaIngreso: 'Litros',
      cantidadIngreso: 6.0,
      fechaRegistro: '2026-05-25'
    }
  ]);

  const getProductStatus = (stock: number) => {
    if (stock === 0) return 'Agotado';
    if (stock <= 10) return 'Stock Bajo';
    return 'En Stock';
  };

  const handleConvert = (data: {
    almacen: string;
    productoSalienteId: string;
    cantidadSalida: number;
    productoIngresoId: string;
    cantidadIngreso: number;
  }) => {
    const outProd = products.find(p => p.id === data.productoSalienteId);
    const inProd = products.find(p => p.id === data.productoIngresoId);

    if (!outProd || !inProd) return false;

    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === outProd.id) {
          const newStock = Math.max(0, p.stock - data.cantidadSalida);
          return { ...p, stock: newStock, status: getProductStatus(newStock) };
        }
        if (p.id === inProd.id) {
          const newStock = p.stock + data.cantidadIngreso;
          return { ...p, stock: newStock, status: getProductStatus(newStock) };
        }
        return p;
      })
    );

    const newRecord = {
      id: `h-${Date.now()}`,
      almacen: data.almacen,
      productoSaliente: outProd.name,
      medidaSalida: outProd.medida,
      cantidadSalida: data.cantidadSalida,
      productoIngreso: inProd.name,
      medidaIngreso: inProd.medida,
      cantidadIngreso: data.cantidadIngreso,
      fechaRegistro: dayjs().format('YYYY-MM-DD')
    };

    setHistory(prevHistory => [newRecord, ...prevHistory]);
    return true;
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas las categorías' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario de Almacén</h1>
          <p className="text-sm text-gray-500 mt-1">Gestione y controle el stock de sus insumos y productos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon="download">
            Exportar
          </Button>
          <Button variant="primary" size="sm" icon="sync_alt" onClick={() => setIsConversionModalOpen(true)}>
            Convertir Productos
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Buscar por nombre, código o categoría..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon="filter_list">
              Filtros
            </Button>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option>Todas las categorías</option>
              <option>Frutas</option>
              <option>Insumos Secos</option>
              <option>Refrigerados</option>
              <option>Limpieza</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">U. Medida</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{p.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{p.stock.toFixed(1)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{p.medida}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${p.status === 'Agotado'
                      ? 'bg-red-50 text-red-700'
                      : p.status === 'Stock Bajo'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-green-50 text-green-700'
                      }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" icon="more_vert" />
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {filteredProducts.length} de {products.length} productos
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Anterior</Button>
            <Button variant="primary" size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Siguiente</Button>
          </div>
        </div>
      </div>

      <ModalConvertirProductos
        open={isConversionModalOpen}
        onClose={() => setIsConversionModalOpen(false)}
        products={products}
        almacenes={almacenes}
        onConvert={handleConvert}
        history={history}
      />
    </div>
  );
};
