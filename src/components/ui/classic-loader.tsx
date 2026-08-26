import { cn } from "@/lib/utils";

type ClassicProps = Omit<React.ComponentProps<"span">, "children">;

/**
 * Twelve fading spokes — the loader shown while a full page (Chats, Agents,
 * Reports, Scheduled, Bookmarks) is coming up in the RHS.
 *
 * `rounded-[var(--radius)]` rather than the Tailwind v4 `rounded-(--radius)`
 * shorthand, since this project is on v3.
 */
function Classic({ className, ...props }: ClassicProps) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-classic-fade {
          0% {
            opacity: 1;
          }

          100% {
            opacity: 0.15;
          }
        }
      `}</style>
      <span
        role="status"
        className={cn("box-border inline-block size-5", className)}
        {...props}
      >
        <span
          aria-hidden="true"
          className="relative top-1/2 left-1/2 block size-full"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              className="absolute top-[-3.9%] left-[-10%] block h-[8%] w-[24%] rounded-[var(--radius)] bg-current"
              style={{
                transform: `rotate(${index * 30}deg) translate(146%)`,
                animation:
                  "loading-ui-classic-fade var(--duration, 1.2s) linear infinite",
                animationDelay: `calc(var(--duration, 1.2s) / 12 * ${index - 12})`,
              }}
            />
          ))}
        </span>
        <span className="sr-only">Loading</span>
      </span>
    </>
  );
}

export { Classic };
