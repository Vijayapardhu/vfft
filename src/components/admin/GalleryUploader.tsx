"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Input, Label, Textarea, FieldError, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";

const galleryItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  imageUrl: z.string().min(1, "Image is required"),
  type: z.enum(["match", "winners", "posters", "teams", "banner"]),
  description: z.string().optional(),
});

const formSchema = z.object({
  items: z.array(galleryItemSchema).min(1, "Add at least one item"),
});

type GalleryFormData = z.infer<typeof formSchema>;

interface GalleryUploaderProps {
  onSave: (items: GalleryFormData["items"]) => Promise<void>;
  saving?: boolean;
}

export function GalleryUploader({ onSave, saving }: GalleryUploaderProps) {
  const { control, register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<GalleryFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: { items: [{ title: "", imageUrl: "", type: "match", description: "" }] },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  return (
    <form onSubmit={handleSubmit((d) => onSave(d.items))} className="space-y-6">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-3xl border-4 border-ink bg-cream p-4 shadow-brutal-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold uppercase">Item {index + 1}</span>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-vred"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input {...register(`items.${index}.title`)} placeholder="Image title" />
              <FieldError>{errors.items?.[index]?.title?.message}</FieldError>
            </div>
            <div>
              <Label>Type</Label>
              <Select {...register(`items.${index}.type`)}>
                <option value="match">Match</option>
                <option value="winners">Winners</option>
                <option value="posters">Posters</option>
                <option value="teams">Teams</option>
                <option value="banner">Banner</option>
              </Select>
            </div>
          </div>

          <div className="mt-3">
            <Label>Description</Label>
            <Textarea {...register(`items.${index}.description`)} placeholder="Optional description" />
          </div>

          <div className="mt-3">
            <Label>Image</Label>
            <ImageUploader
              value={watch(`items.${index}.imageUrl`)}
              onChange={(url) => setValue(`items.${index}.imageUrl`, url)}
              folder="gallery"
            />
            <FieldError>{errors.items?.[index]?.imageUrl?.message}</FieldError>
          </div>
        </div>
      ))}

      <Button
        variant="cream"
        size="sm"
        type="button"
        onClick={() =>
          append({ title: "", imageUrl: "", type: "match", description: "" })
        }
      >
        <Plus className="h-4 w-4" />
        Add Another
      </Button>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="yellow" type="submit" disabled={saving}>
          {saving ? "Uploading..." : "Upload All"}
        </Button>
      </div>
    </form>
  );
}
