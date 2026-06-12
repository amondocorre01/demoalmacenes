# Capresso Almacén - Sistema de Gestión de Almacenes

Sistema de gestión para almacenes, compras y auditorías de inventario desarrollado para Capresso. Esta aplicación está construida con tecnologías modernas para ofrecer una experiencia de usuario fluida, reactiva y altamente personalizable.

## 🚀 Tecnologías Principales

- **Frontend:** [React 19](https://react.dev/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 6+](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Componentes UI:** [Material UI (MUI) 9](https://mui.com/) y [Lucide React](https://lucide.dev/)
- **Enrutamiento:** [React Router 7](https://reactrouter.com/)

## 🛠️ Configuración del Proyecto

### Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- npm o yarn

### Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto y añade la URL de la API:
   ```env
   VITE_API_URL=http://localhost:3000/
   ```

### Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run preview`: Previsualiza la compilación de producción localmente.

## 🎨 Personalización de Temas

El sistema utiliza un esquema de colores dinámico basado en variables CSS. Puedes modificar la apariencia global del sistema editando un solo archivo:

- **Archivo de colores:** `src/styles/colors.css`
- **Configuración Tailwind:** El tema de Tailwind está vinculado automáticamente a estas variables en `src/index.css`.

## 📁 Estructura del Proyecto

```text
src/
├── components/     # Componentes reutilizables (Layout, Sidebar, etc.)
├── config/         # Configuraciones globales y constantes de API
├── pages/          # Páginas de la aplicación (Almacén, Dashboard)
├── styles/         # Archivos CSS y definiciones de colores
├── App.tsx         # Definición de rutas y estructura principal (menú plano de accesos)
├── main.tsx        # Punto de entrada de la aplicación
└── vite-env.d.ts   # Definiciones de tipos para entorno Vite
```

> [!NOTE]
> Las páginas del módulo de planta/área (`pages/area`) y sus respectivas rutas han sido completamente removidas. El menú de navegación lateral (`Sidebar.tsx`) se reestructuró en un formato plano con accesos directos e iconos contextuales para optimizar la usabilidad del sistema de almacenes.

## 🌐 API y Backend

La aplicación está configurada para conectarse a un backend dinámico. En producción, el sistema apunta automáticamente a:
`https://sistemageneralbackend.capressocafe.com/`

Para gestionar esta URL en el código, utiliza la constante exportada en `src/config/api.ts`.

## 📄 Licencia

Este proyecto es de uso interno para Capresso. Todos los derechos reservados.
