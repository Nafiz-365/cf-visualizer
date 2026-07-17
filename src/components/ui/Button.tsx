import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | 'primary'
        | 'secondary'
        | 'ghost'
        | 'outline'
        | 'danger'
        | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    ...props
}: ButtonProps) {
    const variantClass = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        outline: 'btn-outline',
        danger: 'btn-danger',
        gradient: 'btn-gradient',
    }[variant];

    const sizeClass = {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
    }[size];

    return (
        <button
            className={cn('btn btn-ripple', variantClass, sizeClass, className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <div className="btn-spinner" />}
            {children}
        </button>
    );
}
