/**
 * Card Component - Basic UI card container
 */
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Reusable card component for content containers
 */
export function Card({ 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  const baseStyles = 'bg-white border border-slate-200 rounded-lg shadow-sm';
  const classes = `${baseStyles} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
} 