"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isTicketsOnly } from "@/lib/features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Building2,
  FileText,
  Bell,
  IndianRupee,
  TrendingUp,
  CalendarClock,
  HardHat,
  MapPin,
  Maximize2,
  CalendarDays,
  MessageSquare,
  Gift,
  Users,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const quickLinks = [
  {
    href: "/payments",
    label: "Payments",
    description: "View schedule & receipts",
    icon: CreditCard,
    gradient: "from-primary to-primary",
    bg: "bg-primary/10",
    text: "text-primary",
    shadow: "shadow-primary/10",
  },
  {
    href: "/construction",
    label: "Construction",
    description: "Track progress & photos",
    icon: Building2,
    gradient: "from-accent to-accent",
    bg: "bg-accent/10",
    text: "text-accent",
    shadow: "shadow-accent/10",
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Download your documents",
    icon: FileText,
    gradient: "from-primary to-primary",
    bg: "bg-primary/10",
    text: "text-primary",
    shadow: "shadow-primary/10",
  },
  {
    href: "/notifications",
    label: "Notifications",
    description: "View all updates",
    icon: Bell,
    gradient: "from-accent to-accent",
    bg: "bg-accent/10",
    text: "text-accent",
    shadow: "shadow-accent/10",
  },
  {
    href: "/tickets",
    label: "Tickets",
    description: "Raise a support request",
    icon: MessageSquare,
    gradient: "from-primary to-primary",
    bg: "bg-primary/10",
    text: "text-primary",
    shadow: "shadow-primary/10",
  },
  {
    href: "/referrals",
    label: "Referrals",
    description: "Refer & earn rewards",
    icon: Gift,
    gradient: "from-accent to-accent",
    bg: "bg-accent/10",
    text: "text-accent",
    shadow: "shadow-accent/10",
  },
  {
    href: "/community",
    label: "Community",
    description: "Connect with neighbours",
    icon: Users,
    gradient: "from-primary to-primary",
    bg: "bg-primary/10",
    text: "text-primary",
    shadow: "shadow-primary/10",
  },
  {
    href: "/possession",
    label: "Possession",
    description: "Track handover status",
    icon: CalendarDays,
    gradient: "from-accent to-accent",
    bg: "bg-accent/10",
    text: "text-accent",
    shadow: "shadow-accent/10",
  },
];

const recentNotifications = [
  {
    title: "Payment reminder",
    description: "Your next installment is due on 25th April 2026",
    time: "2 hours ago",
    icon: IndianRupee,
    color: "text-primary bg-primary/10",
  },
  {
    title: "Construction update",
    description: "Plastering work completed for Tower B, Floor 12",
    time: "1 day ago",
    icon: HardHat,
    color: "text-accent bg-accent/10",
  },
  {
    title: "Document uploaded",
    description: "Agreement draft is now available for download",
    time: "3 days ago",
    icon: FileText,
    color: "text-primary bg-primary/10",
  },
];

function getCurrentDate() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

interface PaymentStats {
  totalAmount: string;
  totalPaid: string;
  totalDue: string;
  nextDueDate: string | null;
  nextDueAmount: string | null;
}

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PaymentStats | null>(null);

  useEffect(() => {
    if (isTicketsOnly()) router.replace("/tickets");
  }, [router]);

  const bookings = user?.customer?.bookings || [];
  const firstBookingId = bookings[0]?.id || null;
  const totalAmount = bookings.reduce(
    (sum, b) => sum + (parseFloat(b.totalAmount) || 0),
    0
  );

  useEffect(() => {
    if (!accessToken || !firstBookingId) return;
    async function fetchStats() {
      try {
        const res = await fetch(`/api/payments?bookingId=${firstBookingId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) setStats(await res.json());
      } catch {
        // silent
      }
    }
    fetchStats();
  }, [accessToken, firstBookingId]);

  const totalPaid = stats ? Number(stats.totalPaid) : 0;
  const totalDue = stats ? Number(stats.totalDue) : 0;
  const paidPercent = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {user?.customer?.name || user?.name || "Customer"}
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">{getCurrentDate()}</p>
        </div>
        <Link
          href="/payments"
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 sm:mt-0"
        >
          <IndianRupee className="h-4 w-4" />
          Make Payment
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-muted shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Paid
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {formatINR(totalPaid)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {paidPercent}% of total value
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-muted shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Outstanding
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {formatINR(totalDue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {100 - paidPercent}% remaining
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <IndianRupee className="h-5 w-5 text-accent" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-accent/5" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-muted shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Next Due
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {stats?.nextDueDate
                    ? new Date(stats.nextDueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                    : "All Paid"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.nextDueAmount ? formatINR(Number(stats.nextDueAmount)) + " due" : "No pending dues"}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <CalendarClock className="h-5 w-5 text-accent" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-accent/5" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-muted shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Construction
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {paidPercent > 0 ? `${Math.min(paidPercent + 10, 100)}%` : "--"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  In progress
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <HardHat className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5" />
          </CardContent>
        </Card>
      </div>

      {/* Booking cards */}
      {bookings.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Properties
            </h2>
            <Badge variant="secondary" className="text-xs">
              {bookings.length} {bookings.length === 1 ? "Booking" : "Bookings"}
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="group relative overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
              >
                {/* Top gradient bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {booking.projectName}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {booking.bookingRef}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-5">
                  <p className="text-xl font-bold text-gray-900">
                    {booking.unitNumber}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 className="h-3 w-3" />
                      1250 sq.ft
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Pune
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Dec 2027
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-xs text-gray-500">Total Value</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatINR(parseFloat(booking.totalAmount) || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Access
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <Card className="h-full border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                <CardContent className="flex items-start gap-4 p-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${link.bg} ${link.shadow} shadow-sm transition-transform duration-300 group-hover:scale-110`}
                  >
                    <link.icon className={`h-5 w-5 ${link.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                      {link.label}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Notifications
          </h2>
          <Link
            href="/notifications"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all
          </Link>
        </div>
        <Card className="divide-y divide-gray-50 border border-gray-100 shadow-sm">
          {recentNotifications.map((notification, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 transition-colors duration-200 hover:bg-gray-50/50"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${notification.color}`}
              >
                <notification.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                  {notification.description}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
                <Clock className="h-3 w-3" />
                {notification.time}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
