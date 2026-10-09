import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { AuditLogItem } from '../../types';
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
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
} from '../../components/ui';

export const AdminAudit: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [entityIdSearch, setEntityIdSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Expanded rows for JSON diff
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const { data: auditData, isLoading, isError } = useQuery({
    queryKey: [
      'admin',
      'audit',
      { actionFilter, entityTypeFilter, entityIdSearch, startDate, endDate, page },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (entityTypeFilter) params.append('entityType', entityTypeFilter);
      if (entityIdSearch) params.append('entityId', entityIdSearch);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', String(page));
      params.append('limit', '20');

      const res = await api.get(`/admin/audit?${params.toString()}`);
      return res.data.data as {
        items: AuditLogItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const items = auditData?.items || [];
  const pagination = auditData?.pagination;

  const actionColorMap: Record<string, 'status_open' | 'status_assigned' | 'status_in_progress' | 'status_resolved' | 'priority_high' | 'priority_medium'> = {
    USER_ROLE_UPDATED: 'status_assigned',
    ADMIN_USER_ROLE_CHANGED: 'status_in_progress',
    ADMIN_USER_UPDATED: 'status_open',
    ADMIN_USER_STATUS_CHANGED: 'priority_high',
    ADMIN_USER_DELETED: 'priority_high',
    FACULTY_APPROVAL_DECIDED: 'status_resolved',
    DEACTIVATION_APPROVED: 'priority_high',
    DEACTIVATION_REJECTED: 'priority_medium',
    DEPARTMENT_CREATED: 'status_resolved',
    DEPARTMENT_UPDATED: 'status_in_progress',
    DEPARTMENT_DELETED: 'priority_high',
    LABORATORY_CREATED: 'status_resolved',
    LABORATORY_UPDATED: 'status_in_progress',
    LABORATORY_DELETED: 'priority_high',
    LAB_QR_REGENERATED: 'priority_medium',
    COMPUTER_CREATED: 'status_resolved',
    COMPUTER_UPDATED: 'status_in_progress',
    COMPUTER_DELETED: 'priority_high',
    COMPUTERS_BULK_IMPORTED: 'status_resolved',
    COMPUTERS_BULK_STATUS_CHANGED: 'status_in_progress',
    SETTING_UPDATED: 'status_assigned',
    TICKET_AUTO_ESCALATED: 'priority_high',
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Append-Only Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Immutable BR-9 compliance log of all administrative actions, permission mutations, and operational updates.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <Card className="p-4 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Entity ID Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by Entity ID..."
              value={entityIdSearch}
              onChange={(e) => {
                setEntityIdSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          {/* Action Filter */}
          <Select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Actions</option>
            <option value="ADMIN_USER_ROLE_CHANGED">Role Changed</option>
            <option value="ADMIN_USER_STATUS_CHANGED">Status Changed</option>
            <option value="ADMIN_USER_UPDATED">User Updated</option>
            <option value="ADMIN_USER_DELETED">User Deleted</option>
            <option value="FACULTY_APPROVAL_DECIDED">Faculty Approval</option>
            <option value="DEACTIVATION_APPROVED">Deactivation Approved</option>
            <option value="DEACTIVATION_REJECTED">Deactivation Rejected</option>
            <option value="LABORATORY_CREATED">Lab Created</option>
            <option value="LAB_QR_REGENERATED">QR Regenerated</option>
            <option value="COMPUTER_CREATED">Computer Created</option>
            <option value="COMPUTERS_BULK_IMPORTED">Computers Imported</option>
            <option value="SETTING_UPDATED">Setting Updated</option>
            <option value="TICKET_AUTO_ESCALATED">Ticket Escalated</option>
          </Select>

          {/* Entity Type Filter */}
          <Select
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="Department">Department</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Computer">Computer</option>
            <option value="Setting">Setting</option>
            <option value="Ticket">Ticket</option>
            <option value="DeactivationRequest">DeactivationRequest</option>
          </Select>

          {/* Start Date */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          />

          {/* End Date */}
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="text-xs"
          />
        </div>
      </Card>

      {/* Audit Log Table */}
      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-foreground">Failed to load audit logs</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No audit events found"
          description="Try clearing your search terms or expanding the date filter range."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((log) => {
                const isExpanded = expandedRowId === log._id;
                const actorName = log.actor?.name || 'System Auto Engine';
                const actorEmail = log.actor?.email || 'system@fixify';

                return (
                  <React.Fragment key={log._id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => toggleExpand(log._id)}
                    >
                      <TableCell className="w-10 text-center">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(log.at).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs">
                          <span className="font-semibold text-foreground">{actorName}</span>
                          <span className="text-[11px] text-muted-foreground block">
                            {actorEmail}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={actionColorMap[log.action] || 'status_open'}
                          size="sm"
                          className="font-mono text-[11px]"
                        >
                          {log.action}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs font-medium text-foreground">
                        {log.entityType}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.entityId ? String(log.entityId) : 'N/A'}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.ip || 'Internal'}
                      </TableCell>
                    </TableRow>

                    {/* Expandable Before / After JSON Diff Row */}
                    {isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/80">
                        <TableCell colSpan={7} className="p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Before Snapshot */}
                            <div className="space-y-1.5">
                              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] block">
                                State Before Mutation
                              </span>
                              <pre className="p-3 rounded-lg bg-card border border-border/70 font-mono text-[11px] overflow-x-auto text-foreground max-h-56">
                                {log.before
                                  ? JSON.stringify(log.before, null, 2)
                                  : 'null (Initial Creation or No Prior State)'}
                              </pre>
                            </div>

                            {/* After Snapshot */}
                            <div className="space-y-1.5">
                              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] block">
                                State After Mutation
                              </span>
                              <pre className="p-3 rounded-lg bg-card border border-border/70 font-mono text-[11px] overflow-x-auto text-foreground max-h-56">
                                {log.after
                                  ? JSON.stringify(log.after, null, 2)
                                  : 'null (Deletion or No New State)'}
                              </pre>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
                {pagination.total} audit entries
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
    </div>
  );
};

export default AdminAudit;
