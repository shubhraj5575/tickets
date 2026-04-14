"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trash2, Plus, Megaphone, HelpCircle, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  body: string;
  projectId: string;
  project: { name: string };
  createdAt: string;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  projectId: string;
  project: { name: string };
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  projectId: string;
  project: { name: string };
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

export default function AdminCommunityPage() {
  const { accessToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", projectId: "" });
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "", projectId: "" });
  const [eventForm, setEventForm] = useState({ title: "", description: "", eventDate: "", location: "", projectId: "" });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [communityRes, projectsRes] = await Promise.all([
        fetch("/api/admin/community", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch("/api/admin/projects", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (communityRes.ok) {
        const data = await communityRes.json();
        setAnnouncements(data.announcements || []);
        setFaqs(data.faqs || []);
        setEvents(data.events || []);
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
    } catch {
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) fetchData();
  }, [accessToken, fetchData]);

  const handleCreate = async (type: string, formData: Record<string, string>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/community", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, ...formData }),
      });

      if (res.ok) {
        toast.success(`${type} created successfully`);
        setAnnouncementDialogOpen(false);
        setFaqDialogOpen(false);
        setEventDialogOpen(false);
        setAnnouncementForm({ title: "", body: "", projectId: "" });
        setFaqForm({ question: "", answer: "", category: "", projectId: "" });
        setEventForm({ title: "", description: "", eventDate: "", location: "", projectId: "" });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create");
      }
    } catch {
      toast.error("Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    try {
      const res = await fetch(`/api/admin/community?id=${id}&type=${type}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        toast.success("Deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
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
        <h1 className="text-2xl font-bold">Community Management</h1>
        <p className="text-muted-foreground">Manage announcements, FAQs, and events</p>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">
            <Megaphone className="h-4 w-4 mr-1.5" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="faqs">
            <HelpCircle className="h-4 w-4 mr-1.5" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="events">
            <CalendarDays className="h-4 w-4 mr-1.5" />
            Events
          </TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Announcements ({announcements.length})</CardTitle>
              <Button size="sm" onClick={() => setAnnouncementDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Announcement
              </Button>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-muted-foreground text-sm">No announcements yet.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between border rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{a.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Project: {a.project.name} | {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(a.id, "announcement")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>FAQs ({faqs.length})</CardTitle>
              <Button size="sm" onClick={() => setFaqDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add FAQ
              </Button>
            </CardHeader>
            <CardContent>
              {faqs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No FAQs yet.</p>
              ) : (
                <div className="space-y-3">
                  {faqs.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-start justify-between border rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{f.question}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {f.category && `Category: ${f.category} | `}
                          Project: {f.project.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(f.id, "faq")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Events ({events.length})</CardTitle>
              <Button size="sm" onClick={() => setEventDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Event
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm">No events yet.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start justify-between border rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{ev.title}</h3>
                        {ev.description && (
                          <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Date: {new Date(ev.eventDate).toLocaleDateString()}
                          {ev.location && ` | Location: ${ev.location}`}
                          {" | "}Project: {ev.project.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(ev.id, "event")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={announcementForm.projectId}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, projectId: e.target.value })
                }
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1"
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                className="mt-1"
                value={announcementForm.body}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, body: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={submitting || !announcementForm.projectId || !announcementForm.title || !announcementForm.body}
              onClick={() => handleCreate("announcement", announcementForm)}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add FAQ Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add FAQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={faqForm.projectId}
                onChange={(e) => setFaqForm({ ...faqForm, projectId: e.target.value })}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Question</Label>
              <Input
                className="mt-1"
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
              />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea
                className="mt-1"
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
              />
            </div>
            <div>
              <Label>Category (optional)</Label>
              <Input
                className="mt-1"
                value={faqForm.category}
                onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={submitting || !faqForm.projectId || !faqForm.question || !faqForm.answer}
              onClick={() => handleCreate("faq", faqForm)}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={eventForm.projectId}
                onChange={(e) => setEventForm({ ...eventForm, projectId: e.target.value })}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                className="mt-1"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Event Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={eventForm.eventDate}
                onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input
                className="mt-1"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={submitting || !eventForm.projectId || !eventForm.title || !eventForm.eventDate}
              onClick={() => handleCreate("event", eventForm)}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
