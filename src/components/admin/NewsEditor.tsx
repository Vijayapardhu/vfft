"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Label, Textarea, FieldError, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import { RichTextEditor } from "./RichTextEditor";

const newsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  coverImage: z.string().min(1, "Cover image is required"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["match", "announcement", "update", "highlight", "general"]),
  isPublished: z.boolean(),
});

export type NewsFormData = z.infer<typeof newsSchema>;

interface NewsEditorProps {
  defaultValues?: Partial<NewsFormData>;
  onSave: (data: NewsFormData) => Promise<void>;
  saving?: boolean;
}

export function NewsEditor({
  defaultValues,
  onSave,
  saving,
}: NewsEditorProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      coverImage: "",
      content: "",
      category: "general",
      isPublished: false,
      ...defaultValues,
    },
  });

  const title = watch("title");

  useEffect(() => {
    if (!defaultValues?.slug && title) {
      setValue(
        "slug",
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      );
    }
  }, [title, defaultValues, setValue]);

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Title</Label>
          <Input {...register("title")} placeholder="Article title" />
          <FieldError>{errors.title?.message}</FieldError>
        </div>
        <div>
          <Label>Slug</Label>
          <Input {...register("slug")} placeholder="article-slug" />
          <FieldError>{errors.slug?.message}</FieldError>
        </div>
      </div>

      <div>
        <Label>Excerpt</Label>
        <Textarea {...register("excerpt")} placeholder="Short description..." />
        <FieldError>{errors.excerpt?.message}</FieldError>
      </div>

      <div>
        <Label>Cover Image</Label>
        <ImageUploader
          value={watch("coverImage")}
          onChange={(url) => setValue("coverImage", url)}
          folder="banners"
        />
        <FieldError>{errors.coverImage?.message}</FieldError>
      </div>

      <div>
        <Label>Category</Label>
        <Select {...register("category")}>
          <option value="general">General</option>
          <option value="match">Match</option>
          <option value="announcement">Announcement</option>
          <option value="update">Update</option>
          <option value="highlight">Highlight</option>
        </Select>
        <FieldError>{errors.category?.message}</FieldError>
      </div>

      <div>
        <Label>Content</Label>
        <RichTextEditor
          value={watch("content")}
          onChange={(html) => setValue("content", html)}
        />
        <FieldError>{errors.content?.message}</FieldError>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register("isPublished")}
          className="h-5 w-5 accent-vyellow"
        />
        <span className="text-sm font-bold uppercase">Publish immediately</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="cream" type="button" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button variant="yellow" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
