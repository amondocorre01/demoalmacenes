import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  fullWidth,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105',
    secondary: 'bg-secondary text-white shadow-lg shadow-secondary/20 hover:scale-105',
    outline: 'bg-transparent border-2 border-zinc-200 text-zinc-900 hover:bg-zinc-50',
    ghost: 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
    error: 'bg-error text-white shadow-lg shadow-error/20 hover:scale-105',
  };

  const sizes = {
    sm: 'px-6 py-2.5 text-[9px]',
    md: 'px-8 py-4 text-[10px]',
    lg: 'px-12 py-5 text-[12px]',
    icon: 'w-12 h-12 p-0',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
      ) : (
        <>
          {icon && <span className={`${children ? 'mr-3' : ''} material-symbols-outlined text-lg`}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
