"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
const destinations = [
  ["Mission studio · people + AI", "/dashboard/missions"],
  ["My civic desk", "/dashboard"],
  ["Explore participation", "/dashboard/participation"],
  ["Proposals & voting", "/dashboard/proposals"],
  ["Community budgets", "/dashboard/participation/budget"],
  ["Assemblies", "/dashboard/participation/assemblies"],
  ["Surveys", "/dashboard/participation/surveys"],
  ["Legislation", "/dashboard/participation/legislation"],
  ["Citizen initiatives", "/dashboard/participation/initiatives"],
  ["Accountability & outcomes", "/dashboard/participation/accountability"],
  ["Community map", "/dashboard/cosmic-map"],
  ["My communities", "/dashboard/organizations"],
  ["Sticker book", "/dashboard/stickers"],
  ["AI assistant", "/dashboard/assistant"],
  ["Settings", "/dashboard/settings"],
];
export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const results = destinations.filter(([label]) =>
    label.toLowerCase().includes(query.toLowerCase()),
  );
  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="workspace-search">
        <Search size={16} />
        <span>Find your next step...</span>
        <kbd>⌘ K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="command-dialog" showCloseButton={false}>
          <DialogTitle className="sr-only">
            Find a tool or search Cosmogov
          </DialogTitle>
          <DialogDescription className="sr-only">
            Jump to a workspace or search proposals and communities.
          </DialogDescription>
          <div className="command-input">
            <Search size={20} />
            <input
              autoFocus
              aria-label="Search tools"
              placeholder="Where would you like to go?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  navigate(
                    results[0]?.[1] ||
                      `/dashboard/search?q=${encodeURIComponent(query)}`,
                  );
              }}
            />
            <button aria-label="Close search" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="command-results">
            <div className="eyebrow">YOUR WORKSPACE</div>
            {results.map(([label, href]) => (
              <button key={href} onClick={() => navigate(href)}>
                <span>{label}</span>
                <ArrowUpRight size={15} />
              </button>
            ))}
            {query && (
              <button
                onClick={() =>
                  navigate(`/dashboard/search?q=${encodeURIComponent(query)}`)
                }
              >
                Search for “{query}” <Search size={15} />
              </button>
            )}
          </div>
          <div className="command-hint">
            Use Tab to move · Enter to open · Esc to close
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
