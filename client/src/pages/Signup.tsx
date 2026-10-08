import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Building,
  Hash,
  QrCode,
  Activity,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth, RegisterProfileData } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { CourseSelect } from '../components/ui/CourseSelect';
import { DepartmentSelect } from '../components/ui/DepartmentSelect';
import { FixifyLogo } from '../components/layout/FixifyLogo';
import { PasswordStrengthMeter, calculatePasswordStrength } from '../components/auth/PasswordStrengthMeter';
import { api } from '../lib/axios';
import { getFriendlyAuthErrorMessage } from '../lib/firebase';

interface DepartmentOption {
  _id: string;
  name: string;
  code: string;
}

export const Signup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registerWithEmailPassword, loginWithGoogle } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const redirectTarget = searchParams.get('redirect') || '/report';

  // Role selection: STUDENT or FACULTY
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');

  // Common Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student-specific Fields
  const [course, setCourse] = useState('');
  const [year, setYear] = useState<'FE' | 'SE' | 'TE' | 'BE' | 'ME_1' | 'ME_2' | 'PHD'>('TE');
  const [division, setDivision] = useState('A');
  const [prn, setPrn] = useState('');

  // Faculty-specific Fields
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Load departments for faculty role
  useEffect(() => {
    let mounted = true;
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        if (mounted && res.data?.success && Array.isArray(res.data.data)) {
          setDepartments(res.data.data);
        }
      } catch {
        // Fallback or leave empty
      }
    };
    fetchDepartments();
    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Institutional email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid institutional email format.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    } else {
      const strength = calculatePasswordStrength(password);
      if (strength.score < 2) {
        newErrors.password = 'Please choose a stronger password.';
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (role === 'STUDENT') {
      if (!prn.trim()) {
        newErrors.prn = 'PRN is mandatory for student registration.';
      } else if (!/^[A-Za-z0-9]{8,12}$/.test(prn.trim())) {
        newErrors.prn = 'PRN must be 8-12 alphanumeric characters (e.g. 124B1F042).';
      }
      if (!course.trim()) {
        newErrors.course = 'Please select your degree program and branch.';
      }
    }

    if (role === 'FACULTY') {
      if (!departmentId.trim()) {
        newErrors.department = 'Please select your department and branch.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const profilePayload: RegisterProfileData = {
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

      await registerWithEmailPassword(email.trim(), password, profilePayload);

      // Successfully registered Firebase user & dispatched email verification
      navigate(
        `/verify-email?email=${encodeURIComponent(email.trim())}&redirect=${encodeURIComponent(redirectTarget)}`,
        { replace: true }
      );
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setServerError(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      setServerError(null);

      const result = await loginWithGoogle();

      if (result.requiresProfileCompletion) {
        navigate(
          `/complete-profile?redirect=${encodeURIComponent(redirectTarget)}`,
          { replace: true }
        );
      } else if (result.isPendingApproval) {
        navigate(
          `/pending-approval?redirect=${encodeURIComponent(redirectTarget)}`,
          { replace: true }
        );
      } else {
        navigate(redirectTarget, { replace: true });
      }
    } catch (err: unknown) {
      setServerError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-primary/20">
      {/* Top action bar */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-4 sm:pb-6">
        <Link to="/" className="lg:hidden flex items-center">
          <FixifyLogo size={32} />
        </Link>
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

      {/* Main split grid layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* DESKTOP BRAND PANEL (Left column, >= 1024px) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-primary/5 border border-primary/15 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <FixifyLogo size={42} />

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                Join Fixify Campus Maintenance
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Empowering students, faculty, and laboratory staff with quick workstation defect resolution.
              </p>
            </div>

            {/* 3 Benefit lines */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Direct Workstation Access</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    One-scan issue reporting mapped immediately to your enrolled division and laboratory.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Transparent Repair Queue</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Real-time status updates from initial inspection to final testing and ticket sign-off.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Privacy-Preserving Campus ID</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Linked to your official PCCOE email with secure Firebase Authentication and zero ads.
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

        {/* FORM CARD (Right column on desktop, single card on mobile) */}
        <div className="lg:col-span-7 w-full max-w-lg lg:max-w-none mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6 relative">
          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create Fixify Account
            </h1>
            <p className="text-xs text-muted-foreground">
              Institutional IT Asset & Maintenance Management
            </p>
          </div>

          {/* Global error banner */}
          {serverError && (
            <div
              className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Continue with Google button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
            isLoading={isGoogleLoading}
            className="w-full font-semibold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2.5 border-border"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
              or register with email
            </span>
            <div className="border-t border-border w-full" />
          </div>

          {/* Role Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Institutional Role
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

          {/* Registration Form */}
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-firstname"
                  className="text-xs font-semibold text-foreground block"
                >
                  First Name
                </label>
                <Input
                  id="signup-firstname"
                  type="text"
                  placeholder="Rahul"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                  }}
                  leftIcon={<UserIcon className="w-4 h-4 text-muted-foreground" />}
                  error={errors.firstName}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-lastname"
                  className="text-xs font-semibold text-foreground block"
                >
                  Last Name
                </label>
                <Input
                  id="signup-lastname"
                  type="text"
                  placeholder="Deshmukh"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                  }}
                  leftIcon={<UserIcon className="w-4 h-4 text-muted-foreground" />}
                  error={errors.lastName}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="text-xs font-semibold text-foreground block"
              >
                Institutional Email (@pccoe.org)
              </label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="name.dept@pccoe.org"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
                error={errors.email}
                required
              />
            </div>

            {/* Role-Specific Fields */}
            {role === 'STUDENT' ? (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-course"
                    className="text-xs font-semibold text-foreground block"
                  >
                    Degree Program / Course
                  </label>
                  <CourseSelect
                    id="signup-course"
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
                    <label
                      htmlFor="signup-division"
                      className="text-xs font-semibold text-foreground block"
                    >
                      Division
                    </label>
                    <Input
                      id="signup-division"
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
                      htmlFor="signup-prn"
                      className="text-xs font-semibold text-foreground block"
                    >
                      PRN
                    </label>
                    <Input
                      id="signup-prn"
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="signup-department"
                      className="text-xs font-semibold text-foreground block"
                    >
                      Department
                    </label>
                    <DepartmentSelect
                      id="signup-department"
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
                    <label
                      htmlFor="signup-empid"
                      className="text-xs font-semibold text-foreground block"
                    >
                      Employee ID (Optional)
                    </label>
                    <Input
                      id="signup-empid"
                      type="text"
                      placeholder="EMP-1042"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      leftIcon={<Building className="w-4 h-4 text-muted-foreground" />}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="text-xs font-semibold text-foreground block"
              >
                Password
              </label>
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 text-muted-foreground hover:text-foreground transition focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password}
                required
              />
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirmpassword"
                className="text-xs font-semibold text-foreground block"
              >
                Confirm Password
              </label>
              <Input
                id="signup-confirmpassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="p-1 text-muted-foreground hover:text-foreground transition focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={errors.confirmPassword}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5 rounded-xl shadow-md transition mt-2"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          {/* Link back to Login */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
            Already have an account?{' '}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
              className="text-primary hover:underline font-semibold"
            >
              Sign in
            </Link>
          </div>

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

export default Signup;
