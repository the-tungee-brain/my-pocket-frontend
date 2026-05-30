import type { ReactNode } from "react";
import {
  pageAsideClass,
  pageMainClass,
  pageNarrowClass,
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

export function PageNarrowShell({ children, className }: ShellProps) {
  return <div className={cn(pageNarrowClass, className)}>{children}</div>;
}

type SplitProps = {
  main: ReactNode;
  aside?: ReactNode;
  className?: string;
  mainClassName?: string;
  asideClassName?: string;
  splitClassName?: string;
};

export function PageSplit({
  main,
  aside,
  className,
  mainClassName,
  asideClassName,
  splitClassName,
}: SplitProps) {
  if (!aside) {
    return <div className={cn(pageMainClass, className)}>{main}</div>;
  }

  return (
    <div className={cn(splitClassName ?? pageSplitClass, className)}>
      <div className={cn(mainClassName ?? pageMainClass)}>{main}</div>
      <aside className={cn(asideClassName ?? pageAsideClass)}>{aside}</aside>
    </div>
  );
}
