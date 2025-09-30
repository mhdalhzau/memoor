import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-container page-enter">
        {/* Icon with Animation */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
          <AlertCircle className="relative h-24 w-24 text-primary mx-auto" />
        </div>

        {/* Error Code */}
        <div className="error-code">404</div>

        {/* Title */}
        <h1 className="error-title dark:text-gray-100">Page Not Found</h1>

        {/* Description */}
        <p className="error-description dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or the URL might be incorrect.
        </p>

        {/* Actions */}
        <div className="error-actions">
          <Link href="/">
            <Button size="lg" className="gap-2" data-testid="button-go-home">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
          
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => window.history.back()} 
            className="gap-2"
            data-testid="button-go-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Help Card */}
        <Card className="mt-12 max-w-md mx-auto shadow-card">
          <div className="p-6 text-center">
            <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact your system administrator.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
