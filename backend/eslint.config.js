export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        Intl: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'no-undef': 'error',
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { allowTemplateLiterals: true }],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'comma-dangle': ['warn', 'only-multiline'],
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
      'eol-last': ['warn', 'always']
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.config.cjs',
      'ecosystem.config.cjs',
      'prisma/**'
    ]
  }
];
