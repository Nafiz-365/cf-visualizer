import type { Config } from 'tailwindcss';

export default {
    theme: {
        extend: {
            colors: {
                'bg-app': 'var(--bg-app)',
                'card-app': 'var(--bg-card)',
                'text-app': 'var(--text-main)',
                'muted-app': 'var(--text-muted)',
                'subtle-app': 'var(--text-subtle)',
                'border-app': 'var(--border-app)',
                'brand-primary': 'var(--color-brand-primary)',
                'brand-secondary': 'var(--color-brand-secondary)',
                'brand-accent': 'var(--color-brand-accent)',
                'brand-rose': 'var(--color-brand-rose)',
                'brand-amber': 'var(--color-brand-amber)',
            },
            backgroundImage: {
                'linear-to-br':
                    'linear-gradient(135deg, var(--tw-gradient-stops))',
                'linear-to-b':
                    'linear-gradient(to bottom, var(--tw-gradient-stops))',
                'linear-to-r':
                    'linear-gradient(to right, var(--tw-gradient-stops))',
                'linear-to-t':
                    'linear-gradient(to top, var(--tw-gradient-stops))',
            },
        },
    },
} satisfies Config;
