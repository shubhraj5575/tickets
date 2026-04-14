"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingDown,
  Gift,
  Eye,
  Home,
  Award,
} from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  activeBookings: number;
  totalCollection: number;
  overdueAmount: number;
  paymentStats: {
    onTime: number;
    overdue: number;
  };
  ticketStats: {
    open: number;
    inProgress: number;
    resolved: number;
  };
  referralFunnel: {
    leads: number;
    siteVisits: number;
    bookings: number;
    rewards: number;
  };
}

function DonutChart({ percent, color }: { percent: number; color: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-gray-900">{percent}%</span>
        <p className="text-[10px] text-gray-500 -mt-0.5">On-Time</p>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/analytics", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [accessToken]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load analytics data.
      </div>
    );
  }

  const totalPayments = data.paymentStats.onTime + data.paymentStats.overdue;
  const onTimePercent =
    totalPayments > 0
      ? Math.round((data.paymentStats.onTime / totalPayments) * 100)
      : 0;

  const totalTickets =
    data.ticketStats.open + data.ticketStats.inProgress + data.ticketStats.resolved;

  const funnelMax = Math.max(data.referralFunnel.leads, 1);

  const summaryCards = [
    {
      title: "Total Users",
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Bookings",
      value: data.activeBookings.toLocaleString(),
      icon: Building2,
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Total Collection",
      value: formatCurrency(data.totalCollection),
      icon: IndianRupee,
      gradient: "from-teal-500 to-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: "Overdue Amount",
      value: formatCurrency(data.overdueAmount),
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-600",
      bg: "bg-red-50",
    },
  ];

  const ticketItems = [
    {
      label: "Open",
      value: data.ticketStats.open,
      icon: MessageSquare,
      color: "bg-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    {
      label: "In Progress",
      value: data.ticketStats.inProgress,
      icon: Clock,
      color: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Resolved",
      value: data.ticketStats.resolved,
      icon: CheckCircle2,
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
  ];

  const funnelStages = [
    {
      label: "Leads",
      value: data.referralFunnel.leads,
      icon: Gift,
      color: "from-slate-500 to-slate-600",
    },
    {
      label: "Site Visits",
      value: data.referralFunnel.siteVisits,
      icon: Eye,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Bookings",
      value: data.referralFunnel.bookings,
      icon: Home,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Rewards Paid",
      value: data.referralFunnel.rewards,
      icon: Award,
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of portal metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-5">
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center flex-shrink-0`}
                >
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">
                    {card.value}
                  </p>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Stats & Ticket Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Stats - Donut Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Payment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <DonutChart percent={onTimePercent} color="#22c55e" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">On Time</p>
                    <p className="text-2xl font-bold text-green-600">
                      {data.paymentStats.onTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs text-gray-500">Overdue</p>
                    <p className="text-2xl font-bold text-red-500">
                      {data.paymentStats.overdue}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Stats - Progress Bars */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Ticket Statistics</CardTitle>
            <p className="text-sm text-gray-500">
              {totalTickets} total tickets
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {ticketItems.map((ticket) => {
              const pct =
                totalTickets > 0
                  ? Math.round((ticket.value / totalTickets) * 100)
                  : 0;
              return (
                <div key={ticket.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <ticket.icon className={`h-4 w-4 ${ticket.text}`} />
                      <span className="text-sm font-medium text-gray-700">
                        {ticket.label}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${ticket.text}`}>
                      {ticket.value}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ticket.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Referral Funnel */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Referral Funnel</CardTitle>
          <p className="text-sm text-gray-500">
            Conversion from leads to rewards
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-3 py-2">
            {funnelStages.map((stage, i) => {
              const widthPercent = Math.max(
                (stage.value / funnelMax) * 100,
                20
              );
              // Funnel shape: each stage gets progressively narrower
              const maxWidth = 100 - i * 15;
              const finalWidth = Math.min(widthPercent, maxWidth);

              return (
                <div
                  key={stage.label}
                  className={`bg-gradient-to-r ${stage.color} rounded-lg py-3 px-5 flex items-center justify-between text-white transition-all duration-500`}
                  style={{
                    width: `${finalWidth}%`,
                    minWidth: "180px",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <stage.icon className="h-4 w-4 text-white/80" />
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                  <span className="text-lg font-bold">{stage.value}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
