import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { appIconBoxClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

type ResearchSectionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  titleHref?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function ResearchSectionCard({
  title,
  description,
  icon: Icon,
  action,
  titleHref,
  children,
  className,
  bodyClassName,
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
              <div className={appIconBoxClass}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            ) : undefined
          }
        />
        {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      </CardHeader>
      <CardBody spacious className={bodyClassName}>
        {children}
      </CardBody>
    </Card>
  );
}
