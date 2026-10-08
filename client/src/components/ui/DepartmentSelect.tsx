import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DepartmentOption {
  _id: string;
  name: string;
  code: string;
}

export const ALL_DEPARTMENTS_AND_BRANCHES: DepartmentOption[] = [
  { _id: 'dept-comp', name: 'Computer Engineering', code: 'COMP' },
  { _id: 'dept-it', name: 'Information Technology', code: 'IT' },
  { _id: 'dept-aids', name: 'Artificial Intelligence & Data Science', code: 'AI&DS' },
  { _id: 'dept-cser', name: 'Computer Science & Engineering (Regional Language)', code: 'CSE-R' },
  { _id: 'dept-etc', name: 'Electronics & Telecommunication Engineering', code: 'E&TC' },
  { _id: 'dept-mech', name: 'Mechanical Engineering', code: 'MECH' },
  { _id: 'dept-civil', name: 'Civil Engineering', code: 'CIVIL' },
  { _id: 'dept-ra', name: 'Robotics & Automation', code: 'R&A' },
  { _id: 'dept-ash', name: 'Applied Sciences & Humanities (First Year / AS&H)', code: 'AS&H' },
  { _id: 'dept-mca', name: 'Master of Computer Applications (MCA)', code: 'MCA' },
];

export interface DepartmentSelectProps {
  id?: string;
  value: string;
  departments?: DepartmentOption[];
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  id,
  value,
  departments = [],
  onChange,
  error,
  disabled = false,
  placeholder = 'Select your department and branch...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Seamlessly merge full academic catalogue with DB records so MongoDB _ids are preserved
  const availableDepartments = useMemo(() => {
    const codeMap = new Map<string, DepartmentOption>();
    for (const d of departments) {
      if (d.code) codeMap.set(d.code.toUpperCase(), d);
      if (d.name) codeMap.set(d.name.toLowerCase(), d);
    }

    const merged: DepartmentOption[] = ALL_DEPARTMENTS_AND_BRANCHES.map((fallback) => {
      const match =
        codeMap.get(fallback.code.toUpperCase()) ||
        codeMap.get(fallback.name.toLowerCase());
      return match || fallback;
    });

    // Also include any extra custom departments from DB
    for (const d of departments) {
      if (!merged.some((m) => m._id === d._id || m.code?.toUpperCase() === d.code?.toUpperCase())) {
        merged.push(d);
      }
    }

    return merged;
  }, [departments]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter departments based on search query
  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableDepartments;
    return availableDepartments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(q) ||
        dept.code.toLowerCase().includes(q)
    );
  }, [searchQuery, availableDepartments]);

  // Find currently selected department object
  const selectedDepartment = useMemo(() => {
    if (!value) return null;
    return (
      availableDepartments.find(
        (dept) =>
          dept._id === value ||
          dept.code?.toUpperCase() === value.toUpperCase() ||
          dept.name?.toLowerCase() === value.toLowerCase()
      ) || { _id: value, name: value, code: 'DEPT' }
    );
  }, [value, availableDepartments]);

  const handleSelect = (deptVal: string) => {
    onChange(deptVal);
    setIsOpen(false);
  };

  const badgeColorMap: Record<string, string> = {
    'COMP': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
    'IT': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    'AI&DS': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    'CSE-R': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    'E&TC': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    'MECH': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    'CIVIL': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    'R&A': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    'AS&H': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
    'MCA': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-9.5 w-full items-center justify-between rounded-lg border bg-card px-3 py-1.5 text-xs text-foreground shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary',
          error
            ? 'border-destructive/80 focus-visible:ring-destructive/20 focus-visible:border-destructive text-destructive'
            : 'border-border hover:border-border/80',
          disabled && 'cursor-not-allowed opacity-50',
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          {selectedDepartment ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0',
                  badgeColorMap[selectedDepartment.code] || 'bg-primary/10 text-primary border-primary/20'
                )}
              >
                {selectedDepartment.code}
              </span>
              <span className="truncate font-medium">{selectedDepartment.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180 text-primary'
          )}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card p-2 shadow-soft-lg animate-in fade-in-0 zoom-in-95"
        >
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search department or branch (e.g. Comp, Mech, AI, Civil)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredDepartments.length > 0 ? (
              filteredDepartments.map((dept) => {
                const isSelected =
                  value === dept._id ||
                  value === dept.code ||
                  value === dept.name;
                return (
                  <button
                    key={dept._id || dept.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(dept._id)}
                    className={cn(
                      'w-full p-2 rounded-lg text-left text-xs transition flex items-center justify-between group',
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0',
                          badgeColorMap[dept.code] || 'bg-primary/10 text-primary border-primary/20'
                        )}
                      >
                        {dept.code}
                      </span>
                      <span className="truncate">{dept.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No predefined department matching "{searchQuery}"
                </p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(searchQuery.trim())}
                    className="w-full py-1.5 px-2 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Use "{searchQuery.trim()}"</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
};

export default DepartmentSelect;
