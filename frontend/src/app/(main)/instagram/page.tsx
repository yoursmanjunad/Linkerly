"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Instagram, RefreshCw, ExternalLink, Calendar } from "lucide-react";

export default function InstagramBackupPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(true);
  const [backup, setBackup] = useState<any>(null);

  useEffect(() => {
    fetchBackup();
  }, []);

  const fetchBackup = () => {
    setLoading(true);
    fetch(`${API}/instagram/backup`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => setBackup(data))
      .catch(() => setBackup(null))
      .finally(() => setLoading(false));
  };

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API}/instagram/auth`, { credentials: "include" });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error("Failed to initiate Instagram auth");
      }
    } catch (e) {
      toast.error("Error connecting to Instagram");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!backup) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-6 px-4">
        <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-4 rounded-full text-white shadow-lg">
          <Instagram size={48} />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Instagram Backup</h1>
          <p className="text-muted-foreground">
            Connect your Instagram account to automatically backup your photos, videos, and profile data. 
            Never lose your precious memories.
          </p>
        </div>
        <Button size="lg" onClick={handleConnect} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 border-0">
          <Instagram className="mr-2 h-5 w-5" />
          Connect Instagram
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px] rounded-full">
             <div className="bg-background rounded-full p-1">
                {/* We don't have the profile pic url in the backup model currently, just username. 
                    If we want it, we should add it to the model. For now, use a placeholder or just username initial. */}
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
                    {backup.username[0].toUpperCase()}
                </div>
             </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">@{backup.username}</h1>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <Calendar className="h-3 w-3" />
              <span>Last backup: {new Date(backup.lastBackupAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleConnect}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
            </Button>
            <Button variant="ghost" asChild>
                <a href={`https://instagram.com/${backup.username}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                </a>
            </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
              <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{backup.media?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Total Media Items</p>
              </CardContent>
          </Card>
          {/* Add more stats if available later */}
      </div>

      {/* Media Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Media Gallery</h2>
        {backup.media && backup.media.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {backup.media.map((item: any) => (
                <div key={item.id} className="group relative aspect-square bg-muted rounded-lg overflow-hidden border">
                    {item.media_type === "VIDEO" ? (
                        <video 
                            src={item.media_url} 
                            className="w-full h-full object-cover"
                            poster={item.thumbnail_url}
                        />
                    ) : (
                        <img 
                            src={item.media_url} 
                            alt={item.caption || "Instagram Media"} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                        <p className="text-xs line-clamp-2 mb-2">{item.caption}</p>
                        <div className="flex justify-between items-center text-xs text-gray-300">
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            <a href={item.permalink} target="_blank" rel="noreferrer" className="hover:text-white">
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-12 text-muted-foreground">
                No media items found in this backup.
            </div>
        )}
      </div>
    </div>
  );
}
