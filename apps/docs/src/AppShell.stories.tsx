import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  AppBar,
  Toolbar,
  Drawer,
  BottomNavigation,
  BottomNavigationAction,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Popover,
  Button,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
} from '@banana/mui-neo';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import ShareIcon from '@mui/icons-material/Share';

const meta: Meta = {
  title: 'App Shell',
};
export default meta;

type Story = StoryObj;

export const TopBar: Story = {
  name: 'AppBar + Toolbar',
  render: () => (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <IconButton aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Banana
        </Typography>
        <Button>Create</Button>
      </Toolbar>
    </AppBar>
  ),
};

function SideNavDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Button onClick={() => setOpen(true)}>Open navigation</Button>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 240 }} role="presentation" onClick={() => setOpen(false)}>
          <List>
            {['Home', 'Explore', 'Notifications', 'Profile'].map((label) => (
              <ListItem key={label} disablePadding>
                <ListItemButton>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}

export const SideNavigation: Story = {
  name: 'Drawer (side navigation)',
  render: () => <SideNavDemo />,
};

function MobileSheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Drawer anchor="bottom" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Share this pin
          </Typography>
          <Typography variant="body2">Send to a friend or copy the link.</Typography>
        </Box>
      </Drawer>
    </Box>
  );
}

export const MobileSheet: Story = {
  name: 'Drawer (bottom sheet)',
  render: () => <MobileSheetDemo />,
};

function TabBarDemo() {
  const [value, setValue] = useState(0);
  return (
    <Box sx={{ width: 380 }}>
      <BottomNavigation showLabels value={value} onChange={(_, v) => setValue(v)}>
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Search" icon={<SearchIcon />} />
        <BottomNavigationAction label="Alerts" icon={<NotificationsIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Box>
  );
}

export const MobileTabBar: Story = {
  name: 'BottomNavigation',
  render: () => <TabBarDemo />,
};

export const CreateMenu: Story = {
  name: 'SpeedDial (floating create)',
  render: () => (
    <Box sx={{ height: 240, position: 'relative' }}>
      <SpeedDial
        ariaLabel="Create"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction icon={<SaveIcon />} tooltipTitle="Save pin" />
        <SpeedDialAction icon={<ShareIcon />} tooltipTitle="Share" />
      </SpeedDial>
    </Box>
  ),
};

function OverlayMenuDemo() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return (
    <Box>
      <Button onClick={(e) => setAnchorEl(e.currentTarget)}>Pin options</Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <List>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Save" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Hide" />
            </ListItemButton>
          </ListItem>
        </List>
      </Popover>
    </Box>
  );
}

export const OverlayMenu: Story = {
  name: 'Popover',
  render: () => <OverlayMenuDemo />,
};
