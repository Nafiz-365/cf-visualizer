import React from 'react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

export function InsightCard({ title, desc, icon: Icon, color }: any) {
    return (
        <Card className="p-6 transition-all duration-500 group relative bg-linear-to-br from-card-app to-white/1 hover:-translate-y-1 hover:shadow-2xl">
            <div
                className={cn(
                    'p-3 rounded-2xl w-fit mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg',
                    color ||
                        'text-brand-primary bg-brand-primary/10 shadow-brand-primary/5',
                )}
            >
                <Icon size={18} />
            </div>
            <h4 className="text-base font-display font-bold text-text-app mb-2 tracking-tight group-hover:text-brand-primary transition-colors">
                {title}
            </h4>
            <p className="text-xs leading-relaxed text-muted-app font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                {desc}
            </p>

            {/* Interactive Detail */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">
                    Analytical Detail
                </span>
                <div className="w-8 h-px bg-brand-primary/30" />
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 group-hover:scale-150 rotate-12 pointer-events-none">
                {Icon && <Icon size={80} />}
            </div>
        </Card>
    );
}
