import type { Meta, StoryObj } from '@storybook/react';
import {
  TextField,
  Checkbox,
  Switch,
  FormControlLabel,
  FormGroup,
  Stack,
} from '@banana/mui-neo';

const meta: Meta = {
  title: 'Foundations/Inputs',
};
export default meta;

type Story = StoryObj;

export const TextFields: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 320 }}>
      <TextField label="Name" placeholder="Ada Lovelace" />
      <TextField label="Email" defaultValue="ada@example.com" />
      <TextField label="Disabled" disabled defaultValue="Locked" />
      <TextField label="Error" error helperText="Required field" />
    </Stack>
  ),
};

export const Checkboxes: Story = {
  render: () => (
    <FormGroup>
      <FormControlLabel control={<Checkbox defaultChecked />} label="Accept terms" />
      <FormControlLabel control={<Checkbox />} label="Subscribe" />
      <FormControlLabel control={<Checkbox disabled />} label="Disabled" />
    </FormGroup>
  ),
};

export const Switches: Story = {
  render: () => (
    <FormGroup>
      <FormControlLabel control={<Switch defaultChecked />} label="Notifications" />
      <FormControlLabel control={<Switch />} label="Dark mode" />
      <FormControlLabel control={<Switch disabled />} label="Disabled" />
    </FormGroup>
  ),
};
