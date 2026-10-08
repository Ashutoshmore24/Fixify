import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/axios';
import { NotificationItem, UserRole } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { FixifyLogo } from './FixifyLogo';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui';
import {
  PlusCircle,
  Clock,
  Wrench,
  ShieldAlert,
  BarChart3,
  Sparkles,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCheck,
  Check,
  Sun,
  Moon,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  testId: string;
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, devLogin } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationPopover, setShowNotificationPopover] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileDrawerOpen(false);
    setShowNotificationPopover(false);
    setShowUserDropdown(false);
  }, [location.pathname]);

  // Synchronize document.title based on active route
  useEffect(() => {
    const path = location.pathname;
    let title = 'Fixify | College IT Maintenance';
    if (path.startsWith('/report')) {
      title = 'Fixify | Report Complaint';
    } else if (path === '/my-complaints') {
      title = 'Fixify | My Complaints';
    } else if (path === '/assistant') {
      title = 'Fixify | Work Orders & Dashboard';
    } else if (path === '/login') {
      title = 'Fixify | Institutional Login';
    } else if (path === '/signup') {
      title = 'Fixify | Create Account';
    } else if (path === '/verify-email') {
      title = 'Fixify | Verify Email';
    } else if (path === '/complete-profile') {
      title = 'Fixify | Complete Profile';
    } else if (path === '/pending-approval') {
      title = 'Fixify | Pending Approval';
    } else if (path === '/design') {
      title = 'Fixify | Design System Preview';
    }
    document.title = title;
  }, [location.pathname]);

  // Fetch initial notifications & listen for real-time socket events
  useEffect(() => {
    if (!user) return;

    api
      .get('/notifications')
      .then((res) => {
        if (res.data?.success) {
          setNotifications(res.data.data);
        }
      })
      .catch(() => {});

    if (socket) {
      const handleNewNotification = (item: NotificationItem) => {
        setNotifications((prev) => [item, ...prev]);
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('notification', handleNewNotification);
      };
    }
  }, [user, socket]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  };

  // Determine role-scoped navigation links
  const getNavItems = (role?: UserRole): NavItem[] => {
    if (!role) return [];

    const items: NavItem[] = [];

    switch (role) {
      case 'STUDENT':
      case 'FACULTY':
        items.push(
          { label: 'Report Issue', href: '/report', icon: PlusCircle, testId: 'nav-report' },
          { label: 'My Complaints', href: '/my-complaints', icon: Clock, testId: 'nav-my-complaints' }
        );
        break;

      case 'LAB_ASSISTANT':
        items.push(
          { label: 'Work Orders', href: '/assistant', icon: Wrench, testId: 'nav-assistant' },
          { label: 'Report Issue', href: '/report', icon: PlusCircle, testId: 'nav-report' },
          { label: 'My Complaints', href: '/my-complaints', icon: Clock, testId: 'nav-my-complaints' }
        );
        break;

      case 'DEPT_AUTHORITY':
        items.push(
          { label: 'Department Queue', href: '/assistant', icon: ShieldAlert, testId: 'nav-authority' },
          { label: 'Report Issue', href: '/report', icon: PlusCircle, testId: 'nav-report' },
          { label: 'My Complaints', href: '/my-complaints', icon: Clock, testId: 'nav-my-complaints' }
        );
        break;

      case 'HOD':
        items.push(
          { label: 'Department Overview', href: '/assistant', icon: BarChart3, testId: 'nav-hod' },
          { label: 'My Complaints', href: '/my-complaints', icon: Clock, testId: 'nav-my-complaints' }
        );
        break;

      case 'ADMIN':
        items.push(
          { label: 'Admin Work Orders', href: '/assistant', icon: Wrench, testId: 'nav-admin' },
          { label: 'Report Issue', href: '/report', icon: PlusCircle, testId: 'nav-report' },
          { label: 'My Complaints', href: '/my-complaints', icon: Clock, testId: 'nav-my-complaints' }
        );
        break;
    }

    if (import.meta.env.DEV) {
      items.push({
        label: 'Design System',
        href: '/design',
        icon: Sparkles,
        testId: 'nav-design',
      });
    }

    return items;
  };

  const navItems = getNavItems(user?.role);

  // If unauthenticated or on auth pages, render clean page without sidebar
  const authRoutes = ['/login', '/signup', '/verify-email', '/complete-profile', '/pending-approval'];
  if (!user || authRoutes.includes(location.pathname)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-soft"
        >
          Skip to main content
        </a>
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Current page heading calculation
  const getCurrentPageTitle = () => {
    const current = navItems.find((item) =>
      item.href === '/report'
        ? location.pathname.startsWith('/report')
        : location.pathname === item.href
    );
    if (current) return current.label;
    if (location.pathname.startsWith('/report')) return 'Report Issue';
    if (location.pathname === '/design') return 'Design System Preview';
    return 'Dashboard';
  };

  const roleBadgeMap: Record<UserRole, { label: string; variant: 'status_open' | 'status_assigned' | 'status_accepted' | 'status_in_progress' | 'status_resolved' | 'status_escalated' }> = {
    STUDENT: { label: 'Student', variant: 'status_open' },
    FACULTY: { label: 'Faculty', variant: 'status_accepted' },
    LAB_ASSISTANT: { label: 'Lab Assistant', variant: 'status_assigned' },
    DEPT_AUTHORITY: { label: 'Dept Authority', variant: 'status_in_progress' },
    HOD: { label: 'Head of Dept', variant: 'status_resolved' },
    ADMIN: { label: 'Administrator', variant: 'status_escalated' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row antialiased">
      {/* Skip to Content Accessible Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-soft text-sm font-medium"
      >
        Skip to main content
      </a>

      {/* ============================================================ */}
      {/* DESKTOP COLLAPSIBLE SIDEBAR (Hidden on mobile / tablet < 1024px) */}
      {/* ============================================================ */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-card/60 backdrop-blur-xs transition-all duration-200 select-none ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border/70">
          <Link
            to="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
          >
            <FixifyLogo collapsed={sidebarCollapsed} size={30} />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto" aria-label="Main Menu">
          <p
            className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
              sidebarCollapsed ? 'sr-only' : 'block'
            }`}
          >
            Navigation
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/report'
                ? location.pathname.startsWith('/report')
                : location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                data-testid={item.testId}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-soft'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Card & Collapse Toggle */}
        <div className="p-3 border-t border-border/70 space-y-2">
          {/* User Preview */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 border border-border/50 ${
              sidebarCollapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            <Avatar status="online" className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  {user.email}
                </p>
              </div>
            )}
          </div>

          {/* Collapse/Expand Sidebar Button */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 p-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                <span className="text-[11px] font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN LAYOUT WRAPPER (Top Bar + Main Content Area) */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header
          className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between"
          role="banner"
        >
          {/* Left Top Bar: Mobile Hamburger + Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              data-testid="mobile-menu-btn"
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>

            {/* Mobile Brand Monogram */}
            <div className="lg:hidden flex items-center">
              <FixifyLogo size={28} collapsed={true} />
            </div>

            {/* Current Page Title */}
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">
                {getCurrentPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Top Bar: Theme, Role Badge, Notifications, User Menu */}
          <div className="flex items-center gap-2.5">
            {/* Role Badge */}
            <Badge
              variant={roleBadgeMap[user.role]?.variant || 'status_open'}
              size="sm"
              className="hidden sm:inline-flex"
            >
              {roleBadgeMap[user.role]?.label || user.role}
            </Badge>

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" strokeWidth={1.75} />
              )}
            </Button>

            {/* Notification Bell with Popover */}
            <div className="relative">
              <button
                type="button"
                data-testid="notification-bell"
                onClick={() => {
                  setShowNotificationPopover(!showNotificationPopover);
                  setShowUserDropdown(false);
                }}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                aria-label={`Notifications, ${unreadCount} unread`}
              >
                <Bell className="h-4.5 w-4.5" strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotificationPopover && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card p-3 shadow-soft-lg z-50 animate-in fade-in-0 zoom-in-95"
                  role="region"
                  aria-label="Notifications list"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-border/70 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-medium text-primary">
                          ({unreadCount} new)
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary hover:underline font-medium focus-visible:outline-none"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No notifications right now
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-2.5 rounded-lg text-xs transition-colors border ${
                            n.read
                              ? 'border-transparent text-muted-foreground'
                              : 'border-primary/20 bg-primary/5 text-foreground font-medium'
                          }`}
                        >
                          <div className="font-semibold text-foreground flex items-center justify-between">
                            <span>{n.title}</span>
                            {!n.read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu Trigger */}
            <div className="relative">
              <button
                type="button"
                data-testid="user-menu-btn"
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotificationPopover(false);
                }}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="User Account Menu"
              >
                <Avatar status="online" className="h-8 w-8">
                  <AvatarFallback className="text-xs font-semibold bg-secondary text-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-soft-lg z-50 animate-in fade-in-0 zoom-in-95"
                  role="menu"
                >
                  {/* Account Summary */}
                  <div className="p-2 border-b border-border/70 mb-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                    <div className="mt-1.5">
                      <Badge
                        variant={roleBadgeMap[user.role]?.variant || 'status_open'}
                        size="sm"
                      >
                        {roleBadgeMap[user.role]?.label || user.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Dev Fast Impersonation (VISIBLE ONLY IN DEVELOPMENT) */}
                  {import.meta.env.DEV && (
                    <div className="p-2 border-b border-border/70 mb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-primary" strokeWidth={1.75} />
                        Fast Role Switch (Dev)
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={async () => {
                            await devLogin('student@pccoe.org', 'STUDENT');
                            setShowUserDropdown(false);
                          }}
                          className={`p-1.5 rounded-md text-left transition-colors flex items-center justify-between ${
                            user.role === 'STUDENT'
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted/70 text-foreground'
                          }`}
                        >
                          <span>🎓 Student</span>
                          {user.role === 'STUDENT' && <Check className="h-3 w-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await devLogin('assistant@pccoe.org', 'LAB_ASSISTANT');
                            setShowUserDropdown(false);
                          }}
                          className={`p-1.5 rounded-md text-left transition-colors flex items-center justify-between ${
                            user.role === 'LAB_ASSISTANT'
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted/70 text-foreground'
                          }`}
                        >
                          <span>🛠️ Assistant</span>
                          {user.role === 'LAB_ASSISTANT' && <Check className="h-3 w-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await devLogin('authority@pccoe.org', 'DEPT_AUTHORITY');
                            setShowUserDropdown(false);
                          }}
                          className={`p-1.5 rounded-md text-left transition-colors flex items-center justify-between ${
                            user.role === 'DEPT_AUTHORITY'
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted/70 text-foreground'
                          }`}
                        >
                          <span>🏛️ Authority</span>
                          {user.role === 'DEPT_AUTHORITY' && <Check className="h-3 w-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await devLogin('hod@pccoe.org', 'HOD');
                            setShowUserDropdown(false);
                          }}
                          className={`p-1.5 rounded-md text-left transition-colors flex items-center justify-between ${
                            user.role === 'HOD'
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted/70 text-foreground'
                          }`}
                        >
                          <span>📊 HOD</span>
                          {user.role === 'HOD' && <Check className="h-3 w-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await devLogin('admin@pccoe.org', 'ADMIN');
                            setShowUserDropdown(false);
                          }}
                          className={`col-span-2 p-1.5 rounded-md text-left transition-colors flex items-center justify-between ${
                            user.role === 'ADMIN'
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted/70 text-foreground'
                          }`}
                        >
                          <span>👑 Admin</span>
                          {user.role === 'ADMIN' && <Check className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Logout Action */}
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* MOBILE DRAWER (Slide-over Sheet for Screens < 1024px) */}
        {/* ============================================================ */}
        <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="p-4 border-b border-border/70">
              <SheetTitle>
                <FixifyLogo size={28} />
              </SheetTitle>
            </SheetHeader>

            {/* Mobile Nav Links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Mobile Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/report'
                    ? location.pathname.startsWith('/report')
                    : location.pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    data-testid={`mobile-${item.testId}`}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Profile & Switcher */}
            <div className="p-4 border-t border-border/70 space-y-3 bg-muted/20">
              <div className="flex items-center gap-3">
                <Avatar status="online" className="h-9 w-9">
                  <AvatarFallback className="text-xs font-semibold bg-secondary text-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              {/* Dev Fast Switcher inside Mobile Drawer */}
              {import.meta.env.DEV && (
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Role Switcher
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={async () => {
                        await devLogin('student@pccoe.org', 'STUDENT');
                        setMobileDrawerOpen(false);
                      }}
                      className="p-1.5 rounded-md bg-card border border-border/60 text-left truncate"
                    >
                      🎓 Student
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await devLogin('assistant@pccoe.org', 'LAB_ASSISTANT');
                        setMobileDrawerOpen(false);
                      }}
                      className="p-1.5 rounded-md bg-card border border-border/60 text-left truncate"
                    >
                      🛠️ Assistant
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await devLogin('authority@pccoe.org', 'DEPT_AUTHORITY');
                        setMobileDrawerOpen(false);
                      }}
                      className="p-1.5 rounded-md bg-card border border-border/60 text-left truncate"
                    >
                      🏛️ Authority
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await devLogin('hod@pccoe.org', 'HOD');
                        setMobileDrawerOpen(false);
                      }}
                      className="p-1.5 rounded-md bg-card border border-border/60 text-left truncate"
                    >
                      📊 HOD
                    </button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="w-full text-xs flex items-center justify-center gap-2"
              >
                {isDark ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Switch to Light Theme</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-slate-700" />
                    <span>Switch to Dark Theme</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* MAIN CONTENT AREA */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
