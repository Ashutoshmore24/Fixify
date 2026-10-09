import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Computer, Laboratory, Ticket } from '../../types';
import {
  Monitor,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  Cpu,
  HardDrive,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
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
  Textarea,
  useToast,
} from '../../components/ui';

export const AdminComputers: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warrantyExpiredFilter, setWarrantyExpiredFilter] = useState(false);
  const [page, setPage] = useState(1);

  // Selection for bulk status change
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<string>('ACTIVE');

  // Detail Drawer
  const [inspectComputerId, setInspectComputerId] = useState<string | null>(null);

  // Create / Edit Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingComputer, setEditingComputer] = useState<Computer | null>(null);
  const [deletingComputer, setDeletingComputer] = useState<Computer | null>(null);

  // Computer Form Fields
  const [assetTag, setAssetTag] = useState('');
  const [labId, setLabId] = useState('');
  const [label, setLabel] = useState('');
  const [processor, setProcessor] = useState('Intel Core i5');
  const [ram, setRam] = useState('8 GB DDR4');
  const [storage, setStorage] = useState('256 GB SSD');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [vendor, setVendor] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'UNDER_MAINTENANCE' | 'RETIRED'>('ACTIVE');
  const [notes, setNotes] = useState('');

  // Bulk CSV Import Modal States
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    validRows: Array<{
      assetTag: string;
      labCode: string;
      label: string;
      processor: string;
      ram: string;
      storage: string;
    }>;
    invalidRows: Array<{
      rowNumber: number;
      assetTag: string;
      errors: string[];
    }>;
  } | null>(null);

  // 1. Fetch Computers
  const { data: computersData, isLoading, isError } = useQuery({
    queryKey: [
      'admin',
      'computers',
      { search, labFilter, statusFilter, warrantyExpiredFilter, page },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (labFilter) params.append('lab', labFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (warrantyExpiredFilter) params.append('warrantyExpired', 'true');
      params.append('page', String(page));
      params.append('limit', '15');

      const res = await api.get(`/admin/computers?${params.toString()}`);
      return res.data.data as {
        computers: Computer[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });

  // 2. Fetch Labs for Select
  const { data: laboratories = [] } = useQuery({
    queryKey: ['admin', 'labs-list'],
    queryFn: async () => {
      const res = await api.get('/admin/labs');
      return res.data.data as Laboratory[];
    },
  });

  // 3. Fetch Inspected Computer Detail (Specs + Maintenance History)
  const { data: computerDetailData, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'computer-detail', inspectComputerId],
    queryFn: async () => {
      if (!inspectComputerId) return null;
      const res = await api.get(`/admin/computers/${inspectComputerId}`);
      return res.data.data as {
        computer: Computer;
        maintenanceHistory: Ticket[];
      };
    },
    enabled: !!inspectComputerId,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/computers', {
        assetTag,
        lab: labId,
        label,
        processor,
        ram,
        storage,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,
        vendor,
        status,
        notes,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Computer added', message: `Computer ${assetTag} created successfully.` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'computers'] });
      resetForm();
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Creation failed',
        message: err.response?.data?.error?.message || 'Could not add computer asset',
      });
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingComputer) return;
      await api.put(`/admin/computers/${editingComputer._id}`, {
        assetTag,
        lab: labId,
        label,
        processor,
        ram,
        storage,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,
        vendor,
        status,
        notes,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Computer updated', message: `Asset ${assetTag} updated successfully.` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'computers'] });
      resetForm();
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Update failed',
        message: err.response?.data?.error?.message || 'Could not update computer asset',
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deletingComputer) return;
      await api.delete(`/admin/computers/${deletingComputer._id}`);
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Computer deleted', message: 'Workstation asset soft-deleted.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'computers'] });
      setDeletingComputer(null);
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Deletion blocked',
        message: err.response?.data?.error?.message || 'Could not delete computer',
      });
      setDeletingComputer(null);
    },
  });

  // Bulk Status Change Mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/admin/computers/bulk-status', {
        ids: selectedIds,
        status: bulkNewStatus,
      });
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Bulk status updated',
        message: `Updated status for ${selectedIds.length} computer(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'computers'] });
      setSelectedIds([]);
      setBulkStatusOpen(false);
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Bulk update failed',
        message: err.response?.data?.error?.message || 'Could not update computers',
      });
    },
  });

  // Confirm CSV Import Mutation
  const confirmCsvMutation = useMutation({
    mutationFn: async () => {
      if (!csvPreviewData || csvPreviewData.validRows.length === 0) return;
      await api.post('/admin/computers/import/confirm', {
        validRows: csvPreviewData.validRows,
      });
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Bulk import successful',
        message: `Successfully imported ${csvPreviewData?.validRows.length} workstation assets.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'computers'] });
      closeCsvModal();
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Import failed',
        message: err.response?.data?.error?.message || 'Could not complete import',
      });
    },
  });

  const resetForm = () => {
    setAssetTag('');
    setLabId('');
    setLabel('');
    setProcessor('Intel Core i5');
    setRam('8 GB DDR4');
    setStorage('256 GB SSD');
    setPurchaseDate('');
    setWarrantyExpiry('');
    setVendor('');
    setStatus('ACTIVE');
    setNotes('');
    setIsCreateOpen(false);
    setEditingComputer(null);
  };

  const openEdit = (pc: Computer) => {
    setEditingComputer(pc);
    setAssetTag(pc.assetTag);
    setLabId(typeof pc.lab === 'object' && pc.lab !== null && '_id' in pc.lab ? pc.lab._id : typeof pc.lab === 'string' ? pc.lab : '');
    setLabel(pc.label);
    setProcessor(pc.processor || 'Intel Core i5');
    setRam(pc.ram || '8 GB DDR4');
    setStorage(pc.storage || '256 GB SSD');
    setPurchaseDate(pc.purchaseDate ? new Date(pc.purchaseDate).toISOString().split('T')[0]! : '');
    setWarrantyExpiry(pc.warrantyExpiry ? new Date(pc.warrantyExpiry).toISOString().split('T')[0]! : '');
    setVendor(pc.vendor || '');
    setStatus(
      pc.status === 'OPERATIONAL' || pc.status === 'ACTIVE'
        ? 'ACTIVE'
        : pc.status === 'UNDER_MAINTENANCE'
        ? 'UNDER_MAINTENANCE'
        : 'RETIRED'
    );
    setNotes(pc.notes || '');
  };

  // CSV Parsing
  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      addToast({ type: 'error', title: 'Invalid CSV', message: 'CSV file must contain a header and at least one row.' });
      return;
    }

    const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!;
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const rowObj: Record<string, string> = {};
      for (let h = 0; h < headers.length; h++) {
        rowObj[headers[h]!] = values[h] || '';
      }
      rows.push(rowObj);
    }

    try {
      const res = await api.post('/admin/computers/import/preview', { rows });
      setCsvPreviewData(res.data.data);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: { message?: string } }>;
      addToast({
        type: 'error',
        title: 'Preview failed',
        message: error.response?.data?.error?.message || 'Could not parse CSV',
      });
    }
  };

  const handleDownloadErrorCsv = () => {
    if (!csvPreviewData || csvPreviewData.invalidRows.length === 0) return;
    let csvContent = 'rowNumber,assetTag,errors\n';
    for (const inv of csvPreviewData.invalidRows) {
      csvContent += `${inv.rowNumber},"${inv.assetTag}","${inv.errors.join('; ')}"\n`;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'computers-import-errors.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/admin/computers/import/template', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'computers-import-template.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast({ type: 'error', title: 'Download failed', message: 'Could not fetch template' });
    }
  };

  const closeCsvModal = () => {
    setIsCsvModalOpen(false);
    setCsvFile(null);
    setCsvPreviewData(null);
  };

  const computers = computersData?.computers || [];
  const pagination = computersData?.pagination;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(computers.map((c) => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Workstation Assets & Fleet
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage laboratory hardware specifications, service warranties, bulk CSV imports, and maintenance histories.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setIsCsvModalOpen(true)}
            className="gap-2 text-xs"
          >
            <Upload className="h-4 w-4" /> Bulk CSV Import
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 text-xs">
            <Plus className="h-4 w-4" /> Add Computer
          </Button>
        </div>
      </div>

      {/* Filters Bar & Bulk Action Bar */}
      <Card className="p-4 shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tag, label, processor, vendor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          {/* Lab Filter */}
          <Select
            value={labFilter}
            onChange={(e) => {
              setLabFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Laboratories</option>
            {laboratories.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name} ({l.code})
              </option>
            ))}
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
            <option value="ACTIVE">Active / Operational</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="RETIRED">Retired / Decommissioned</option>
          </Select>

          {/* Warranty Filter */}
          <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={warrantyExpiredFilter}
              onChange={(e) => {
                setWarrantyExpiredFilter(e.target.checked);
                setPage(1);
              }}
              className="rounded text-primary focus:ring-primary h-4 w-4"
            />
            <span className="font-medium text-foreground">Expired Warranty Only</span>
          </label>
        </div>

        {/* Selected Rows Multi-Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
            <span className="font-semibold text-primary">
              {selectedIds.length} computer(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setBulkStatusOpen(true)}
              >
                Change Status
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setSelectedIds([])}
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Computers Table */}
      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-foreground">Failed to load workstation fleet</p>
        </div>
      ) : computers.length === 0 ? (
        <EmptyState
          title="No computers found"
          description="Add your first workstation asset or perform a bulk CSV import."
          actionLabel="+ Add Computer"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      computers.length > 0 &&
                      computers.every((c) => selectedIds.includes(c._id))
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                </TableHead>
                <TableHead>Asset Tag & PC Label</TableHead>
                <TableHead>Laboratory</TableHead>
                <TableHead>Hardware Specs</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Issue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computers.map((pc) => {
                const labName =
                  typeof pc.lab === 'object' && pc.lab !== null
                    ? ((pc.lab as { code?: string; name?: string }).code || (pc.lab as { code?: string; name?: string }).name || 'Unassigned')
                    : 'Unassigned';

                const isWarrantyExpired =
                  pc.warrantyExpiry && new Date(pc.warrantyExpiry) < new Date();

                const isChecked = selectedIds.includes(pc._id);

                return (
                  <TableRow key={pc._id} data-state={isChecked ? 'selected' : undefined}>
                    {/* Checkbox */}
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(pc._id)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                    </TableCell>

                    {/* Tag & Label */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Monitor className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-xs font-mono">
                            {pc.assetTag}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{pc.label}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Laboratory */}
                    <TableCell className="text-xs font-medium text-foreground">
                      {labName}
                    </TableCell>

                    {/* Hardware Specs */}
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{pc.processor}</div>
                      <div className="text-[11px]">
                        {pc.ram} * {pc.storage}
                      </div>
                    </TableCell>

                    {/* Warranty */}
                    <TableCell className="text-xs">
                      {pc.warrantyExpiry ? (
                        <div
                          className={
                            isWarrantyExpired
                              ? 'text-rose-600 font-semibold'
                              : 'text-muted-foreground'
                          }
                        >
                          {new Date(pc.warrantyExpiry).toLocaleDateString()}
                          {isWarrantyExpired && (
                            <span className="block text-[10px] text-rose-500 font-normal">
                              Expired
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={
                          pc.status === 'ACTIVE' || pc.status === 'OPERATIONAL'
                            ? 'status_resolved'
                            : pc.status === 'UNDER_MAINTENANCE'
                            ? 'priority_medium'
                            : 'priority_high'
                        }
                        size="sm"
                      >
                        {pc.status === 'OPERATIONAL' ? 'ACTIVE' : pc.status}
                      </Badge>
                    </TableCell>

                    {/* Active Issue */}
                    <TableCell>
                      {pc.activeTicket ? (
                        <Badge variant="priority_high" size="sm" className="gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          {pc.activeTicket.ticketId}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View Maintenance Dossier"
                          onClick={() => setInspectComputerId(pc._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => openEdit(pc)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingComputer(pc)}
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <div>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} workstations
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

      {/* ======================================================== */}
      {/* COMPUTER DETAIL DRAWER (Radix Sheet) */}
      {/* ======================================================== */}
      <Sheet
        open={!!inspectComputerId}
        onOpenChange={(open) => !open && setInspectComputerId(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto space-y-6">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <Monitor className="h-5 w-5 text-emerald-600" />
              Workstation Hardware Dossier
            </SheetTitle>
          </SheetHeader>

          {detailLoading || !computerDetailData ? (
            <div className="space-y-4 pt-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Asset Header */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-base font-mono">
                    {computerDetailData.computer.assetTag}
                  </h3>
                  <Badge variant="status_assigned" size="sm">
                    {computerDetailData.computer.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Label: {computerDetailData.computer.label} * Lab:{' '}
                  {typeof computerDetailData.computer.lab === 'object' && computerDetailData.computer.lab !== null && 'name' in computerDetailData.computer.lab
                    ? computerDetailData.computer.lab.name
                    : 'N/A'}
                </p>
              </div>

              {/* Hardware Specifications */}
              <div className="space-y-3 text-xs">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                  System Specifications
                </h4>
                <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-primary" /> Processor
                    </span>
                    <span className="font-semibold">{computerDetailData.computer.processor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" /> RAM
                    </span>
                    <span className="font-semibold">{computerDetailData.computer.ram}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5 text-primary" /> Storage
                    </span>
                    <span className="font-semibold">{computerDetailData.computer.storage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vendor</span>
                    <span className="font-semibold">{computerDetailData.computer.vendor || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Purchase Date</span>
                    <span className="font-semibold">
                      {computerDetailData.computer.purchaseDate
                        ? new Date(computerDetailData.computer.purchaseDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Warranty Expiry</span>
                    <span className="font-semibold">
                      {computerDetailData.computer.warrantyExpiry
                        ? new Date(computerDetailData.computer.warrantyExpiry).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Maintenance History */}
              <div className="space-y-3 text-xs">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                  Full Maintenance History ({computerDetailData.maintenanceHistory.length})
                </h4>

                {computerDetailData.maintenanceHistory.length === 0 ? (
                  <p className="text-muted-foreground italic">No maintenance tickets recorded for this computer.</p>
                ) : (
                  <div className="space-y-2">
                    {computerDetailData.maintenanceHistory.map((t) => (
                      <div
                        key={t._id}
                        className="p-3 rounded-lg border border-border bg-card space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground font-mono">{t.ticketId}</span>
                          <Badge variant="status_assigned" size="sm">
                            {t.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[11px] line-clamp-2">
                          {t.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                          <span>Reported: {new Date(t.createdAt).toLocaleDateString()}</span>
                          <span>Category: {t.category}</span>
                        </div>
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
      {/* BULK STATUS CHANGE DIALOG */}
      {/* ======================================================== */}
      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status for {selectedIds.length} Computers</DialogTitle>
            <DialogDescription>
              Select the new operational status to apply to all selected workstation assets.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs space-y-2">
            <label className="font-semibold text-foreground">Select New Status *</label>
            <Select
              value={bulkNewStatus}
              onChange={(e) => setBulkNewStatus(e.target.value)}
              className="w-full text-xs"
            >
              <option value="ACTIVE">Active (Operational)</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="RETIRED">Retired (Decommissioned)</option>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkStatusOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate()}
            >
              {bulkStatusMutation.isPending ? 'Updating...' : 'Apply Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* BULK CSV IMPORT MODAL */}
      {/* ======================================================== */}
      <Dialog open={isCsvModalOpen} onOpenChange={(open) => !open && closeCsvModal()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Bulk CSV Asset Import
            </DialogTitle>
            <DialogDescription>
              Upload a comma-separated CSV with up to 1000 computer assets. Previews will identify valid and invalid rows.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Template Download Banner */}
            <div className="p-3 rounded-lg border border-border bg-muted/40 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Download Standard CSV Template</p>
                <p className="text-[11px] text-muted-foreground">
                  Contains all supported header columns and sample hardware rows.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-3.5 w-3.5" /> Template.csv
              </Button>
            </div>

            {/* File Dropzone */}
            <div className="p-4 rounded-xl border border-dashed border-border bg-card text-center space-y-2">
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                className="hidden"
                onChange={handleCsvFileChange}
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center gap-1.5"
              >
                <Upload className="h-8 w-8 text-primary/70" />
                <span className="font-semibold text-foreground">
                  {csvFile ? csvFile.name : 'Click to select CSV file for dry-run preview'}
                </span>
                <span className="text-[11px] text-muted-foreground">Maximum 1000 rows</span>
              </label>
            </div>

            {/* Dry-run Preview Results */}
            {csvPreviewData && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">Dry-Run Preview:</span>
                    <Badge variant="status_resolved" size="sm">
                      {csvPreviewData.validCount} Valid
                    </Badge>
                    <Badge
                      variant={csvPreviewData.invalidCount > 0 ? 'priority_high' : 'status_open'}
                      size="sm"
                    >
                      {csvPreviewData.invalidCount} Invalid
                    </Badge>
                  </div>

                  {csvPreviewData.invalidCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-rose-600 gap-1"
                      onClick={handleDownloadErrorCsv}
                    >
                      <Download className="h-3 w-3" /> Download Error Report
                    </Button>
                  )}
                </div>

                {/* Valid Preview Snippet */}
                {csvPreviewData.validCount > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-600 uppercase">
                      Ready to Import ({csvPreviewData.validCount} rows)
                    </span>
                    <div className="max-h-36 overflow-y-auto border border-border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="py-1">Asset Tag</TableHead>
                            <TableHead className="py-1">Lab Code</TableHead>
                            <TableHead className="py-1">Label</TableHead>
                            <TableHead className="py-1">Specs</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreviewData.validRows.slice(0, 10).map((r, i) => (
                            <TableRow key={i}>
                              <TableCell className="py-1 font-mono">{r.assetTag}</TableCell>
                              <TableCell className="py-1">{r.labCode}</TableCell>
                              <TableCell className="py-1">{r.label}</TableCell>
                              <TableCell className="py-1 text-muted-foreground">
                                {r.processor} / {r.ram}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Invalid Errors Snippet */}
                {csvPreviewData.invalidCount > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-rose-600 uppercase">
                      Invalid Rows (will be skipped)
                    </span>
                    <div className="max-h-36 overflow-y-auto border border-rose-500/30 rounded-lg bg-rose-500/5 p-2 space-y-1">
                      {csvPreviewData.invalidRows.slice(0, 10).map((inv, i) => (
                        <div key={i} className="text-[11px] text-rose-700 dark:text-rose-300">
                          <strong>Row #{inv.rowNumber} ({inv.assetTag}):</strong>{' '}
                          {inv.errors.join(', ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeCsvModal}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                !csvPreviewData ||
                csvPreviewData.validCount === 0 ||
                confirmCsvMutation.isPending
              }
              onClick={() => confirmCsvMutation.mutate()}
            >
              {confirmCsvMutation.isPending
                ? 'Importing...'
                : `Confirm Import (${csvPreviewData?.validCount || 0} valid assets)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* CREATE / EDIT COMPUTER MODAL */}
      {/* ======================================================== */}
      <Dialog
        open={isCreateOpen || !!editingComputer}
        onOpenChange={(open) => !open && resetForm()}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingComputer ? 'Edit Workstation Asset' : 'Add Workstation Asset'}</DialogTitle>
            <DialogDescription>
              Record hardware asset tags, laboratory placement, component specifications, and warranty contracts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              {/* Asset Tag */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Asset Tag (Unique) *</label>
                <Input
                  placeholder="e.g. COMP-L101-PC01"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
                  className="text-xs uppercase font-mono"
                />
              </div>

              {/* Lab */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Assigned Laboratory *</label>
                <Select
                  value={labId}
                  onChange={(e) => setLabId(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="">Select Lab</option>
                  {laboratories.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Label */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Workstation Label / PC # *</label>
                <Input
                  placeholder="e.g. PC-01"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Operational Status</label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'UNDER_MAINTENANCE' | 'RETIRED')}
                  className="w-full text-xs"
                >
                  <option value="ACTIVE">Active (Operational)</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="RETIRED">Retired (Decommissioned)</option>
                </Select>
              </div>
            </div>

            {/* Hardware Specs */}
            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
              <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground block">
                Hardware Specifications
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground">Processor</label>
                  <Input
                    placeholder="e.g. Intel Core i5"
                    value={processor}
                    onChange={(e) => setProcessor(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground">RAM</label>
                  <Input
                    placeholder="e.g. 16 GB DDR4"
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground">Storage</label>
                  <Input
                    placeholder="e.g. 512 GB SSD"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Warranty & Vendor */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">Purchase Date</label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">Warranty Expiry</label>
                <Input
                  type="date"
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">Vendor</label>
                <Input
                  placeholder="e.g. Dell / HP"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Administrative Notes</label>
              <Textarea
                placeholder="Serial number or hardware notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                !assetTag.trim() ||
                !labId ||
                !label.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              onClick={() => {
                if (editingComputer) {
                  updateMutation.mutate();
                } else {
                  createMutation.mutate();
                }
              }}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingComputer
                ? 'Save Changes'
                : 'Create Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={!!deletingComputer}
        onOpenChange={(open) => !open && setDeletingComputer(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Workstation Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete computer{' '}
              <strong className="text-foreground">{deletingComputer?.assetTag} ({deletingComputer?.label})</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs space-y-2">
            {deletingComputer?.activeTicket ? (
              <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Active Ticket Guard:</p>
                  <p className="mt-0.5">
                    This computer currently has active ticket{' '}
                    <strong>{deletingComputer.activeTicket.ticketId}</strong>. Deletion is prohibited until the ticket is resolved.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                This will soft-delete the computer record from the active inventory.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingComputer(null)}>
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

export default AdminComputers;
