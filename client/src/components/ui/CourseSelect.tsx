import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BookOpen, Search, ChevronDown, Check, X, GraduationCap } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CourseOption {
  value: string;
  label: string;
  degree: 'B.Tech' | 'M.Tech' | 'MCA' | 'Ph.D' | 'Other';
  branch: string;
}

export const COLLEGE_COURSES: CourseOption[] = [
  // Undergraduate Programs (B.Tech)
  { value: 'B.Tech - Computer Engineering', label: 'B.Tech - Computer Engineering', degree: 'B.Tech', branch: 'Computer Engineering' },
  { value: 'B.Tech - Information Technology', label: 'B.Tech - Information Technology', degree: 'B.Tech', branch: 'Information Technology' },
  { value: 'B.Tech - Artificial Intelligence & Data Science', label: 'B.Tech - Artificial Intelligence & Data Science (AI & DS)', degree: 'B.Tech', branch: 'AI & Data Science' },
  { value: 'B.Tech - Computer Science & Engineering (Regional)', label: 'B.Tech - Computer Science & Engineering (Regional Language)', degree: 'B.Tech', branch: 'CSE (Regional)' },
  { value: 'B.Tech - Electronics & Telecommunication', label: 'B.Tech - Electronics & Telecommunication (E&TC)', degree: 'B.Tech', branch: 'Electronics & Telecommunication' },
  { value: 'B.Tech - Mechanical Engineering', label: 'B.Tech - Mechanical Engineering', degree: 'B.Tech', branch: 'Mechanical Engineering' },
  { value: 'B.Tech - Civil Engineering', label: 'B.Tech - Civil Engineering', degree: 'B.Tech', branch: 'Civil Engineering' },
  { value: 'B.Tech - Robotics & Automation', label: 'B.Tech - Robotics & Automation', degree: 'B.Tech', branch: 'Robotics & Automation' },

  // Postgraduate Programs (M.Tech & MCA)
  { value: 'M.Tech - Computer Engineering', label: 'M.Tech - Computer Engineering', degree: 'M.Tech', branch: 'Computer Engineering' },
  { value: 'M.Tech - Artificial Intelligence & Data Science', label: 'M.Tech - Artificial Intelligence & Data Science', degree: 'M.Tech', branch: 'AI & Data Science' },
  { value: 'M.Tech - Mechanical (Design Engineering)', label: 'M.Tech - Mechanical (Design Engineering)', degree: 'M.Tech', branch: 'Mechanical (Design)' },
  { value: 'M.Tech - Mechanical (Heat Power Engineering)', label: 'M.Tech - Mechanical (Heat Power Engineering)', degree: 'M.Tech', branch: 'Mechanical (Heat Power)' },
  { value: 'M.Tech - Electronics & Telecommunication', label: 'M.Tech - Electronics & Telecommunication', degree: 'M.Tech', branch: 'Electronics & Telecommunication' },
  { value: 'M.Tech - Information Technology', label: 'M.Tech - Information Technology', degree: 'M.Tech', branch: 'Information Technology' },
  { value: 'MCA - Master of Computer Applications', label: 'MCA - Master of Computer Applications', degree: 'MCA', branch: 'Computer Applications' },

  // Doctoral Programs (Ph.D)
  { value: 'Ph.D - Computer Engineering', label: 'Ph.D - Computer Engineering', degree: 'Ph.D', branch: 'Computer Engineering' },
  { value: 'Ph.D - Mechanical Engineering', label: 'Ph.D - Mechanical Engineering', degree: 'Ph.D', branch: 'Mechanical Engineering' },
  { value: 'Ph.D - Electronics & Telecommunication', label: 'Ph.D - Electronics & Telecommunication', degree: 'Ph.D', branch: 'Electronics & Telecommunication' },
  { value: 'Ph.D - Civil Engineering', label: 'Ph.D - Civil Engineering', degree: 'Ph.D', branch: 'Civil Engineering' },
];

export interface CourseSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const CourseSelect: React.FC<CourseSelectProps> = ({
  id,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'Select your course and branch...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COLLEGE_COURSES;
    return COLLEGE_COURSES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.branch.toLowerCase().includes(q) ||
        c.degree.toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Selected item display
  const selectedCourse = useMemo(() => {
    return (
      COLLEGE_COURSES.find((c) => c.value === value || c.label === value) ||
      (value ? { value, label: value, degree: 'Other' as const, branch: value } : null)
    );
  }, [value]);

  const handleSelect = (courseVal: string) => {
    onChange(courseVal);
    setIsOpen(false);
  };

  const degreeBadgeColors: Record<string, string> = {
    'B.Tech': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
    'M.Tech': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    'MCA': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    'Ph.D': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    'Other': 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Dropdown Trigger Button */}
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
          <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
          {selectedCourse ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0', degreeBadgeColors[selectedCourse.degree] || degreeBadgeColors['Other'])}>
                {selectedCourse.degree}
              </span>
              <span className="truncate font-medium">{selectedCourse.branch || selectedCourse.label}</span>
            </div>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150', isOpen && 'rotate-180 text-primary')}
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
              placeholder="Search branch or degree (e.g., Computer, AI, Mech, M.Tech)..."
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

          {/* Courses List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((c) => {
                const isSelected = value === c.value || value === c.label;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c.value)}
                    className={cn(
                      'w-full p-2 rounded-lg text-left text-xs transition flex items-center justify-between group',
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0', degreeBadgeColors[c.degree] || degreeBadgeColors['Other'])}>
                        {c.degree}
                      </span>
                      <span className="truncate">{c.branch}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No predefined course matching "{searchQuery}"
                </p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(searchQuery.trim())}
                    className="w-full py-1.5 px-2 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
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

export default CourseSelect;
