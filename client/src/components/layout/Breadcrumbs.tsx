import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

interface BreadcrumbsProps {
  /** The CopyParty volume path, e.g. "raid/Projects/Brown Melon" */
  path: string;
  /** Base route prefix, e.g. "/browse" */
  basePath?: string;
}

export function Breadcrumbs({ path, basePath = "/browse" }: BreadcrumbsProps) {
  const segments = path.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm">
      {segments.map((segment, i) => {
        const href = `${basePath}/${segments.slice(0, i + 1).join("/")}`;
        const isLast = i === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {isLast ? (
              <span className="font-medium">{decodeURIComponent(segment)}</span>
            ) : (
              <Link
                to={href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {decodeURIComponent(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
