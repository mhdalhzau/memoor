import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Breadcrumb } from "@/utils/route-registry";
import { Save, X, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface FormPageProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  showBackButton?: boolean;
}

export default function FormPage({
  title,
  description,
  breadcrumbs,
  children,
  onSave,
  onCancel,
  showBackButton = true,
}: FormPageProps) {
  const [, setLocation] = useLocation();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <MainLayout showBreadcrumb={true}>
      <div className="space-y-4" data-testid="form-page">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="page-title">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1" data-testid="page-description">
                {description}
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle data-testid="form-card-title">{title}</CardTitle>
            {description && (
              <CardDescription data-testid="form-card-description">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {children || (
              <div className="py-8 text-center text-muted-foreground" data-testid="form-placeholder">
                Form content will be displayed here
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2" data-testid="form-actions">
          <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSave} data-testid="button-save">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
