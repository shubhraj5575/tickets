"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Target = { customerId: string; customerName: string } | null;

export function SendMessageDialog({
  target,
  onClose,
  accessToken,
}: {
  target: Target;
  onClose: () => void;
  accessToken: string | null;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (target) {
      setTitle("");
      setBody("");
    }
  }, [target]);

  async function send() {
    if (!target || !accessToken) return;
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error("Message cannot be empty");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          customerId: target.customerId,
          title: title.trim() || undefined,
          body: trimmed,
        }),
      });
      if (res.ok) {
        toast.success(`Message sent to ${target.customerName}`);
        onClose();
      } else {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Failed to send message");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            Send Message{target ? ` to ${target.customerName}` : ""}
          </DialogTitle>
          <DialogDescription>
            The customer will see this in their in-app notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="msg-title" className="text-xs text-gray-600">
              Subject (optional)
            </Label>
            <Input
              id="msg-title"
              placeholder="e.g. Reminder: upload PAN copy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={sending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-body" className="text-xs text-gray-600">
              Message
            </Label>
            <Textarea
              id="msg-body"
              placeholder="Write your message to the customer..."
              rows={5}
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={sending}
            />
            <p className="text-xs text-gray-400 text-right">
              {body.length}/2000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending || !body.trim()}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
