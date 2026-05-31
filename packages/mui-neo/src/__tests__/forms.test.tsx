import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BananaProvider,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormControlLabel,
  InputLabel,
} from '../index';

const wrap = (ui: React.ReactNode) => render(<BananaProvider>{ui}</BananaProvider>);

describe('Group 1 — Form & Input controls', () => {
  it('renders a Radio in a RadioGroup', () => {
    wrap(
      <RadioGroup defaultValue="a">
        <FormControlLabel value="a" control={<Radio />} label="Option A" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('renders a Select with its label', () => {
    wrap(
      <FormControl>
        <InputLabel id="l">Fruit</InputLabel>
        <Select labelId="l" label="Fruit" value="banana" onChange={() => {}}>
          <MenuItem value="banana">Banana</MenuItem>
        </Select>
      </FormControl>,
    );
    expect(screen.getByLabelText('Fruit')).toBeInTheDocument();
  });

  it('renders a Slider', () => {
    wrap(<Slider defaultValue={50} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders a ToggleButtonGroup', () => {
    wrap(
      <ToggleButtonGroup exclusive value="left">
        <ToggleButton value="left">Left</ToggleButton>
      </ToggleButtonGroup>,
    );
    expect(screen.getByRole('button', { name: 'Left' })).toBeInTheDocument();
  });
});
