import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router";

interface BreadcrumbsProps {
  /** The CopyParty volume path, e.g. "raid/Projects/Brown Melon" */
  path: string;
  /** Base route prefix, e.g. "/browse" */
  basePath?: string;
}

export function Breadcrumbs({ path, basePath = "/browse" }: BreadcrumbsProps) {
  const segments = (path || "").split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
      <Link to="/" className="p-1 rounded-sm hover:bg-muted transition-colors">
        <Home className="h-3 w-3" />
      </Link>
      
      {segments.map((segment, i) => {
        const href = `${basePath}/${segments.slice(0, i + 1).join("/")}`;
        const isLast = i === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />
            {isLast ? (
              <span className="bg-muted px-1.5 py-0.5 rounded-sm text-foreground">
                {decodeURIComponent(segment)}
              </span>
            ) : (
              <Link
                to={href}
                className="text-muted-foreground/60 hover:text-foreground hover:bg-muted px-1.5 py-0.5 rounded-sm transition-all"
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
