import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BananaProvider,
  Alert,
  Dialog,
  DialogTitle,
  Tooltip,
  Button,
  LinearProgress,
  CircularProgress,
  Skeleton,
} from '../index';

const wrap = (ui: React.ReactNode) => render(<BananaProvider>{ui}</BananaProvider>);

describe('Group 3 — Feedback & Overlays', () => {
  it('renders an Alert with its message', () => {
    wrap(<Alert severity="success">Saved</Alert>);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders an open Dialog', () => {
    wrap(
      <Dialog open>
        <DialogTitle>Delete item?</DialogTitle>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete item?')).toBeInTheDocument();
  });

  it('renders a Tooltip trigger', () => {
    wrap(
      <Tooltip title="Hi">
        <Button>Hover</Button>
      </Tooltip>,
    );
    expect(screen.getByText('Hover')).toBeInTheDocument();
  });

  it('renders a LinearProgress', () => {
    wrap(<LinearProgress variant="determinate" value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders a CircularProgress', () => {
    wrap(<CircularProgress />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders a Skeleton', () => {
    const { container } = wrap(<Skeleton height={32} />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });
});
