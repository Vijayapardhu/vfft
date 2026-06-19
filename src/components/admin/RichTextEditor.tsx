"use client";

import { useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = prompt("Enter link URL:");
    if (url) exec("createLink", url);
  }, [exec]);

  return (
    <div className="rounded-2xl border-4 border-ink overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b-4 border-ink bg-vyellow/30 p-2">
        {[
          { icon: Bold, cmd: "bold", label: "Bold" },
          { icon: Italic, cmd: "italic", label: "Italic" },
          { icon: Heading, cmd: "formatBlock", val: "h3", label: "Heading" },
          { icon: List, cmd: "insertUnorderedList", label: "Bullet list" },
          { icon: ListOrdered, cmd: "insertOrderedList", label: "Numbered list" },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => exec(item.cmd, item.val)}
            className="grid h-8 w-8 place-items-center rounded-lg border-2 border-transparent hover:border-ink hover:bg-cream"
            title={item.label}
          >
            <item.icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          onClick={insertLink}
          className="grid h-8 w-8 place-items-center rounded-lg border-2 border-transparent hover:border-ink hover:bg-cream"
          title="Insert link"
        >
          <Link className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        className={cn(
          "min-h-[200px] bg-cream p-4 text-sm focus:outline-none",
          !value && "before:text-ink/30 before:content-[attr(data-placeholder)]",
        )}
        data-placeholder={placeholder}
      />
    </div>
  );
}
