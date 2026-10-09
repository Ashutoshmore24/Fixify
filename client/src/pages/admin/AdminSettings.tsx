import React, { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import {
  Clock,
  Boxes,
  Save,
  AlertCircle,
  Globe,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  SkeletonCard,
  useToast,
} from '../../components/ui';

interface SystemSettingsResponse {
  escalation_timeout_hours: number;
  low_stock_default_threshold: number;
  allowed_email_domains: string[];
}

export const AdminSettings: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [escalationHours, setEscalationHours] = useState<number>(24);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data.data as SystemSettingsResponse;
    },
  });

  useEffect(() => {
    if (settings) {
      setEscalationHours(settings.escalation_timeout_hours);
      setLowStockThreshold(settings.low_stock_default_threshold);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/admin/settings', {
        escalation_timeout_hours: Number(escalationHours),
        low_stock_default_threshold: Number(lowStockThreshold),
      });
      return res.data.data;
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'System parameters updated and changes audited successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.error?.message || 'Could not update system settings',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 duration-200">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-foreground">Failed to load system settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            System & Operational Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure automated escalation SLA thresholds, inventory replenishment minimums, and institutional domain policies.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card 1: Ticket Escalation SLA */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Automated Ticket Escalation SLA
                </CardTitle>
                <CardDescription className="text-xs">
                  Interval after which unaddressed tickets automatically escalate from OPEN/ASSIGNED to Department Authority.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="max-w-xs space-y-1.5">
              <label className="font-semibold text-foreground">
                Escalation Timeout (Hours) *
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={escalationHours}
                  onChange={(e) => setEscalationHours(Number(e.target.value))}
                  className="text-xs w-32"
                />
                <span className="text-muted-foreground font-medium">hours (1 - 168)</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Default is 24 hours. The hourly background cron checks for tickets exceeding this threshold and transitions them to <code>ESCALATED</code>.
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Inventory Low Stock Alert Threshold */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Boxes className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Spare-Part Inventory Alert Threshold
                </CardTitle>
                <CardDescription className="text-xs">
                  Default threshold below which hardware components trigger low-stock alerts.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="max-w-xs space-y-1.5">
              <label className="font-semibold text-foreground">
                Low Stock Default Threshold *
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="text-xs w-32"
                />
                <span className="text-muted-foreground font-medium">units</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Default is 5 units. When inventory items fall below this count during ticket fulfillment or audit checks, low-stock notifications are emitted.
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Read-Only Institutional Domain Policy */}
        <Card className="shadow-soft border-border/80 bg-muted/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Institutional Email Domain Whitelist (Read-Only)
                </CardTitle>
                <CardDescription className="text-xs">
                  Configured via environment variables; enforced at registration and Google OAuth sign-in.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex flex-wrap gap-2">
              {settings?.allowed_email_domains.map((dom) => (
                <Badge key={dom} variant="status_resolved" size="sm" className="font-mono">
                  @{dom}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              To update authorized institutional domains, adjust <code>ALLOWED_EMAIL_DOMAINS</code> in server environment configuration.
            </p>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={
              updateMutation.isPending ||
              escalationHours < 1 ||
              escalationHours > 168 ||
              lowStockThreshold < 0
            }
            className="gap-2 text-xs"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Saving Settings...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
