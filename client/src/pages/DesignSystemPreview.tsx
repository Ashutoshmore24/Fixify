import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  StatusBadge,
  PriorityBadge,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  useToast,
  SkeletonCard,
  SkeletonText,
  SkeletonTable,
  EmptyState,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';
import {
  Sun,
  Moon,
  Search,
  Monitor,
  Wrench,
  Clock,
  Info,
} from 'lucide-react';

export const DesignSystemPreview: React.FC = () => {
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const [charCount, setCharCount] = useState(42);
  const [btnLoading, setBtnLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const triggerLoading = () => {
    setBtnLoading(true);
    setTimeout(() => setBtnLoading(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-soft">
                Fx
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-foreground">
                    Fixify Design System
                  </h1>
                  <Badge variant="status_in_progress" size="sm">
                    DEV PREVIEW
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Institutional Tokens, Typography & Component Primitives
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-slate-700" strokeWidth={1.75} />
                    <span>Dark Mode</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Showcase */}
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
          {/* Introduction Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">
                    Clean, Calm & Professional Institutional UI
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Tailored for college computer laboratories. Palette features a warm off-white canvas, deep ink-blue typography, a single teal-600 action accent, and accessible semantic status indicators.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="status_open">8px Controls</Badge>
                  <Badge variant="status_accepted">12px Cards</Badge>
                  <Badge variant="status_resolved">WCAG AA Contrast</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 1: Color Palette & Semantic System */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                1. Palette & Semantic Status Colors
              </h2>
              <p className="text-xs text-muted-foreground">
                Core neutral palette + strict semantic status color conventions
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-card shadow-soft">
                <div className="h-8 rounded-lg bg-background border border-border/60 mb-2" />
                <p className="text-xs font-semibold text-foreground">Background</p>
                <p className="text-[11px] text-muted-foreground">Warm off-white</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card shadow-soft">
                <div className="h-8 rounded-lg bg-foreground mb-2" />
                <p className="text-xs font-semibold text-foreground">Foreground</p>
                <p className="text-[11px] text-muted-foreground">Deep ink-blue</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card shadow-soft">
                <div className="h-8 rounded-lg bg-primary mb-2 shadow-soft" />
                <p className="text-xs font-semibold text-foreground">Primary Accent</p>
                <p className="text-[11px] text-muted-foreground">Teal-600 (#0d9488)</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card shadow-soft">
                <div className="h-8 rounded-lg bg-muted border border-border/60 mb-2" />
                <p className="text-xs font-semibold text-foreground">Muted / Surface</p>
                <p className="text-[11px] text-muted-foreground">Neutral slate</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card shadow-soft">
                <div className="h-8 rounded-lg bg-destructive mb-2" />
                <p className="text-xs font-semibold text-foreground">Destructive</p>
                <p className="text-[11px] text-muted-foreground">Rose red</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card shadow-soft">
                <div className="h-8 rounded-lg border-2 border-primary mb-2" />
                <p className="text-xs font-semibold text-foreground">Focus Ring</p>
                <p className="text-[11px] text-muted-foreground">Teal glow (2px)</p>
              </div>
            </div>

            {/* Semantic Status Badges Matrix */}
            <div className="mt-4 p-5 rounded-xl border border-border bg-card shadow-soft space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Official Ticket Lifecycle Status Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="OPEN" />
                <StatusBadge status="ASSIGNED" />
                <StatusBadge status="ACCEPTED" />
                <StatusBadge status="IN_PROGRESS" />
                <StatusBadge status="ESCALATED" />
                <StatusBadge status="AWAITING_PARTS" />
                <StatusBadge status="RESOLVED" />
                <StatusBadge status="CLOSED" />
                <StatusBadge status="REJECTED" />
                <StatusBadge status="CANCELLED" />
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-3">
                Ticket Priority Levels
              </h3>
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority="LOW" />
                <PriorityBadge priority="MEDIUM" />
                <PriorityBadge priority="HIGH" />
                <PriorityBadge priority="CRITICAL" />
              </div>
            </div>
          </section>

          {/* Section 2: Typography Scale */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                2. Typography Scale (Inter via @fontsource)
              </h2>
              <p className="text-xs text-muted-foreground">
                Geometric, clean, tight headings and 1.5 body line-height
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-soft space-y-4">
              <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/40 pb-3">
                <span className="text-xs font-mono text-muted-foreground w-24">32px / Bold</span>
                <span className="text-3xl font-bold tracking-tight text-foreground flex-1">
                  IT Asset & Maintenance System
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/40 pb-3">
                <span className="text-xs font-mono text-muted-foreground w-24">24px / Semi</span>
                <span className="text-2xl font-semibold tracking-tight text-foreground flex-1">
                  Laboratory 101 — Turing Machine Lab
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/40 pb-3">
                <span className="text-xs font-mono text-muted-foreground w-24">20px / Semi</span>
                <span className="text-xl font-semibold tracking-tight text-foreground flex-1">
                  Work Order Queue & Active Dispatches
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/40 pb-3">
                <span className="text-xs font-mono text-muted-foreground w-24">16px / Med</span>
                <span className="text-base font-medium text-foreground flex-1">
                  PC-04: RAM Module Fault detected during practical exam
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/40 pb-3">
                <span className="text-xs font-mono text-muted-foreground w-24">14px / Body</span>
                <span className="text-sm text-muted-foreground leading-normal flex-1">
                  Technician replaced faulty 8GB DDR4 RAM stick. System boot verified with diagnostics passing 100%. Tested OK by lab in-charge.
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline justify-between">
                <span className="text-xs font-mono text-muted-foreground w-24">12px / Caption</span>
                <span className="text-xs text-muted-foreground flex-1">
                  Ticket FIX-2026-000001 • Created 12 minutes ago by Rahul Deshmukh
                </span>
              </div>
            </div>
          </section>

          {/* Section 3: Buttons */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                3. Buttons (Variants, Sizes & Loading State)
              </h2>
              <p className="text-xs text-muted-foreground">
                8px radius, subtle active scale, accessible focus rings
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-soft space-y-6">
              {/* Variants */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Variants
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">Primary (Teal)</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link Style</Button>
                </div>
              </div>

              {/* Sizes & States */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Sizes & Interactive States
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small (32px)</Button>
                  <Button size="default">Default (38px)</Button>
                  <Button size="lg">Large (44px)</Button>
                  <Button size="icon" aria-label="Settings">
                    <Wrench className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                  <Button isLoading={btnLoading} onClick={triggerLoading}>
                    {btnLoading ? 'Processing...' : 'Click for Loading'}
                  </Button>
                  <Button disabled>Disabled State</Button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Form Controls */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                4. Form Controls (Input, Textarea, Select)
              </h2>
              <p className="text-xs text-muted-foreground">
                Clear teal focus ring, 8px radius, built-in validation styling
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Text Inputs</CardTitle>
                  <CardDescription>Single line controls with icon support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Standard Input
                    </label>
                    <Input placeholder="Enter laboratory or equipment code..." />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Input with Search Icon
                    </label>
                    <Input
                      leftIcon={<Search className="h-4 w-4" strokeWidth={1.75} />}
                      placeholder="Search computer by serial or tag..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Input with Error State
                    </label>
                    <Input
                      defaultValue="invalid-email"
                      error="Please enter an institutional @pccoe.org email address"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Textarea & Select</CardTitle>
                  <CardDescription>Multi-line input and dropdown pickers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Select Laboratory
                    </label>
                    <Select defaultValue="LAB-101">
                      <option value="LAB-101">LAB-101: Turing Machine Lab</option>
                      <option value="LAB-102">LAB-102: Systems & Networks Lab</option>
                      <option value="LAB-103">LAB-103: Artificial Intelligence Lab</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Issue Description
                    </label>
                    <Textarea
                      placeholder="Detail the issue observed on the computer..."
                      rows={3}
                      maxChars={250}
                      charCount={charCount}
                      onChange={(e) => setCharCount(e.target.value.length)}
                      defaultValue="Display flickers intermittently when booting into Ubuntu."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 5: Cards & Overlays */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                5. Cards, Overlays & Feedback (Dialog, Sheet, Toast)
              </h2>
              <p className="text-xs text-muted-foreground">
                12px card radius, accessible Radix overlays with backdrop blur
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Interactive KPI Card */}
              <Card hoverable className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Open Work Orders</p>
                    <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                      <Clock className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">14</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                      <span>↓ 2 resolved today</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Dialog Trigger Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Accessible Dialog</CardTitle>
                  <CardDescription>Centered modal with backdrop blur</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Open Sample Dialog
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Hardware Replacement</DialogTitle>
                        <DialogDescription>
                          This action will mark the current SSD as decommissioned and request inventory allocation.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/60 text-xs text-muted-foreground space-y-1">
                        <p><span className="font-semibold text-foreground">Asset:</span> PC-04 (LAB-101)</p>
                        <p><span className="font-semibold text-foreground">Component:</span> 500GB NVMe SSD</p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          setDialogOpen(false);
                          toast.success('SSD replacement request approved successfully.');
                        }}>
                          Approve Replacement
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Sheet Trigger Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Side Drawer (Sheet)</CardTitle>
                  <CardDescription>Slide-out panel for detail views</CardDescription>
                </CardHeader>
                <CardContent>
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Open Detail Drawer
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>Computer Specifications</SheetTitle>
                        <SheetDescription>
                          Hardware profile for LAB-101 / PC-01
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4 space-y-4 text-xs">
                        <div className="flex justify-between border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Processor</span>
                          <span className="font-medium text-foreground">Intel Core i7-12700</span>
                        </div>
                        <div className="flex justify-between border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">RAM</span>
                          <span className="font-medium text-foreground">16GB DDR4 3200MHz</span>
                        </div>
                        <div className="flex justify-between border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Storage</span>
                          <span className="font-medium text-foreground">512GB NVMe M.2 SSD</span>
                        </div>
                        <div className="flex justify-between border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Operating System</span>
                          <span className="font-medium text-foreground">Ubuntu 22.04 LTS / Win 11</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Warranty</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">Active until Dec 2027</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4" onClick={() => setSheetOpen(false)}>
                        Close Details
                      </Button>
                    </SheetContent>
                  </Sheet>
                </CardContent>
              </Card>
            </div>

            {/* Toasts Trigger Demonstration */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-soft">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Live Notification Toasts (with aria-live announcements)
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success('Ticket FIX-2026-000001 closed and verified OK.', 'Success')}
                >
                  Trigger Success Toast
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.error('Unable to connect to laboratory inventory API.', 'Connection Error')}
                >
                  Trigger Error Toast
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.warning('Low stock alert: RAM modules remaining < 3 units.', 'Inventory Alert')}
                >
                  Trigger Warning Toast
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info('New ticket auto-assigned to your queue.', 'Work Order')}
                >
                  Trigger Info Toast
                </Button>
              </div>
            </div>
          </section>

          {/* Section 6: Skeletons & Empty State */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                6. Loading Skeletons & Empty States
              </h2>
              <p className="text-xs text-muted-foreground">
                Polished loading placeholders and informative zero-data states
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shimmer Skeletons</CardTitle>
                  <CardDescription>Prevents layout shifts during data fetching</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SkeletonCard />
                  <div className="pt-2 border-t border-border/40">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Text & Table Placeholders</p>
                    <SkeletonText lines={2} className="mb-3" />
                    <SkeletonTable rows={2} cols={3} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calm Empty State</CardTitle>
                  <CardDescription>Clear guidance when no records are found</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={Monitor}
                    title="No Complaints in This Laboratory"
                    description="All computer assets in LAB-101 are currently operational and verified without open tickets."
                    actionLabel="Scan Another Lab"
                    onAction={() => toast.info('Redirecting to QR scanner...')}
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 7: Tabs & Institutional Data Table */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                7. Tabs, Avatars & Institutional Data Table
              </h2>
              <p className="text-xs text-muted-foreground">
                Role-scoped tabs, user avatars with status dots, and zebra-hover tables
              </p>
            </div>

            {/* Avatars */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-soft">
              <div className="flex items-center gap-3">
                <Avatar status="online">
                  <AvatarFallback>RP</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold text-foreground">Ramesh Patil</p>
                  <p className="text-[11px] text-muted-foreground">Lab Assistant (Online)</p>
                </div>
              </div>

              <div className="h-6 w-px bg-border/60 mx-2" />

              <div className="flex items-center gap-3">
                <Avatar status="busy">
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold text-foreground">Dr. Sanjay Joshi</p>
                  <p className="text-[11px] text-muted-foreground">Dept Authority (In Review)</p>
                </div>
              </div>

              <div className="h-6 w-px bg-border/60 mx-2" />

              <div className="flex items-center gap-3">
                <Avatar status="offline">
                  <AvatarFallback>RD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold text-foreground">Rahul Deshmukh</p>
                  <p className="text-[11px] text-muted-foreground">Student</p>
                </div>
              </div>
            </div>

            {/* Tabs & Table */}
            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">All Assets (10)</TabsTrigger>
                  <TabsTrigger value="active">Active Tickets (2)</TabsTrigger>
                  <TabsTrigger value="operational">Operational (8)</TabsTrigger>
                </TabsList>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      <Info className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Table Guide
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Lists all computers enrolled in LAB-101 inventory
                  </TooltipContent>
                </Tooltip>
              </div>

              <TabsContent value="all" className="mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Specification</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Technician</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold text-xs">PC-01</TableCell>
                      <TableCell className="text-xs">Workstation</TableCell>
                      <TableCell className="text-xs text-muted-foreground">i7-12700 / 16GB / 512GB SSD</TableCell>
                      <TableCell>
                        <StatusBadge status="OPEN" />
                      </TableCell>
                      <TableCell className="text-xs">Ramesh Patil</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-semibold text-xs">PC-02</TableCell>
                      <TableCell className="text-xs">Workstation</TableCell>
                      <TableCell className="text-xs text-muted-foreground">i7-12700 / 16GB / 512GB SSD</TableCell>
                      <TableCell>
                        <StatusBadge status="IN_PROGRESS" />
                      </TableCell>
                      <TableCell className="text-xs">Ramesh Patil</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-semibold text-xs">PC-03</TableCell>
                      <TableCell className="text-xs">Workstation</TableCell>
                      <TableCell className="text-xs text-muted-foreground">i7-12700 / 16GB / 512GB SSD</TableCell>
                      <TableCell>
                        <StatusBadge status="RESOLVED" />
                      </TableCell>
                      <TableCell className="text-xs">Ramesh Patil</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="active">
                <div className="p-4 bg-card rounded-xl border border-border text-xs text-muted-foreground">
                  Showing 2 active tickets requiring technician intervention.
                </div>
              </TabsContent>

              <TabsContent value="operational">
                <div className="p-4 bg-card rounded-xl border border-border text-xs text-muted-foreground">
                  8 systems running normally with zero faults.
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default DesignSystemPreview;
