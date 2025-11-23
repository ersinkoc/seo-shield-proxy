import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: CardTitleProps) {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-slate-500 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}