"use client";

import { useState } from "react";
import { sendNotification } from "@/services/adminService";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { toast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@/hooks/useNotifications";
import { Spinner } from "@/components/ui/spinner";
import { Send } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message is required"),
  type: z.enum(["general", "matchReminder", "auctionStart", "scheduleChange", "resultsPublished"]),
});

type FormData = z.infer<typeof schema>;

export default function AdminNotificationsPage() {
  const { data: notifications, loading } = useNotifications(20);
  const [sending, setSending] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", type: "general" },
  });

  async function onSubmit(data: FormData) {
    if (sending) return; // guard against double-submit
    setSending(true);
    try {
      // Broadcast (no userId) → one in-app doc for everyone + one data-only push.
      await sendNotification({
        type: data.type,
        title: data.title,
        body: data.body,
        imageUrl: imageUrl || undefined,
      });
      reset();
      setImageUrl("");
      toast({ type: "success", message: "Notification sent to all users." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to send." });
    } finally {
      setSending(false);
    }
  }

  const typeColors: Record<string, "yellow" | "blue" | "green" | "purple" | "red"> = {
    general: "yellow",
    matchReminder: "blue",
    auctionStart: "purple",
    scheduleChange: "red",
    resultsPublished: "green",
  };

  return (
    <div>
      <AdminHeader title="Notifications" subtitle="Send and manage notifications" />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input {...register("title")} placeholder="Notification title" />
                <FieldError>{errors.title?.message}</FieldError>
              </div>
              <div>
                <Label>Type</Label>
                <Select {...register("type")}>
                  <option value="general">General</option>
                  <option value="matchReminder">Match Reminder</option>
                  <option value="auctionStart">Auction Start</option>
                  <option value="scheduleChange">Schedule Change</option>
                  <option value="resultsPublished">Results Published</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea {...register("body")} placeholder="Notification message" />
              <FieldError>{errors.body?.message}</FieldError>
            </div>
            <div>
              <Label>Image (optional)</Label>
              <ImageUploader value={imageUrl} onChange={setImageUrl} folder="banners" />
              <p className="mt-1 text-xs font-medium text-ink/50">
                Shown in the in-app bell and the push notification.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="yellow" type="submit" disabled={sending}>
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send to everyone"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight">Recent Notifications</h2>

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <p className="text-sm font-medium text-ink/60">No notifications sent yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-2xl border-4 border-ink bg-cream p-4 shadow-brutal-sm"
            >
              {n.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={n.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl border-2 border-ink object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold">{n.title}</span>
                  <Badge variant={typeColors[n.type] ?? "yellow"}>{n.type}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-ink/70">{n.body}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-ink/40">
                {n.createdAt?.toMillis()
                  ? new Date(n.createdAt.toMillis()).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
