import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

// Note: BreadcrumbList JSON-LD is emitted via SEOHead's `jsonLd` prop on each
// page. Do NOT also emit it from this component — it caused duplicate
// BreadcrumbList script tags in the DOM.
const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const location = useLocation();

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {index === 0 && <Home className="h-3.5 w-3.5 mr-0.5" />}
            {item.href === location.pathname ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                to={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
