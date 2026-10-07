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
} from 'lucide-react';
import { useAuth, RegisterProfileData } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
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

  const redirectTarget = searchParams.get('redirect') || '/report';

  // Role selection
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');

  // Pre-fill names if available
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(
    user?.lastName || user?.name?.split(' ').slice(1).join(' ') || ''
  );

  // Student fields
  const [course, setCourse] = useState(user?.course || 'B.Tech Computer Engineering');
  const [year, setYear] = useState<'FE' | 'SE' | 'TE' | 'BE' | 'ME_1' | 'ME_2' | 'PHD'>('TE');
  const [division, setDivision] = useState(user?.division || 'A');
  const [prn, setPrn] = useState(user?.prn || '');

  // Faculty fields
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState(user?.employeeId || '');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

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
        // Fallback
      }
    };
    fetchDepartments();
    return () => {
      mounted = false;
    };
  }, []);

  // Redirect if user already completed profile
  useEffect(() => {
    if (user && user.profileComplete) {
      if (user.approvalStatus === 'PENDING_APPROVAL') {
        navigate(`/pending-approval?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
      } else {
        navigate(redirectTarget, { replace: true });
      }
    }
  }, [user, redirectTarget, navigate]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';

    if (role === 'STUDENT') {
      if (!prn.trim()) {
        newErrors.prn = 'PRN is required for student verification.';
      } else if (!/^[0-9]{8,12}[A-Za-z]?$/.test(prn.trim())) {
        newErrors.prn = 'PRN should be 8-12 alphanumeric characters (e.g. 12022001).';
      }
      if (!course.trim()) newErrors.course = 'Course is required.';
    }

    if (role === 'FACULTY') {
      if (!departmentId && departments.length > 0) {
        newErrors.department = 'Department is required for faculty.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

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
              prn: prn.trim(),
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-blue-500/30">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Complete Your Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Link your institutional details to finalize campus IT access
          </p>
        </div>

        {serverError && (
          <div
            className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">
            Select Your Role
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="profile-firstname"
                className="text-xs font-semibold text-slate-300 block"
              >
                First Name
              </label>
              <Input
                id="profile-firstname"
                type="text"
                placeholder="First name"
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
                htmlFor="profile-lastname"
                className="text-xs font-semibold text-slate-300 block"
              >
                Last Name
              </label>
              <Input
                id="profile-lastname"
                type="text"
                placeholder="Last name"
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

          {role === 'STUDENT' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-course"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Course / Degree
                  </label>
                  <Input
                    id="profile-course"
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
                    htmlFor="profile-prn"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Permanent Reg. Number (PRN)
                  </label>
                  <Input
                    id="profile-prn"
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-year"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Academic Year
                  </label>
                  <Select
                    id="profile-year"
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
                    htmlFor="profile-division"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Division
                  </label>
                  <Input
                    id="profile-division"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-dept"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Department
                  </label>
                  {departments.length > 0 ? (
                    <Select
                      id="profile-dept"
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
                      id="profile-dept"
                      type="text"
                      placeholder="Department"
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
                    htmlFor="profile-emp-id"
                    className="text-xs font-semibold text-slate-300 block"
                  >
                    Employee ID (Optional)
                  </label>
                  <Input
                    id="profile-emp-id"
                    type="text"
                    placeholder="EMP-1042"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    leftIcon={<Hash className="w-4 h-4 text-slate-400" />}
                    className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition mt-2"
            isLoading={isLoading}
          >
            Complete Registration
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
