"use client";

import { Fragment, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  TrendingUp,
  CalendarClock,
  CircleDollarSign,
} from "lucide-react";

interface PaymentScheduleItem {
  id: string;
  instalmentNo: number;
  label: string;
  dueDate: string;
  amount: string;
  interestAmount?: string;
  escalationStage?: number;
  status: string;
  payment?: {
    id: string;
    paymentDate: string;
    paymentMode: string;
    referenceNumber: string;
    receiptUrl: string | null;
  } | null;
}

interface PaymentSummary {
  totalAmount: string;
  totalPaid: string;
  totalDue: string;
  nextDueDate: string | null;
  nextDueAmount: string | null;
  schedule: PaymentScheduleItem[];
}

const statusConfig = {
  PAID: {
    label: "Paid",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-emerald-600",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
  },
  UPCOMING: {
    label: "Upcoming",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-blue-600",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
  },
  OVERDUE: {
    label: "Overdue",
    variant: "destructive" as const,
    icon: AlertCircle,
    color: "text-red-600",
    dot: "bg-red-500",
    bg: "bg-red-50",
  },
  PARTIALLY_PAID: {
    label: "Partial",
    variant: "outline" as const,
    icon: Clock,
    color: "text-amber-600",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
  },
  WAIVED: {
    label: "Waived",
    variant: "secondary" as const,
    icon: CheckCircle2,
    color: "text-gray-500",
    dot: "bg-gray-400",
    bg: "bg-gray-50",
  },
};

export default function PaymentsPage() {
  const { accessToken, user } = useAuth();
  const [data, setData] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<string>("");

  const bookings = user?.customer?.bookings || [];
  const firstBookingId = bookings[0]?.id || null;

  useEffect(() => {
    if (firstBookingId && !selectedBooking) {
      setSelectedBooking(firstBookingId);
    }
  }, [firstBookingId, selectedBooking]);

  useEffect(() => {
    if (!selectedBooking || !accessToken) return;

    async function fetchPayments() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/payments?bookingId=${selectedBooking}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [selectedBooking, accessToken]);

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val));

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const paidPercent =
    data && Number(data.totalAmount) > 0
      ? Math.round((Number(data.totalPaid) / Number(data.totalAmount)) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const statCards = data
    ? [
        {
          title: "Total Amount",
          value: formatCurrency(data.totalAmount),
          subtitle: "Agreement value",
          icon: Wallet,
          gradient: "from-primary to-primary/90",
          iconBg: "bg-white/20",
        },
        {
          title: "Amount Paid",
          value: formatCurrency(data.totalPaid),
          subtitle: `${paidPercent}% completed`,
          icon: TrendingUp,
          gradient: "from-accent to-accent/90",
          iconBg: "bg-white/20",
        },
        {
          title: "Outstanding",
          value: formatCurrency(data.totalDue),
          subtitle: "Remaining balance",
          icon: CircleDollarSign,
          gradient: "from-primary/80 to-primary",
          iconBg: "bg-white/20",
        },
        {
          title: "Next Due",
          value: data.nextDueDate
            ? formatCurrency(data.nextDueAmount || 0)
            : "All Paid",
          subtitle: data.nextDueDate ? formatDate(data.nextDueDate) : "No pending dues",
          icon: CalendarClock,
          gradient: "from-accent/80 to-accent",
          iconBg: "bg-white/20",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Payment Schedule
          </h1>
          <p className="text-gray-500 mt-1">
            Track your payment status and download receipts
          </p>
        </div>

        {bookings.length > 1 && (
          <select
            value={selectedBooking}
            onChange={(e) => setSelectedBooking(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.unitNumber} - {b.projectName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Gradient Stat Cards */}
      {data && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white/80">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-xs text-white/60">{stat.subtitle}</p>
                  </div>
                  <div
                    className={`${stat.iconBg} rounded-xl p-2.5`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
              {/* Decorative circle */}
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/5" />
            </Card>
          ))}
        </div>
      )}

      {/* Payment Progress Bar */}
      {data && (
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-gray-700">
                  Payment Progress
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                {paidPercent}% Paid
              </span>
            </div>
            <Progress value={paidPercent} className="h-3" />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{formatCurrency(data.totalPaid)} paid</span>
              <span>{formatCurrency(data.totalDue)} remaining</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Schedule Table */}
      {data && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-gray-400" />
              Instalment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="w-14 font-semibold text-gray-600">
                      #
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600">
                      Description
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600">
                      Due Date
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">
                      Amount
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600">
                      Status
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">
                      Receipt
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.schedule.map((item, idx) => {
                    const config =
                      statusConfig[item.status as keyof typeof statusConfig];
                    const interest = Number(item.interestAmount || 0);
                    const hasLateFee = interest > 0 && item.status !== "PAID";
                    return (
                      <Fragment key={item.id}>
                      <TableRow
                        className={
                          idx % 2 === 0
                            ? "bg-white hover:bg-gray-50/50"
                            : "bg-gray-50/40 hover:bg-gray-50/70"
                        }
                      >
                        <TableCell className="font-semibold text-gray-400">
                          {item.instalmentNo}
                        </TableCell>
                        <TableCell className="font-medium text-gray-800">
                          {item.label}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatDate(item.dueDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {hasLateFee ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                                <IndianRupee className="h-3 w-3 text-red-500" />
                                {(Number(item.amount) + interest).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-gray-400 mt-0.5 line-through">
                                ₹{Number(item.amount).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                              <IndianRupee className="h-3 w-3 text-gray-400" />
                              {Number(item.amount).toLocaleString("en-IN")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={config?.variant || "secondary"}
                            className={`${config?.bg || ""} ${config?.color || ""} border-0 gap-1.5 font-medium`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${config?.dot || "bg-gray-400"}`}
                            />
                            {config?.label || item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.payment?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-primary hover:text-primary/80 hover:bg-primary/10"
                              onClick={() =>
                                window.open(
                                  `/api/payments/receipt?paymentId=${item.payment!.id}`,
                                  "_blank"
                                )
                              }
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline text-xs">
                                Receipt
                              </span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {hasLateFee && (
                        <TableRow
                          className="bg-red-50/50 hover:bg-red-50"
                        >
                          <TableCell />
                          <TableCell className="text-sm text-red-700 pl-6">
                            <span className="inline-flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Late Fee
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-red-600">
                            Applied
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-700">
                            <span className="inline-flex items-center gap-1">
                              <IndianRupee className="h-3 w-3 text-red-500" />
                              {interest.toLocaleString("en-IN")}
                            </span>
                          </TableCell>
                          <TableCell colSpan={2} className="text-xs text-red-600">
                            Total due: ₹{(Number(item.amount) + interest).toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
