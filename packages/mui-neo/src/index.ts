// Theme
export { createNeoBrutalistTheme, neoBrutalistTheme } from './theme';

// Provider
export { BananaProvider } from './components/BananaProvider';
export type { BananaProviderProps } from './components/BananaProvider';

// Foundation components (Neo-Brutalist styling comes from the theme overrides)
export {
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Checkbox,
  Switch,
  Badge,
  Typography,
  Container,
  Stack,
  Box,
  FormControlLabel,
  FormGroup,
} from '@mui/material';

export type {
  ButtonProps,
  TextFieldProps,
  CardProps,
  CheckboxProps,
  SwitchProps,
  BadgeProps,
  TypographyProps,
  ContainerProps,
} from '@mui/material';

// Group 1 — Form & Input controls
export {
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  Menu,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  InputLabel,
  FormHelperText,
} from '@mui/material';

export type {
  RadioProps,
  RadioGroupProps,
  SelectProps,
  MenuItemProps,
  MenuProps,
  SliderProps,
  ToggleButtonProps,
  ToggleButtonGroupProps,
  FormControlProps,
  FormLabelProps,
  InputLabelProps,
  FormHelperTextProps,
} from '@mui/material';

// Group 2 — Actions & Navigation
export {
  IconButton,
  ButtonGroup,
  Fab,
  Link,
  Tabs,
  Tab,
  Breadcrumbs,
} from '@mui/material';

export type {
  IconButtonProps,
  ButtonGroupProps,
  FabProps,
  LinkProps,
  TabsProps,
  TabProps,
  BreadcrumbsProps,
} from '@mui/material';
