import React from 'react';

/** Skeleton block — animated shimmer placeholder */
function Bone({ className = '' }: { className?: string }) {
    return <div className={`skeleton ${className}`} />;
}

/** Full dashboard loading skeleton that mirrors the real layout */
export function DashboardSkeleton({ handle }: { handle?: string }) {
    return (
        <div
            className="min-h-screen flex"
            style={{ background: 'var(--bg-app)' }}
        >
            {/* Skeleton sidebar */}
            <aside
                className="hidden md:flex w-20 lg:w-64 border-r flex-col pt-8 px-3 space-y-2"
                style={{ borderColor: 'var(--glass-border)' }}
            >
                {Array.from({ length: 7 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    >
                        <Bone className="w-5 h-5 rounded-lg shrink-0" />
                        <Bone className="flex-1 h-3 rounded-full hidden lg:block" />
                    </div>
                ))}
            </aside>

            <main className="flex-1 md:ml-20 lg:ml-64">
                {/* Skeleton header */}
                <div
                    className="sticky top-0 z-40 px-4 md:px-8 py-4 border-b flex items-center gap-4"
                    style={{
                        background: 'var(--bg-app)',
                        borderColor: 'var(--glass-border)',
                    }}
                >
                    <Bone className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                        <Bone className="h-4 w-32 rounded-full" />
                        <Bone className="h-3 w-20 rounded-full" />
                    </div>
                    <div className="hidden sm:flex gap-3 ml-auto">
                        <Bone className="w-20 h-8 rounded-xl" />
                        <Bone className="w-8 h-8 rounded-xl" />
                    </div>
                </div>

                {/* Skeleton content */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-24 space-y-8">
                    {/* Hero + side mini cards */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        <div
                            className="xl:col-span-8 rounded-[1.75rem] p-8 space-y-4"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--glass-border)',
                            }}
                        >
                            <Bone className="h-4 w-32 rounded-full" />
                            <Bone className="h-8 w-3/4 rounded-xl" />
                            <Bone className="h-4 w-full rounded-full" />
                            <Bone className="h-4 w-5/6 rounded-full" />
                            <div className="flex gap-6 pt-4">
                                <Bone className="h-6 w-24 rounded-full" />
                                <Bone className="h-6 w-24 rounded-full" />
                            </div>
                        </div>
                        <div className="xl:col-span-4 grid grid-cols-2 xl:grid-cols-1 gap-4">
                            {[0, 1].map((i) => (
                                <div
                                    key={i}
                                    className="rounded-[1.75rem] p-6 space-y-3"
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--glass-border)',
                                    }}
                                >
                                    <Bone className="h-3 w-24 rounded-full" />
                                    <Bone className="h-7 w-32 rounded-xl" />
                                    <Bone className="h-3 w-full rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stat cards row */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-[1.75rem] p-5 space-y-3 min-h-30"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--glass-border)',
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <Bone className="h-2.5 w-16 rounded-full" />
                                    <Bone className="w-8 h-8 rounded-lg shrink-0" />
                                </div>
                                <Bone className="h-7 w-20 rounded-xl" />
                                <Bone className="h-1 w-full rounded-full mt-auto" />
                            </div>
                        ))}
                    </div>

                    {/* Chart area */}
                    <div
                        className="rounded-[1.75rem] p-6 h-72"
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--glass-border)',
                        }}
                    >
                        <Bone className="h-3 w-40 rounded-full mb-6" />
                        <Bone className="w-full h-52 rounded-xl" />
                    </div>

                    {/* Loading status text */}
                    <div className="text-center pt-4 space-y-1">
                        <p
                            className="text-sm font-display font-medium animate-pulse"
                            style={{ color: 'var(--text-main)' }}
                        >
                            Analyzing{handle ? ` ${handle}'s` : ''} profile
                            intelligence…
                        </p>
                        <p
                            className="text-overline"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Fetching from Codeforces API
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
