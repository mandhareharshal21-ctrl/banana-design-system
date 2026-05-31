import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BananaProvider,
  IconButton,
  ButtonGroup,
  Button,
  Fab,
  Link,
  Tabs,
  Tab,
  Breadcrumbs,
} from '../index';

const wrap = (ui: React.ReactNode) => render(<BananaProvider>{ui}</BananaProvider>);

describe('Group 2 — Actions & Navigation', () => {
  it('renders an IconButton', () => {
    wrap(<IconButton aria-label="add">+</IconButton>);
    expect(screen.getByRole('button', { name: 'add' })).toBeInTheDocument();
  });

  it('renders a ButtonGroup with its buttons', () => {
    wrap(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole('button', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Two' })).toBeInTheDocument();
  });

  it('renders a Fab', () => {
    wrap(<Fab aria-label="create">+</Fab>);
    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders a Link', () => {
    wrap(<Link href="#">Docs</Link>);
    expect(screen.getByRole('link', { name: 'Docs' })).toBeInTheDocument();
  });

  it('renders Tabs with a selected Tab', () => {
    wrap(
      <Tabs value={0}>
        <Tab label="Overview" />
        <Tab label="Details" />
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
  });

  it('renders Breadcrumbs', () => {
    wrap(
      <Breadcrumbs separator="/">
        <Link href="#">Home</Link>
        <span>Button</span>
      </Breadcrumbs>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });
});
