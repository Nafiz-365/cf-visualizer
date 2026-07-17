import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useLocation,
} from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Compare } from './components/Compare';
import { Leaderboards } from './components/Leaderboards';
import {
    LayoutGrid,
    Users,
    Home,
    Search,
    Sun,
    Moon,
    Trophy,
    Menu,
    X,
} from 'lucide-react';
import { cn } from './lib/utils';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

function Navbar() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="fixed bottom-6 md:bottom-auto md:top-8 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[calc(100%-2rem)]">
            <nav className="nav-pill px-2 py-1.5 rounded-full flex items-center gap-1">
                <NavLink
                    to="/"
                    active={isActive('/')}
                    icon={Search}
                    label="Search"
                />
                <NavLink
                    to="/leaderboards"
                    active={isActive('/leaderboards')}
                    icon={Trophy}
                    label="Elite"
                />
                <NavLink
                    to="/compare"
                    active={isActive('/compare')}
                    icon={Users}
                    label="Compare"
                />

                <div
                    className="w-px h-5 mx-1"
                    style={{ background: 'var(--glass-border)' }}
                />

                <button
                    onClick={toggleTheme}
                    className="p-2 md:p-2.5 rounded-full transition-all duration-300 shrink-0
                                text-(--text-muted) hover:text-(--text-main)
                                hover:bg-[rgba(255,255,255,0.08)] hover:shadow-[0_0_12px_rgba(79,142,247,0.15)]"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? (
                        <Moon size={14} className="md:w-4 md:h-4" />
                    ) : (
                        <Sun size={14} className="md:w-4 md:h-4" />
                    )}
                </button>
            </nav>
        </div>
    );
}

function NavLink({ to, active, icon: Icon, label }: any) {
    return (
        <Link
            to={to}
            className={cn(
                'flex items-center justify-center py-2 px-4 md:py-2 md:px-5 rounded-full',
                'text-[10px] md:text-xs font-black transition-all duration-300 uppercase tracking-widest',
                active
                    ? 'nav-link-active'
                    : 'text-(--text-muted) hover:text-(--text-main) hover:bg-[rgba(255,255,255,0.08)]',
            )}
        >
            <Icon size={14} className="shrink-0" />
            <span
                className={cn(
                    'overflow-hidden transition-all duration-300 whitespace-nowrap',
                    active
                        ? 'w-auto opacity-100 ml-2 max-w-24'
                        : 'w-0 opacity-0 max-w-0 md:w-auto md:opacity-100 md:ml-2 md:max-w-24',
                )}
            >
                {label}
            </span>
        </Link>
    );
}

function App() {
    return (
        <ThemeProvider>
            <Router>
                <div
                    className="min-h-screen font-sans relative overflow-hidden"
                    style={{
                        background: 'var(--bg-app)',
                        color: 'var(--text-main)',
                    }}
                >
                    {/* Subtle grid */}
                    <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-100" />

                    {/* Atmospheric Glows */}
                    <div
                        className="fixed top-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full pointer-events-none z-0"
                        style={{
                            background:
                                'radial-gradient(ellipse, rgba(79,142,247,0.07) 0%, transparent 70%)',
                            filter: 'blur(60px)',
                        }}
                    />
                    <div
                        className="fixed bottom-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full pointer-events-none z-0"
                        style={{
                            background:
                                'radial-gradient(ellipse, rgba(157,110,245,0.07) 0%, transparent 70%)',
                            filter: 'blur(60px)',
                        }}
                    />
                    <div
                        className="fixed top-[40%] left-[40%] w-[30%] h-[30%] rounded-full pointer-events-none z-0"
                        style={{
                            background:
                                'radial-gradient(ellipse, rgba(14,207,207,0.04) 0%, transparent 70%)',
                            filter: 'blur(80px)',
                        }}
                    />

                    <div className="relative z-10">
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route
                                path="/dashboard/:handle"
                                element={<Dashboard />}
                            />
                            <Route path="/compare" element={<Compare />} />
                            <Route
                                path="/leaderboards"
                                element={<Leaderboards />}
                            />
                        </Routes>

                        <Navbar />

                        {/* Global floating footer badge */}
                        <div className="fixed bottom-20 md:bottom-4 right-4 z-40 pointer-events-none">
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-overline opacity-30 hover:opacity-70 transition-opacity pointer-events-auto"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--glass-border)',
                                    backdropFilter: 'blur(12px)',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                CF API
                            </div>
                        </div>
                    </div>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
