import type { Meta, StoryObj } from '@storybook/react';
import { Typography, Stack } from '@banana/mui-neo';

const meta: Meta<typeof Typography> = {
  title: 'Foundations/Typography',
  component: Typography,
};
export default meta;

type Story = StoryObj<typeof Typography>;

export const Scale: Story = {
  render: () => (
    <Stack spacing={1}>
      <Typography variant="h1">Heading 1</Typography>
      <Typography variant="h2">Heading 2</Typography>
      <Typography variant="h3">Heading 3</Typography>
      <Typography variant="h4">Heading 4</Typography>
      <Typography variant="h5">Heading 5</Typography>
      <Typography variant="h6">Label / Overline</Typography>
      <Typography variant="body1">
        Body 1 — the quick brown fox jumps over the lazy dog.
      </Typography>
      <Typography variant="body2">
        Body 2 — the quick brown fox jumps over the lazy dog.
      </Typography>
    </Stack>
  ),
};
