import { Button } from '../components/common/Button';

/**
 * Ejemplo de cómo definir botones de forma dinámica.
 * Esto permite centralizar las acciones y etiquetas de los botones.
 */

export interface ButtonConfig {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  onClick: () => void;
}

// Ejemplo de uso en un componente:
/*
const myButtons: ButtonConfig[] = [
  { id: 'save', label: 'Guardar', icon: 'save', variant: 'primary', onClick: () => console.log('Guardado') },
  { id: 'cancel', label: 'Cancelar', variant: 'outline', onClick: () => console.log('Cancelado') },
];

{myButtons.map(btn => (
  <Button key={btn.id} variant={btn.variant} icon={btn.icon} onClick={btn.onClick}>
    {btn.label}
  </Button>
))}
*/
