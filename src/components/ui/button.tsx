import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = "default", 
  size = "default",
  className = "", 
  ...props 
}) => {
  const base = "rounded font-medium focus:outline-none transition inline-flex items-center justify-center";
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    ghost: "hover:bg-gray-100 text-gray-800",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };
  
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
};

export { Button };