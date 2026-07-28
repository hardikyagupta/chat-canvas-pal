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
        {/* Secondary button — matches the artifact "Download" style */}
        <AlertDialogCancel className="mt-0 flex items-center justify-center px-[16px] py-[6px] h-auto rounded-[6px] border-[0.75px] border-[var(--color-line-strong)] bg-card shadow-[0px_1px_0px_0px_oklch(0_0_0_/_0.02)] text-[14px] leading-[20px] font-normal text-[var(--color-ink)] hover:bg-[var(--color-surface-0)] hover:text-[var(--color-ink)]">
          Cancel
        </AlertDialogCancel>
        {/* Primary (destructive) — matches the artifact primary button, red fill */}
        <AlertDialogAction
          onClick={onConfirm}
          className="relative flex items-center justify-center px-[16px] py-[6px] h-auto rounded-[8px] overflow-hidden bg-[var(--color-danger,#e5484d)] hover:bg-[var(--color-danger,#e5484d)]/90 text-[14px] leading-[20px] font-medium text-white"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-[8px] pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, oklch(1 0 0 / 0.07) 82%, oklch(1 0 0 / 0.15) 94%)' }}
          />
          <span className="relative z-10">Delete</span>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteChatDialog;
