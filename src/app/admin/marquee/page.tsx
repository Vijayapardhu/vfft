"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { MarqueeEditor } from "@/components/admin/MarqueeEditor";
import { useMarqueeItems } from "@/hooks/useMarquee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function AdminMarqueePage() {
  const { data: items, loading } = useMarqueeItems();

  return (
    <div>
      <AdminHeader title="Marquee" subtitle="Manage scrolling marquee announcements" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <p className="text-sm font-medium text-ink/60">No active items.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border-4 border-ink bg-vyellow p-3">
              <div className="animate-marquee whitespace-nowrap text-sm font-bold uppercase">
                {items.map((item) => item.text).join("  •  ")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Items</CardTitle>
        </CardHeader>
        <CardContent>
          <MarqueeEditor />
        </CardContent>
      </Card>
    </div>
  );
}
