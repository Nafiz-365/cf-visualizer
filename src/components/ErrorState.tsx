import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, RefreshCcw } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
    onHome: () => void;
}

export function ErrorState({ message, onRetry, onHome }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-bg-app">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <Card className="text-center p-12 border-red-500/10 relative overflow-hidden">
                    {/* Subtle Red Glow */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[100px] rounded-full" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/10 blur-[100px] rounded-full" />

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-red-500/10 rounded-4xl flex items-center justify-center mx-auto mb-8 text-red-500 border border-red-500/20 shadow-2xl shadow-red-500/20">
                            <XCircle size={40} strokeWidth={1.5} />
                        </div>

                        <h2 className="text-3xl font-display font-black text-text-app mb-4 tracking-tighter uppercase italic">
                            Sync <span className="text-red-500">Failed.</span>
                        </h2>

                        <p className="text-sm font-medium text-muted-app mb-10 leading-relaxed px-4">
                            We encountered an obstacle while retrieving the
                            performance data stream. {message}
                        </p>

                        <div className="flex flex-col gap-3">
                            {onRetry && (
                                <Button
                                    onClick={onRetry}
                                    variant="primary"
                                    className="w-full h-14 rounded-2xl gap-2 font-black uppercase tracking-widest text-[11px]"
                                >
                                    <RefreshCcw size={16} /> Attempt Resync
                                </Button>
                            )}
                            <Button
                                onClick={onHome}
                                variant="secondary"
                                className="w-full h-14 rounded-2xl gap-2 font-black uppercase tracking-widest text-[11px]"
                            >
                                Return to Command Center
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
