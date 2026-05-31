import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BananaProvider, Button, createNeoBrutalistTheme } from '../index';
import { tokens } from '@banana/tokens';

describe('Neo-Brutalist theme', () => {
  it('maps brand tokens onto the MUI palette', () => {
    const theme = createNeoBrutalistTheme();
    expect(theme.palette.primary.main).toBe(tokens.color.brand.yellow);
    expect(theme.palette.secondary.main).toBe(tokens.color.brand.pink);
    expect(theme.shape.borderRadius).toBe(0);
  });

  it('renders a themed Button inside the provider', () => {
    render(
      <BananaProvider>
        <Button>Press me</Button>
      </BananaProvider>,
    );
    expect(screen.getByRole('button', { name: 'Press me' })).toBeInTheDocument();
  });
});
