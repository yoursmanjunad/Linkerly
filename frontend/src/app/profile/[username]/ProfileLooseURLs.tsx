"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { UrlImagePlaceholder } from "@/components/url-image-placeholder";

export default function ProfileLooseUrls({ username }: { username: string }) {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [urls, setUrls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    const loadUrls = async () => {
      try {
        const res = await fetch(`${API}/url/user/links`, {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const data = await res.json();

        if (!data.success) {
          toast.error("Failed to load URLs");
          return;
        }

        // Filter URLs with NO collection
        const loose = data.data.urls.filter((u: any) => u.collection === null);
        setUrls(loose);
      } catch (err) {
        toast.error("Failed to load URLs");
      } finally {
        setLoading(false);
      }
    };

    loadUrls();
  }, [username, API]);

  if (loading) {
    return (
      <div className="mt-10 text-center text-muted-foreground">Loading URLs…</div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="mt-10 text-center text-muted-foreground">
        No standalone URLs found.
      </div>
    );
  }

  return (
    <div className="mt-16">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
        URLs without Collection
        </h2>
        <p className="text-muted-foreground">
          These links are not part of any collection.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {urls.map((url: any) => (
          <Card
            key={url._id}
            className="overflow-hidden border bg-card hover:shadow-md transition-shadow"
          >
            <CardContent className="p-5 space-y-3">
              {/* TITLE */}
              <h3 className="font-semibold text-lg">{url.title}</h3>

              {/* SHORT URL */}
              <div className="flex items-center gap-2 text-sm break-all">
                <a
                  href={`/${url.shortUrl}`}
                  target="_blank"
                  className="text-primary underline"
                >
                  {window.location.origin}/{url.shortUrl}
                </a>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/${url.shortUrl}`
                    );
                    toast.success("Copied!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    window.open(`${window.location.origin}/${url.shortUrl}`)
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* LONG URL */}
              <p className="text-xs text-muted-foreground break-all">
                {url.longUrl}
              </p>
              {/* IMAGE */}
              <div className="w-full h-40 rounded-md border overflow-hidden">
                {url.image ? (
                  <img
                    src={url.image}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UrlImagePlaceholder title={url.title} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
