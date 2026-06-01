import type { Meta, StoryObj } from '@storybook/react';
import {
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
  Box,
} from '@banana/mui-neo';

const meta: Meta = {
  title: 'Media',
};
export default meta;

type Story = StoryObj;

const pins = [
  { seed: 'banana1', h: 200, title: 'Kitchen ideas' },
  { seed: 'banana2', h: 280, title: 'Travel' },
  { seed: 'banana3', h: 160, title: 'Recipes' },
  { seed: 'banana4', h: 240, title: 'Home decor' },
  { seed: 'banana5', h: 180, title: 'Outfits' },
  { seed: 'banana6', h: 300, title: 'Gardening' },
];

export const MasonryBoard: Story = {
  name: 'ImageList (masonry pin board)',
  render: () => (
    <ImageList variant="masonry" cols={3} gap={12} sx={{ width: 540 }}>
      {pins.map((p) => (
        <ImageListItem key={p.seed}>
          <img
            src={`https://picsum.photos/seed/${p.seed}/240/${p.h}`}
            alt={p.title}
            loading="lazy"
            style={{ display: 'block', width: '100%' }}
          />
          <ImageListItemBar title={p.title} subtitle="banana board" />
        </ImageListItem>
      ))}
    </ImageList>
  ),
};

export const PinCard: Story = {
  name: 'CardMedia + CardActionArea',
  render: () => (
    <Card sx={{ width: 240 }}>
      <CardActionArea>
        <CardMedia
          component="img"
          height={180}
          image="https://picsum.photos/seed/bananapin/240/180"
          alt="Saved pin"
        />
        <CardContent>
          <Typography sx={{ fontWeight: 700 }}>Weeknight pasta</Typography>
          <Typography variant="body2">Saved to · Recipes</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  ),
};

export const Collaborators: Story = {
  name: 'AvatarGroup',
  render: () => (
    <AvatarGroup max={4}>
      <Avatar>AB</Avatar>
      <Avatar>CD</Avatar>
      <Avatar>EF</Avatar>
      <Avatar>GH</Avatar>
      <Avatar>IJ</Avatar>
      <Avatar>KL</Avatar>
    </AvatarGroup>
  ),
};

export const SearchCombo: Story = {
  name: 'Autocomplete (search)',
  render: () => (
    <Box sx={{ width: 320 }}>
      <Autocomplete
        options={['Home decor', 'Recipes', 'Travel', 'Outfits', 'Gardening', 'DIY']}
        renderInput={(params) => <TextField {...params} label="Search ideas" />}
      />
    </Box>
  ),
};

export const FreeSoloTags: Story = {
  name: 'Autocomplete (multi tags)',
  render: () => (
    <Box sx={{ width: 360 }}>
      <Autocomplete
        multiple
        freeSolo
        options={['DIY', 'Minimal', 'Cozy', 'Vintage']}
        defaultValue={['Cozy']}
        renderInput={(params) => <TextField {...params} label="Topics" />}
      />
    </Box>
  ),
};
