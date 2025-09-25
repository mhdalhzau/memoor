import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Database, CheckCircle, AlertCircle, Loader2, TestTube, Eye, EyeOff } from "lucide-react";

const databaseConfigSchema = z.object({
  databaseUrl: z.string()
    .min(1, "Database URL is required")
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'postgresql:' || urlObj.protocol === 'postgres:';
        } catch {
          return url.startsWith('postgresql://') || url.startsWith('postgres://');
        }
      },
      {
        message: "Invalid database URL format. Must start with postgresql:// or postgres://"
      }
    )
    .refine(
      (url) => url.includes('aivencloud.com'), 
      {
        message: "🔒 Security restriction: Only Aiven PostgreSQL databases are allowed (*.aivencloud.com)"
      }
    ),
  connectionPool: z.object({
    min: z.number().min(1, "Minimum connections must be at least 1").max(50, "Maximum 50 connections"),
    max: z.number().min(2, "Maximum connections must be at least 2").max(100, "Maximum 100 connections"),
    idleTimeoutMs: z.number().min(1000, "Minimum 1000ms").max(300000, "Maximum 300000ms (5 minutes)")
  }),
  ssl: z.object({
    rejectUnauthorized: z.boolean(),
    caCertificate: z.string().optional(),
    description: z.string().optional()
  })
});

type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export default function DatabaseConfigContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load current database config
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/settings/database'],
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<DatabaseConfig>({
    resolver: zodResolver(databaseConfigSchema),
    defaultValues: {
      databaseUrl: config?.databaseUrl || "",
      connectionPool: {
        min: config?.connectionPool?.min || 2,
        max: config?.connectionPool?.max || 10,
        idleTimeoutMs: config?.connectionPool?.idleTimeoutMs || 30000
      },
      ssl: {
        rejectUnauthorized: config?.ssl?.rejectUnauthorized ?? true,
        caCertificate: config?.ssl?.caCertificate || "",
        description: config?.ssl?.description || ""
      }
    }
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: DatabaseConfig) => apiRequest('POST', '/api/settings/database', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/database'] });
      toast({
        title: "Database configuration updated",
        description: "Your database settings have been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive", 
        title: "Failed to update database configuration",
        description: error.message || "An unexpected error occurred."
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (url: string) => apiRequest('POST', '/api/settings/database/test', { databaseUrl: url }),
    onSuccess: () => {
      setConnectionStatus('success');
      setTestError("");
      toast({
        title: "Connection successful",
        description: "Database connection test passed successfully."
      });
    },
    onError: (error: any) => {
      setConnectionStatus('error');
      setTestError(error.message || "Connection test failed");
      toast({
        variant: "destructive",
        title: "Connection failed", 
        description: error.message || "Unable to connect to the database."
      });
    }
  });

  const handleSubmit = (data: DatabaseConfig) => {
    // Validate pool configuration
    if (data.connectionPool.max <= data.connectionPool.min) {
      form.setError("connectionPool.max", {
        message: "Maximum connections must be greater than minimum connections"
      });
      return;
    }

    updateConfigMutation.mutate(data);
  };

  const handleTestConnection = async () => {
    const url = form.getValues("databaseUrl");
    if (!url) {
      toast({
        variant: "destructive",
        title: "URL Required",
        description: "Please enter a database URL before testing."
      });
      return;
    }

    // Client-side Aiven validation before sending request
    if (!url.includes('aivencloud.com')) {
      toast({
        variant: "destructive",
        title: "🔒 Security Restriction",
        description: "Only Aiven PostgreSQL databases are allowed (*.aivencloud.com). Please use a valid Aiven connection string."
      });
      setConnectionStatus('error');
      setTestError("Security restriction: Only Aiven databases are supported");
      return;
    }

    setConnectionStatus('testing');
    testConnectionMutation.mutate(url);
  };

  const getDatabaseProvider = (url: string) => {
    if (url.includes('neon.tech')) return 'Neon';
    if (url.includes('aivencloud.com')) return 'Aiven';
    if (url.includes('supabase.com')) return 'Supabase';
    if (url.includes('planetscale.com')) return 'PlanetScale';
    return 'PostgreSQL';
  };

  const maskUrl = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      if (urlObj.password) {
        urlObj.password = '••••••••';
      }
      return urlObj.toString();
    } catch {
      return url.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1••••••••$2');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Database URL */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="databaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Database URL
                        <Badge variant="outline" className="text-xs">
                          {getDatabaseProvider(field.value)}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="postgresql:// or postgres://username:password@host:port/database"
                            data-testid="input-database-url"
                            className="pr-20"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={handleTestConnection}
                              disabled={testConnectionMutation.isPending}
                              data-testid="button-test-connection"
                            >
                              {testConnectionMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <TestTube className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <p className="text-xs text-muted-foreground">
                          Preview: {maskUrl(field.value)}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Connection Test Results */}
                {connectionStatus !== 'idle' && (
                  <Alert className={connectionStatus === 'success' ? 'border-green-200 bg-green-50' : connectionStatus === 'error' ? 'border-red-200 bg-red-50' : ''}>
                    <div className="flex items-center gap-2">
                      {connectionStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                      {connectionStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {connectionStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <AlertDescription>
                      {connectionStatus === 'testing' && "Testing database connection..."}
                      {connectionStatus === 'success' && "Database connection successful!"}
                      {connectionStatus === 'error' && testError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Connection Pool Settings */}
              <Card className="border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Connection Pool Settings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="connectionPool.min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Connections</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={1}
                            max={50}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-pool-min"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="connectionPool.max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Connections</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={2}
                            max={100}
                            onChange={e => field.onChange(parseInt(e.target.value) || 2)}
                            data-testid="input-pool-max"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="connectionPool.idleTimeoutMs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idle Timeout (ms)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={1000}
                            max={300000}
                            onChange={e => field.onChange(parseInt(e.target.value) || 30000)}
                            data-testid="input-pool-timeout"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* SSL Configuration */}
              <Card className="border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">SSL Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ssl.rejectUnauthorized"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            data-testid="checkbox-ssl-reject"
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Reject unauthorized certificates (recommended for production)
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ssl.caCertificate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CA Certificate (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUFwqE9MW2mEfLCdNnl...
-----END CERTIFICATE-----"
                            className="resize-none font-mono text-xs"
                            rows={6}
                            data-testid="textarea-ca-certificate"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Paste your CA certificate here for secure Aiven/custom database connections.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ssl.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SSL Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Additional SSL configuration notes..."
                            className="resize-none"
                            rows={3}
                            data-testid="textarea-ssl-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  data-testid="button-save-config"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}