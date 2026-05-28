import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type ResearchSectionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  titleHref?: string;
  children: React.ReactNode;
  className?: string;
};

export function ResearchSectionCard({
  title,
  description,
  icon: Icon,
  action,
  titleHref,
  children,
  className,
}: ResearchSectionCardProps) {
  const titleNode = titleHref ? (
    <Link
      href={titleHref}
      className="text-foreground transition hover:text-accent-strong hover:underline"
    >
      {title}
    </Link>
  ) : (
    title
  );

  return (
    <Card surface="subtle" className={className}>
      <CardHeader>
        <CardTitle
          title={titleNode}
          description={description}
          icon={
            Icon ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            ) : undefined
          }
        />
        {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      </CardHeader>
      <CardBody className="py-4">{children}</CardBody>
    </Card>
  );
}
