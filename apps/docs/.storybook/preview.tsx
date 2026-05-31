import React from 'react';
import type { Preview } from '@storybook/react';
import { BananaProvider } from '@banana/mui-neo';
import { tokens } from '@banana/tokens';

import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'paper',
      values: [
        { name: 'paper', value: tokens.color.background.default },
        { name: 'white', value: tokens.color.white },
      ],
    },
  },
  decorators: [
    (Story) => (
      <BananaProvider>
        <div style={{ padding: 24 }}>
          <Story />
        </div>
      </BananaProvider>
    ),
  ],
};

export default preview;
