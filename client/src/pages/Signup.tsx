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
  BookOpen,
} from 'lucide-react';
import { useAuth, RegisterProfileData } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
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
  const [course, setCourse] = useState('B.Tech Computer Engineering');
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
          if (res.data.data.length > 0) {
            setDepartmentId((prev) => prev || res.data.data[0]._id);
          }
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
      } else if (!/^[0-9]{8,12}[A-Za-z]?$/.test(prn.trim())) {
        newErrors.prn = 'PRN should be 8-12 alphanumeric digits (e.g. 12022001).';
      }
      if (!course.trim()) {
        newErrors.course = 'Course is required.';
      }
    }

    if (role === 'FACULTY') {
      if (!departmentId && departments.length > 0) {
        newErrors.department = 'Department selection is mandatory for faculty.';
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
              prn: prn.trim(),
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-blue-500/30">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Fixify Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Institutional IT Asset & Maintenance Management
          </p>
        </div>

        {/* Global error banner */}
        {serverError && (
          <div
            className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
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
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-2.5 rounded-xl border-transparent shadow-md transition flex items-center justify-center gap-2.5"
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
          <div className="border-t border-slate-700/80 w-full" />
          <span className="bg-slate-800 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 shrink-0">
            or register with email
          </span>
          <div className="border-t border-slate-700/80 w-full" />
        </div>

        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">
            Institutional Role
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 border border-slate-700 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setRole('STUDENT');
                setErrors({});
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                role === 'STUDENT'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                className="text-xs font-semibold text-slate-300 block"
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
                leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
                error={errors.firstName}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="signup-lastname"
                className="text-xs font-semibold text-slate-300 block"
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
                className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
                error={errors.lastName}
                required
              />
            </div>
          </div>

          {/* Role-Specific Fields */}
          {role === 'STUDENT' ? (
            <>
              {/* Course & PRN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-course"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Course / Degree
                  </label>
                  <Input
                    id="signup-course"
                    type="text"
                    placeholder="B.Tech Computer"
                    value={course}
                    onChange={(e) => {
                      setCourse(e.target.value);
                      if (errors.course) setErrors((prev) => ({ ...prev, course: '' }));
                    }}
                    leftIcon={<BookOpen className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    error={errors.course}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-prn"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Permanent Reg. Number (PRN)
                  </label>
                  <Input
                    id="signup-prn"
                    type="text"
                    placeholder="12022001"
                    value={prn}
                    onChange={(e) => {
                      setPrn(e.target.value);
                      if (errors.prn) setErrors((prev) => ({ ...prev, prn: '' }));
                    }}
                    leftIcon={<Hash className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    error={errors.prn}
                    required
                  />
                </div>
              </div>

              {/* Year & Division */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-year"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Academic Year
                  </label>
                  <Select
                    id="signup-year"
                    value={year}
                    onChange={(e) =>
                      setYear(e.target.value as 'FE' | 'SE' | 'TE' | 'BE' | 'ME_1' | 'ME_2' | 'PHD')
                    }
                    className="bg-slate-900/80 border-slate-700 text-slate-100"
                  >
                    <option value="FE">First Year (FE)</option>
                    <option value="SE">Second Year (SE)</option>
                    <option value="TE">Third Year (TE)</option>
                    <option value="BE">Final Year (BE)</option>
                    <option value="ME_1">M.Tech Year 1</option>
                    <option value="ME_2">M.Tech Year 2</option>
                    <option value="PHD">Ph.D Scholar</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-division"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Division
                  </label>
                  <Input
                    id="signup-division"
                    type="text"
                    placeholder="A"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Faculty Department & Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-dept"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Department
                  </label>
                  {departments.length > 0 ? (
                    <Select
                      id="signup-dept"
                      value={departmentId}
                      onChange={(e) => {
                        setDepartmentId(e.target.value);
                        if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
                      }}
                      className="bg-slate-900/80 border-slate-700 text-slate-100"
                      error={errors.department}
                    >
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id="signup-dept"
                      type="text"
                      placeholder="e.g. Computer Engineering"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      leftIcon={<Building className="w-4 h-4 text-slate-400" />}
                      className="bg-slate-900/80 border-slate-700 text-slate-100"
                      error={errors.department}
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-employee-id"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Employee ID (Optional)
                  </label>
                  <Input
                    id="signup-employee-id"
                    type="text"
                    placeholder="EMP-1042"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    leftIcon={<Hash className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                Note: Faculty accounts require institutional verification. If your domain is not auto-approved, an administrator will review your account.
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-email"
              className="text-xs font-semibold text-slate-300 block"
            >
              Institutional Email
            </label>
            <Input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@pccoepune.org or name@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
              error={errors.email}
              required
            />
            <p className="text-[11px] text-slate-400">
              Only authorized emails ending in <span className="text-blue-400 font-mono">@pccoepune.org</span> or <span className="text-blue-400 font-mono">@gmail.com</span> are permitted.
            </p>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-password"
              className="text-xs font-semibold text-slate-300 block"
            >
              Password
            </label>
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              name="new-password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              rightIcon={
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
              error={errors.password}
              required
            />
            <PasswordStrengthMeter password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-confirm-password"
              className="text-xs font-semibold text-slate-300 block"
            >
              Confirm Password
            </label>
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirm-password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              rightIcon={
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
              error={errors.confirmPassword}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition mt-2"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        {/* Link back to Login */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-700/80">
          Already have an account?{' '}
          <Link
            to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
            className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
