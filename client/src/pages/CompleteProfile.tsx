import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Building,
  Hash,
  BookOpen,
  Sun,
  Moon,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, RegisterProfileData } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { CourseSelect } from '../components/ui/CourseSelect';
import { DepartmentSelect } from '../components/ui/DepartmentSelect';
import { FixifyLogo } from '../components/layout/FixifyLogo';
import { api } from '../lib/axios';
import { getFriendlyAuthErrorMessage } from '../lib/firebase';

interface DepartmentOption {
  _id: string;
  name: string;
  code: string;
}

export const CompleteProfile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, registerProfile, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const redirectTarget = searchParams.get('redirect') || '/report';

  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Student fields
  const [course, setCourse] = useState('');
  const [year, setYear] = useState<'FE' | 'SE' | 'TE' | 'BE' | 'ME_1' | 'ME_2' | 'PHD'>('TE');
  const [division, setDivision] = useState('A');
  const [prn, setPrn] = useState('');

  // Faculty fields
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        if (mounted && res.data?.success && Array.isArray(res.data.data)) {
          setDepartments(res.data.data);
        }
      } catch {
        // Fallback
      }
    };
    fetchDepartments();
    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';

    if (role === 'STUDENT') {
      if (!prn.trim()) {
        newErrors.prn = 'PRN is mandatory for student registration.';
      } else if (!/^[A-Za-z0-9]{8,12}$/.test(prn.trim())) {
        newErrors.prn = 'PRN must be 8-12 alphanumeric characters (e.g. 124B1F042).';
      }
      if (!course.trim()) newErrors.course = 'Please select your degree program and branch.';
    }

    if (role === 'FACULTY') {
      if (!departmentId.trim()) {
        newErrors.department = 'Please select your department and branch.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const payload: RegisterProfileData = {
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(role === 'STUDENT'
          ? {
              course: course.trim(),
              year,
              division: division.trim(),
              prn: prn.trim().toUpperCase(),
            }
          : {
              department: departmentId || undefined,
              employeeId: employeeId.trim() || undefined,
            }),
      };

      const result = await registerProfile(payload);
      await refreshUser();

      if (result.isPendingApproval) {
        navigate(`/pending-approval?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
      } else {
        navigate(redirectTarget, { replace: true });
      }
    } catch (err: unknown) {
      setServerError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-primary/20">
      <div className="w-full max-w-5xl flex items-center justify-between pb-4 sm:pb-6">
        <div className="lg:hidden flex items-center">
          <FixifyLogo size={32} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            aria-label="Toggle theme"
            data-testid="theme-toggle"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-primary/5 border border-primary/15 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <FixifyLogo size={42} />

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                Complete Institutional Profile
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your institutional record to link lab assignments and maintenance reporting privileges.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Verified Identity</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Secure institutional binding with PCCoE academic rolls.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Workstation Routing</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Assigned laboratory access configured instantly after completion.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>PCCoE Campus System</span>
            <span className="font-semibold text-primary">v1.0 Institutional</span>
          </div>
        </div>

        <div className="lg:col-span-7 w-full max-w-lg lg:max-w-none mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6 relative">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Complete Your Profile
            </h1>
            <p className="text-xs text-muted-foreground">
              Link your institutional details to finalize campus IT access
            </p>
          </div>

          {serverError && (
            <div
              className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Role Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 border border-border rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT');
                  setErrors({});
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  role === 'STUDENT'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('FACULTY');
                  setErrors({});
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  role === 'FACULTY'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Faculty
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  First Name
                </label>
                <Input
                  type="text"
                  placeholder="Rahul"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4 text-muted-foreground" />}
                  error={errors.firstName}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Last Name
                </label>
                <Input
                  type="text"
                  placeholder="Deshmukh"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4 text-muted-foreground" />}
                  error={errors.lastName}
                  required
                />
              </div>
            </div>

            {role === 'STUDENT' ? (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="complete-profile-course"
                    className="text-xs font-semibold text-foreground block"
                  >
                    Degree Program / Course
                  </label>
                  <CourseSelect
                    id="complete-profile-course"
                    value={course}
                    onChange={(val) => {
                      setCourse(val);
                      if (errors.course) setErrors((prev) => ({ ...prev, course: '' }));
                    }}
                    error={errors.course}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Year
                    </label>
                    <Select
                      value={year}
                      onChange={(e) => setYear(e.target.value as 'FE' | 'SE' | 'TE' | 'BE' | 'ME_1' | 'ME_2' | 'PHD')}
                    >
                      <option value="FE">First Year (FE)</option>
                      <option value="SE">Second Year (SE)</option>
                      <option value="TE">Third Year (TE)</option>
                      <option value="BE">Final Year (BE)</option>
                      <option value="ME_1">M.Tech Year 1</option>
                      <option value="ME_2">M.Tech Year 2</option>
                      <option value="PHD">PhD Scholar</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Division
                    </label>
                    <Input
                      type="text"
                      maxLength={2}
                      placeholder="A"
                      value={division}
                      onChange={(e) => setDivision(e.target.value.toUpperCase())}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="complete-profile-prn"
                      className="text-xs font-semibold text-foreground block"
                    >
                      PRN
                    </label>
                    <Input
                      id="complete-profile-prn"
                      type="text"
                      placeholder="124B1FXXX"
                      value={prn}
                      onChange={(e) => {
                        setPrn(e.target.value.toUpperCase());
                        if (errors.prn) setErrors((prev) => ({ ...prev, prn: '' }));
                      }}
                      leftIcon={<Hash className="w-4 h-4 text-muted-foreground" />}
                      error={errors.prn}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="complete-profile-department"
                    className="text-xs font-semibold text-foreground block"
                  >
                    Department
                  </label>
                  <DepartmentSelect
                    id="complete-profile-department"
                    value={departmentId}
                    departments={departments}
                    onChange={(val) => {
                      setDepartmentId(val);
                      if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
                    }}
                    error={errors.department}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Employee ID (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="EMP-1042"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    leftIcon={<Building className="w-4 h-4 text-muted-foreground" />}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5 rounded-xl shadow-md transition mt-2"
              isLoading={isLoading}
            >
              Save & Continue
            </Button>
          </form>

          {/* SRS 6.2 Institutional Privacy Notice */}
          <div className="pt-3 border-t border-border">
            <div className="bg-muted/40 rounded-xl p-3 border border-border text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span>🔒</span> Institutional Privacy Notice (SRS 6.2)
              </div>
              <p className="leading-relaxed">
                Passwords are handled securely by Firebase Authentication and never stored by Fixify; we keep only name, institutional email, PRN/course details and role; no third-party tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
