import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Laboratory, Department, User } from '../../types';
import {
  FlaskConical,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Download,
  RefreshCw,
  Search,
  AlertCircle,
  FileDown,
  Monitor,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import {
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
  useToast,
} from '../../components/ui';

export const AdminLabs: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Dialog & Drawer States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);
  const [deletingLab, setDeletingLab] = useState<Laboratory | null>(null);
  const [inspectLab, setInspectLab] = useState<Laboratory | null>(null);
  const [regenerateLab, setRegenerateLab] = useState<Laboratory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [building, setBuilding] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [assistantIds, setAssistantIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // QR preview state for inspect drawer
  const [copiedUrl, setCopiedUrl] = useState(false);

  // 1. Fetch Laboratories
  const { data: laboratories = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'labs'],
    queryFn: async () => {
      const res = await api.get('/admin/labs');
      return res.data.data as Laboratory[];
    },
  });

  // 2. Fetch Departments for select
  const { data: departments = [] } = useQuery({
    queryKey: ['admin', 'departments-list'],
    queryFn: async () => {
      const res = await api.get('/admin/departments');
      return res.data.data as Department[];
    },
  });

  // 3. Fetch Lab Assistants
  const { data: assistantCandidates = [] } = useQuery({
    queryKey: ['admin', 'assistant-candidates'],
    queryFn: async () => {
      const res = await api.get('/admin/users?role=LAB_ASSISTANT&limit=100');
      return res.data.data.users as User[];
    },
  });

  // 4. Fetch QR Data for inspected lab
  const { data: inspectedQrData, isLoading: qrLoading } = useQuery({
    queryKey: ['admin', 'lab-qr', inspectLab?._id],
    queryFn: async () => {
      if (!inspectLab) return null;
      const res = await api.get(`/admin/labs/${inspectLab._id}/qr`);
      return res.data.data as {
        dataUrl: string;
        svg: string;
        url: string;
        labCode: string;
        placardText: string;
      };
    },
    enabled: !!inspectLab,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/labs', {
        name,
        code,
        building,
        department: departmentId,
        assistants: assistantIds,
        isActive,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Laboratory created', message: `Lab ${code} created with unique non-guessable QR.` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'labs'] });
      resetForm();
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Creation failed',
        message: err.response?.data?.error?.message || 'Could not create laboratory',
      });
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingLab) return;
      await api.put(`/admin/labs/${editingLab._id}`, {
        name,
        code,
        building,
        department: departmentId,
        assistants: assistantIds,
        isActive,
      });
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Laboratory updated', message: `Lab ${code} updated successfully.` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'labs'] });
      resetForm();
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Update failed',
        message: err.response?.data?.error?.message || 'Could not update laboratory',
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deletingLab) return;
      await api.delete(`/admin/labs/${deletingLab._id}`);
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Laboratory deleted', message: 'Laboratory soft-deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'labs'] });
      setDeletingLab(null);
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Deletion blocked',
        message: err.response?.data?.error?.message || 'Cannot delete laboratory',
      });
      setDeletingLab(null);
    },
  });

  // Regenerate QR Code Mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!regenerateLab) return;
      await api.post(`/admin/labs/${regenerateLab._id}/regenerate-qr`);
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'QR Code Regenerated',
        message: 'A new non-guessable lab code was generated. The previous QR code is now invalid.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'labs'] });
      if (inspectLab && inspectLab._id === regenerateLab?._id) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'lab-qr', inspectLab._id] });
      }
      setRegenerateLab(null);
    },
    onError: (err: AxiosError<{ error?: { message?: string } }>) => {
      addToast({
        type: 'error',
        title: 'Regeneration failed',
        message: err.response?.data?.error?.message || 'Could not regenerate QR code',
      });
    },
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setBuilding('');
    setDepartmentId('');
    setAssistantIds([]);
    setIsActive(true);
    setIsCreateOpen(false);
    setEditingLab(null);
  };

  const openEdit = (lab: Laboratory) => {
    setEditingLab(lab);
    setName(lab.name);
    setCode(lab.code);
    setBuilding(lab.building);
    setDepartmentId(
      typeof lab.department === 'object' && lab.department !== null && '_id' in lab.department
        ? lab.department._id
        : typeof lab.department === 'string'
        ? lab.department
        : ''
    );
    setAssistantIds(
      Array.isArray(lab.assistants)
        ? lab.assistants.map((a) => (typeof a === 'object' && a !== null ? a.id || a._id || '' : String(a)))
        : []
    );
    setIsActive(lab.isActive);
  };

  // Download Handlers
  const handleDownloadPng = (dataUrl: string, labCode: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `fixify-qr-${labCode}.png`;
    link.click();
  };

  const handleDownloadSvg = (svgString: string, labCode: string) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fixify-qr-${labCode}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPlacardPdf = async (labId: string, labCode: string) => {
    try {
      const res = await api.get(`/admin/labs/${labId}/placard-pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `placard-${labCode}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Placard downloaded', message: 'Printable A4 placard PDF ready.' });
    } catch {
      addToast({ type: 'error', title: 'Download failed', message: 'Could not generate placard PDF' });
    }
  };

  const handleDownloadAllPlacardsPdf = async () => {
    try {
      const res = await api.get('/admin/labs/placards/all-pdf', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'all-laboratories-placards.pdf';
      link.click();
      URL.revokeObjectURL(url);
      addToast({
        type: 'success',
        title: 'All placards downloaded',
        message: 'Multi-page A4 PDF containing all laboratories downloaded.',
      });
    } catch {
      addToast({ type: 'error', title: 'Download failed', message: 'Could not generate multi-page placards PDF' });
    }
  };

  const filteredLabs = laboratories.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(term) ||
      l.code.toLowerCase().includes(term) ||
      (l.labCode && l.labCode.toLowerCase().includes(term)) ||
      l.building.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Laboratories & QR Placards
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure campus computer laboratories, manage non-guessable QR codes, and generate printable placards.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={handleDownloadAllPlacardsPdf}
            className="gap-2 text-xs"
            title="Download multi-page PDF of all lab placards"
          >
            <FileDown className="h-4 w-4" /> Download All Placards (PDF)
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 text-xs">
            <Plus className="h-4 w-4" /> Add Laboratory
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-sm relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by lab name, room, or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      {/* Labs Table */}
      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-foreground">Failed to load laboratories</p>
        </div>
      ) : filteredLabs.length === 0 ? (
        <EmptyState
          title="No laboratories found"
          description="Create your first laboratory to generate an official QR complaint placard."
          actionLabel="+ Add Laboratory"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Laboratory</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location / Room</TableHead>
              <TableHead>Assigned Assistants</TableHead>
              <TableHead>Computers</TableHead>
              <TableHead>Active Tickets</TableHead>
              <TableHead className="text-right">QR & Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLabs.map((lab) => {
              const assistants = Array.isArray(lab.assistants) ? lab.assistants : [];
              const deptName =
                typeof lab.department === 'object' && lab.department !== null && 'name' in lab.department
                  ? lab.department.name
                  : 'Unassigned';

              return (
                <TableRow key={lab._id}>
                  {/* Name & Code */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                        <FlaskConical className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-xs">{lab.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Display: {lab.code} {lab.labCode && `* URL: ${lab.labCode}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Department */}
                  <TableCell className="text-xs text-foreground font-medium">
                    {deptName}
                  </TableCell>

                  {/* Location */}
                  <TableCell className="text-xs text-muted-foreground">{lab.building}</TableCell>

                  {/* Assistants */}
                  <TableCell>
                    {assistants.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assistants.map((a) => (
                          <Badge key={a.id || a._id || ''} variant="status_assigned" size="sm">
                            {a.name || 'Assistant'}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="priority_high" size="sm">
                        Unassigned
                      </Badge>
                    )}
                  </TableCell>

                  {/* Computers Count */}
                  <TableCell>
                    <Badge variant="status_open" size="sm" className="gap-1">
                      <Monitor className="h-3 w-3" />
                      {lab.computersCount || 0} PCs
                    </Badge>
                  </TableCell>

                  {/* Active Tickets */}
                  <TableCell>
                    {(lab.activeTicketsCount || 0) > 0 ? (
                      <Badge variant="priority_medium" size="sm">
                        {lab.activeTicketsCount} open
                      </Badge>
                    ) : (
                      <Badge variant="status_resolved" size="sm">
                        0 open
                      </Badge>
                    )}
                  </TableCell>

                  {/* QR & Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Inspect QR Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setInspectLab(lab)}
                      >
                        <QrCode className="h-3.5 w-3.5 text-primary" /> QR Placard
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs hover:bg-muted"
                        onClick={() => openEdit(lab)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingLab(lab)}
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
      {/* LAB QR DETAIL DRAWER (Radix Sheet) */}
      {/* ======================================================== */}
      <Sheet open={!!inspectLab} onOpenChange={(open) => !open && setInspectLab(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto space-y-6">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Laboratory QR Placard
            </SheetTitle>
          </SheetHeader>

          {inspectLab && (
            <div className="space-y-6">
              {/* Lab Overview */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                <h3 className="font-bold text-foreground text-base">{inspectLab.name}</h3>
                <p className="text-xs text-muted-foreground">{inspectLab.building}</p>
                <div className="pt-2 flex items-center gap-2">
                  <Badge variant="status_assigned" size="sm">
                    Display Code: {inspectLab.code}
                  </Badge>
                  {inspectLab.labCode && (
                    <Badge variant="status_open" size="sm" className="font-mono">
                      Secret URL Code: {inspectLab.labCode}
                    </Badge>
                  )}
                </div>
              </div>

              {/* QR Code Visual Preview */}
              <div className="p-6 rounded-2xl border border-border bg-card shadow-soft flex flex-col items-center text-center space-y-4">
                {qrLoading || !inspectedQrData ? (
                  <div className="h-48 w-48 rounded-xl bg-muted animate-pulse" />
                ) : (
                  <>
                    <div className="p-3 bg-white rounded-xl shadow-soft border border-slate-200">
                      <img
                        src={inspectedQrData.dataUrl}
                        alt={`QR Code for ${inspectLab.name}`}
                        className="h-48 w-48 object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">
                        "Scan with your phone camera to report a computer problem"
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono break-all px-2">
                        {inspectedQrData.url}
                      </p>
                    </div>

                    {/* Copy Direct URL */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() => {
                        navigator.clipboard.writeText(inspectedQrData.url);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                    >
                      {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedUrl ? 'Copied URL!' : 'Copy Direct Report URL'}
                    </Button>
                  </>
                )}
              </div>

              {/* Export & Download Actions */}
              {inspectedQrData && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                    Export Assets & Printables
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() =>
                        handleDownloadPng(inspectedQrData.dataUrl, inspectLab.labCode || inspectLab.code)
                      }
                    >
                      <Download className="h-3.5 w-3.5" /> Download PNG
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() =>
                        handleDownloadSvg(inspectedQrData.svg, inspectLab.labCode || inspectLab.code)
                      }
                    >
                      <Download className="h-3.5 w-3.5" /> Download SVG
                    </Button>
                  </div>

                  {/* Printable A4 Placard PDF */}
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-xs gap-2"
                    onClick={() =>
                      handleDownloadPlacardPdf(inspectLab._id, inspectLab.labCode || inspectLab.code)
                    }
                  >
                    <Printer className="h-4 w-4" /> Download Printable A4 Placard (PDF)
                  </Button>
                </div>
              )}

              {/* Regenerate QR Code Warning Card */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Regenerate QR Code
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Generating a new secret code will immediately invalidate all previously printed QR placards for this laboratory.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-amber-600 border-amber-500/40 hover:bg-amber-500/10 gap-1.5 mt-1"
                  onClick={() => setRegenerateLab(inspectLab)}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate Secret Code
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ======================================================== */}
      {/* REGENERATE QR CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={!!regenerateLab} onOpenChange={(open) => !open && setRegenerateLab(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600">Regenerate Laboratory QR Code?</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate the QR code for{' '}
              <strong className="text-foreground">{regenerateLab?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs space-y-2">
            <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200">
              <p className="font-semibold">Security Warning:</p>
              <p className="mt-1">
                Existing physical placards printed for this room will immediately stop functioning.
                You must download and replace the physical placard in the laboratory.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRegenerateLab(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={regenerateMutation.isPending}
              onClick={() => regenerateMutation.mutate()}
            >
              {regenerateMutation.isPending ? 'Regenerating...' : 'Confirm Invalidation & Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* CREATE / EDIT LAB MODAL */}
      {/* ======================================================== */}
      <Dialog open={isCreateOpen || !!editingLab} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLab ? 'Edit Laboratory' : 'Create Laboratory'}</DialogTitle>
            <DialogDescription>
              Configure laboratory attributes, room location, department affiliation, and assigned lab assistants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Lab Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Laboratory Name *</label>
              <Input
                placeholder="e.g. Advanced Computing Laboratory"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Display Code */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Display Code *</label>
              <Input
                placeholder="e.g. LAB-101"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-xs uppercase"
              />
            </div>

            {/* Building / Room */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Building & Room *</label>
              <Input
                placeholder="e.g. IT Building 1st Floor (Room 101)"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Affiliated Department *</label>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full text-xs"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Assigned Assistants (Multi-select) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Assigned Lab Assistants</label>
              <div className="p-2.5 rounded-lg border border-border bg-card max-h-36 overflow-y-auto space-y-1">
                {assistantCandidates.length === 0 ? (
                  <p className="text-muted-foreground italic">No users with LAB_ASSISTANT role found.</p>
                ) : (
                  assistantCandidates.map((u) => {
                    const uId = u.id || u._id || '';
                    const isChecked = assistantIds.includes(uId);
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
                              setAssistantIds((prev) => [...prev, uId]);
                            } else {
                              setAssistantIds((prev) => prev.filter((id) => id !== uId));
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
                !building.trim() ||
                !departmentId ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              onClick={() => {
                if (editingLab) {
                  updateMutation.mutate();
                } else {
                  createMutation.mutate();
                }
              }}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingLab
                ? 'Save Changes'
                : 'Create Laboratory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={!!deletingLab} onOpenChange={(open) => !open && setDeletingLab(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Laboratory</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{deletingLab?.name} ({deletingLab?.code})</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs space-y-2">
            {deletingLab && (deletingLab.activeTicketsCount || 0) > 0 ? (
              <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Active Tickets Guard:</p>
                  <p className="mt-0.5">
                    This laboratory currently has <strong>{deletingLab.activeTicketsCount}</strong> active
                    maintenance ticket(s). Deletion is prohibited until all tickets are resolved or closed.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                This will soft-delete the laboratory. Associated assistants will be automatically unlinked.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingLab(null)}>
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

export default AdminLabs;
