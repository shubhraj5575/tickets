"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, CheckCircle, Clock, Circle } from "lucide-react";
import { toast } from "sonner";

interface PossessionStep {
  id: string;
  stepNumber: number;
  title: string;
  status: string;
  estimatedDate: string | null;
  completedDate: string | null;
}

interface BookingWithSteps {
  id: string;
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  unitNumber: string;
  projectName: string;
  status: string;
  possessionSteps: PossessionStep[];
}

const STATUS_FLOW: Record<string, string> = {
  UPCOMING: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
};

function statusBadgeVariant(status: string) {
  switch (status) {
    case "DONE":
      return "default" as const;
    case "IN_PROGRESS":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "DONE":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "IN_PROGRESS":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function AdminPossessionPage() {
  const { accessToken } = useAuth();
  const [bookings, setBookings] = useState<BookingWithSteps[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/possession", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch {
      toast.error("Failed to load possession data");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) fetchData();
  }, [accessToken, fetchData]);

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  const handleUpdateStep = async (stepId: string, newStatus: string) => {
    setUpdatingStepId(stepId);
    try {
      const res = await fetch("/api/admin/possession", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stepId, status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Step updated to ${newStatus}`);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update step");
      }
    } catch {
      toast.error("Failed to update step");
    } finally {
      setUpdatingStepId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Possession Management</h1>
        <p className="text-muted-foreground">
          Track and update possession steps for bookings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
          >
            <option value="">-- Select a booking --</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bookingRef} - {b.customerName} | {b.projectName} - {b.unitNumber}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedBooking && (
        <Card>
          <CardHeader>
            <CardTitle>
              Possession Steps for {selectedBooking.bookingRef}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedBooking.customerName} | {selectedBooking.projectName} -{" "}
              {selectedBooking.unitNumber}
            </p>
          </CardHeader>
          <CardContent>
            {selectedBooking.possessionSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No possession steps defined for this booking.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedBooking.possessionSteps.map((step) => {
                  const nextStatus = STATUS_FLOW[step.status];
                  return (
                    <div
                      key={step.id}
                      className="flex items-center justify-between border rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon status={step.status} />
                        <div>
                          <p className="font-medium">
                            Step {step.stepNumber}: {step.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={statusBadgeVariant(step.status)}>
                              {step.status}
                            </Badge>
                            {step.estimatedDate && (
                              <span className="text-xs text-muted-foreground">
                                Est: {new Date(step.estimatedDate).toLocaleDateString()}
                              </span>
                            )}
                            {step.completedDate && (
                              <span className="text-xs text-green-600">
                                Completed: {new Date(step.completedDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {nextStatus && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingStepId === step.id}
                          onClick={() => handleUpdateStep(step.id, nextStatus)}
                        >
                          {updatingStepId === step.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-1.5" />
                              Mark {nextStatus.replace("_", " ")}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
