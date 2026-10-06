import React from 'react';

interface ElectricalSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedKeyword?: string;
}

export const ElectricalSafetyModal: React.FC<ElectricalSafetyModalProps> = ({
  isOpen,
  onClose,
  detectedKeyword,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/70 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-rose-950/50 space-y-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500 flex items-center justify-center text-3xl shrink-0 animate-bounce">
            ⚡
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white tracking-wider uppercase">
              SAFETY PROTOCOL
            </span>
            <h3 id="safety-modal-title" className="text-lg font-bold text-rose-200 mt-1">
              Electrical Hazard Detected
            </h3>
          </div>
        </div>

        {detectedKeyword && (
          <div className="p-2.5 bg-rose-900/40 rounded-xl border border-rose-800/80 text-xs text-rose-200">
            Hazard keyword detected: <span className="font-mono font-bold text-white uppercase">{detectedKeyword}</span>
          </div>
        )}

        <div className="space-y-2.5 text-xs text-slate-300 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
          <p className="font-semibold text-rose-300">
            MANDATORY SAFETY ACTIONS:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-slate-200">
            <li>
              <strong className="text-white">DO NOT TOUCH</strong> the computer cabinet, power cables, switchboard, or peripherals.
            </li>
            <li>
              <strong className="text-white">STEP BACK</strong> from the workstation desk immediately.
            </li>
            <li>
              If safe to do so, inform fellow students nearby to stay clear of this machine.
            </li>
            <li>
              This report will automatically receive <strong className="text-rose-400">CRITICAL PRIORITY</strong> and immediately notify the Lab Assistant.
            </li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-900/40 transition active:scale-[0.98]"
        >
          I Understand & Stepped Back
        </button>
      </div>
    </div>
  );
};
