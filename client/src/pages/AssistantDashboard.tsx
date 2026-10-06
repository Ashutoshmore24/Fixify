import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/axios';
import { Ticket, TicketStatus } from '../types';
import { useSocket } from '../context/SocketContext';
import { TicketTimelineModal } from '../components/TicketTimelineModal';

export const AssistantDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimelineTicket, setSelectedTimelineTicket] = useState<Ticket | null>(null);

  // Modals for actions
  const [closingTicket, setClosingTicket] = useState<Ticket | null>(null);
  const [testedOkChecked, setTestedOkChecked] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [closeError, setCloseError] = useState<string | null>(null);
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  const [addingNoteTicket, setAddingNoteTicket] = useState<Ticket | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const { socket } = useSocket();

  const fetchTickets = () => {
    setIsLoading(true);
    api
      .get('/tickets')
      .then((res) => {
        if (res.data?.success) {
          setTickets(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev]);
    };

    const handleUpdated = (updatedTicket: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );
      if (selectedTimelineTicket && selectedTimelineTicket._id === updatedTicket._id) {
        setSelectedTimelineTicket(updatedTicket);
      }
    };

    socket.on('ticket:created', handleCreated);
    socket.on('ticket:updated', handleUpdated);

    return () => {
      socket.off('ticket:created', handleCreated);
      socket.off('ticket:updated', handleUpdated);
    };
  }, [socket, selectedTimelineTicket]);

  // Metrics
  const metrics = useMemo(() => {
    const assigned = tickets.filter((t) => t.status === 'ASSIGNED').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const active = tickets.filter((t) => t.isActive).length;
    return { assigned, inProgress, resolved, active };
  }, [tickets]);

  // Quick Action: Accept Ticket
  const handleAcceptTicket = async (ticket: Ticket) => {
    try {
      const res = await api.patch(`/tickets/${ticket._id}/status`, {
        status: 'ACCEPTED' as TicketStatus,
        note: 'Ticket accepted by Lab Assistant',
      });
      if (res.data?.success) {
        setTickets((prev) => prev.map((t) => (t._id === ticket._id ? res.data.data : t)));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      alert(error.response?.data?.error?.message || 'Failed to accept ticket');
    }
  };

  // Quick Action: Start Repair
  const handleStartRepair = async (ticket: Ticket) => {
    try {
      const res = await api.patch(`/tickets/${ticket._id}/status`, {
        status: 'IN_PROGRESS' as TicketStatus,
        note: 'Hardware/software diagnostic and repair started',
      });
      if (res.data?.success) {
        setTickets((prev) => prev.map((t) => (t._id === ticket._id ? res.data.data : t)));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      alert(error.response?.data?.error?.message || 'Failed to start repair');
    }
  };

  // Quick Action: Add Internal Note
  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingNoteTicket || !noteText.trim()) return;

    try {
      setIsSubmittingNote(true);
      const res = await api.post(`/tickets/${addingNoteTicket._id}/notes`, {
        note: noteText.trim(),
      });
      if (res.data?.success) {
        setTickets((prev) =>
          prev.map((t) => (t._id === addingNoteTicket._id ? res.data.data : t))
        );
        setAddingNoteTicket(null);
        setNoteText('');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      alert(error.response?.data?.error?.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Quick Action: Resolve & Close with BR-8 dialog
  const handleSubmitClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingTicket) return;

    if (!testedOkChecked) {
      setCloseError('BR-8 Requirement: You must verify that the machine tested OK.');
      return;
    }
    if (!resolutionNotes.trim()) {
      setCloseError('BR-8 Requirement: Resolution notes cannot be empty.');
      return;
    }

    try {
      setIsSubmittingClose(true);
      setCloseError(null);

      const res = await api.patch(`/tickets/${closingTicket._id}/status`, {
        status: 'CLOSED' as TicketStatus,
        testedOk: true,
        resolutionNotes: resolutionNotes.trim(),
        note: `Resolved and Closed with notes: ${resolutionNotes.trim()}`,
      });

      if (res.data?.success) {
        setTickets((prev) =>
          prev.map((t) => (t._id === closingTicket._id ? res.data.data : t))
        );
        setClosingTicket(null);
        setTestedOkChecked(false);
        setResolutionNotes('');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setCloseError(error.response?.data?.error?.message || 'Failed to close ticket');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
      <TicketTimelineModal
        ticket={selectedTimelineTicket}
        onClose={() => setSelectedTimelineTicket(null)}
        onTicketUpdated={(updated) => setSelectedTimelineTicket(updated)}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Lab Assistant Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage assigned laboratory maintenance tickets and resolve hardware faults
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.assigned}</div>
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-1">
            Assigned (New)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.inProgress}</div>
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1">
            In Progress
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.resolved}</div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
            Resolved / Closed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{metrics.active}</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Total Active
          </div>
        </div>
      </div>

      {/* Assigned Tickets List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Assigned Work Orders ({tickets.length})
        </h2>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-400">
            No complaints currently assigned to this laboratory.
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => setSelectedTimelineTicket(t)}
                      className="font-mono font-bold text-base text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                    >
                      {t.ticketId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {t.status.replace('_', ' ')}
                    </span>
                    {t.priority === 'CRITICAL' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    Reported by {t.reportedBy?.name} • {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span>🖥️ Workstation: <strong>{t.computer?.label}</strong> ({t.computer?.assetTag})</span>
                  <span>📍 Lab: <strong>{t.lab?.name}</strong></span>
                  <span>⚙️ Category: <strong>{t.category}</strong></span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                  {t.description}
                </p>

                {/* Technician Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  {t.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleAcceptTicket(t)}
                      className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      ✓ Accept Ticket
                    </button>
                  )}

                  {t.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStartRepair(t)}
                      className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      🔧 Start Repair
                    </button>
                  )}

                  {(t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED') && (
                    <button
                      onClick={() => {
                        setClosingTicket(t);
                        setCloseError(null);
                        setTestedOkChecked(false);
                        setResolutionNotes('');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      🏁 Resolve & Close (BR-8)
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setAddingNoteTicket(t);
                      setNoteText('');
                    }}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                  >
                    💬 Add Note
                  </button>

                  <button
                    onClick={() => setSelectedTimelineTicket(t)}
                    className="py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-medium transition ml-auto"
                  >
                    Timeline & History →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BR-8 RESOLUTION & CLOSURE MODAL */}
      {closingTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="close-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="close-modal-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
                Resolve & Close Ticket {closingTicket.ticketId}
              </h3>
              <button
                onClick={() => setClosingTicket(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <strong className="block font-semibold">BR-8 Business Rule Enforcement:</strong>
              <span>A ticket can close ONLY when repair is performed, testedOk is explicitly verified true, and non-empty resolution notes are supplied.</span>
            </div>

            {closeError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 rounded-xl text-xs">
                {closeError}
              </div>
            )}

            <form onSubmit={handleSubmitClose} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Resolution & Servicing Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the root cause and actions taken (e.g. Reseated RAM slot 1, ran diagnostic memory test, verified Windows boot)."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Mandatory testedOk checkbox (BR-8) */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testedOkChecked}
                  onChange={(e) => setTestedOkChecked(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-800 dark:text-slate-200">
                  <strong>Verification (testedOk):</strong> I certify that I have personally booted and verified operational status on computer{' '}
                  <span className="font-semibold">{closingTicket.computer?.label}</span>.
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClosingTicket(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClose || !testedOkChecked || !resolutionNotes.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingClose ? 'Closing...' : 'Close Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NOTE MODAL */}
      {addingNoteTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 id="note-modal-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              Add Work Note
            </h3>
            <form onSubmit={handleSubmitNote} className="space-y-4">
              <textarea
                required
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter work note to append to the ticket timeline..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddingNoteTicket(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNote || !noteText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
