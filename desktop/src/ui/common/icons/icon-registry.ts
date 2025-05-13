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
  Upload,
  Paperclip,
  CheckCheck,
} from 'lucide';
import { broom } from '@lucide/lab';

export const icons = {
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
  Upload,
  Paperclip,
  CheckCheck,
  Broom: broom,
} as const;

export type CanonicalIconName = keyof typeof icons;
export type IconName =
  | CanonicalIconName
  | keyof typeof ALIASES
  | Lowercase<CanonicalIconName>
  | string;

export const ALIASES: Record<string, CanonicalIconName> = {
  close: 'X',
  toolbox: 'Shapes',
  sliders: 'Settings2',
  dropdown: 'ChevronsUpDown',
  enter: 'CornerDownLeft',
  handle: 'GripHorizontal',
  delete: 'Trash',
  refresh: 'RefreshCw',
  error: 'AlertTriangle',
  loading: 'Loader',
  external: 'ExternalLink',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  attachment: 'Paperclip',
  archive: 'Broom',
};

export type IconFactory = (attrs: Record<string, any>) => IconNode;

export function getIcon(name: IconName): IconFactory {
  const wrapIconNode =
    (node: IconNode): IconFactory =>
    (_attrs: Record<string, any>) =>
      node;
  if (!name) return wrapIconNode(icons.HelpCircle);

  // Resolve alias
  let canonical = name as string;
  if (ALIASES[canonical as keyof typeof ALIASES]) {
    canonical = ALIASES[canonical as keyof typeof ALIASES];
  }

  // Prepare candidate keys to try in order
  const pascal = canonical.replace(
    /(^|[-_])(\w)/g,
    (_: string, __: string, p2: string) => p2.toUpperCase()
  );
  const capFirst = canonical.charAt(0).toUpperCase() + canonical.slice(1);
  const lower = canonical.toLowerCase();
  const keysToTry = [canonical, pascal, capFirst];

  // Try direct keys
  for (const key of keysToTry) {
    const candidate = (icons as any)[key];
    if (typeof candidate === 'function') return candidate;
    if (candidate) return wrapIconNode(candidate);
  }

  // Try any key matching lowercased name
  for (const key of Object.keys(icons)) {
    if (key.toLowerCase() === lower) {
      const icon = (icons as any)[key];
      if (typeof icon === 'function') return icon;
      if (icon) return wrapIconNode(icon);
    }
  }

  // Fallback
  return wrapIconNode(icons.HelpCircle);
}
