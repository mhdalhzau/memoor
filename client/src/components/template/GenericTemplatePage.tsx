import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/utils/route-registry";
import { Plus, Download, Upload, Filter, Search, Construction } from "lucide-react";

interface GenericTemplatePageProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode;
  showActionButtons?: boolean;
  actionButtons?: React.ReactNode;
}

export default function GenericTemplatePage({
  title,
  breadcrumbs,
  children,
  showActionButtons = true,
  actionButtons,
}: GenericTemplatePageProps) {
  return (
    <MainLayout showBreadcrumb={true}>
      <div className="space-y-4" data-testid="generic-template-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="page-title">
              {title}
            </h1>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1" data-testid="breadcrumb-trail">
                {breadcrumbs.map((b) => b.label).join(" / ")}
              </p>
            )}
          </div>
          {showActionButtons && (
            <div className="flex gap-2" data-testid="action-buttons">
              {actionButtons || (
                <>
                  <Button variant="outline" size="sm" data-testid="button-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-download">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm" data-testid="button-add">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {children || (
          <Card data-testid="coming-soon-placeholder">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Construction className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2" data-testid="coming-soon-title">
                Coming Soon
              </h2>
              <p className="text-muted-foreground text-center max-w-md" data-testid="coming-soon-description">
                This page is under construction. Check back soon for updates!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
