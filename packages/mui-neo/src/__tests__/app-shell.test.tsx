import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BananaProvider,
  AppBar,
  Toolbar,
  Drawer,
  BottomNavigation,
  BottomNavigationAction,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '../index';

const wrap = (ui: React.ReactNode) => render(<BananaProvider>{ui}</BananaProvider>);

describe('Group 5 — Pinterest essentials (App Shell)', () => {
  it('renders an AppBar + Toolbar', () => {
    wrap(
      <AppBar position="static">
        <Toolbar>
          <Typography>Banana</Typography>
        </Toolbar>
      </AppBar>,
    );
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('renders a permanent Drawer with navigation items', () => {
    wrap(
      <Drawer variant="permanent" anchor="left" open>
        <List>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Explore" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>,
    );
    expect(screen.getByText('Explore')).toBeInTheDocument();
  });

  it('renders a BottomNavigation tab bar', () => {
    wrap(
      <BottomNavigation showLabels value={0}>
        <BottomNavigationAction label="Home" icon={<span>H</span>} />
        <BottomNavigationAction label="Profile" icon={<span>P</span>} />
      </BottomNavigation>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders an open SpeedDial with an action', () => {
    wrap(
      <SpeedDial ariaLabel="Create" open icon={<SpeedDialIcon />}>
        <SpeedDialAction icon={<span>S</span>} tooltipTitle="Save pin" />
      </SpeedDial>,
    );
    expect(screen.getByLabelText('Save pin')).toBeInTheDocument();
  });

  it('renders an open Popover with menu items', () => {
    wrap(
      <Popover open anchorReference="none">
        <List>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Hide pin" />
            </ListItemButton>
          </ListItem>
        </List>
      </Popover>,
    );
    expect(screen.getByText('Hide pin')).toBeInTheDocument();
  });
});
