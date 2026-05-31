import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardActions, Button, Typography } from '@banana/mui-neo';

const meta: Meta<typeof Card> = {
  title: 'Foundations/Card',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card sx={{ maxWidth: 360 }}>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Neo-Brutalist Card
        </Typography>
        <Typography variant="body1">
          Thick borders, hard offset shadows, and zero blur. Structure is visible and proud.
        </Typography>
      </CardContent>
      <CardActions>
        <Button color="primary">Action</Button>
        <Button variant="outlined">Cancel</Button>
      </CardActions>
    </Card>
  ),
};
