import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Stack,
} from '@banana/mui-neo';

const meta: Meta = {
  title: 'Forms/Controls',
};
export default meta;

type Story = StoryObj;

export const Radios: Story = {
  render: () => (
    <FormControl>
      <FormLabel>Shipping speed</FormLabel>
      <RadioGroup defaultValue="standard">
        <FormControlLabel value="standard" control={<Radio />} label="Standard" />
        <FormControlLabel value="express" control={<Radio />} label="Express" />
        <FormControlLabel value="overnight" control={<Radio disabled />} label="Overnight" />
      </RadioGroup>
      <FormHelperText>Choose how fast you need it.</FormHelperText>
    </FormControl>
  ),
};

export const Selects: Story = {
  render: function SelectStory() {
    const [value, setValue] = useState('banana');
    return (
      <FormControl sx={{ minWidth: 220 }}>
        <InputLabel id="fruit-label">Fruit</InputLabel>
        <Select
          labelId="fruit-label"
          label="Fruit"
          value={value}
          onChange={(e) => setValue(String(e.target.value))}
        >
          <MenuItem value="banana">Banana</MenuItem>
          <MenuItem value="apple">Apple</MenuItem>
          <MenuItem value="cherry">Cherry</MenuItem>
        </Select>
        <FormHelperText>Pick your favourite.</FormHelperText>
      </FormControl>
    );
  },
};

export const Sliders: Story = {
  render: () => (
    <Stack spacing={4} sx={{ width: 320 }}>
      <Slider defaultValue={40} />
      <Slider defaultValue={60} marks min={0} max={100} step={20} />
      <Slider defaultValue={30} disabled />
    </Stack>
  ),
};

export const ToggleButtons: Story = {
  render: function ToggleStory() {
    const [align, setAlign] = useState('left');
    return (
      <ToggleButtonGroup
        exclusive
        value={align}
        onChange={(_, next) => next && setAlign(next)}
      >
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
        <ToggleButton value="right">Right</ToggleButton>
      </ToggleButtonGroup>
    );
  },
};
