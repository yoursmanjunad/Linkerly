"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Copy, Edit, ExternalLink, MoreVertical, Eye, Trash } from "lucide-react";
import { toast } from "sonner";

export default function LooseUrlCards() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const BASE = process.env.NEXT_PUBLIC_SHORT_BASE_URL || "http://localhost:5000";

  const [urls, setUrls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ========================================
  // Fetch URLs that are not linked to any collection
  // ========================================
  const loadLooseUrls = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/url/user/links`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!data.success) {
        toast.error("Failed to load URLs");
        return;
      }

      const loose = data.data.urls.filter((u: any) => u.collection === null);
      setUrls(loose);
    } catch (err) {
      toast.error("Error loading URLs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLooseUrls();
  }, []);

  // ========================================
  // Delete URL
  // ========================================
  const deleteUrl = async (id: string) => {
    if (!confirm("Delete this URL?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/url/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Deleted");
        loadLooseUrls();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return <p className="mt-10 text-center text-muted-foreground">Loading URLs...</p>;
  }

  if (urls.length === 0) {
    return <p className="mt-10 text-center text-muted-foreground">No loose URLs found.</p>;
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Loose URLs</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {urls.map((url) => (
          <Card key={url._id} className="overflow-hidden border bg-card hover:shadow-lg transition">
            <CardContent className="p-4 space-y-3">

              {/* IMAGE */}
              {url.image ? (
                <img src={url.image} className="w-full h-40 object-cover rounded-md border" />
              ) : (
                <div className="w-full h-40 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}

              {/* TITLE */}
              <h3 className="font-semibold text-lg">{url.title}</h3>

              {/* DESCRIPTION */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {url.description || "No description"}
              </p>

              {/* SHORT URL */}
              <div className="flex items-center gap-2 text-sm">
                <a
                  href={`${BASE}/${url.shortUrl}`}
                  target="_blank"
                  className="text-primary underline break-all"
                >
                  {BASE}/{url.shortUrl}
                </a>
              </div>

              {/* ACTION MENU */}
              <div className="flex justify-between pt-2">
                {/* Visit Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${BASE}/${url.shortUrl}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>

                {/* 3 dots */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => window.open(`/dashboard/url/${url._id}`, "_blank")}
                    >
                      <Eye className="h-4 w-4" /> View Details
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => (window.location.href = `/dashboard/edit-url/${url._id}`)}>
                      <Edit className="h-4 w-4" /> Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(`${BASE}/${url.shortUrl}`);
                        toast.success("Copied!");
                      }}
                    >
                      <Copy className="h-4 w-4" /> Copy
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteUrl(url._id)}
                    >
                      <Trash className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
