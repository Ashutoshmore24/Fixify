import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Search,
} from 'lucide-react';
import { api } from '../lib/axios';
import { Computer, Laboratory, TicketCategory } from '../types';
import { ElectricalSafetyModal } from '../components/ElectricalSafetyModal';
import { ImageUploader } from '../features/complaints/ImageUploader';
import { Badge } from '../components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/Dialog';

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
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  const [category, setCategory] = useState<TicketCategory>('HARDWARE');
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);

  // Safety Modal
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [safetyKeywordDetected, setSafetyKeywordDetected] = useState<string>('');
  const [safetyAcknowledged, setSafetyAcknowledged] = useState<boolean>(false);

  // Lab Picker modal (in production when user clicks "Wrong lab?")
  const [labPickerOpen, setLabPickerOpen] = useState(false);
  const [labSearchQuery, setLabSearchQuery] = useState('');

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState(false);

  // Fetch labs and resolve current lab
  useEffect(() => {
    setIsLoading(true);
    api
      .get('/laboratories')
      .then((res) => {
        if (res.data?.success) {
          const labs: Laboratory[] = res.data.data;
          setAllLabs(labs);

          const matched =
            labs.find((l) => l.code === labCodeFromQuery.toUpperCase()) || labs[0] || null;
          setCurrentLab(matched);
        }
      })
      .catch((err) => {
        setErrorMessage(
          err.response?.data?.error?.message || 'Failed to load laboratory details'
        );
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

  const availableCount = useMemo(
    () => computers.filter((c) => !c.activeTicket).length,
    [computers]
  );

  const priorityHint = useMemo(() => {
    if (category === 'ELECTRICAL') return 'Critical (Electrical Hazard)';
    if (category === 'NETWORK') return 'High (Network Downtime)';
    return 'Normal (Standard SLA)';
  }, [category]);

  const handleCopyTicket = () => {
    if (!successTicketId) return;
    navigator.clipboard.writeText(successTicketId);
    setCopiedTicketId(true);
    setTimeout(() => setCopiedTicketId(false), 2000);
  };

  const handleSelectLab = (labCode: string) => {
    setSearchParams({ lab: labCode });
    setSelectedComputerId('');
    setLabPickerOpen(false);
  };

  const filteredLabs = useMemo(() => {
    if (!labSearchQuery.trim()) return allLabs;
    const q = labSearchQuery.toLowerCase();
    return allLabs.filter(
      (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q) || l.building.toLowerCase().includes(q)
    );
  }, [allLabs, labSearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComputerId) {
      setErrorMessage('Please select an affected computer workstation (Step 1)');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMessage('Please provide a detailed description (minimum 10 characters)');
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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Resolving laboratory workstation data...</p>
      </div>
    );
  }

  // SUCCESS SCREEN
  if (successTicketId) {
    return (
      <div className="max-w-md mx-auto p-4 py-12 text-center space-y-6 animate-in fade-in-0 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-soft">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Complaint Registered
          </h2>
          <p className="text-xs text-muted-foreground">
            Your complaint has been queued and assigned to the lab assistant.
          </p>
        </div>

        {/* Ticket ID Box with Copy Button */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Sequential Ticket ID (REQ-1.8)
            </span>
            <span className="font-mono text-lg font-bold text-primary tracking-tight">
              {successTicketId}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition shadow-2xs"
            aria-label="Copy ticket ID to clipboard"
          >
            {copiedTicketId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-card p-4 rounded-2xl border border-border text-left text-xs space-y-2.5 shadow-2xs">
          <div className="flex justify-between items-center pb-2 border-b border-border/70">
            <span className="text-muted-foreground">Laboratory:</span>
            <span className="font-semibold text-foreground">{currentLab?.name} ({currentLab?.code})</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border/70">
            <span className="text-muted-foreground">Workstation:</span>
            <span className="font-semibold text-foreground">{selectedComputer?.label} ({selectedComputer?.assetTag})</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Auto-Assignment:</span>
            <span className="font-semibold text-primary">Assigned to Lab Assistant (BR-4)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/my-complaints')}
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm shadow-md transition"
          >
            Track Status
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccessTicketId(null);
              setSelectedComputerId('');
              setDescription('');
              setImages([]);
              setSafetyAcknowledged(false);
            }}
            className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-sm transition"
          >
            Report Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-8">
      {/* Electrical Safety Warning Modal */}
      <ElectricalSafetyModal
        isOpen={showSafetyModal}
        detectedKeyword={safetyKeywordDetected}
        onClose={() => {
          setShowSafetyModal(false);
          setSafetyAcknowledged(true);
        }}
      />

      {/* Lab Picker Dialog (Used in production when user clicks "Wrong lab?") */}
      <Dialog open={labPickerOpen} onOpenChange={setLabPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Select Laboratory</DialogTitle>
            <DialogDescription>
              Choose your laboratory if you scanned a different QR or deep link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search lab by name or code..."
                value={labSearchQuery}
                onChange={(e) => setLabSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredLabs.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelectLab(l.code)}
                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    currentLab?.code === l.code
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border hover:bg-muted text-foreground'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{l.name}</div>
                    <div className="text-[11px] text-muted-foreground">{l.building}</div>
                  </div>
                  <Badge variant="outline" size="sm">{l.code}</Badge>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MOBILE STEP INDICATORS (<1024px) */}
      <div className="lg:hidden mb-4 p-3 bg-card border border-border rounded-2xl flex items-center justify-between text-xs">
        <div className={`flex items-center gap-1.5 ${selectedComputerId ? 'text-primary font-semibold' : 'text-foreground'}`}>
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
          <span>PC</span>
        </div>
        <div className="w-4 h-px bg-border" />
        <div className={`flex items-center gap-1.5 ${category ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">2</span>
          <span>Category</span>
        </div>
        <div className="w-4 h-px bg-border" />
        <div className={`flex items-center gap-1.5 ${description.length >= 10 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">3</span>
          <span>Details</span>
        </div>
      </div>

      {errorMessage && (
        <div
          className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-medium flex items-center gap-2"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT ON DESKTOP (>=1024px) */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================== */}
          {/* LEFT COLUMN: SCANNED LAB CARD + PC GRID (lg:col-span-7) */}
          {/* ========================================================== */}
          <div className="lg:col-span-7 space-y-5">
            {/* Scanned Lab Card */}
            <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Scanned Laboratory
                  </span>
                </div>

                {/* Lab switcher: Dropdown in dev, text link in production */}
                {import.meta.env.DEV ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono px-1.5 py-0.5 rounded">DEV</span>
                    <select
                      value={currentLab?.code || ''}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        setSearchParams({ lab: selectedCode });
                        setSelectedComputerId('');
                      }}
                      className="text-xs bg-muted border border-border rounded-lg py-1 px-2 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {allLabs.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.code}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLabPickerOpen(true)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Wrong lab?
                  </button>
                )}
              </div>

              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {currentLab?.name || 'Loading Laboratory...'}
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{currentLab?.building}</span>
                  <span className="mx-1">•</span>
                  <span className="font-mono font-semibold">{currentLab?.code}</span>
                </p>
              </div>
            </div>

            {/* PC Workstation Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  Pick Affected Workstation
                </h2>
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground">{availableCount}</strong> Available / {computers.length} Total
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
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
                      className={`relative p-3 rounded-2xl border text-left transition select-none ${
                        isBusy
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100 cursor-not-allowed opacity-90'
                          : isSelected
                          ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-soft cursor-pointer'
                          : 'bg-card border-border hover:border-primary/50 hover:bg-muted/40 cursor-pointer shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-foreground truncate">
                          {pc.label}
                        </span>
                        {isBusy ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                            Busy
                          </span>
                        ) : (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-primary' : 'bg-emerald-500'
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {pc.assetTag}
                      </p>

                      {/* Busy PC Link to Active Ticket */}
                      {isBusy && pc.activeTicket && (
                        <div className="mt-2 pt-1 border-t border-amber-500/30">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/my-complaints');
                            }}
                            className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 group"
                          >
                            <span>Active ticket {pc.activeTicket.ticketId}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: STICKY DETAILS PANEL (lg:col-span-5) */}
          {/* ========================================================== */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-20 space-y-5 bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-soft">
              {/* Category Picker */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
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
                              ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20'
                              : 'bg-primary/10 border-primary ring-2 ring-primary/20'
                            : 'bg-background border-border hover:border-primary/40'
                        }`}
                      >
                        <span className="text-lg mb-1">{cat.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {cat.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                            {cat.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description & Character Count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    Description
                  </h2>
                  <span className={`text-[10px] ${description.length < 10 ? 'text-muted-foreground' : 'text-primary font-medium'}`}>
                    {description.length}/500 chars (min 10)
                  </span>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Describe what's wrong (e.g. PC won't power on, monitor display flickering, blue screen loop, mouse not responding)..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  required
                />
              </div>

              {/* Photo Upload with previews and remove */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      4
                    </span>
                    Attach Photo (Optional)
                  </h2>
                  <span className="text-[10px] text-muted-foreground">
                    {images.length}/3 Photos
                  </span>
                </div>

                <ImageUploader
                  value={images}
                  onChange={(newImages) => setImages(newImages)}
                  maxImages={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Selection Summary */}
              <div className="pt-3 border-t border-border/70 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Workstation:</span>
                  <span className="font-semibold text-foreground">
                    {selectedComputer ? `${selectedComputer.label} (${selectedComputer.assetTag})` : 'None selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold text-foreground">{category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Priority Hint:</span>
                  <span className={`font-semibold ${category === 'ELECTRICAL' ? 'text-destructive font-bold' : 'text-primary'}`}>
                    {priorityHint}
                  </span>
                </div>
              </div>

              {/* Desktop Submit Button (Hidden on mobile where sticky bottom submit bar takes over) */}
              <button
                type="submit"
                data-testid="submit-complaint-btn"
                disabled={isSubmitting || !selectedComputerId || description.trim().length < 10}
                className="hidden lg:block w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isSubmitting ? 'Registering Complaint...' : 'Register Complaint'}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM SUBMIT BAR (<1024px) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-md border-t border-border z-30 shadow-lg">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>{selectedComputer ? `PC: ${selectedComputer.label}` : 'Select a PC'} • {category}</span>
              <span className={category === 'ELECTRICAL' ? 'text-destructive font-bold' : 'text-primary'}>
                {priorityHint}
              </span>
            </div>

            <button
              type="submit"
              data-testid="submit-complaint-btn"
              disabled={isSubmitting || !selectedComputerId || description.trim().length < 10}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isSubmitting ? 'Registering Complaint...' : 'Register Complaint'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReportComplaint;
