import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';

// Custom rename/edit pencil (Phosphor-style) — fill-based, uses currentColor.
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" {...props}>
    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z" />
  </svg>
);
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
} from '@/components/ui/action-menu';

interface ChatActionsMenuProps {
  /** The trigger element (e.g. the three-dot button). Rendered via asChild. */
  trigger: React.ReactNode;
  isBookmarked?: boolean;
  onRename?: () => void;
  onBookmark?: () => void;
  onDelete?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

// Shared "chat actions" menu — Rename / Bookmark / Delete. Used by both the LHS
// chat rows (on hover) and the RHS header three-dot button. Styling/behaviour
// come from the shared ActionMenu primitive so it stays consistent everywhere.
const ChatActionsMenu: React.FC<ChatActionsMenuProps> = ({
  trigger,
  isBookmarked,
  onRename,
  onBookmark,
  onDelete,
  open,
  onOpenChange,
  align = 'start',
  side = 'bottom',
}) => (
  <ActionMenu open={open} onOpenChange={onOpenChange}>
    <ActionMenuTrigger asChild>{trigger}</ActionMenuTrigger>
    <ActionMenuContent align={align} side={side}>
      <ActionMenuItem icon={PencilIcon} onSelect={() => onRename?.()}>
        Rename
      </ActionMenuItem>
      <ActionMenuItem
        icon={Bookmark}
        iconProps={{ fill: isBookmarked ? 'currentColor' : 'none' }}
        onSelect={() => onBookmark?.()}
      >
        {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
      </ActionMenuItem>
      <ActionMenuItem icon={Trash2} variant="danger" onSelect={() => onDelete?.()}>
        Delete
      </ActionMenuItem>
    </ActionMenuContent>
  </ActionMenu>
);

export default ChatActionsMenu;
