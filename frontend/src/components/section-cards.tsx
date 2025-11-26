"use client";

import { useEffect, useState } from "react";
import { IconTrendingDown, IconTrendingUp, IconLoader } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface UserStats {
  totalLinks: number;
  totalClicks: number;
  avgClicks: number;
  topLink?: {
    title: string;
    shortUrl: string;
    clickCount: number;
  };
}

interface CollectionStats {
  totalCollections: number;
}

export function SectionCards() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [collections, setCollections] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch user stats
        const statsResponse = await fetch(`${API_BASE}/url/user/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const statsData = await statsResponse.json();
        console.log("Stats API response:", statsData);
        if (statsData.success) {
          setStats(statsData.data);
        }

        // Fetch collections count
        const collectionsResponse = await fetch(`${API_BASE}/collections?page=1&limit=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const collectionsData = await collectionsResponse.json();
        console.log("Collections API response:", collectionsData);
        if (collectionsData.success) {
          setCollections({
            totalCollections: collectionsData.data?.pagination?.totalCollections || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <div className="flex items-center justify-center h-32">
                <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const totalClicks = stats?.totalClicks || 0;
  const totalLinks = stats?.totalLinks || 0;
  const totalCollections = collections?.totalCollections || 0;
  const avgClicks = stats?.avgClicks || 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Clicks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalClicks.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {totalClicks > 0 ? (
                <>
                  <IconTrendingUp />
                  Active
                </>
              ) : (
                "No data"
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {totalClicks > 0 ? "Tracking link engagement" : "Create links to see stats"}
          </div>
          <div className="text-muted-foreground">
            {stats?.topLink ? `Top: ${stats.topLink.title || stats.topLink.shortUrl}` : "All-time clicks"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Links</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalLinks.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {totalLinks > 0 ? (
                <>
                  <IconTrendingUp />
                  {totalLinks} URL{totalLinks !== 1 ? "s" : ""}
                </>
              ) : (
                "Start creating"
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {totalLinks > 0 ? "Active short links" : "No links yet"}
          </div>
          <div className="text-muted-foreground">
            {totalLinks > 0 ? `Average ${avgClicks} clicks per link` : "Create your first link"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Collections</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCollections.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {totalCollections > 0 ? (
                <>
                  <IconTrendingUp />
                  Organized
                </>
              ) : (
                "None"
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {totalCollections > 0 ? "Link organization active" : "Create collections"}
          </div>
          <div className="text-muted-foreground">
            {totalCollections > 0 ? "Group related links" : "Organize your links"}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avg Clicks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgClicks.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {avgClicks > 0 ? (
                <>
                  <IconTrendingUp />
                  Per link
                </>
              ) : (
                "N/A"
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {avgClicks > 0 ? "Link performance metric" : "No data yet"}
          </div>
          <div className="text-muted-foreground">
            {totalLinks > 0 ? `${totalClicks} total / ${totalLinks} links` : "Create links to track"}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
