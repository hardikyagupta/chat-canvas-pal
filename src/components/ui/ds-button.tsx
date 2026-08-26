import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Infinity Design System 3.0 button (Figma node 718:6337).
 *
 * One medium size — 40px tall, 16px/16px padding pair, 8px radius, 8px gap —
 * with 14px Manrope Medium sentence-case labels at 0.4px tracking. Colours
 * come
 * from the `--btn-*` tokens in index.css so both themes stay in one place.
 *
 * Icon-only buttons are deliberately NOT covered here: the app's icon affordances
 * (pencils, three-dot menus, close) keep their own compact square treatment.
 */
const dsButtonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-colors',
    'h-[var(--btn-height)] gap-[var(--btn-gap)] rounded-[var(--btn-radius)] px-[var(--btn-px)]',
    'text-[length:var(--btn-font-size)] font-[number:var(--btn-font-weight)] leading-none tracking-[var(--btn-tracking)]',
    'outline-none focus-visible:ring-2 focus-visible:ring-[var(--btn-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed [&_svg]:size-[16px] [&_svg]:shrink-0 [&_svg]:pointer-events-none',
  ),
  {
    variants: {
      variant: {
        // Primary carries a royal-blue-600 hairline and an inset white glow
        // (Figma node 743:1073) so the fill reads as raised, not flat.
        primary:
          'border-[length:var(--btn-border)] border-solid border-[var(--btn-primary-line)] bg-[var(--btn-primary)] text-white shadow-[shadow:var(--btn-inner-glow)] hover:bg-[image:var(--btn-hover-veil)] disabled:border-transparent disabled:bg-[var(--btn-primary-disabled)] disabled:bg-none disabled:shadow-none',
        secondary:
          'border-[length:var(--btn-border)] border-solid border-[var(--btn-primary)] text-[var(--btn-primary)] hover:border-[var(--btn-primary-hover)] hover:bg-[var(--btn-primary-tint)] hover:text-[var(--btn-primary-hover)] disabled:border-[var(--btn-disabled-line)] disabled:bg-transparent disabled:text-[var(--btn-disabled-line)]',
        // Tertiary follows the dedicated DS node 738:1049: white fill, 1px
        // grey-200 hairline, grey-400 label — lighter than the thick outline
        // the other variants carry.
        tertiary:
          'border-[length:var(--btn-border)] border-solid border-[var(--btn-tertiary-border)] bg-[var(--btn-tertiary-bg)] bg-[image:var(--btn-tertiary-sheen)] text-[var(--btn-neutral)] shadow-[shadow:var(--btn-tertiary-shadow)] hover:bg-[var(--btn-neutral-tint)] disabled:border-[var(--btn-disabled-line)] disabled:bg-transparent disabled:bg-none disabled:text-[var(--btn-disabled-line)] disabled:shadow-none',
        error:
          'bg-[var(--btn-error)] text-white hover:bg-[var(--btn-error-hover)] disabled:bg-[var(--btn-error-disabled)] disabled:hover:bg-[var(--btn-error-disabled)]',
        link:
          'px-0 text-[var(--btn-primary)] hover:text-[var(--btn-primary-hover)] hover:underline disabled:text-[var(--btn-disabled-line)] disabled:no-underline',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

export interface DsButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof dsButtonVariants> {
  asChild?: boolean;
}

const DsButton = React.forwardRef<HTMLButtonElement, DsButtonProps>(
  ({ className, variant, asChild = false, type = 'button', style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(dsButtonVariants({ variant }), className)}
        style={{ fontFamily: 'Manrope, sans-serif', ...style }}
        {...props}
      />
    );
  },
);
DsButton.displayName = 'DsButton';

export { DsButton, dsButtonVariants };
