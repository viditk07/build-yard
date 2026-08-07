import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import type { ReactNode } from "react";

type ProjectPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  backTo?: "/projects" | "/projects/$projectId";
  projectId?: string;
  actions?: ReactNode;
};

export function ProjectPageHeader({
  eyebrow,
  title,
  description,
  backTo,
  projectId,
  actions,
}: ProjectPageHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {backTo === "/projects" && (
          <Link
            to="/projects"
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> All projects
          </Link>
        )}
        {backTo === "/projects/$projectId" && projectId && (
          <Link
            to="/projects/$projectId"
            params={{ projectId }}
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Project dashboard
          </Link>
        )}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-spec flex items-center gap-2 text-primary">
              <Building2 className="size-4" /> {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
