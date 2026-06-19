"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { GripVertical, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { db } from "@/firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllMarqueeItems } from "@/hooks/useMarquee";
import type { MarqueeItem, WithId } from "@/types";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export function MarqueeEditor() {
  const { data: items, loading, error } = useAllMarqueeItems();
  const [saving, setSaving] = useState(false);

  async function addItem() {
    setSaving(true);
    try {
      await addDoc(collection(db, COLLECTIONS.marquee), {
        text: "New announcement",
        isActive: true,
        order: items.length,
        createdAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id: string, data: Partial<MarqueeItem>) {
    await updateDoc(doc(db, COLLECTIONS.marquee, id), data);
  }

  async function deleteItem(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.marquee, id));
  }

  if (loading) return <Spinner />;
  if (error) return <p className="text-vred font-bold">Failed to load marquee items.</p>;

  return (
    <div className="space-y-3">
      <Button variant="yellow" size="sm" onClick={addItem} disabled={saving}>
        <Plus className="h-4 w-4" />
        Add Item
      </Button>

      {items.length === 0 && (
        <p className="text-sm font-medium text-ink/60">No marquee items yet.</p>
      )}

      {items.map((item) => (
        <MarqueeItemRow
          key={item.id}
          item={item}
          onUpdate={(data) => updateItem(item.id, data)}
          onDelete={() => deleteItem(item.id)}
        />
      ))}
    </div>
  );
}

function MarqueeItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: WithId<MarqueeItem>;
  onUpdate: (data: Partial<MarqueeItem>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-4 border-ink bg-cream p-3 shadow-brutal-sm">
      <GripVertical className="h-5 w-5 cursor-grab text-ink/40" />
      <Input
        value={item.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        className="flex-1"
      />
      <button
        type="button"
        onClick={() => onUpdate({ isActive: !item.isActive })}
        className="text-ink/60 hover:text-ink"
      >
        {item.isActive ? (
          <ToggleRight className="h-6 w-6 text-vgreen" />
        ) : (
          <ToggleLeft className="h-6 w-6" />
        )}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-vred hover:text-vred/80"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
