import next from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  ...next,
  ...nextTypescript,
];

export default config;
