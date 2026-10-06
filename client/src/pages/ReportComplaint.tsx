import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { Computer, Laboratory, TicketCategory } from '../types';
import { ElectricalSafetyModal } from '../components/ElectricalSafetyModal';

const SAFETY_KEYWORDS = [
  'spark',
  'smoke',
  'fire',
  'burning',
  'shock',
  'smell',
  'explosion',
  'heat',
  'blast',
  'short circuit',
];

export const ReportComplaint: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const labCodeFromQuery = searchParams.get('lab') || 'LAB-101';

  const [allLabs, setAllLabs] = useState<Laboratory[]>([]);
  const [currentLab, setCurrentLab] = useState<Laboratory | null>(null);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states (<= 4 actions)
  // Action 1: Selected Computer
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  // Action 2: Selected Category
  const [category, setCategory] = useState<TicketCategory>('HARDWARE');
  // Action 3: Description
  const [description, setDescription] = useState<string>('');
  // Action 4: Optional Image attachment (mock/base64 URL or uploaded URL)
  const [images, setImages] = useState<string[]>([]);

  // Safety Modal
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [safetyKeywordDetected, setSafetyKeywordDetected] = useState<string>('');
  const [safetyAcknowledged, setSafetyAcknowledged] = useState<boolean>(false);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);

  // Fetch labs and resolve current lab
  useEffect(() => {
    setIsLoading(true);
    api
      .get('/laboratories')
      .then((res) => {
        if (res.data?.success) {
          const labs: Laboratory[] = res.data.data;
          setAllLabs(labs);

          const matched = labs.find((l) => l.code === labCodeFromQuery.toUpperCase()) || labs[0] || null;
          setCurrentLab(matched);
        }
      })
      .catch((err) => {
        setErrorMessage(err.response?.data?.error?.message || 'Failed to load laboratory details');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [labCodeFromQuery]);

  // Fetch computers for the current lab
  useEffect(() => {
    if (!currentLab) return;

    api
      .get(`/computers?lab=${currentLab._id}`)
      .then((res) => {
        if (res.data?.success) {
          setComputers(res.data.data);
        }
      })
      .catch(() => {});
  }, [currentLab]);

  // Check description and category for safety keywords
  useEffect(() => {
    if (safetyAcknowledged) return;

    if (category === 'ELECTRICAL') {
      setShowSafetyModal(true);
      setSafetyKeywordDetected('ELECTRICAL CATEGORY');
      return;
    }

    const lower = description.toLowerCase();
    for (const kw of SAFETY_KEYWORDS) {
      if (lower.includes(kw)) {
        setShowSafetyModal(true);
        setSafetyKeywordDetected(kw);
        break;
      }
    }
  }, [category, description, safetyAcknowledged]);

  const categories: Array<{ id: TicketCategory; label: string; icon: string; desc: string }> = [
    { id: 'HARDWARE', label: 'Hardware', icon: '🖥️', desc: 'Monitor, Keyboard, Mouse, RAM' },
    { id: 'SOFTWARE', label: 'Software', icon: '💾', desc: 'OS, IDE, License, App crash' },
    { id: 'NETWORK', label: 'Network', icon: '🌐', desc: 'LAN cable, No Internet, DNS' },
    { id: 'ELECTRICAL', label: 'Electrical', icon: '⚡', desc: 'Spark, Smoking, Shock, UPS' },
    { id: 'OTHER', label: 'Other', icon: '📦', desc: 'Desk, Physical damage, Other' },
  ];

  const selectedComputer = useMemo(
    () => computers.find((c) => c._id === selectedComputerId),
    [computers, selectedComputerId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComputerId) {
      setErrorMessage('Please select an affected computer workstation (Action 1)');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMessage('Please provide a detailed description (min 10 characters)');
      return;
    }
    if (!currentLab) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await api.post('/tickets', {
        computer: selectedComputerId,
        lab: currentLab._id,
        category,
        description: description.trim(),
        images,
      });

      if (res.data?.success) {
        const ticket = res.data.data;
        setSuccessTicketId(ticket.ticketId);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMessage(
        error.response?.data?.error?.message || 'Failed to submit complaint. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateImageUpload = () => {
    // Allows adding a simulated photo capture
    const sampleImage = `https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80`;
    if (images.length < 3) {
      setImages([...images, sampleImage]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (successTicketId) {
    return (
      <div className="max-w-md mx-auto p-4 py-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20">
          ✓
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Complaint Registered
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ticket ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{successTicketId}</span>
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Laboratory:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentLab?.name} ({currentLab?.code})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Workstation:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedComputer?.label} ({selectedComputer?.assetTag})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Auto-Assignment:</span>
            <span className="font-semibold text-emerald-600">Assigned to Lab Assistant (BR-4)</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/my-complaints')}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
          >
            Track Status
          </button>
          <button
            onClick={() => {
              setSuccessTicketId(null);
              setSelectedComputerId('');
              setDescription('');
              setImages([]);
            }}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
          >
            Report Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-20 space-y-6">
      {/* Safety modal */}
      <ElectricalSafetyModal
        isOpen={showSafetyModal}
        detectedKeyword={safetyKeywordDetected}
        onClose={() => {
          setShowSafetyModal(false);
          setSafetyAcknowledged(true);
        }}
      />

      {/* Lab Header & Switcher */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scanned Laboratory
            </span>
          </div>
          {allLabs.length > 1 && (
            <select
              value={currentLab?.code || ''}
              onChange={(e) => {
                const selectedCode = e.target.value;
                setSearchParams({ lab: selectedCode });
                setSelectedComputerId('');
              }}
              className="text-xs bg-slate-100 dark:bg-slate-700 border-none rounded-lg py-1 px-2 font-medium"
            >
              {allLabs.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code}
                </option>
              ))}
            </select>
          )}
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {currentLab?.name || 'Loading Laboratory...'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          📍 {currentLab?.building}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ACTION 1: PICK COMPUTER */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              Pick Affected Computer
            </h2>
            <span className="text-[11px] text-slate-400">
              {computers.filter((c) => !c.activeTicket).length} Available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            {computers.map((pc) => {
              const isBusy = Boolean(pc.activeTicket);
              const isSelected = selectedComputerId === pc._id;

              return (
                <div
                  key={pc._id}
                  data-testid={`pc-card-${pc.label}`}
                  onClick={() => {
                    if (!isBusy) {
                      setSelectedComputerId(pc._id);
                    }
                  }}
                  className={`relative p-3 rounded-xl border text-left transition ${
                    isBusy
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 opacity-80 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20 cursor-pointer'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {pc.label}
                    </span>
                    {isBusy ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white uppercase">
                        Busy
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{pc.assetTag}</p>

                  {/* BR-3 Link to current active ticket if busy */}
                  {isBusy && pc.activeTicket && (
                    <div className="mt-2 pt-1 border-t border-amber-200 dark:border-amber-800/40">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/my-complaints');
                        }}
                        className="text-[10px] font-medium text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        Active Ticket: {pc.activeTicket.ticketId} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ACTION 2: CATEGORY PICKER */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
              2
            </span>
            Issue Category
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => {
              const isSelected = category === cat.id;
              const isHazard = cat.id === 'ELECTRICAL';

              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? isHazard
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl mb-1">{cat.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {cat.label}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{cat.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ACTION 3: DESCRIPTION & SAFETY AUTO-CHECK */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              Description
            </h2>
            <span className="text-[10px] text-slate-400">Min 10 characters</span>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe what's wrong (e.g. PC won't power on, blue screen loop, mouse not responding)..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
        </section>

        {/* ACTION 4: OPTIONAL IMAGE UPLOAD */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                4
              </span>
              Add Photo (Optional)
            </h2>
            <span className="text-[10px] text-slate-400">{images.length}/3 Photos</span>
          </div>

          <div className="flex gap-2 items-center">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={img} alt="Fault snapshot" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}

            {images.length < 3 && (
              <button
                type="button"
                onClick={handleSimulateImageUpload}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 transition text-[10px] gap-1"
              >
                <span>📷</span>
                <span>Attach</span>
              </button>
            )}
          </div>
        </section>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          data-testid="submit-complaint-btn"
          disabled={isSubmitting || !selectedComputerId || description.length < 10}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isSubmitting ? 'Submitting Complaint...' : 'Register Complaint'}
        </button>
      </form>
    </div>
  );
};
