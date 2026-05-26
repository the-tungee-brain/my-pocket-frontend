import type { ReactNode } from "react";
import {
  pageAsideClass,
  pageMainClass,
  pageShellClass,
  pageSplitClass,
} from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

type ShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: ShellProps) {
  return <div className={cn(pageShellClass, className)}>{children}</div>;
}

type SplitProps = {
  main: ReactNode;
  aside?: ReactNode;
  className?: string;
  mainClassName?: string;
  asideClassName?: string;
};

export function PageSplit({
  main,
  aside,
  className,
  mainClassName,
  asideClassName,
}: SplitProps) {
  if (!aside) {
    return <div className={cn(pageMainClass, className)}>{main}</div>;
  }

  return (
    <div className={cn(pageSplitClass, className)}>
      <div className={cn(pageMainClass, mainClassName)}>{main}</div>
      <aside className={cn(pageAsideClass, asideClassName)}>{aside}</aside>
    </div>
  );
}
