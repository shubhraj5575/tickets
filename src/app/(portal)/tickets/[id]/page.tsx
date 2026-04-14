"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, User, Headphones } from "lucide-react";

interface TicketDetail {
  id: string;
  ticketRef: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
  isCustomer: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OPEN: { label: "Open", variant: "destructive" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  RESOLVED: { label: "Resolved", variant: "secondary" },
  CLOSED: { label: "Closed", variant: "outline" },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: "Low", variant: "outline" },
  MEDIUM: { label: "Medium", variant: "secondary" },
  HIGH: { label: "High", variant: "default" },
  URGENT: { label: "Urgent", variant: "destructive" },
};

const categoryLabels: Record<string, string> = {
  PAYMENT_DISPUTE: "Payment Dispute",
  NAME_CHANGE: "Name Change",
  ADDRESS_UPDATE: "Address Update",
  CONSTRUCTION_QUERY: "Construction Query",
  DOCUMENT_REQUEST: "Document Request",
  GENERAL: "General",
};

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    fetchTicket();
  }, [accessToken, id]);

  async function fetchTicket() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setTicket(await res.json());
      }
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply() {
    if (!reply.trim() || !accessToken) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: reply }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setTicket((prev) =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
        );
        setReply("");
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSending(false);
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>
    );
  }

  const sc = statusConfig[ticket.status];
  const pc = priorityConfig[ticket.priority];
  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ticket.ticketRef} - Created {formatDate(ticket.createdAt)}
          </p>
        </div>
      </div>

      {/* Ticket Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={sc?.variant || "secondary"}>
              {sc?.label || ticket.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={pc?.variant || "secondary"}>
              {pc?.label || ticket.priority}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {categoryLabels[ticket.category] || ticket.category}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatDate(ticket.updatedAt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Thread */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isCustomer ? "justify-end" : "justify-start"}`}
              >
                {!msg.isCustomer && (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Headphones className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    msg.isCustomer
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.isCustomer ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
                {msg.isCustomer && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reply Form */}
          {!isClosed && (
            <div className="mt-6 flex gap-3">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="flex-1"
              />
              <Button
                onClick={handleSendReply}
                disabled={sending || !reply.trim()}
                className="self-end"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          )}

          {isClosed && (
            <div className="mt-6 text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">
                This ticket is closed. Create a new ticket if you need further assistance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
