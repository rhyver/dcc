import tsBasics from '@kilcekru/ts-basics'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default tsBasics.defineConfig([
  ...tsBasics.presets.base,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      'import/no-extraneous-dependencies': 'off'
    }
  },
  {
    ignores: ['dist/*', '/.expo', '/.turbo', 'node_modules'],
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }]
    }
  }
])
