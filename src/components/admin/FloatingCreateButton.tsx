"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Gamepad2, Send, Newspaper, Upload, Gavel } from "lucide-react";

const actions = [
  { label: "Create Match", href: "/admin/matches", icon: Gamepad2, color: "bg-vblue" },
  { label: "Send Notification", href: "/admin/notifications", icon: Send, color: "bg-vred" },
  { label: "Create News", href: "/admin/news", icon: Newspaper, color: "bg-vpurple" },
  { label: "Upload Poster", href: "/admin/gallery", icon: Upload, color: "bg-vgreen" },
  { label: "Start Auction", href: "/admin/auction", icon: Gavel, color: "bg-vyellow" },
];

export function FloatingCreateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 lg:hidden">
        <AnimatePresence>
          {open &&
            actions.map((action, i) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className={`${action.color} flex items-center gap-2 rounded-2xl border-4 border-ink px-4 py-2.5 text-sm font-bold uppercase shadow-brutal-md transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5`}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              </motion.div>
            ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="grid h-14 w-14 place-items-center rounded-2xl border-4 border-ink bg-vyellow shadow-brutal-lg transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-sm"
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus className="h-7 w-7" />
          </motion.div>
        </button>
      </div>
    </>
  );
}
