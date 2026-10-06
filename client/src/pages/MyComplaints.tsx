import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Ticket } from '../types';
import { useSocket } from '../context/SocketContext';
import { TicketTimelineModal } from '../components/TicketTimelineModal';

export const MyComplaints: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

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

    const handleTicketCreated = (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev]);
    };

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );
      if (selectedTicket && selectedTicket._id === updatedTicket._id) {
        setSelectedTicket(updatedTicket);
      }
    };

    socket.on('ticket:created', handleTicketCreated);
    socket.on('ticket:updated', handleTicketUpdated);

    return () => {
      socket.off('ticket:created', handleTicketCreated);
      socket.off('ticket:updated', handleTicketUpdated);
    };
  }, [socket, selectedTicket]);

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'ACTIVE') return t.isActive;
    if (filter === 'RESOLVED') return !t.isActive;
    return true;
  });

  const statusBadges: Record<string, { label: string; bg: string }> = {
    OPEN: { label: 'Open', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    ASSIGNED: { label: 'Assigned', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse' },
    ESCALATED: { label: 'Escalated', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    AWAITING_PARTS: { label: 'Awaiting Parts', bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    RESOLVED: { label: 'Resolved', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    CLOSED: { label: 'Closed', bg: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-slate-200 text-slate-600' },
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">
      <TicketTimelineModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={(updated) => setSelectedTicket(updated)}
      />

      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            My Complaints
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track real-time maintenance status and timeline
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`py-1.5 px-3 rounded-lg transition ${
              filter === 'ALL'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({tickets.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`py-1.5 px-3 rounded-lg transition ${
              filter === 'ACTIVE'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Active ({tickets.filter((t) => t.isActive).length})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`py-1.5 px-3 rounded-lg transition ${
              filter === 'RESOLVED'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Resolved ({tickets.filter((t) => !t.isActive).length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 space-y-3">
          <div className="text-4xl">📋</div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No complaints found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            You haven't reported any equipment problems yet, or none match the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => {
            const badge = statusBadges[t.status] || { label: t.status, bg: 'bg-slate-100' };

            return (
              <div
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition shadow-sm hover:shadow-md cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 group-hover:underline">
                      {t.ticketId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {t.computer?.label} • {t.lab?.code}
                  </span>
                  <span className="text-slate-500 text-[11px] font-medium">
                    Category: {t.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {t.assignedTo ? `Assigned to: ${t.assignedTo.name}` : 'Awaiting assignment'}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                    View Timeline →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
