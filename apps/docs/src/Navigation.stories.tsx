import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  IconButton,
  ButtonGroup,
  Button,
  Fab,
  Link,
  Tabs,
  Tab,
  Breadcrumbs,
  Stack,
  Typography,
} from '@banana/mui-neo';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeleteIcon from '@mui/icons-material/Delete';

const meta: Meta = {
  title: 'Navigation/Actions',
};
export default meta;

type Story = StoryObj;

export const IconButtons: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <IconButton aria-label="add">
        <AddIcon />
      </IconButton>
      <IconButton aria-label="favorite">
        <FavoriteIcon />
      </IconButton>
      <IconButton aria-label="delete" disabled>
        <DeleteIcon />
      </IconButton>
    </Stack>
  ),
};

export const ButtonGroups: Story = {
  render: () => (
    <ButtonGroup>
      <Button>One</Button>
      <Button>Two</Button>
      <Button>Three</Button>
    </ButtonGroup>
  ),
};

export const Fabs: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Fab aria-label="add">
        <AddIcon />
      </Fab>
      <Fab variant="extended">
        <AddIcon sx={{ mr: 1 }} />
        Create
      </Fab>
    </Stack>
  ),
};

export const Links: Story = {
  render: () => (
    <Typography>
      Read the <Link href="#">documentation</Link> or visit the{' '}
      <Link href="#">repository</Link>.
    </Typography>
  ),
};

export const TabsExample: Story = {
  render: function TabsStory() {
    const [tab, setTab] = useState(0);
    return (
      <Tabs value={tab} onChange={(_, next) => setTab(next)}>
        <Tab label="Overview" />
        <Tab label="Details" />
        <Tab label="Settings" />
      </Tabs>
    );
  },
};

export const BreadcrumbsExample: Story = {
  render: () => (
    <Breadcrumbs separator="/">
      <Link href="#">Home</Link>
      <Link href="#">Components</Link>
      <Typography>Button</Typography>
    </Breadcrumbs>
  ),
};
