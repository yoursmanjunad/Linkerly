"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, AlertCircle, Sparkles, Folder } from "lucide-react";
import { toast } from "sonner";
import { CreateCollectionDialog } from "@/components/create-collection-dialog";

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        if (!token) {
          setError("Please login to view collections");
          return;
        }

        const response = await fetch(`${API}/collections`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch collections");
        }

        const data = await response.json();
        if (data.success) {
          // The backend might return { success: true, data: [...] } or { success: true, data: { collections: [...] } }
          // Based on bookmarks it was data.data.
          // Let's assume data.data is the array or data.data.collections
          const list = Array.isArray(data.data) ? data.data : (data.data?.collections || []);
          setCollections(list);
        } else {
          throw new Error(data.message || "Failed to load collections");
        }
      } catch (err: any) {
        console.error("Error fetching collections:", err);
        setError(err.message);
        toast.error("Failed to load collections");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [API]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto ring-4 ring-destructive/5">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Error Loading Collections</h2>
            <p className="text-muted-foreground text-lg">{error}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Folder className="h-6 w-6" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Collections</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl ml-14">
              Manage and organize your links into beautiful collections.
            </p>
          </div>
          <CreateCollectionDialog 
            onSuccess={() => window.location.reload()} 
            trigger={
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                <Sparkles className="h-4 w-4" />
                Create Collection
              </Button>
            }
          />
        </div>

        {/* Pinterest Grid */}
        {collections.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {collections.map((collection, index) => {
              const linkCount = Array.isArray(collection.links)
                ? collection.links.length
                : collection.linkCount ?? 0;

              return (
                <div
                  key={`${collection._id}-${index}`}
                  className="break-inside-avoid mb-6"
                >
                  <div
                    className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.01] active:scale-[0.99]"
                    onClick={() => router.push(`/collections/${collection._id}`)}
                    style={{
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    {/* Collection Image */}
                    {collection.image ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      </div>
                    ) : (
                      <div className="relative h-80 bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-0 left-0 w-40 h-40 bg-primary rounded-full blur-3xl" />
                          <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent rounded-full blur-3xl" />
                        </div>
                        <Link2 className="h-14 w-14 text-muted-foreground/40 relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    )}

                    {/* Link Count Badge */}
                    <div className="absolute top-3 right-3 z-20">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/90 shadow-sm transition-all duration-300 group-hover:bg-black/30">
                        <Link2 className="w-3 h-3" />
                        <span className="text-xs font-medium">{linkCount}</span>
                      </div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-5 z-20">
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
                          {collection.name}
                        </h3>

                        {collection.description && (
                          <p className="text-xs text-white/80 line-clamp-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
                            {collection.description}
                          </p>
                        )}

                        {/* View Action */}
                        <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                          <div className="h-0.5 w-8 bg-white/60 rounded-full" />
                          <span className="text-xs text-white/90 font-medium uppercase tracking-wider">
                            View Collection
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6 ring-4 ring-muted/20">
              <Folder className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
              Create your first collection to start organizing your links.
            </p>
            <CreateCollectionDialog 
              onSuccess={() => window.location.reload()} 
              trigger={
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Collection
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
