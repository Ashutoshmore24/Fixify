import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole, Department, Ticket } from '../../types';
import {
  Search,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  EmptyState,
  Input,
  Select,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SkeletonCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
  useToast,
} from '../../components/ui';

interface DeactivationRequestItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: { url: string };
    picture?: string;
    department?: { name: string; code: string };
  };
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
}

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'deactivations'>('users');

  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selected User for Detail Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Dialog States
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('STUDENT');
  const [roleReason, setRoleReason] = useState('');

  const [editFieldsUser, setEditFieldsUser] = useState<User | null>(null);
  const [editDeptId, setEditDeptId] = useState('');
  const [editPrn, setEditPrn] = useState('');
  const [editFieldsReason, setEditFieldsReason] = useState('');

  const [statusModalUser, setStatusModalUser] = useState<User | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const [approvalModalUser, setApprovalModalUser] = useState<User | null>(null);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalNote, setApprovalNote] = useState('');

  const [deactDecisionItem, setDeactDecisionItem] = useState<{
    request: DeactivationRequestItem;
    action: 'APPROVE' | 'REJECT';
  } | null>(null);
  const [deactNote, setDeactNote] = useState('');

  // 1. Fetch Users Query
  const { data: usersData, isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter, statusFilter, deptFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (deptFilter) params.append('department', deptFilter);
      params.append('page', String(page));
      params.append('limit', '15');

      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data.data as {
        users: User[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });

  // 2. Fetch Departments & Labs for selects
  const { data: departments = [] } = useQuery({
    queryKey: ['admin', 'departments-list'],
    queryFn: async () => {
      const res = await api.get('/admin/departments');
      return res.data.data as Department[];
    },
  });

  // 3. Fetch User Detail Query
  const { data: userDetailData, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'user-detail', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const res = await api.get(`/admin/users/${selectedUserId}`);
      return res.data.data as {
        user: User;
        ticketsCount: number;
        recentTickets: Ticket[];
      };
    },
    enabled: !!selectedUserId,
  });

  // 4. Fetch Deactivation Requests Query
  const { data: deactRequests = [], isLoading: deactLoading } = useQuery({
    queryKey: ['admin', 'deactivations'],
    queryFn: async () => {
      const res = await api.get('/admin/deactivations');
      return res.data.data as DeactivationRequestItem[];
    },
  });

  // Mutations
  const roleMutation = useMutation({
    mutationFn: async () => {
      if (!roleModalUser) return;
      await api.patch(`/admin/users/${roleModalUser.id || roleModalUser._id}/role`, {
        role: newRole,
        reason: roleReason,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Role updated', message: 'User role updated and active sessions revoked.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setRoleModalUser(null);
      setRoleReason('');
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({ type: 'error', title: 'Role update failed', message: err.response?.data?.error?.message || 'Could not update role' });
    },
  });

  const editFieldsMutation = useMutation({
    mutationFn: async () => {
      if (!editFieldsUser) return;
      await api.patch(`/admin/users/${editFieldsUser.id || editFieldsUser._id}`, {
        department: editDeptId || null,
        prn: editPrn || null,
        reason: editFieldsReason,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Profile updated', message: 'Institutional fields updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditFieldsUser(null);
      setEditFieldsReason('');
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({ type: 'error', title: 'Update failed', message: err.response?.data?.error?.message || 'Could not update profile' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async () => {
      if (!statusModalUser) return;
      const newStatus = !statusModalUser.isActive;
      await api.patch(`/admin/users/${statusModalUser.id || statusModalUser._id}/status`, {
        isActive: newStatus,
        reason: statusReason,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Status changed', message: 'Account status updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setStatusModalUser(null);
      setStatusReason('');
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({ type: 'error', title: 'Status change failed', message: err.response?.data?.error?.message || 'Action failed' });
    },
  });


  const approvalMutation = useMutation({
    mutationFn: async () => {
      if (!approvalModalUser) return;
      await api.patch(`/admin/users/${approvalModalUser.id || approvalModalUser._id}/faculty-approval`, {
        action: approvalAction,
        note: approvalNote,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Decision saved', message: 'Faculty registration status updated and user notified.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setApprovalModalUser(null);
      setApprovalNote('');
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({ type: 'error', title: 'Failed', message: err.response?.data?.error?.message || 'Could not process decision' });
    },
  });

  const deactivationDecisionMutation = useMutation({
    mutationFn: async () => {
      if (!deactDecisionItem) return;
      const endpoint =
        deactDecisionItem.action === 'APPROVE'
          ? `/admin/deactivations/${deactDecisionItem.request._id}/approve`
          : `/admin/deactivations/${deactDecisionItem.request._id}/reject`;

      await api.post(endpoint, { note: deactNote });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Decision recorded', message: 'Deactivation request updated and audited.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'deactivations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeactDecisionItem(null);
      setDeactNote('');
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({ type: 'error', title: 'Failed', message: err.response?.data?.error?.message || 'Could not process deactivation decision' });
    },
  });

  const roleBadgeMap: Record<UserRole, { label: string; variant: 'status_open' | 'status_assigned' | 'status_accepted' | 'status_in_progress' | 'status_resolved' | 'status_escalated' }> = {
    STUDENT: { label: 'Student', variant: 'status_open' },
    FACULTY: { label: 'Faculty', variant: 'status_accepted' },
    LAB_ASSISTANT: { label: 'Assistant', variant: 'status_assigned' },
    DEPT_AUTHORITY: { label: 'Authority', variant: 'status_in_progress' },
    HOD: { label: 'HOD', variant: 'status_resolved' },
    ADMIN: { label: 'Admin', variant: 'status_escalated' },
  };

  const users = usersData?.users || [];
  const pagination = usersData?.pagination;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User Accounts & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit institutional directory, manage RBAC privileges, verify faculty, and handle deactivations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'deactivations')} className="w-full">
        <TabsList className="grid w-full sm:w-80 grid-cols-2">
          <TabsTrigger value="users">Institutional Users</TabsTrigger>
          <TabsTrigger value="deactivations" className="relative">
            Deactivation Requests
            {deactRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {deactRequests.filter((r) => r.status === 'PENDING').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: USERS DIRECTORY */}
        {/* ======================================================== */}
        <TabsContent value="users" className="space-y-4 pt-2">
          {/* Filters Bar */}
          <Card className="p-4 shadow-soft">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, PRN..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Role Filter */}
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="LAB_ASSISTANT">Lab Assistant</option>
                <option value="DEPT_AUTHORITY">Dept Authority</option>
                <option value="HOD">HOD</option>
                <option value="ADMIN">Administrator</option>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active Accounts</option>
                <option value="DEACTIVATED">Deactivated Accounts</option>
              </Select>

              {/* Department Filter */}
              <Select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Table Container */}
          {usersLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : usersError ? (
            <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-foreground">Failed to load directory</p>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              title="No users match your criteria"
              description="Try adjusting your search terms or clearing role/department filters."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearch('');
                setRoleFilter('');
                setStatusFilter('');
                setDeptFilter('');
              }}
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department / PRN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sign-In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const uId = u.id || u._id || '';
                    const isSelf = Boolean(currentUser && (currentUser.id === uId || currentUser._id === uId));
                    const isDeactivated = !u.isActive;
                    const isPendingFaculty = u.role === 'FACULTY' && u.approvalStatus === 'PENDING_APPROVAL';

                    return (
                      <TableRow key={uId}>
                        {/* User Column */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {(u.avatar?.url || u.picture) && (
                                <AvatarImage src={u.avatar?.url || u.picture} alt={u.name} />
                              )}
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                {u.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role Column */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={roleBadgeMap[u.role]?.variant || 'status_open'} size="sm">
                              {roleBadgeMap[u.role]?.label || u.role}
                            </Badge>
                            {isPendingFaculty && (
                              <Badge variant="priority_high" size="sm">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Department / PRN */}
                        <TableCell>
                          <div className="text-xs">
                            <span className="text-foreground font-medium">
                              {typeof u.department === 'object' && u.department !== null && 'code' in u.department
                                ? u.department.code
                                : 'Unassigned'}
                            </span>
                            {u.prn && (
                              <div className="text-[11px] text-muted-foreground">PRN: {u.prn}</div>
                            )}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant={isDeactivated ? 'priority_high' : 'status_resolved'}
                            size="sm"
                          >
                            {isDeactivated ? 'Deactivated' : 'Active'}
                          </Badge>
                        </TableCell>

                        {/* Last Sign-In */}
                        <TableCell className="text-xs text-muted-foreground">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleDateString()
                            : 'Never'}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Drawer */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Inspect Details"
                              onClick={() => setSelectedUserId(uId)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Faculty Approval Quick Button */}
                            {isPendingFaculty && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                                onClick={() => {
                                  setApprovalModalUser(u);
                                  setApprovalAction('APPROVE');
                                }}
                              >
                                Review
                              </Button>
                            )}

                            {/* Change Role Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-primary hover:bg-primary/10"
                              onClick={() => {
                                setRoleModalUser(u);
                                setNewRole(u.role);
                              }}
                              disabled={isSelf}
                              title={isSelf ? 'Cannot demote yourself' : 'Change Role'}
                            >
                              Role
                            </Button>

                            {/* Edit Fields Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs hover:bg-muted"
                              onClick={() => {
                                setEditFieldsUser(u);
                                setEditDeptId(
                                  typeof u.department === 'object' && u.department !== null && '_id' in u.department
                                    ? u.department._id
                                    : typeof u.department === 'string'
                                    ? u.department
                                    : ''
                                );
                                setEditPrn(u.prn || '');
                              }}
                            >
                              Edit
                            </Button>

                            {/* Deactivate / Activate Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 text-xs ${
                                isDeactivated
                                  ? 'text-emerald-600 hover:bg-emerald-500/10'
                                  : 'text-destructive hover:bg-destructive/10'
                              }`}
                              onClick={() => setStatusModalUser(u)}
                              disabled={isSelf}
                              title={isSelf ? 'Cannot deactivate yourself' : undefined}
                            >
                              {isDeactivated ? 'Activate' : 'Deactivate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Server-Side Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <div>
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Previous
                    </Button>
                    <span className="px-2 font-medium text-foreground">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: DEACTIVATION REQUESTS */}
        {/* ======================================================== */}
        <TabsContent value="deactivations" className="space-y-4 pt-2">
          {deactLoading ? (
            <SkeletonCard />
          ) : deactRequests.length === 0 ? (
            <EmptyState
              title="No account deactivation requests"
              description="Members who request deactivation from their profile settings will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Account</TableHead>
                  <TableHead>Reason Submitted</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deactRequests.map((req) => (
                  <TableRow key={req._id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          {(req.user?.avatar?.url || req.user?.picture) && (
                            <AvatarImage
                              src={req.user.avatar?.url || req.user.picture}
                              alt={req.user.name}
                            />
                          )}
                          <AvatarFallback className="text-xs bg-muted">
                            {req.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground text-xs">
                            {req.user?.name || 'Deleted User'}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{req.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs text-xs text-foreground italic">
                      "{req.reason}"
                      {req.adminNote && (
                        <div className="text-[11px] text-muted-foreground not-italic mt-0.5">
                          Admin note: {req.adminNote}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          req.status === 'APPROVED'
                            ? 'status_resolved'
                            : req.status === 'REJECTED'
                            ? 'priority_high'
                            : 'priority_medium'
                        }
                        size="sm"
                      >
                        {req.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setDeactDecisionItem({ request: req, action: 'APPROVE' });
                            }}
                          >
                            Approve Deactivation
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setDeactDecisionItem({ request: req, action: 'REJECT' });
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* ======================================================== */}
      {/* USER DETAIL DRAWER (Radix Sheet) */}
      {/* ======================================================== */}
      <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto space-y-6">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">Institutional User Dossier</SheetTitle>
          </SheetHeader>

          {detailLoading || !userDetailData ? (
            <div className="space-y-4 pt-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                <Avatar className="h-14 w-14">
                  {(userDetailData.user.avatar?.url || userDetailData.user.picture) && (
                    <AvatarImage
                      src={userDetailData.user.avatar?.url || userDetailData.user.picture}
                      alt={userDetailData.user.name}
                    />
                  )}
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                    {userDetailData.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground text-sm truncate">
                    {userDetailData.user.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {userDetailData.user.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge
                      variant={roleBadgeMap[userDetailData.user.role]?.variant || 'status_open'}
                      size="sm"
                    >
                      {roleBadgeMap[userDetailData.user.role]?.label || userDetailData.user.role}
                    </Badge>
                    {!userDetailData.user.isActive && (
                      <Badge variant="priority_high" size="sm">
                        Deactivated
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Institutional Attributes */}
              <div className="space-y-3 text-xs">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                  Institutional Identifiers
                </h4>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-border/80 bg-card">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Department:</span>
                    <span className="font-medium text-foreground">
                      {typeof userDetailData.user.department === 'object' && userDetailData.user.department !== null && 'name' in userDetailData.user.department
                        ? userDetailData.user.department.name
                        : 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">PRN:</span>
                    <span className="font-medium text-foreground">
                      {userDetailData.user.prn || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Phone:</span>
                    <span className="font-medium text-foreground">
                      {userDetailData.user.phone || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Approval Status:</span>
                    <span className="font-medium text-foreground">
                      {userDetailData.user.approvalStatus || 'APPROVED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Labs (for assistants) */}
              {userDetailData.user.role === 'LAB_ASSISTANT' && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                    Assigned Laboratories
                  </h4>
                  {Array.isArray(userDetailData.user.assignedLabs) &&
                  userDetailData.user.assignedLabs.length > 0 ? (
                    <div className="space-y-1.5">
                      {userDetailData.user.assignedLabs.map((l) => {
                        const isObj = typeof l === 'object' && l !== null;
                        const key = isObj && '_id' in l ? l._id : String(l);
                        const name = isObj && 'name' in l ? l.name : String(l);
                        return (
                          <div
                            key={key}
                            className="p-2 rounded-md bg-muted/30 border border-border flex items-center justify-between"
                          >
                            <span className="font-medium">{name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No laboratories assigned yet.</p>
                  )}
                </div>
              )}

              {/* Recent Activity / Maintenance Tickets */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                    Maintenance History ({userDetailData.ticketsCount})
                  </h4>
                </div>
                {userDetailData.recentTickets.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No ticket activity on file.</p>
                ) : (
                  <div className="space-y-2">
                    {userDetailData.recentTickets.map((t) => (
                      <div
                        key={t._id}
                        className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{t.ticketId}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {t.category} * PC: {t.computer?.label || 'Asset'}
                          </div>
                        </div>
                        <Badge variant="status_assigned" size="sm">
                          {t.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ======================================================== */}
      {/* 1. CHANGE ROLE DIALOG */}
      {/* ======================================================== */}
      <Dialog open={!!roleModalUser} onOpenChange={(o) => !o && setRoleModalUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Assign new institutional permissions for{' '}
              <strong className="text-foreground">{roleModalUser?.name}</strong>. This action will
              immediately revoke all active sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Select New Role *</label>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full text-xs"
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="LAB_ASSISTANT">Lab Assistant</option>
                <option value="DEPT_AUTHORITY">Department Authority</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="ADMIN">System Administrator</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Administrative Reason for Change *
              </label>
              <Textarea
                placeholder="State institutional justification (e.g., promoted to Lab Assistant for LAB-101)..."
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRoleModalUser(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={roleReason.trim().length < 3 || roleMutation.isPending}
              onClick={() => roleMutation.mutate()}
            >
              {roleMutation.isPending ? 'Updating...' : 'Confirm Role Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 2. EDIT INSTITUTIONAL FIELDS DIALOG */}
      {/* ======================================================== */}
      <Dialog open={!!editFieldsUser} onOpenChange={(o) => !o && setEditFieldsUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Institutional Fields</DialogTitle>
            <DialogDescription>
              Modify department assignment and PRN for{' '}
              <strong className="text-foreground">{editFieldsUser?.name}</strong>. Required audit
              justification will be recorded.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Assigned Department</label>
              <Select
                value={editDeptId}
                onChange={(e) => setEditDeptId(e.target.value)}
                className="w-full text-xs"
              >
                <option value="">No Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">PRN (Student Identifier)</label>
              <Input
                placeholder="e.g. 121B1B042"
                value={editPrn}
                onChange={(e) => setEditPrn(e.target.value)}
                className="text-xs uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Administrative Reason *</label>
              <Textarea
                placeholder="Why are these fields being updated? (required for audit trail)..."
                value={editFieldsReason}
                onChange={(e) => setEditFieldsReason(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditFieldsUser(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={editFieldsReason.trim().length < 3 || editFieldsMutation.isPending}
              onClick={() => editFieldsMutation.mutate()}
            >
              {editFieldsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 3. STATUS TOGGLE DIALOG */}
      {/* ======================================================== */}
      <Dialog open={!!statusModalUser} onOpenChange={(o) => !o && setStatusModalUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusModalUser?.isActive ? 'Deactivate Account' : 'Reactivate Account'}
            </DialogTitle>
            <DialogDescription>
              {statusModalUser?.isActive
                ? `Deactivating ${statusModalUser?.name}'s account will terminate their active sessions and prevent login.`
                : `Reactivating ${statusModalUser?.name}'s account will restore their institutional access.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Reason for Status Change *</label>
              <Textarea
                placeholder="Specify the reason for deactivation or reactivation..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStatusModalUser(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={statusModalUser?.isActive ? 'destructive' : 'default'}
              disabled={statusReason.trim().length < 3 || statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
            >
              {statusMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 4. FACULTY APPROVAL DIALOG */}
      {/* ======================================================== */}
      <Dialog open={!!approvalModalUser} onOpenChange={(o) => !o && setApprovalModalUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Faculty Registration Review</DialogTitle>
            <DialogDescription>
              Verify institutional credentials for{' '}
              <strong className="text-foreground">{approvalModalUser?.name}</strong> (
              {approvalModalUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Decision</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant={approvalAction === 'APPROVE' ? 'default' : 'outline'}
                  onClick={() => setApprovalAction('APPROVE')}
                  className="flex-1 text-xs"
                >
                  Approve Faculty
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant={approvalAction === 'REJECT' ? 'destructive' : 'outline'}
                  onClick={() => setApprovalAction('REJECT')}
                  className="flex-1 text-xs"
                >
                  Reject
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Notification Note to Instructor</label>
              <Textarea
                placeholder="Optional verification note or reason if rejected..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApprovalModalUser(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={approvalMutation.isPending}
              onClick={() => approvalMutation.mutate()}
            >
              {approvalMutation.isPending ? 'Saving...' : 'Submit Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 5. DEACTIVATION REQUEST REVIEW DIALOG */}
      {/* ======================================================== */}
      <Dialog open={!!deactDecisionItem} onOpenChange={(o) => !o && setDeactDecisionItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deactDecisionItem?.action === 'APPROVE'
                ? 'Approve Deactivation Request'
                : 'Reject Deactivation Request'}
            </DialogTitle>
            <DialogDescription>
              {deactDecisionItem?.action === 'APPROVE'
                ? `This will soft-delete user account (${deactDecisionItem.request.user?.name}), revoke active sessions, and notify them.`
                : `This will decline user (${deactDecisionItem?.request.user?.name})'s request and send them an explanatory notice.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
              <strong>User's Stated Reason:</strong> "{deactDecisionItem?.request.reason}"
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Administrative Note to User {deactDecisionItem?.action === 'REJECT' && '*'}
              </label>
              <Textarea
                placeholder="Include a short explanation for the user..."
                value={deactNote}
                onChange={(e) => setDeactNote(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeactDecisionItem(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={deactDecisionItem?.action === 'APPROVE' ? 'destructive' : 'default'}
              disabled={
                deactivationDecisionMutation.isPending ||
                (deactDecisionItem?.action === 'REJECT' && deactNote.trim().length === 0)
              }
              onClick={() => deactivationDecisionMutation.mutate()}
            >
              {deactivationDecisionMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
