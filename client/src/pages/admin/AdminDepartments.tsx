import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Department, User } from '../../types';
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  FlaskConical,
  Users,
  Search,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  EmptyState,
  Input,
  Select,
  SkeletonCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  useToast,
} from '../../components/ui';

export const AdminDepartments: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hodId, setHodId] = useState('');
  const [authorityIds, setAuthorityIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // 1. Fetch Departments
  const { data: departments = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: async () => {
      const res = await api.get('/admin/departments');
      return res.data.data as Department[];
    },
  });

  // 2. Fetch Eligible Users for HOD & Authority
  const { data: hodCandidates = [] } = useQuery({
    queryKey: ['admin', 'candidates', 'HOD'],
    queryFn: async () => {
      const res = await api.get('/admin/users?role=HOD&limit=100');
      return res.data.data.users as User[];
    },
  });

  const { data: authorityCandidates = [] } = useQuery({
    queryKey: ['admin', 'candidates', 'DEPT_AUTHORITY'],
    queryFn: async () => {
      const res = await api.get('/admin/users?role=DEPT_AUTHORITY&limit=100');
      return res.data.data.users as User[];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/departments', {
        name,
        code,
        hod: hodId || null,
        authorities: authorityIds,
        isActive,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Department created', message: `Department ${code} was added.` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      resetForm();
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Creation failed',
        message: err.response?.data?.error?.message || 'Could not create department',
      });
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingDept) return;
      await api.put(`/admin/departments/${editingDept._id}`, {
        name,
        code,
        hod: hodId || null,
        authorities: authorityIds,
        isActive,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Department updated', message: `Department ${code} updated successfully.` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      resetForm();
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Update failed',
        message: err.response?.data?.error?.message || 'Could not update department',
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deletingDept) return;
      await api.delete(`/admin/departments/${deletingDept._id}`);
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Department deleted', message: 'Department soft-deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      setDeletingDept(null);
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Deletion blocked',
        message: err.response?.data?.error?.message || 'Cannot delete department',
      });
      setDeletingDept(null);
    },
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setHodId('');
    setAuthorityIds([]);
    setIsActive(true);
    setIsCreateOpen(false);
    setEditingDept(null);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setHodId(
      typeof dept.hod === 'object' && dept.hod !== null && '_id' in dept.hod
        ? (dept.hod as { _id: string })._id
        : typeof dept.hod === 'string'
        ? dept.hod
        : ''
    );
    setAuthorityIds(
      Array.isArray(dept.authorities)
        ? dept.authorities.map((a) =>
            typeof a === 'object' && a !== null && '_id' in a ? (a as { _id: string })._id : String(a)
          )
        : []
    );
    setIsActive(dept.isActive);
  };

  const filteredDepts = departments.filter((d) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return d.name.toLowerCase().includes(term) || d.code.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Academic Departments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage academic faculties, designate Head of Departments, and configure departmental authorities.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 text-xs self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-sm relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by department name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      {/* Departments Table */}
      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-foreground">Failed to load academic departments</p>
        </div>
      ) : filteredDepts.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Create your first academic department to begin grouping laboratories."
          actionLabel="+ Add Department"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name & Code</TableHead>
              <TableHead>Head of Department (HOD)</TableHead>
              <TableHead>Department Authorities</TableHead>
              <TableHead>Laboratories</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDepts.map((dept) => {
              const hodUser = typeof dept.hod === 'object' ? dept.hod : null;
              const authorities = Array.isArray(dept.authorities) ? dept.authorities : [];

              return (
                <TableRow key={dept._id}>
                  {/* Name & Code */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {dept.code}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-xs">{dept.name}</div>
                        <div className="text-[11px] text-muted-foreground">Code: {dept.code}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* HOD */}
                  <TableCell>
                    {hodUser ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {(hodUser.avatar?.url || hodUser.picture) && (
                            <AvatarImage src={hodUser.avatar?.url || hodUser.picture} alt={hodUser.name} />
                          )}
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {hodUser.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">{hodUser.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None assigned</span>
                    )}
                  </TableCell>

                  {/* Authorities */}
                  <TableCell>
                    {authorities.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {authorities.slice(0, 2).map((a) => {
                          const isObj = typeof a === 'object' && a !== null;
                          const key = isObj && '_id' in a ? (a as { _id: string })._id : String(a);
                          const label = isObj && 'name' in a ? (a as { name: string }).name : 'Authority';
                          return (
                            <Badge key={key} variant="status_in_progress" size="sm">
                              {label}
                            </Badge>
                          );
                        })}
                        {authorities.length > 2 && (
                          <span className="text-[11px] text-muted-foreground">
                            +{authorities.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None assigned</span>
                    )}
                  </TableCell>

                  {/* Labs Count */}
                  <TableCell>
                    <Badge variant="status_assigned" size="sm" className="gap-1">
                      <FlaskConical className="h-3 w-3" />
                      {dept.labsCount || 0} labs
                    </Badge>
                  </TableCell>

                  {/* Users Count */}
                  <TableCell>
                    <Badge variant="status_open" size="sm" className="gap-1">
                      <Users className="h-3 w-3" />
                      {dept.usersCount || 0} users
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={dept.isActive ? 'status_resolved' : 'priority_high'} size="sm">
                      {dept.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs hover:bg-muted"
                        onClick={() => openEdit(dept)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingDept(dept)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* ======================================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* ======================================================== */}
      <Dialog
        open={isCreateOpen || !!editingDept}
        onOpenChange={(open) => !open && resetForm()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
            <DialogDescription>
              Configure department credentials, assigned Head of Department, and authorized authorities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Department Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Department Name *</label>
              <Input
                placeholder="e.g. Computer Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Department Code */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Unique Code *</label>
              <Input
                placeholder="e.g. COMP"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-xs uppercase"
              />
            </div>

            {/* HOD Select */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Head of Department (HOD)</label>
              <Select
                value={hodId}
                onChange={(e) => setHodId(e.target.value)}
                className="w-full text-xs"
              >
                <option value="">None (Unassigned)</option>
                {hodCandidates.map((u) => {
                  const uId = u.id || u._id || '';
                  return (
                    <option key={uId} value={uId}>
                      {u.name} ({u.email})
                    </option>
                  );
                })}
              </Select>
            </div>

            {/* Department Authorities Multi-select placeholder/chips */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Department Authorities</label>
              <div className="p-2.5 rounded-lg border border-border bg-card max-h-36 overflow-y-auto space-y-1">
                {authorityCandidates.length === 0 ? (
                  <p className="text-muted-foreground italic">No users with DEPT_AUTHORITY role found.</p>
                ) : (
                  authorityCandidates.map((u) => {
                    const uId = u.id || u._id || '';
                    const isChecked = authorityIds.includes(uId);
                    return (
                      <label
                        key={uId}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAuthorityIds((prev) => [...prev, uId]);
                            } else {
                              setAuthorityIds((prev) => prev.filter((id) => id !== uId));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="font-medium">{u.name}</span>
                        <span className="text-[11px] text-muted-foreground">({u.email})</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                !name.trim() ||
                !code.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              onClick={() => {
                if (editingDept) {
                  updateMutation.mutate();
                } else {
                  createMutation.mutate();
                }
              }}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingDept
                ? 'Save Changes'
                : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={!!deletingDept} onOpenChange={(open) => !open && setDeletingDept(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{deletingDept?.name} ({deletingDept?.code})</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs space-y-2">
            {deletingDept && ((deletingDept.labsCount || 0) > 0 || (deletingDept.usersCount || 0) > 0) ? (
              <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Deletion Guard Warning:</p>
                  <p className="mt-0.5">
                    This department currently has <strong>{deletingDept.labsCount || 0}</strong>{' '}
                    laboratory/laboratories and <strong>{deletingDept.usersCount || 0}</strong>{' '}
                    member(s) assigned. The server will reject deletion until they are reassigned.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                This will soft-delete the department record from active listings.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingDept(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDepartments;
