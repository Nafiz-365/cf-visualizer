import React from 'react';
import { cn } from '../lib/utils';

export function DetailItem({
    label,
    value,
    isVerdict,
    isMono,
    outerClassName,
}: any) {
    return (
        <div className={cn('space-y-1.5 p-4 rounded-3xl', outerClassName)}>
            <p className="text-[10px] text-muted-app uppercase font-black tracking-[0.2em]">
                {label}
            </p>
            {isVerdict ? (
                <span
                    className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider',
                        value === 'OK'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20',
                    )}
                >
                    {value === 'OK' ? 'Accepted' : value.replace(/_/g, ' ')}
                </span>
            ) : (
                <p
                    className={cn(
                        'text-sm font-bold text-text-app',
                        isMono && 'font-mono text-brand-primary',
                    )}
                >
                    {value}
                </p>
            )}
        </div>
    );
}
