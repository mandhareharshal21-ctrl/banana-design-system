import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BananaProvider,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Card,
  CardMedia,
  CardActionArea,
  CardContent,
  Avatar,
  AvatarGroup,
  Autocomplete,
  TextField,
  Typography,
} from '../index';

const wrap = (ui: React.ReactNode) => render(<BananaProvider>{ui}</BananaProvider>);

describe('Group 5 — Pinterest essentials (Media)', () => {
  it('renders a masonry ImageList with an item bar', () => {
    wrap(
      <ImageList variant="masonry" cols={2}>
        <ImageListItem>
          <img src="https://example.com/p.jpg" alt="A pin" />
          <ImageListItemBar title="Kitchen ideas" subtitle="board" />
        </ImageListItem>
      </ImageList>,
    );
    expect(screen.getByAltText('A pin')).toBeInTheDocument();
    expect(screen.getByText('Kitchen ideas')).toBeInTheDocument();
  });

  it('renders a Pin card with media inside an action area', () => {
    wrap(
      <Card>
        <CardActionArea>
          <CardMedia component="img" height={120} image="https://example.com/p.jpg" alt="pin" />
          <CardContent>
            <Typography>Weeknight pasta</Typography>
          </CardContent>
        </CardActionArea>
      </Card>,
    );
    expect(screen.getByText('Weeknight pasta')).toBeInTheDocument();
  });

  it('renders an AvatarGroup with a surplus indicator', () => {
    wrap(
      <AvatarGroup max={2}>
        <Avatar>AB</Avatar>
        <Avatar>CD</Avatar>
        <Avatar>EF</Avatar>
      </AvatarGroup>,
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders an Autocomplete search field', () => {
    wrap(
      <Autocomplete
        options={['Recipes', 'Travel']}
        renderInput={(params) => <TextField {...params} label="Search ideas" />}
      />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText('Search ideas')).toBeInTheDocument();
  });
});
