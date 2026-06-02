import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-2xl bg-zinc-800/80", className)}
      {...props}
    />
  );
}

export { Skeleton };
