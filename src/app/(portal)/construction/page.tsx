"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Video,
  Plane,
  CheckCircle2,
  Circle,
  CalendarDays,
  HardHat,
} from "lucide-react";

interface ConstructionUpdate {
  id: string;
  title: string;
  description: string | null;
  stage: string;
  date: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  source: string;
}

const stages = [
  "FOUNDATION",
  "STRUCTURE",
  "BRICKWORK",
  "PLASTERING",
  "FINISHING",
  "EXTERNAL_DEVELOPMENT",
  "HANDOVER_READY",
];

const stageLabels: Record<string, string> = {
  FOUNDATION: "Foundation",
  STRUCTURE: "Structure",
  BRICKWORK: "Brickwork",
  PLASTERING: "Plastering",
  FINISHING: "Finishing",
  EXTERNAL_DEVELOPMENT: "External Dev",
  HANDOVER_READY: "Handover",
};

const stageFullLabels: Record<string, string> = {
  FOUNDATION: "Foundation",
  STRUCTURE: "Structure",
  BRICKWORK: "Brickwork",
  PLASTERING: "Plastering",
  FINISHING: "Finishing",
  EXTERNAL_DEVELOPMENT: "External Development",
  HANDOVER_READY: "Handover Ready",
};

const stageColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  FOUNDATION: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", badge: "bg-amber-50 text-amber-700" },
  STRUCTURE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", badge: "bg-blue-50 text-blue-700" },
  BRICKWORK: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", badge: "bg-orange-50 text-orange-700" },
  PLASTERING: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300", badge: "bg-purple-50 text-purple-700" },
  FINISHING: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300", badge: "bg-pink-50 text-pink-700" },
  EXTERNAL_DEVELOPMENT: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300", badge: "bg-teal-50 text-teal-700" },
  HANDOVER_READY: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", badge: "bg-emerald-50 text-emerald-700" },
};

const mediaIcons = {
  PHOTO: Camera,
  VIDEO: Video,
  DRONE: Plane,
  CCTV_SNAPSHOT: Camera,
};

export default function ConstructionPage() {
  const { accessToken, user } = useAuth();
  const [updates, setUpdates] = useState<ConstructionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState("");

  const bookings = user?.customer?.bookings || [];
  const projectId = bookings[0]?.id;

  useEffect(() => {
    if (!accessToken) return;

    async function fetchUpdates() {
      try {
        const res = await fetch("/api/construction", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUpdates(data.updates || []);
          setCurrentStage(data.currentStage || "FOUNDATION");
        }
      } catch (err) {
        console.error("Failed to load construction updates:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, [accessToken, projectId]);

  const stageIndex = stages.indexOf(currentStage);
  const progressPercent = ((stageIndex + 1) / stages.length) * 100;

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <HardHat className="h-8 w-8 text-primary" />
          Construction Progress
        </h1>
        <p className="text-gray-500 mt-1 ml-11">
          Monthly updates on your property&apos;s construction
        </p>
      </div>

      {/* Horizontal Progress Stepper */}
      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        <CardContent className="p-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-semibold text-gray-700">
              Overall Progress
            </span>
            <Badge className="bg-primary/10 text-primary border-0 font-semibold">
              {Math.round(progressPercent)}% Complete
            </Badge>
          </div>

          {/* Stepper */}
          <div className="relative">
            {/* Background line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
            {/* Active line */}
            <div
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/80 transition-all duration-700"
              style={{
                width: `${(stageIndex / (stages.length - 1)) * 100}%`,
              }}
            />

            <div className="relative flex justify-between">
              {stages.map((stage, i) => {
                const isCompleted = i < stageIndex;
                const isCurrent = i === stageIndex;
                const isFuture = i > stageIndex;

                return (
                  <div
                    key={stage}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / stages.length}%` }}
                  >
                    {/* Step circle */}
                    <div
                      className={`
                        relative z-10 flex items-center justify-center rounded-full transition-all duration-300
                        ${
                          isCompleted
                            ? "h-10 w-10 bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : isCurrent
                            ? "h-10 w-10 bg-white border-[3px] border-primary text-primary shadow-lg shadow-primary/10 ring-4 ring-primary/5"
                            : "h-10 w-10 bg-gray-100 text-gray-400 border-2 border-gray-200"
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isCurrent ? (
                        <span className="text-xs font-bold">{i + 1}</span>
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`
                        mt-3 text-[11px] font-medium text-center leading-tight max-w-[80px]
                        ${
                          isCompleted
                            ? "text-primary"
                            : isCurrent
                            ? "text-primary font-semibold"
                            : "text-gray-400"
                        }
                      `}
                    >
                      {stageLabels[stage]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Updates Timeline + Photo Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gray-400" />
          Recent Updates
        </h2>

        {updates.length === 0 ? (
          <Card className="border border-gray-100">
            <CardContent className="py-16 text-center">
              <HardHat className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No construction updates yet
              </h3>
              <p className="text-gray-500 mt-1">Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Photo Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {updates.map((update) => {
                const Icon =
                  mediaIcons[update.mediaType as keyof typeof mediaIcons] ||
                  Camera;
                const colors = stageColors[update.stage] || stageColors.FOUNDATION;

                return (
                  <Card
                    key={update.id}
                    className="group overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    {/* Media preview with hover zoom */}
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {update.mediaType === "VIDEO" ||
                      update.mediaType === "DRONE" ? (
                        <video
                          src={update.mediaUrl}
                          poster={update.thumbnailUrl || undefined}
                          controls
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <img
                          src={update.mediaUrl}
                          alt={update.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Media type badge */}
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant="secondary"
                          className="bg-white/90 backdrop-blur-sm shadow-sm border-0 gap-1"
                        >
                          <Icon className="h-3 w-3" />
                          {update.source === "CCTV"
                            ? "CCTV"
                            : update.mediaType}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {update.title}
                      </h3>
                      {update.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {update.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <Badge
                          className={`${colors.badge} border-0 font-medium text-xs`}
                        >
                          {stageFullLabels[update.stage] || update.stage}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(update.date)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Timeline View */}
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Update Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-6">
                    {updates.map((update) => {
                      const colors =
                        stageColors[update.stage] || stageColors.FOUNDATION;
                      return (
                        <div key={update.id} className="relative flex gap-4">
                          {/* Timeline dot */}
                          <div
                            className={`relative z-10 h-10 w-10 rounded-full ${colors.bg} ${colors.text} border-2 ${colors.border} flex items-center justify-center flex-shrink-0`}
                          >
                            <Camera className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {update.title}
                                </h4>
                                {update.description && (
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    {update.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                                {formatDate(update.date)}
                              </span>
                            </div>
                            <Badge
                              className={`${colors.badge} border-0 text-xs mt-2`}
                            >
                              {stageFullLabels[update.stage] || update.stage}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
