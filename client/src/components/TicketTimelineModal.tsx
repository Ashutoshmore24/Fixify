import React, { useEffect, useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { useSocket } from '../context/SocketContext';
import { PublicProfileModal } from './profile/PublicProfileModal';

interface TicketTimelineModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onTicketUpdated?: (updated: Ticket) => void;
}

const STATUS_STEPS: TicketStatus[] = [
  'OPEN',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

export const TicketTimelineModal: React.FC<TicketTimelineModalProps> = ({
  ticket,
  onClose,
  onTicketUpdated,
}) => {
  const { socket } = useSocket();
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket || !socket) return;

    const handleUpdate = (updated: Ticket) => {
      if (updated._id === ticket._id && onTicketUpdated) {
        onTicketUpdated(updated);
      }
    };

    socket.on('ticket:updated', handleUpdate);
    return () => {
      socket.off('ticket:updated', handleUpdate);
    };
  }, [ticket, socket, onTicketUpdated]);

  if (!ticket) return null;

  const currentStepIdx = STATUS_STEPS.indexOf(ticket.status);

  const priorityColors = {
    LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    CRITICAL: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 animate-pulse',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                {ticket.ticketId}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {ticket.computer?.label} ({ticket.computer?.assetTag}) • {ticket.lab?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Live Status Stepper */}
        <div className="py-4 border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[340px] px-2">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = currentStepIdx >= 0 && idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 scale-110'
                          : isPast
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[9px] font-medium mt-1 uppercase tracking-tight text-center ${
                        isCurrent
                          ? 'font-bold text-blue-600 dark:text-blue-400'
                          : isPast
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.replace('_', ' ')}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 transition-all ${
                        idx < currentStepIdx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Assigned Assistant Card Trigger */}
          {ticket.assignedTo && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Assigned Assistant:</span>
              <button
                type="button"
                onClick={() => {
                  if (ticket.assignedTo) {
                    setSelectedAssistantId(ticket.assignedTo._id);
                  }
                }}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 focus:outline-none"
              >
                <span>{ticket.assignedTo.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                  View Profile ↗
                </span>
              </button>
            </div>
          )}

          {/* Description & Category */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-500">
              <span>Category: <strong className="text-slate-800 dark:text-slate-200">{ticket.category}</strong></span>
              <span>Reported: {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {/* Supporting Evidence Images from Cloudinary */}
          {ticket.images && ticket.images.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Attached Photos ({ticket.images.length})
                </h4>
                <span className="text-[10px] text-blue-500 font-medium">Click to inspect</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ticket.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 cursor-pointer group hover:shadow-md transition"
                  >
                    <img
                      src={imgUrl}
                      alt={`Complaint snapshot ${idx + 1}`}
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-semibold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                        View
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BR-8 Resolution details if closed */}
          {ticket.status === 'CLOSED' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                <span>✓</span> Resolved & Closed (BR-8 Verified)
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Resolution Notes:</strong> {ticket.resolutionNotes}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Tested Operational: {ticket.testedOk ? 'Yes (Verified OK)' : 'Pending'}
              </p>
            </div>
          )}

          {/* Chronological Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audit Activity History
            </h4>
            <div className="space-y-2.5">
              {ticket.timeline?.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {entry.actor.role === 'LAB_ASSISTANT' && entry.actor.id ? (
                          <button
                            type="button"
                            onClick={() => setSelectedAssistantId(entry.actor.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 focus:outline-none"
                          >
                            <span>{entry.actor.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({entry.actor.role})</span>
                          </button>
                        ) : (
                          <>
                            {entry.actor.name}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">({entry.actor.role})</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {entry.note || `Transitioned status to ${entry.status}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Enlarged complaint snapshot"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Public Profile Popover / Modal */}
      <PublicProfileModal
        userId={selectedAssistantId}
        isOpen={Boolean(selectedAssistantId)}
        onClose={() => setSelectedAssistantId(null)}
      />
    </div>
  );
};
