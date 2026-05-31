import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  Snackbar,
  Alert as SnackAlert,
  LinearProgress,
  CircularProgress,
  Skeleton,
  Stack,
} from '@banana/mui-neo';

const meta: Meta = {
  title: 'Feedback/Overlays',
};
export default meta;

type Story = StoryObj;

export const Alerts: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 420 }}>
      <Alert severity="success">Saved successfully.</Alert>
      <Alert severity="info">Heads up — new version available.</Alert>
      <Alert severity="warning">Your trial ends soon.</Alert>
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        Something went wrong.
      </Alert>
    </Stack>
  ),
};

export const Dialogs: Story = {
  render: function DialogStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Delete item?</DialogTitle>
          <DialogContent>
            <DialogContentText>This action cannot be undone.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Delete</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  },
};

export const Tooltips: Story = {
  render: () => (
    <Tooltip title="Neo-brutalist tooltip" arrow>
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Snackbars: Story = {
  render: function SnackbarStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Show snackbar</Button>
        <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
          <SnackAlert severity="success" onClose={() => setOpen(false)}>
            Changes saved.
          </SnackAlert>
        </Snackbar>
      </>
    );
  },
};

export const Progress: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: 320 }} alignItems="flex-start">
      <LinearProgress variant="determinate" value={60} sx={{ width: '100%' }} />
      <CircularProgress />
    </Stack>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <Stack spacing={1} sx={{ width: 320 }}>
      <Skeleton height={32} />
      <Skeleton height={80} />
      <Skeleton width="60%" />
    </Stack>
  ),
};
