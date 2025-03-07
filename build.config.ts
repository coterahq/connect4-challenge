import type { BunPlugin } from 'bun';

const config = {
  entrypoints: ['./src/index.tsx'],
  outdir: './dist',
  target: 'browser' as const,
  plugins: [] as BunPlugin[],
  external: ['react', 'react-dom', 'react-router-dom'],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
} as const;

export default config; 