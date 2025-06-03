import {
  IconNode,
  HelpCircle,
  X,
  Home,
  Plus,
  Bug,
  Shapes,
  Settings,
  Pencil,
  Settings2,
  Check,
  ChevronsUpDown,
  CornerDownLeft,
  GripHorizontal,
  Trash,
  Mic,
  History,
  RefreshCw,
  AlertTriangle,
  Loader,
  Info,
  ExternalLink,
  Download,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Search,
  PanelRight,
  Upload,
  Paperclip,
  CheckCheck,
} from 'lucide';
import { createElement } from 'lucide';
import { broom } from '@lucide/lab';

export const icons = {
  panelRight: PanelRight,
  help: HelpCircle,
  close: X,
  home: Home,
  plus: Plus,
  bug: Bug,
  toolbox: Shapes,
  settings: Settings,
  pencil: Pencil,
  sliders: Settings2,
  check: Check,
  dropdown: ChevronsUpDown,
  enter: CornerDownLeft,
  handle: GripHorizontal,
  delete: Trash,
  mic: Mic,
  history: History,
  refresh: RefreshCw,
  error: AlertTriangle,
  loading: Loader,
  info: Info,
  external: ExternalLink,
  download: Download,
  left: ArrowLeft,
  right: ArrowRight,
  up: ArrowUp,
  down: ArrowDown,
  search: Search,
  upload: Upload,
  attachment: Paperclip,
  checkcheck: CheckCheck,
  archive: broom,
} as const;

export type IconName = keyof typeof icons;

export type IconRenderer = (attributes?: Record<string, any>) => SVGElement;

export function icon(name: IconName | string): IconRenderer {
  // Direct lookup - much simpler!
  const iconData = icons[name as IconName] || icons.help;

  return (attributes: Record<string, any> = {}) => {
    // Default attributes for all icons
    const defaultAttrs = {
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      fill: 'none',
      width: '14',
      height: '14',
    };

    // Merge defaults with provided attributes
    const finalAttrs = { ...defaultAttrs, ...attributes };

    return createElement(iconData, finalAttrs);
  };
}

export function getIcon(name: IconName | string) {
  // Direct lookup - much simpler!
  const icon = icons[name as IconName];

  if (icon) {
    // Return the IconNode directly
    return icon;
  }

  // Fallback to help circle if icon not found
  return icons.help;
}
