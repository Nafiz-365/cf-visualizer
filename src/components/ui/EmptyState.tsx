import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
        >
            {/* Ghost icon container */}
            <div className="relative mb-6">
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(79,142,247,0.10) 0%, rgba(157,110,245,0.08) 100%)',
                        border: '1px solid rgba(79,142,247,0.15)',
                        boxShadow: '0 0 32px rgba(79,142,247,0.08)',
                    }}
                >
                    <Icon
                        size={32}
                        style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                    />
                </div>
                {/* Subtle outer ring */}
                <div
                    className="absolute inset-0 rounded-2xl animate-pulse-glow"
                    style={{ border: '1px solid rgba(79,142,247,0.08)' }}
                />
            </div>

            <h3
                className="text-base font-display font-bold mb-2 tracking-tight"
                style={{ color: 'var(--text-main)' }}
            >
                {title}
            </h3>
            <p
                className="text-sm max-w-xs leading-relaxed mb-6"
                style={{ color: 'var(--text-muted)', opacity: 0.7 }}
            >
                {description}
            </p>

            {action && (
                <button
                    onClick={action.onClick}
                    className="btn btn-outline btn-sm btn-ripple"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    );
}
