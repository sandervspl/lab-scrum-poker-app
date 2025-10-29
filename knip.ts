import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreDependencies: ['tailwindcss', 'tw-animate-css'],
  ignoreFiles: ['./lib/supabase/database.types.ts'],
};

export default config;
