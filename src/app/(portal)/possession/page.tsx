"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface PossessionStepData {
  id: string;
  stepNumber: number;
  title: string;
  status: string;
  estimatedDate: string | null;
  completedDate: string | null;
}

interface PossessionData {
  progressPercent: number;
  totalSteps: number;
  doneSteps: number;
  steps: PossessionStepData[];
}

export default function PossessionPage() {
  const { accessToken, user } = useAuth();
  const [data, setData] = useState<PossessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState("");

  const bookings = user?.customer?.bookings || [];
  const firstBookingId = bookings[0]?.id || null;

  useEffect(() => {
    if (firstBookingId && !selectedBooking) {
      setSelectedBooking(firstBookingId);
    }
  }, [firstBookingId, selectedBooking]);

  useEffect(() => {
    if (!selectedBooking || !accessToken) return;

    async function fetchSteps() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/possession?bookingId=${selectedBooking}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load possession steps:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSteps();
  }, [selectedBooking, accessToken]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Possession Tracker</h1>
          <p className="text-gray-500 mt-1">Track your property possession progress</p>
        </div>

        {bookings.length > 1 && (
          <select
            value={selectedBooking}
            onChange={(e) => setSelectedBooking(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.unitNumber} - {b.projectName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Progress Overview */}
      {data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {data.progressPercent}%
              </span>
              <span className="text-sm text-gray-500">
                {data.doneSteps} of {data.totalSteps} steps completed
              </span>
            </div>
            <Progress value={data.progressPercent} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {data && data.steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Possession Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {data.steps.map((step, index) => {
                const isLast = index === data.steps.length - 1;
                return (
                  <div key={step.id} className="flex gap-4 pb-8 last:pb-0">
                    {/* Timeline line and icon */}
                    <div className="flex flex-col items-center">
                      <div className="flex-shrink-0">
                        {step.status === "DONE" && (
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                        {step.status === "IN_PROGRESS" && (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                          </div>
                        )}
                        {step.status === "UPCOMING" && (
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Circle className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 mt-2 ${
                            step.status === "DONE"
                              ? "bg-green-300"
                              : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">
                          Step {step.stepNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            step.status === "DONE"
                              ? "bg-green-100 text-green-700"
                              : step.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {step.status === "DONE"
                            ? "Completed"
                            : step.status === "IN_PROGRESS"
                            ? "In Progress"
                            : "Upcoming"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mt-1">
                        {step.title}
                      </h3>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500">
                        {step.estimatedDate && (
                          <span>Est: {formatDate(step.estimatedDate)}</span>
                        )}
                        {step.completedDate && (
                          <span className="text-green-600">
                            Done: {formatDate(step.completedDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.steps.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No possession steps have been added yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
