import type { Meta, StoryObj } from '@storybook/react';
import { Button, Stack } from '@banana/mui-neo';

const meta: Meta<typeof Button> = {
  title: 'Foundations/Button',
  component: Button,
  args: { children: 'Press me', color: 'primary' },
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
    },
    variant: { control: 'select', options: ['contained', 'outlined', 'text'] },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Variants: Story = {
  render: (args) => (
    <Stack direction="row" spacing={2}>
      <Button {...args} variant="contained">
        Contained
      </Button>
      <Button {...args} variant="outlined">
        Outlined
      </Button>
      <Button {...args} variant="text">
        Text
      </Button>
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      {(['primary', 'secondary', 'error', 'success'] as const).map((c) => (
        <Button key={c} color={c}>
          {c}
        </Button>
      ))}
    </Stack>
  ),
};

export const Disabled: Story = { args: { disabled: true } };
