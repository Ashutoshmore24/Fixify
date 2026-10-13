import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { User, Laboratory, Department } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  SkeletonCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  useToast,
} from '../../components/ui';

interface ProvisionStaffPayload {
  name: string;
  email: string;
  role: 'LAB_ASSISTANT' | 'ADMIN';
  password?: string;
  department?: string;
  assignedLabs?: string[];
}

interface ProvisioningDataResponse {
  staff: User[];
  laboratories: Laboratory[];
  departments: Department[];
}

export const ProvisionStaff: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProvisionStaffPayload>({
    name: '',
    email: '',
    role: 'LAB_ASSISTANT',
    password: '',
    department: '',
    assignedLabs: [],
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Security Guard: Defense-in-depth role check
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="access-denied">
          Access Denied
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Staff provisioning requires institutional Administrator privileges. Your role does not have authorization to view or execute provisioning actions.
        </p>
      </div>
    );
  }

  // 1. Fetch Staff & Available Labs via Admin API
  const { data, isLoading, error, refetch } = useQuery<ProvisioningDataResponse>({
    queryKey: ['admin-provision-staff'],
    queryFn: async () => {
      const res = await api.get('/admin/provision-staff');
      return res.data?.data;
    },
  });

  // 2. Mutation for Provisioning
  const provisionMutation = useMutation({
    mutationFn: async (payload: ProvisionStaffPayload) => {
      const res = await api.post('/admin/provision-staff', payload);
      return res.data;
    },
    onSuccess: (data) => {
      addToast({
        title: 'Staff Provisioned',
        message: data?.message || 'Staff account was successfully provisioned on server.',
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-provision-staff'] });
      setDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        role: 'LAB_ASSISTANT',
        password: '',
        department: '',
        assignedLabs: [],
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to provision staff account.';
      setFormError(msg);
      addToast({
        title: 'Provisioning Error',
        message: msg,
        type: 'error',
      });
    },
  });

  const staffList = data?.staff || [];
  const labsList = data?.laboratories || [];
  const deptList = data?.departments || [];

  const filteredStaff = staffList.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.role?.toLowerCase().includes(term)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Staff member full name is required');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Valid institutional email address is required');
      return;
    }

    if (!formData.email.endsWith('@pccoepune.org') && !formData.email.endsWith('@pccoe.org')) {
      setFormError('Staff emails must belong to the institutional domain (@pccoepune.org)');
      return;
    }

    provisionMutation.mutate(formData);
  };

  const handleToggleLab = (labId: string) => {
    setFormData((prev) => {
      const current = prev.assignedLabs || [];
      if (current.includes(labId)) {
        return { ...prev, assignedLabs: current.filter((id) => id !== labId) };
      } else {
        return { ...prev, assignedLabs: [...current, labId] };
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Staff Provisioning Directory
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Admin Authorized
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Secure server-side provisioning and laboratory workstation assignment for institutional assistants and administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1.5"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Provision Staff Member
          </Button>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Zero-Trust Server-Side Provisioning Boundary
          </p>
          <p className="leading-relaxed">
            All user creation, role assignment, and Firebase Authentication credential issuance are strictly performed on the trusted backend via Firebase Admin SDK. Privileged service account credentials and database secrets are never exposed to the client bundle.
          </p>
        </div>
      </div>

      {/* Search & Statistics Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Total Staff Accounts: <strong className="text-foreground">{staffList.length}</strong></span>
          <span>•</span>
          <span>Available Laboratories: <strong className="text-foreground">{labsList.length}</strong></span>
        </div>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-destructive/20 bg-destructive/5 space-y-2">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="font-semibold text-foreground">Failed to Load Staff Directory</h3>
          <p className="text-xs text-muted-foreground">Please check network connectivity or refresh your session.</p>
        </Card>
      ) : filteredStaff.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-xs">
          No staff accounts found matching your query.
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border shadow-soft">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs font-semibold">Staff Member</TableHead>
                <TableHead className="text-xs font-semibold">Institutional Email</TableHead>
                <TableHead className="text-xs font-semibold">Role</TableHead>
                <TableHead className="text-xs font-semibold">Assigned Laboratories</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staffUser) => (
                <TableRow key={staffUser._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        {staffUser.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{staffUser.name}</p>
                        <p className="text-[10px] text-muted-foreground">ID: {(staffUser._id || '').substring(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-mono">
                    {staffUser.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={staffUser.role === 'ADMIN' ? 'default' : 'secondary'}
                      className="text-[10px] font-semibold uppercase"
                    >
                      {staffUser.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {staffUser.assignedLabs && staffUser.assignedLabs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {staffUser.assignedLabs.map((l: any) => (
                          <span
                            key={l._id || l.code}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground"
                          >
                            {l.code || l.roomNumber || l.name}
                          </span>
                        ))}
                      </div>
                    ) : staffUser.role === 'ADMIN' ? (
                      <span className="text-[11px] text-muted-foreground italic">All Labs (Global Admin)</span>
                    ) : (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Provisioning Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <UserPlus className="w-5 h-5 text-primary" /> Provision Staff Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create or configure an authorized institutional Lab Assistant or Administrator with verified credentials and laboratory assignment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Mrs. Shradha Gade"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                leftIcon={<UserIcon className="w-4 h-4 text-muted-foreground" />}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Institutional Email Address *
              </label>
              <Input
                type="email"
                placeholder="e.g. shradha.gade@pccoepune.org"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
                required
              />
              <span className="text-[10px] text-muted-foreground">Must use the official @pccoepune.org campus domain.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Privileged Role *
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                >
                  <option value="LAB_ASSISTANT">LAB_ASSISTANT</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Department
                </label>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {deptList.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Initial Password (Optional)
              </label>
              <Input
                type="password"
                placeholder="Leave blank for secure auto-generated password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
              />
              <span className="text-[10px] text-muted-foreground">Minimum 6 characters. Synced directly into Firebase Authentication.</span>
            </div>

            {formData.role === 'LAB_ASSISTANT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Assigned Laboratories
                </label>
                <div className="max-h-36 overflow-y-auto p-2 border border-border rounded-lg bg-muted/20 space-y-1">
                  {labsList.map((lab) => {
                    const isChecked = (formData.assignedLabs || []).includes(lab._id);
                    return (
                      <label
                        key={lab._id}
                        className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleLab(lab._id)}
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="font-medium">{lab.code}</span>
                        <span className="text-muted-foreground">({lab.name})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={provisionMutation.isPending}
                className="bg-primary text-primary-foreground font-semibold"
              >
                Provision Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProvisionStaff;
