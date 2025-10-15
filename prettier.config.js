// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  trailingComma: 'all',
  arrowParens: 'always',
  singleQuote: true,
  printWidth: 100,
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-curly',
    'prettier-plugin-tailwindcss',
  ],
  importOrder: [
    '^types$',
    '^(react|react-dom)$',
    '^next(.*)$',
    '<THIRD_PARTY_MODULES>',
    '',
    '^(services|schemas)(/.*|$)',
    '^hooks(/.*|$)',
    '^(queries|requests)(/.*|$)',
    '^(vectors|images|icons)(/.*|$)',
    '^styles(/.*|$)',
    '^(pages|layouts|components)(/.*|$)',
    '^src(/.*|$)',
    '',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx'],
  importOrderTypeScriptVersion: '5.4.2',
};
