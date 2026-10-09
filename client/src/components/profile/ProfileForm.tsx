import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, Phone, FileText, Hash, Building, GraduationCap, Briefcase } from 'lucide-react';
import { User } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CourseSelect } from '../ui/CourseSelect';
import { DepartmentSelect } from '../ui/DepartmentSelect';
import { api } from '../../lib/axios';
import { useToast } from '../ui/Toast';

interface DepartmentOption {
  _id: string;
  name: string;
  code: string;
}

export interface ProfileFormProps {
  mode: 'edit' | 'complete';
  user: User;
  onSuccess?: (updated: User) => void;
  // For 'complete' mode
  redirectTarget?: string;
  onCompleteSubmit?: (payload: Record<string, unknown>) => Promise<void>;
  isLoadingExternal?: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  mode,
  user,
  onSuccess,
  onCompleteSubmit,
  isLoadingExternal = false,
}) => {
  const { toast } = useToast();

  // Role state (only selectable in 'complete' mode)
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>(
    user.role === 'FACULTY' ? 'FACULTY' : 'STUDENT'
  );

  // Common fields
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [bio, setBio] = useState(user.bio || '');

  // Student fields
  const [course, setCourse] = useState(user.course || '');
  const [year, setYear] = useState<string>(user.year || 'TE');
  const [division, setDivision] = useState(user.division || 'A');
  const [prn, setPrn] = useState(user.prn || '');

  // Faculty fields
  const [departmentId, setDepartmentId] = useState<string>(
    typeof user.department === 'object' && user.department?._id
      ? user.department._id
      : typeof user.department === 'string'
      ? user.department
      : ''
  );
  const [employeeId, setEmployeeId] = useState(user.employeeId || '');

  // Departments list for faculty select
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (!user.firstName && !user.lastName && user.name) {
        const parts = user.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      if (user.phone) setPhone(user.phone);
      if (user.bio) setBio(user.bio);
      if (user.course) setCourse(user.course);
      if (user.year) setYear(user.year);
      if (user.division) setDivision(user.division);
      if (user.prn) setPrn(user.prn);
      if (user.employeeId) setEmployeeId(user.employeeId);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    api
      .get('/departments')
      .then((res) => {
        if (mounted && res.data?.success && Array.isArray(res.data.data)) {
          setDepartments(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';

    if (bio.length > 160) {
      errs.bio = 'Bio cannot exceed 160 characters.';
    }

    if (phone.trim() && !/^\+?[0-9]{10,15}$/.test(phone.trim().replace(/[\s-]/g, ''))) {
      errs.phone = 'Please enter a valid phone number (10-15 digits).';
    }

    if (mode === 'complete') {
      if (role === 'STUDENT') {
        if (!prn.trim()) {
          errs.prn = 'PRN is mandatory for student registration.';
        } else if (!/^[A-Za-z0-9]{8,12}$/.test(prn.trim())) {
          errs.prn = 'PRN must be 8-12 alphanumeric characters (e.g. 124B1F042).';
        }
        if (!course.trim()) errs.course = 'Please select your degree program and branch.';
      } else {
        if (!departmentId.trim()) {
          errs.department = 'Please select your department.';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === 'complete' && onCompleteSubmit) {
      const payload = {
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(role === 'STUDENT'
          ? {
              course: course.trim(),
              year,
              division: division.trim().toUpperCase(),
              prn: prn.trim().toUpperCase(),
            }
          : {
              department: departmentId || undefined,
              employeeId: employeeId.trim() || undefined,
            }),
      };
      await onCompleteSubmit(payload);
      return;
    }

    // 'edit' mode: call PATCH /profile/me
    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      };

      if (user.role === 'STUDENT') {
        payload.course = course.trim();
        payload.year = year;
        payload.division = division.trim().toUpperCase();
      }

      const res = await api.patch('/profile/me', payload, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      if (res.data?.success) {
        toast.success('Your profile has been updated successfully.', 'Profile Saved');
        if (onSuccess) {
          onSuccess(res.data.data);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(
        error.response?.data?.error?.message || 'Failed to update profile. Please try again.',
        'Update Error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStudent = mode === 'complete' ? role === 'STUDENT' : user.role === 'STUDENT';
  const isFaculty = mode === 'complete' ? role === 'FACULTY' : user.role === 'FACULTY';
  const isAssistant = user.role === 'LAB_ASSISTANT';
  const isAuthority = user.role === 'DEPT_AUTHORITY' || user.role === 'HOD';

  const departmentDisplay =
    typeof user.department === 'object' && user.department
      ? `${user.department.name} (${user.department.code})`
      : 'Institutional Department';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Picker (Visible ONLY in 'complete' mode) */}
      {mode === 'complete' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Select Your Institutional Role
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
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            First Name <span className="text-destructive">*</span>
          </label>
          <Input
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
          <label className="text-xs font-semibold text-foreground block">
            Last Name <span className="text-destructive">*</span>
          </label>
          <Input
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

      {/* Contact & Bio Fields (Always available in 'edit' mode) */}
      {mode === 'edit' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              leftIcon={<Phone className="w-4 h-4 text-muted-foreground" />}
              error={errors.phone}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground block">
                Bio (Optional)
              </label>
              <span className={`text-[10px] ${bio.length > 150 ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                {bio.length}/160
              </span>
            </div>
            <Input
              type="text"
              placeholder="Brief institutional bio or area of interest..."
              value={bio}
              maxLength={160}
              onChange={(e) => {
                setBio(e.target.value);
                if (errors.bio) setErrors((prev) => ({ ...prev, bio: '' }));
              }}
              leftIcon={<FileText className="w-4 h-4 text-muted-foreground" />}
              error={errors.bio}
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STUDENT SPECIFIC SECTION */}
      {/* ============================================================ */}
      {isStudent && (
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Student Academic Record
              </h3>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="student-course-select" className="text-xs font-semibold text-foreground block">
              Degree Program / Course
            </label>
            <CourseSelect
              id="student-course-select"
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
              <label className="text-xs font-semibold text-foreground block">Year</label>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value)}
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
              <label className="text-xs font-semibold text-foreground block">Division</label>
              <Input
                type="text"
                maxLength={2}
                placeholder="A"
                value={division}
                onChange={(e) => setDivision(e.target.value.toUpperCase())}
                required
              />
            </div>

            {/* PRN Field: Read-Only in 'edit' mode, Editable in 'complete' mode */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="student-prn-input" className="text-xs font-semibold text-foreground block">
                  PRN
                </label>
                {mode === 'edit' && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-muted-foreground" /> Locked
                  </span>
                )}
              </div>
              <Input
                id="student-prn-input"
                type="text"
                placeholder="124B1F042"
                value={prn}
                readOnly={mode === 'edit'}
                disabled={mode === 'edit'}
                onChange={(e) => {
                  setPrn(e.target.value.toUpperCase());
                  if (errors.prn) setErrors((prev) => ({ ...prev, prn: '' }));
                }}
                leftIcon={<Hash className="w-4 h-4 text-muted-foreground" />}
                className={mode === 'edit' ? 'bg-muted/60 cursor-not-allowed text-muted-foreground' : ''}
                error={errors.prn}
                required
              />
              {mode === 'edit' && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3 shrink-0 text-muted-foreground" />
                  <span>Contact an administrator to change this</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FACULTY / AUTHORITY SPECIFIC SECTION */}
      {/* ============================================================ */}
      {(isFaculty || isAuthority) && (
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Departmental Information
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department: Select in 'complete', Read-only locked in 'edit' */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground block">Department</label>
                {mode === 'edit' && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-muted-foreground" /> Locked
                  </span>
                )}
              </div>

              {mode === 'complete' ? (
                <DepartmentSelect
                  id="faculty-department-select"
                  value={departmentId}
                  departments={departments}
                  onChange={(val) => {
                    setDepartmentId(val);
                    if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
                  }}
                  error={errors.department}
                />
              ) : (
                <>
                  <Input
                    type="text"
                    value={departmentDisplay}
                    readOnly
                    disabled
                    leftIcon={<Building className="w-4 h-4 text-muted-foreground" />}
                    className="bg-muted/60 cursor-not-allowed text-muted-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Lock className="w-3 h-3 shrink-0 text-muted-foreground" />
                    <span>Contact an administrator to change this</span>
                  </p>
                </>
              )}
            </div>

            {/* Employee ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Employee ID {mode === 'complete' ? '(Optional)' : ''}
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
        </div>
      )}

      {/* ============================================================ */}
      {/* LAB ASSISTANT SPECIFIC READ-ONLY SECTION */}
      {/* ============================================================ */}
      {isAssistant && mode === 'edit' && (
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Assigned Laboratories & Scope
              </h3>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Lock className="w-3 h-3 text-muted-foreground" /> Managed by Admin
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">
              Assigned Workstation Labs
            </label>
            {user.assignedLabs && Array.isArray(user.assignedLabs) && user.assignedLabs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.assignedLabs.map((lab) => (
                  <div
                    key={typeof lab === 'string' ? lab : lab._id}
                    className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold flex items-center gap-2 text-foreground shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{typeof lab === 'string' ? lab : `${lab.name} (${lab.code})`}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No laboratories currently assigned.</p>
            )}
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
              <Lock className="w-3 h-3 shrink-0 text-muted-foreground" />
              <span>Contact an administrator to change this</span>
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* INSTITUTIONAL READ-ONLY IDENTIFIERS (Email & Role) */}
      {/* ============================================================ */}
      {mode === 'edit' && (
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Institutional Account Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Institutional Email</label>
              <Input
                type="email"
                value={user.email}
                readOnly
                disabled
                className="bg-muted/60 cursor-not-allowed text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <Lock className="w-3 h-3 shrink-0 text-muted-foreground" />
                <span>Contact an administrator to change this</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">System Role</label>
              <Input
                type="text"
                value={user.role}
                readOnly
                disabled
                className="bg-muted/60 cursor-not-allowed text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <Lock className="w-3 h-3 shrink-0 text-muted-foreground" />
                <span>Contact an administrator to change this</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full sm:w-auto min-w-36 font-semibold shadow-soft"
          isLoading={isSubmitting || isLoadingExternal}
        >
          {mode === 'complete' ? 'Save & Continue' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
