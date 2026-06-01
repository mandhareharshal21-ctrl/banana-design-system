import type { Meta, StoryObj } from '@storybook/react';
import {
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from '@banana/mui-neo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const meta: Meta = {
  title: 'Data Display/Surfaces',
};
export default meta;

type Story = StoryObj;

export const Chips: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Chip label="Filled" />
      <Chip label="Outlined" variant="outlined" />
      <Chip label="Deletable" onDelete={() => {}} />
    </Stack>
  ),
};

export const Avatars: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Avatar>BA</Avatar>
      <Avatar>NA</Avatar>
      <Avatar>NA</Avatar>
    </Stack>
  ),
};

export const Lists: Story = {
  render: () => (
    <Paper sx={{ width: 280 }}>
      <List>
        <ListItem disablePadding>
          <ListItemButton selected>
            <ListItemText primary="Inbox" />
          </ListItemButton>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Drafts" />
          </ListItemButton>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Sent" />
          </ListItemButton>
        </ListItem>
      </List>
    </Paper>
  ),
};

export const Accordions: Story = {
  render: () => (
    <Stack sx={{ width: 360 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>What is this?</AccordionSummary>
        <AccordionDetails>A neo-brutalist accordion built on MUI.</AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>How does it work?</AccordionSummary>
        <AccordionDetails>Styling comes entirely from theme overrides.</AccordionDetails>
      </Accordion>
    </Stack>
  ),
};

export const Tables: Story = {
  render: () => (
    <TableContainer component={Paper} sx={{ maxWidth: 480 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Token</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>brand/yellow</TableCell>
            <TableCell>#FFE181</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>border/width/regular</TableCell>
            <TableCell>3px</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

export const Dividers: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 280 }}>
      <Typography>Above</Typography>
      <Divider />
      <Typography>Below</Typography>
    </Stack>
  ),
};
