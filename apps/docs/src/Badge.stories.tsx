import type { Meta, StoryObj } from '@storybook/react';
import { Badge, Button, Stack } from '@banana/mui-neo';

const meta: Meta<typeof Badge> = {
  title: 'Foundations/Badge',
  component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Counts: Story = {
  render: () => (
    <Stack direction="row" spacing={4}>
      <Badge badgeContent={4} color="primary">
        <Button>Inbox</Button>
      </Badge>
      <Badge badgeContent={12} color="secondary">
        <Button>Alerts</Button>
      </Badge>
      <Badge badgeContent={99} color="error">
        <Button>Errors</Button>
      </Badge>
    </Stack>
  ),
};
