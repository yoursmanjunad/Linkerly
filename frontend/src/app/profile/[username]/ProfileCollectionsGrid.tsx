"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Link2, Sparkles } from "lucide-react";

type Props = {
  username: string;
  page?: number;
  limit?: number;
  showPagination?: boolean;
};

export default function ProfileCollectionsGridB({
  username,
  page = 1,
  limit = 12,
  showPagination = false,
}: Props) {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`${API}/profiles/${username}/collections?page=${page}&limit=${limit}`)
      .then((res) => res.json())
      .then((payload) => {
        // defensive: payload.data.collections or []
        const collections = payload?.data?.collections ?? [];
        setData(collections);
        setMeta(payload?.data?.pagination ?? {});
      })
      .catch(() => {
        setData([]);
        setMeta({});
      })
      .finally(() => setLoading(false));
  }, [username, page, limit, API]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i}>
            <Skeleton className="w-full aspect-[4/5] rounded-md" />
            <Skeleton className="h-5 w-2/3 mt-3" />
          </div>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-full bg-muted">
          <Link2 className="w-5 h-5 text-muted-foreground/60" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No collections yet</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2">
          Collections will appear here once they're created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((col: any) => {
          const linkCount = Array.isArray(col.links) ? col.links.length : col.linkCount ?? 0;
          const slug = col.collectionShortUrl || col.slug;
          return (
            <Link
              key={col._id}
              href={`/c/${slug}`}
              className="group block rounded-md overflow-hidden"
            >
              {/* Use a simple container — image will take full area, no top/bottom gaps */}
              <div className="relative w-full aspect-[4/5] bg-muted">
                {/* image */}
                <img
                  src={col.image || "/placeholder.svg"}
                  alt={col.name}
                  className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
                  style={{ display: "block" }} // ensure no baseline gap
                />

                {/* dark gradient overlay to keep text legible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 transition-opacity" />

                {/* Top-left badge */}
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="backdrop-blur-md bg-black/30 hover:bg-black/40 text-white border-white/20 shadow-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Collection
                  </Badge>
                </div>

                {/* Top-right external icon */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transform -translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/40 text-white backdrop-blur-md">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>

                {/* Bottom overlay content (title, desc, stats) */}
                <div className="absolute left-0 right-0 bottom-0 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white text-lg font-bold leading-tight truncate">{col.name}</h3>
                      {col.description && (
                        <p className="text-xs text-gray-200 line-clamp-1 mt-1.5 font-medium">{col.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                        <Link2 className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs text-white font-semibold">{linkCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* simple pagination area (keeps your existing behavior) */}
      {showPagination && (meta.hasPrev || meta.hasNext) && (
        <div className="flex items-center justify-center gap-3">
          {meta.hasPrev && (
            <Link href={`?page=${meta.currentPage - 1}`} className="inline-block">
              <Button variant="outline">Previous</Button>
            </Link>
          )}
          <div className="text-sm text-muted-foreground px-3">
            Page {meta.currentPage} of {meta.totalPages}
          </div>
          {meta.hasNext && (
            <Link href={`?page=${meta.currentPage + 1}`} className="inline-block">
              <Button variant="outline">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
