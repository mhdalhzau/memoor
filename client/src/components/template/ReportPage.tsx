import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/utils/route-registry";
import { Download, Printer, Calendar, Filter, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportPageProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode;
  onExport?: () => void;
  onPrint?: () => void;
  showDateFilter?: boolean;
  showFilters?: boolean;
}

export default function ReportPage({
  title,
  breadcrumbs,
  children,
  onExport,
  onPrint,
  showDateFilter = true,
  showFilters = true,
}: ReportPageProps) {
  return (
    <MainLayout showBreadcrumb={true}>
      <div className="space-y-4" data-testid="report-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="page-title">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="report-subtitle">
                Generate and export reports
              </p>
            </div>
          </div>
          <div className="flex gap-2" data-testid="report-actions">
            <Button variant="outline" size="sm" onClick={onPrint} data-testid="button-print">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={onExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {(showDateFilter || showFilters) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3" data-testid="report-filters">
                {showDateFilter && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" data-testid="label-date-range">
                        Date Range
                      </label>
                      <Select defaultValue="month">
                        <SelectTrigger data-testid="select-date-range">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="quarter">This Quarter</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {showFilters && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium" data-testid="label-status">
                      Status
                    </label>
                    <Select defaultValue="all">
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-end">
                  <Button className="w-full" data-testid="button-generate-report">
                    <Filter className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            {children || (
              <div className="text-center py-12" data-testid="report-placeholder">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Report Data</h3>
                <p className="text-muted-foreground">
                  Select filters and generate a report to view data
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
