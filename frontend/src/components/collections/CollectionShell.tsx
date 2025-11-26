// components/collections/CollectionShell.client.tsx
"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookmarkPlus, Bookmark } from "lucide-react";
// import LinkCard from "./LinkCard.client";
import LinkCard from "@/components/collections/LinkCard.client";
import { useBookmark } from "@/lib/useBookmark";
export default function CollectionShell({ collection }: any) {
  const { id, name, description, image, links = [], owner } = collection;
  const { isBookmarked, toggling, toggleBookmark } = useBookmark(id);

  return (
    <div className="max-w-6xl mx-auto lg:px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* LEFT: Image (sticky on desktop) */}
        <aside className="hidden md:block sticky top-20 self-start">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            {image ? (
              <img src={image} alt={name} className="w-full h-[60vh] object-cover" />
            ) : (
              <div className="h-[60vh] w-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{name}</h2>
              <Badge variant="secondary">{links.length} links</Badge>
            </div>
            <div className="text-sm text-muted-foreground">by {owner?.username || "unknown"}</div>
          </div>
        </aside>

        {/* RIGHT: content */}
        <section className="min-h-[60vh]">
          {/* Sticky header on top of right column */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{name}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
                <div className="text-xs text-muted-foreground mt-1">by {owner?.username}</div>
              </div>

              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleBookmark}
                  disabled={toggling}
                  aria-pressed={isBookmarked}
                  title={isBookmarked ? "Bookmarked" : "Add bookmark"}
                >
                  {isBookmarked ? <Bookmark className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable links list */}
          <div className="mt-4 space-y-4 overflow-y-auto">
            {links.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No links yet</div>
            ) : (
              links.map((link: any) => <LinkCard key={link._id} link={link} />)
            )}
          </div>

          <footer className="mt-8 py-6 text-center text-sm text-muted-foreground border-t">
            <a href="https://linkerly.it" className="hover:underline">linkerly.it</a>
          </footer>
        </section>
      </div>

      {/* Mobile image + header (show at top for small screens) */}
      <div className="md:hidden mt-6">
        {image && <img src={image} alt={name} className="w-full h-48 object-cover rounded-lg" />}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{name}</h2>
            <div className="text-xs text-muted-foreground">by {owner?.username}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleBookmark} disabled={toggling}>
            {isBookmarked ? <Bookmark /> : <BookmarkPlus />}
          </Button>
        </div>
      </div>
    </div>
  );
}
