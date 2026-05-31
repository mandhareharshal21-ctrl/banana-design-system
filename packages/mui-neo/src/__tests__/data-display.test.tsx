import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BananaProvider,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '../index';

const wrap = (ui: React.ReactNode) => render(<BananaProvider>{ui}</BananaProvider>);

describe('Group 4 — Data display & Surfaces', () => {
  it('renders a Chip', () => {
    wrap(<Chip label="Filled" />);
    expect(screen.getByText('Filled')).toBeInTheDocument();
  });

  it('renders an Avatar', () => {
    wrap(<Avatar>BA</Avatar>);
    expect(screen.getByText('BA')).toBeInTheDocument();
  });

  it('renders a List with a selected item', () => {
    wrap(
      <List>
        <ListItem disablePadding>
          <ListItemButton selected>
            <ListItemText primary="Inbox" />
          </ListItemButton>
        </ListItem>
      </List>,
    );
    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  it('renders an Accordion summary', () => {
    wrap(
      <Accordion>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Answer</AccordionDetails>
      </Accordion>,
    );
    expect(screen.getByText('Question')).toBeInTheDocument();
  });

  it('renders a Divider', () => {
    const { container } = wrap(<Divider />);
    expect(container.querySelector('.MuiDivider-root')).toBeInTheDocument();
  });

  it('renders a Table with a header cell', () => {
    wrap(
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Token</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>brand/yellow</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('brand/yellow')).toBeInTheDocument();
  });
});
