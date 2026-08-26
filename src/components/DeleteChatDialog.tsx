import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { dsButtonVariants } from '@/components/ui/ds-button';
import { cn } from '@/lib/utils';

const MANROPE = { fontFamily: 'Manrope, sans-serif' } as const;

interface DeleteChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatName?: string | null;
  onConfirm: () => void;
  /** Dialog heading — defaults to "Delete chat?" (e.g. pass "Delete report?"). */
  title?: string;
  /** Fallback noun used when no name is given — defaults to "this chat". */
  fallbackName?: string;
}

// Confirmation shown before a chat is deleted (from the LHS row menu or the
// RHS header menu). Buttons reuse the artifact-layout button styles (DSL).
const DeleteChatDialog: React.FC<DeleteChatDialogProps> = ({
  open,
  onOpenChange,
  chatName,
  onConfirm,
  title = 'Delete chat?',
  fallbackName = 'this chat',
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="rounded-[16px]" style={MANROPE}>
      <AlertDialogHeader className="space-y-[12px]">
        <AlertDialogTitle className="text-[20px] font-semibold text-[var(--color-ink)]">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-[15px] text-[var(--color-charcoal)]">
          This will delete <span className="font-semibold text-[var(--color-ink)]">{chatName || fallbackName}</span>.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        {/* DS tertiary / error pair (Infinity DS 3.0 button set). */}
        <AlertDialogCancel
          className={cn(dsButtonVariants({ variant: 'tertiary' }), 'mt-0')}
          style={MANROPE}
        >
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className={dsButtonVariants({ variant: 'error' })}
          style={MANROPE}
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteChatDialog;
