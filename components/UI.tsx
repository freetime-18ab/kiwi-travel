import React from 'react';

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}
export const Card: React.FC<CardProps> = ({ children, className = '', onClick, noPadding }) => {
  // Only apply interactive styles if onClick is present
  const interactiveStyles = onClick 
    ? "hover:shadow-soft-hover active:scale-95 cursor-pointer" 
    : "";

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-3xl border-2 border-card-border shadow-soft transition-all duration-200 ${interactiveStyles} ${noPadding ? '' : 'p-4'} ${className}`}
    >
      {children}
    </div>
  );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', fullWidth, className = '', ...props }) => {
  const baseStyles = "font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border-2";
  const variants = {
    primary: "bg-primary text-white border-primary shadow-soft hover:bg-opacity-90",
    secondary: "bg-secondary text-white border-secondary shadow-soft hover:bg-opacity-90",
    danger: "bg-accent text-white border-accent shadow-soft hover:bg-opacity-90",
    ghost: "bg-transparent text-dark border-transparent hover:bg-gray-100",
  };
  const width = fullWidth ? "w-full py-3" : "px-4 py-2";

  return (
    <button className={`${baseStyles} ${variants[variant]} ${width} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'bg-gray-100 text-gray-600' }) => (
  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${color}`}>
    {children}
  </span>
);

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-bold text-dark ml-1">{label}</label>}
    <input 
      className={`bg-white border-2 border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-dark placeholder-gray-400 ${className}`}
      {...props}
    />
  </div>
);