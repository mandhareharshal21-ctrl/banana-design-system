import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: { name: '@storybook/react-vite', options: {} },
  async viteFinal(cfg) {
    if (process.env.STORYBOOK_BASE_PATH) {
      cfg.base = process.env.STORYBOOK_BASE_PATH;
    }
    return cfg;
  },
};

export default config;
