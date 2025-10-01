import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/utils/route-registry";
import { Plus, Download, Search, Filter, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TablePageProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  columns?: string[];
  data?: any[];
  onAdd?: () => void;
  onRefresh?: () => void;
  showSearch?: boolean;
  showFilters?: boolean;
  children?: React.ReactNode;
}

export default function TablePage({
  title,
  breadcrumbs,
  columns = ["ID", "Name", "Status", "Actions"],
  data = [],
  onAdd,
  onRefresh,
  showSearch = true,
  showFilters = true,
  children,
}: TablePageProps) {
  return (
    <MainLayout showBreadcrumb={true}>
      <div className="space-y-4" data-testid="table-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="page-title">
              {title}
            </h1>
          </div>
          <div className="flex gap-2" data-testid="table-actions">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {onAdd && (
              <Button size="sm" onClick={onAdd} data-testid="button-add-new">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            )}
          </div>
        </div>

        {(showSearch || showFilters) && (
          <div className="flex gap-2" data-testid="table-filters">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            )}
            {showFilters && (
              <Button variant="outline" size="sm" data-testid="button-filters">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            )}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {children || (
              <Table data-testid="data-table">
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column} data-testid={`table-header-${column.toLowerCase()}`}>
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="text-center py-8 text-muted-foreground"
                        data-testid="table-no-data"
                      >
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, index) => (
                      <TableRow key={index} data-testid={`table-row-${index}`}>
                        {columns.map((column) => (
                          <TableCell key={column} data-testid={`table-cell-${column.toLowerCase()}-${index}`}>
                            {row[column.toLowerCase()] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
