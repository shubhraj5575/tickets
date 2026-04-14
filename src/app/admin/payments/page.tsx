"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  CheckCircle2,
  IndianRupee,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  Clock,
  Percent,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SendMessageDialog } from "@/components/admin/send-message-dialog";

interface ScheduleItem {
  id: string;
  instalmentNo: number;
  label: string;
  dueDate: string;
  amount: string;
  interestAmount?: string;
  escalationStage?: number;
  status: string;
  bookingId: string;
  bookingRef: string;
  lateFeeRatePct?: number;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  projectName: string;
  unitNumber?: string;
}

type CustomerGroup = {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  schedules: ScheduleItem[];
  overdueCount: number;
  upcomingCount: number;
  totalOutstanding: number;
  totalLateFees: number;
  oldestOverdue: ScheduleItem | null;
  nextUpcoming: ScheduleItem | null;
  units: string[];
};

function groupByCustomer(items: ScheduleItem[]): CustomerGroup[] {
  const map = new Map<string, CustomerGroup>();
  for (const s of items) {
    let g = map.get(s.customerId);
    if (!g) {
      g = {
        customerId: s.customerId,
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        schedules: [],
        overdueCount: 0,
        upcomingCount: 0,
        totalOutstanding: 0,
        totalLateFees: 0,
        oldestOverdue: null,
        nextUpcoming: null,
        units: [],
      };
      map.set(s.customerId, g);
    }
    g.schedules.push(s);
    const interest = Number(s.interestAmount || 0);
    const due = Number(s.amount) + interest;
    g.totalOutstanding += due;
    g.totalLateFees += interest;
    if (s.status === "OVERDUE") {
      g.overdueCount += 1;
      if (!g.oldestOverdue || new Date(s.dueDate) < new Date(g.oldestOverdue.dueDate)) {
        g.oldestOverdue = s;
      }
    } else if (s.status === "UPCOMING") {
      g.upcomingCount += 1;
      if (!g.nextUpcoming || new Date(s.dueDate) < new Date(g.nextUpcoming.dueDate)) {
        g.nextUpcoming = s;
      }
    }
    if (s.unitNumber && !g.units.includes(s.unitNumber)) g.units.push(s.unitNumber);
  }
  for (const g of map.values()) {
    g.schedules.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
  return Array.from(map.values());
}

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const daysBetween = (d: string) => {
  const ms = Date.now() - new Date(d).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export default function AdminPaymentsPage() {
  const { accessToken } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCustomerId, setOpenCustomerId] = useState<string | null>(null);
  const [markingItem, setMarkingItem] = useState<ScheduleItem | null>(null);
  const [messagingTarget, setMessagingTarget] = useState<
    { customerId: string; customerName: string } | null
  >(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "NEFT",
    referenceNumber: "",
  });

  async function fetchSchedules() {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/payments/pending", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
      }
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const groups = useMemo(() => groupByCustomer(schedules), [schedules]);
  const needsAttention = useMemo(
    () =>
      groups
        .filter((g) => g.overdueCount > 0)
        .sort((a, b) => {
          const ad = a.oldestOverdue?.dueDate ?? "";
          const bd = b.oldestOverdue?.dueDate ?? "";
          return ad.localeCompare(bd);
        }),
    [groups]
  );
  const upcomingOnly = useMemo(
    () =>
      groups
        .filter((g) => g.overdueCount === 0 && g.upcomingCount > 0)
        .sort((a, b) => {
          const ad = a.nextUpcoming?.dueDate ?? "";
          const bd = b.nextUpcoming?.dueDate ?? "";
          return ad.localeCompare(bd);
        }),
    [groups]
  );

  const openCustomer = groups.find((g) => g.customerId === openCustomerId) || null;

  const handleMarkPayment = async () => {
    if (!markingItem || !paymentForm.amount) return;

    try {
      const res = await fetch("/api/admin/payments/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          scheduleId: markingItem.id,
          amount: parseFloat(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMode: paymentForm.paymentMode,
          referenceNumber: paymentForm.referenceNumber,
        }),
      });

      if (res.ok) {
        toast.success("Payment recorded successfully");
        setMarkingItem(null);
        await fetchSchedules();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to record payment");
      }
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const openMark = (item: ScheduleItem) => {
    const interest = Number(item.interestAmount || 0);
    const totalDue = Number(item.amount) + interest;
    setMarkingItem(item);
    setPaymentForm({
      amount: totalDue.toString(),
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMode: "NEFT",
      referenceNumber: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-500 mt-1">
          Customers with pending or overdue instalments — action items first
        </p>
      </div>

      {/* Needs Attention */}
      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Needs Attention ({needsAttention.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {needsAttention.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">
              No customers with overdue payments. 🎉
            </p>
          ) : (
            <ul className="divide-y">
              {needsAttention.map((g) => (
                <CustomerRow
                  key={g.customerId}
                  group={g}
                  variant="overdue"
                  onOpen={() => setOpenCustomerId(g.customerId)}
                  onMessage={() =>
                    setMessagingTarget({
                      customerId: g.customerId,
                      customerName: g.customerName,
                    })
                  }
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Upcoming only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Upcoming ({upcomingOnly.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {upcomingOnly.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">
              No upcoming payments due.
            </p>
          ) : (
            <ul className="divide-y">
              {upcomingOnly.map((g) => (
                <CustomerRow
                  key={g.customerId}
                  group={g}
                  variant="upcoming"
                  onOpen={() => setOpenCustomerId(g.customerId)}
                  onMessage={() =>
                    setMessagingTarget({
                      customerId: g.customerId,
                      customerName: g.customerName,
                    })
                  }
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Customer slide-over with full schedule */}
      <Sheet
        open={openCustomerId !== null}
        onOpenChange={(o) => !o && setOpenCustomerId(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {openCustomer && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle>{openCustomer.customerName}</SheetTitle>
                    <SheetDescription>
                      {openCustomer.units.join(", ")}
                      {openCustomer.customerPhone && ` · +91 ${openCustomer.customerPhone}`}
                    </SheetDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMessagingTarget({
                        customerId: openCustomer.customerId,
                        customerName: openCustomer.customerName,
                      })
                    }
                    className="gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              </SheetHeader>

              <div className="px-4 pb-6 space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <SummaryStat label="Overdue" value={openCustomer.overdueCount.toString()} tone={openCustomer.overdueCount > 0 ? "red" : "gray"} />
                  <SummaryStat label="Upcoming" value={openCustomer.upcomingCount.toString()} tone="blue" />
                  <SummaryStat label="Outstanding" value={formatINR(openCustomer.totalOutstanding)} tone={openCustomer.overdueCount > 0 ? "red" : "gray"} />
                </div>

                {/* Per-booking late fee rate editor */}
                {uniqueBookings(openCustomer.schedules).map((b) => (
                  <LateFeeRateEditor
                    key={b.bookingId}
                    bookingId={b.bookingId}
                    bookingRef={b.bookingRef}
                    initialRate={b.lateFeeRatePct}
                    accessToken={accessToken}
                    onUpdated={fetchSchedules}
                  />
                ))}

                {openCustomer.totalLateFees > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <span className="font-semibold">Late fees applied:</span>{" "}
                    {formatINR(openCustomer.totalLateFees)}
                  </div>
                )}

                {/* Schedule rows with inline actions */}
                <div className="space-y-2">
                  {openCustomer.schedules.map((s) => {
                    const interest = Number(s.interestAmount || 0);
                    const total = Number(s.amount) + interest;
                    const isOverdue = s.status === "OVERDUE";
                    const days = isOverdue ? daysBetween(s.dueDate) : 0;
                    return (
                      <div
                        key={s.id}
                        className={`rounded-lg border p-3 ${isOverdue ? "border-red-200 bg-red-50/40" : "border-gray-200 bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-400">
                                #{s.instalmentNo}
                              </span>
                              <span className="font-medium text-gray-900 text-sm">
                                {s.label}
                              </span>
                              <Badge
                                variant={isOverdue ? "destructive" : "secondary"}
                                className="text-[10px]"
                              >
                                {s.status}
                                {interest > 0 ? " +FEE" : ""}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Due {formatDate(s.dueDate)}
                              {isOverdue && ` · ${days} days overdue`}
                              {s.unitNumber && ` · ${s.unitNumber}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${interest > 0 ? "text-red-700" : "text-gray-900"}`}>
                              {formatINR(total)}
                            </p>
                            {interest > 0 && (
                              <p className="text-[10px] text-red-600 mt-0.5">
                                ₹{Number(s.amount).toLocaleString("en-IN")} + ₹{interest.toLocaleString("en-IN")} late fee
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2 mt-2 border-t border-gray-100">
                          <Button size="sm" onClick={() => openMark(s)} className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Paid
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Mark Payment Dialog */}
      <Dialog open={!!markingItem} onOpenChange={() => setMarkingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Record Payment
              {markingItem && (
                <span className="block text-xs font-normal text-gray-500 mt-0.5">
                  {markingItem.customerName} · {markingItem.label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm((p) => ({ ...p, amount: e.target.value }))
                }
              />
              {markingItem && Number(markingItem.interestAmount || 0) > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Includes ₹{Number(markingItem.interestAmount).toLocaleString("en-IN")} late fee
                </p>
              )}
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Payment Mode</Label>
              <select
                value={paymentForm.paymentMode}
                onChange={(e) =>
                  setPaymentForm((p) => ({ ...p, paymentMode: e.target.value }))
                }
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <Label>Reference / Cheque Number</Label>
              <Input
                value={paymentForm.referenceNumber}
                onChange={(e) =>
                  setPaymentForm((p) => ({
                    ...p,
                    referenceNumber: e.target.value,
                  }))
                }
                placeholder="Transaction or cheque number"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setMarkingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleMarkPayment}>Confirm Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SendMessageDialog
        target={messagingTarget}
        onClose={() => setMessagingTarget(null)}
        accessToken={accessToken}
      />
    </div>
  );
}

function CustomerRow({
  group,
  variant,
  onOpen,
  onMessage,
}: {
  group: CustomerGroup;
  variant: "overdue" | "upcoming";
  onOpen: () => void;
  onMessage: () => void;
}) {
  // Focus instalment: oldest overdue if any, else next upcoming
  const focus =
    variant === "overdue" ? group.oldestOverdue : group.nextUpcoming;
  const focusInterest = Number(focus?.interestAmount || 0);
  const focusTotal = focus ? Number(focus.amount) + focusInterest : 0;
  const daysLate =
    variant === "overdue" && focus ? daysBetween(focus.dueDate) : 0;

  return (
    <li className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
      <button
        onClick={onOpen}
        className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold shrink-0"
      >
        {group.customerName.charAt(0).toUpperCase()}
      </button>
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">
            {group.customerName}
          </p>
          <span className="text-xs text-gray-400">{group.units.join(", ")}</span>
        </div>
        {focus && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Badge
              variant={variant === "overdue" ? "destructive" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              #{focus.instalmentNo}
            </Badge>
            <span className="text-xs font-medium text-gray-800">
              {focus.label}
            </span>
            <span
              className={`text-xs font-semibold ${
                focusInterest > 0 ? "text-red-700" : "text-gray-700"
              }`}
            >
              {formatINR(focusTotal)}
              {focusInterest > 0 && (
                <span className="ml-1 text-[10px] font-normal text-red-600">
                  (+{formatINR(focusInterest)} penalty)
                </span>
              )}
            </span>
            <span
              className={`text-xs ${
                variant === "overdue" ? "text-red-700" : "text-gray-500"
              }`}
            >
              · {variant === "overdue" ? "overdue" : "due"}{" "}
              {formatDate(focus.dueDate)}
              {daysLate > 0 && ` · ${daysLate} days late`}
            </span>
          </div>
        )}
        {variant === "overdue" && group.overdueCount > 1 && (
          <p className="text-[11px] text-red-600 mt-0.5">
            +{group.overdueCount - 1} more overdue instalment
            {group.overdueCount - 1 > 1 ? "s" : ""}
          </p>
        )}
      </button>

      <div className="text-right shrink-0">
        <p
          className={`font-bold ${
            variant === "overdue" ? "text-red-700" : "text-gray-900"
          }`}
        >
          {formatINR(group.totalOutstanding)}
        </p>
        <p className="text-[10px] text-gray-500">total outstanding</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onMessage} className="gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          Message
        </Button>
        <Button size="sm" onClick={onOpen} className="gap-1">
          Open
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function uniqueBookings(items: ScheduleItem[]) {
  const map = new Map<string, { bookingId: string; bookingRef: string; lateFeeRatePct: number }>();
  for (const s of items) {
    if (!map.has(s.bookingId)) {
      map.set(s.bookingId, {
        bookingId: s.bookingId,
        bookingRef: s.bookingRef,
        lateFeeRatePct: s.lateFeeRatePct ?? 2,
      });
    }
  }
  return Array.from(map.values());
}

function LateFeeRateEditor({
  bookingId,
  bookingRef,
  initialRate,
  accessToken,
  onUpdated,
}: {
  bookingId: string;
  bookingRef: string;
  initialRate: number;
  accessToken: string | null;
  onUpdated: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialRate.toString());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialRate.toString());
  }, [initialRate]);

  async function save() {
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      toast.error("Rate must be between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/late-fee-rate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ lateFeeRatePct: n }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const recalc = Number(data.recalculatedSchedules || 0);
        toast.success(
          recalc > 0
            ? `Rate updated to ${n}%/month · ${recalc} existing late fee${recalc > 1 ? "s" : ""} recalculated`
            : `Late fee rate updated to ${n}%/month`
        );
        setEditing(false);
        await onUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 flex items-center gap-3">
      <Percent className="h-4 w-4 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">
          Late fee rate · Booking {bookingRef}
        </p>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 w-24 text-sm"
              disabled={saving}
              autoFocus
            />
            <span className="text-sm text-gray-600">% per month</span>
          </div>
        ) : (
          <p className="font-semibold text-gray-900 text-sm mt-0.5">
            {initialRate}% per month{" "}
            <span className="font-normal text-xs text-gray-500">
              (applied after 30 days overdue)
            </span>
          </p>
        )}
      </div>
      {editing ? (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(false);
              setValue(initialRate.toString());
            }}
            disabled={saving}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing(true)}
          className="gap-1"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: string;
  tone?: "gray" | "red" | "blue";
}) {
  const bg =
    tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : "bg-gray-50 text-gray-700";
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="font-bold text-base mt-0.5">{value}</p>
    </div>
  );
}
