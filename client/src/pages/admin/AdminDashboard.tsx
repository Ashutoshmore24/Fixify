import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import {
  Users,
  Building2,
  FlaskConical,
  Monitor,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserX,
  ArrowRight,
  Settings,
  ScrollText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Badge,
  Button,
  SkeletonCard,
} from '../../components/ui';

interface DashboardStats {
  usersByRole: {
    STUDENT: number;
    FACULTY: number;
    LAB_ASSISTANT: number;
    DEPT_AUTHORITY: number;
    HOD: number;
    ADMIN: number;
  };
  totalLabs: number;
  computersByStatus: {
    ACTIVE: number;
    UNDER_MAINTENANCE: number;
    RETIRED: number;
  };
  openTicketsCount: number;
  pendingFacultyCount: number;
  pendingDeactivationsCount: number;
  warnings: {
    labsWithoutAssistant: Array<{
      _id: string;
      name: string;
      code: string;
      building: string;
      department?: { name: string; code: string };
    }>;
    computersWithExpiredWarranty: Array<{
      _id: string;
      assetTag: string;
      label: string;
      lab?: { name: string; code: string };
      warrantyExpiry: string;
      status: string;
    }>;
    labsWithNoComputers: Array<{
      _id: string;
      name: string;
      code: string;
      building: string;
      department?: { name: string; code: string };
    }>;
  };
}

