import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/utils/route-registry";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

interface DashboardPageProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  stats?: StatCard[];
  children?: React.ReactNode;
}

const defaultStats: StatCard[] = [
  {
    title: "Total Revenue",
    value: "$0",
    change: "+0%",
    changeType: "positive",
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: "Active Users",
    value: "0",
    change: "+0%",
    changeType: "positive",
    icon: <Activity className="h-4 w-4" />,
  },
  {
    title: "Sales",
    value: "0",
    change: "-0%",
    changeType: "negative",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    title: "Expenses",
    value: "$0",
    change: "+0%",
    changeType: "neutral",
    icon: <TrendingDown className="h-4 w-4" />,
  },
];

export default function DashboardPage({
  title,
  breadcrumbs,
  stats = defaultStats,
  children,
}: DashboardPageProps) {
  return (
    <MainLayout showBreadcrumb={true}>
      <div className="space-y-6" data-testid="dashboard-page">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="page-title">
            {title}
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
          {stats.map((stat, index) => (
            <Card key={index} data-testid={`stat-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" data-testid={`stat-title-${index}`}>
                  {stat.title}
                </CardTitle>
                {stat.icon && (
                  <div className="text-muted-foreground" data-testid={`stat-icon-${index}`}>
                    {stat.icon}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`stat-value-${index}`}>
                  {stat.value}
                </div>
                {stat.change && (
                  <p
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-muted-foreground"
                    }`}
                    data-testid={`stat-change-${index}`}
                  >
                    {stat.changeType === "positive" && <TrendingUp className="h-3 w-3" />}
                    {stat.changeType === "negative" && <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {children || (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="dashboard-content">
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Dashboard Content</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8 text-muted-foreground">
                Dashboard widgets and charts will be displayed here
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
