import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    output: {
      mode: 'tags-split',
      target: 'src/api',
      schemas: 'src/api/model',
      client: 'fetch',
      mock: false,
      prettier: true,
      httpClient: 'fetch',
      override: {
        useTypeOverInterfaces: true,
        mutator: {
          path: './src/api/fetch.ts',
          name: 'customFetch',
        },
      },
    },
    input: {
      target: '../asset-server/docs/swagger.yaml',
    },
  },
});
