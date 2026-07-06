import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

// Accepts both lucide icons and custom SVG components.
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * ActionMenu — the single, consistent popover-menu primitive for the app
 * (the "+" attachment menu, the chat more-options menu, etc.).
 *
 * It standardises: surface (radius / border / shadow), padding, item height,
 * text size (13px / medium), icon size (16px) and hover state (grey), so every
 * menu looks and behaves the same. Built on Radix so it keeps keyboard nav,
 * focus management and Escape handling for free.
 *
 * Usage:
 *   <ActionMenu open={open} onOpenChange={setOpen}>
 *     <ActionMenuTrigger asChild><button>…</button></ActionMenuTrigger>
 *     <ActionMenuContent align="start" side="bottom">
 *       <ActionMenuItem icon={Pencil} onSelect={…}>Rename</ActionMenuItem>
 *       <ActionMenuItem icon={Trash2} variant="danger" onSelect={…}>Delete</ActionMenuItem>
 *     </ActionMenuContent>
 *   </ActionMenu>
 */

export const ActionMenu = DropdownMenuPrimitive.Root;
export const ActionMenuTrigger = DropdownMenuPrimitive.Trigger;

export const ActionMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[184px] p-[6px] flex flex-col gap-[2px] rounded-[12px] border border-[#dbe0e3] bg-white',
        'shadow-[0px_8px_20px_0px_rgba(0,0,0,0.12)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
        className
      )}
      style={{ fontFamily: 'Manrope, sans-serif' }}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
ActionMenuContent.displayName = 'ActionMenuContent';

interface ActionMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  icon?: IconComponent;
  /** Extra props forwarded to the leading icon (e.g. fill for a bookmark). */
  iconProps?: { fill?: string };
  variant?: 'default' | 'danger';
}

export const ActionMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  ActionMenuItemProps
>(({ className, icon: Icon, iconProps, variant = 'default', children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'flex items-center gap-[8px] h-[32px] px-[8px] rounded-[8px] text-[13px] font-medium cursor-pointer select-none outline-none transition-colors',
      'focus:bg-[oklch(0_0_0_/_0.06)] data-[highlighted]:bg-[oklch(0_0_0_/_0.06)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      variant === 'danger'
        ? 'text-[var(--color-danger,#e5484d)]'
        : 'text-[var(--color-charcoal)]',
      className
    )}
    {...props}
  >
    {Icon && <Icon className="size-[16px] shrink-0" strokeWidth={1.75} {...iconProps} />}
    <span className="whitespace-nowrap">{children}</span>
  </DropdownMenuPrimitive.Item>
));
ActionMenuItem.displayName = 'ActionMenuItem';

export const ActionMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('my-[4px] h-px bg-[var(--color-line)]', className)}
    {...props}
  />
));
ActionMenuSeparator.displayName = 'ActionMenuSeparator';