export const AdminDashboard: React.FC = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data as DashboardStats;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 bg-muted rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-72 bg-muted/60 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Failed to load administrator metrics</h2>
          <p className="text-sm text-muted-foreground">
            {(error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message || 'An unexpected server error occurred.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const stats = data!;
  const totalUsers = Object.values(stats.usersByRole).reduce((a, b) => a + b, 0);
  const totalComputers =
    stats.computersByStatus.ACTIVE +
    stats.computersByStatus.UNDER_MAINTENANCE +
    stats.computersByStatus.RETIRED;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in-0 duration-200">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            System Administration Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Central operational status, user telemetry, asset health, and maintenance queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Refreshing...' : 'Refresh Telemetry'}
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="hover:border-primary/40 transition-colors shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Institutional Users
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.usersByRole.STUDENT} Students * {stats.usersByRole.FACULTY} Faculty *{' '}
              {stats.usersByRole.LAB_ASSISTANT} Staff
            </p>
          </CardContent>
        </Card>

        {/* Total Laboratories */}
        <Card className="hover:border-primary/40 transition-colors shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Laboratories
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <FlaskConical className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{stats.totalLabs}</div>
            <p className="text-xs text-muted-foreground">
              Campus computer labs with unique QR deep-links
            </p>
          </CardContent>
        </Card>

        {/* Computers Fleet */}
        <Card className="hover:border-primary/40 transition-colors shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workstation Fleet
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Monitor className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{totalComputers}</div>
            <p className="text-xs text-emerald-600 font-medium">
              {stats.computersByStatus.ACTIVE} Active * {stats.computersByStatus.UNDER_MAINTENANCE} In Maintenance
            </p>
          </CardContent>
        </Card>

        {/* Open Work Orders */}
        <Card className="hover:border-primary/40 transition-colors shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Open Maintenance Orders
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{stats.openTicketsCount}</div>
            <p className="text-xs text-muted-foreground">Active complaints in workflow</p>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Approvals Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pending Faculty Approvals */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Faculty Registrations Pending Approval
              </h2>
              <p className="text-xs text-muted-foreground">
                {stats.pendingFacultyCount === 0
                  ? 'All faculty accounts are currently approved.'
                  : `${stats.pendingFacultyCount} instructor(s) awaiting credentials verification.`}
              </p>
            </div>
          </div>
          {stats.pendingFacultyCount > 0 ? (
            <Link to="/admin/users?role=FACULTY&status=PENDING">
              <Button size="sm" variant="default" className="text-xs shrink-0 gap-1.5">
                Review <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          ) : (
            <Badge variant="status_resolved" size="sm">
              All Clear
            </Badge>
          )}
        </div>

        {/* Pending Deactivation Requests */}
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Pending Account Deactivations
              </h2>
              <p className="text-xs text-muted-foreground">
                {stats.pendingDeactivationsCount === 0
                  ? 'No pending account deletion or deactivation requests.'
                  : `${stats.pendingDeactivationsCount} member(s) submitted deactivation requests.`}
              </p>
            </div>
          </div>
          {stats.pendingDeactivationsCount > 0 ? (
            <Link to="/admin/users?tab=deactivations">
              <Button size="sm" variant="destructive" className="text-xs shrink-0 gap-1.5">
                Inspect <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          ) : (
            <Badge variant="status_resolved" size="sm">
              All Clear
            </Badge>
          )}
        </div>
      </div>

      {/* Warning Lists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
            Operational Attention & Warning Alerts
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Labs without an Assistant */}
          <Card className="border-border shadow-soft flex flex-col">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Labs Without Assistant
                </CardTitle>
                <Badge
                  variant={stats.warnings.labsWithoutAssistant.length > 0 ? 'priority_high' : 'status_resolved'}
                  size="sm"
                >
                  {stats.warnings.labsWithoutAssistant.length}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Unassigned labs cannot automatically route student tickets.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 flex-1 flex flex-col justify-between">
              {stats.warnings.labsWithoutAssistant.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <span>All active labs have at least one assigned assistant.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {stats.warnings.labsWithoutAssistant.map((lab) => (
                    <div
                      key={lab._id}
                      className="p-2.5 rounded-lg border border-border/80 bg-muted/30 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{lab.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {lab.code} * {lab.building}
                        </div>
                      </div>
                      <Link to="/admin/labs">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]">
                          Assign
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Computers with Expired Warranty */}
          <Card className="border-border shadow-soft flex flex-col">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Expired Hardware Warranty
                </CardTitle>
                <Badge
                  variant={stats.warnings.computersWithExpiredWarranty.length > 0 ? 'priority_medium' : 'status_resolved'}
                  size="sm"
                >
                  {stats.warnings.computersWithExpiredWarranty.length}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Assets requiring institutional service contracts or renewal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 flex-1 flex flex-col justify-between">
              {stats.warnings.computersWithExpiredWarranty.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <span>No active computers have expired warranties.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {stats.warnings.computersWithExpiredWarranty.slice(0, 8).map((pc) => (
                    <div
                      key={pc._id}
                      className="p-2.5 rounded-lg border border-border/80 bg-muted/30 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{pc.assetTag}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {pc.label} * Exp: {new Date(pc.warrantyExpiry).toLocaleDateString()}
                        </div>
                      </div>
                      <Link to="/admin/computers">
                        <Button size="sm" variant="ghost" className="h-7 text-[11px]">
                          Inspect
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {stats.warnings.computersWithExpiredWarranty.length > 8 && (
                    <p className="text-[11px] text-muted-foreground text-center pt-1">
                      +{stats.warnings.computersWithExpiredWarranty.length - 8} more in computers section
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Labs with No Computers */}
          <Card className="border-border shadow-soft flex flex-col">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Empty Labs (No PCs)
                </CardTitle>
                <Badge
                  variant={stats.warnings.labsWithNoComputers.length > 0 ? 'priority_low' : 'status_resolved'}
                  size="sm"
                >
                  {stats.warnings.labsWithNoComputers.length}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Laboratories defined in database with zero registered PCs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 flex-1 flex flex-col justify-between">
              {stats.warnings.labsWithNoComputers.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <span>All registered laboratories possess active computer assets.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {stats.warnings.labsWithNoComputers.map((lab) => (
                    <div
                      key={lab._id}
                      className="p-2.5 rounded-lg border border-border/80 bg-muted/30 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{lab.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {lab.code} * {lab.building}
                        </div>
                      </div>
                      <Link to="/admin/computers">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]">
                          + Add PC
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-semibold text-foreground">Quick Management Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/admin/users"
            className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-center flex flex-col items-center gap-2 shadow-soft"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">User Accounts</span>
          </Link>

          <Link
            to="/admin/departments"
            className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-center flex flex-col items-center gap-2 shadow-soft"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Departments</span>
          </Link>

          <Link
            to="/admin/labs"
            className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-center flex flex-col items-center gap-2 shadow-soft"
          >
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <FlaskConical className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Laboratories</span>
          </Link>

          <Link
            to="/admin/computers"
            className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-center flex flex-col items-center gap-2 shadow-soft"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Monitor className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Computers</span>
          </Link>

          <Link
            to="/admin/settings"
            className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-center flex flex-col items-center gap-2 shadow-soft"
          >
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Settings</span>
          </Link>

          <Link
            to="/admin/audit"
            className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-center flex flex-col items-center gap-2 shadow-soft"
          >
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ScrollText className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Audit Trail</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
