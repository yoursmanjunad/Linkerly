"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Link as LinkIcon, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Link2, 
  Sparkles, 
  MoreVertical, 
  FolderInput,
  Check,
  BarChart3,
  QrCode,
  Calendar,
  MousePointer2,
  Download,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { UrlImagePlaceholder } from "@/components/url-image-placeholder";

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

interface Url {
  _id: string;
  title: string;
  longUrl: string;
  shortUrl: string;
  image?: string;
  collection?: {
    _id: string;
    name: string;
    color?: string;
  } | null;
  createdAt: string;
  clickCount?: number;
}

interface Collection {
  _id: string;
  name: string;
  color?: string;
}

interface GroupedUrls {
  id: string;
  name: string;
  urls: Url[];
  isCollection: boolean;
}

export default function UrlsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupedUrls[]>([]);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // QR Code State
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [currentQrUrl, setCurrentQrUrl] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError("Please login to view URLs");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch URLs and Collections in parallel
      const [urlsRes, colsRes] = await Promise.all([
        fetch(`${API}/url/user/links?limit=1000`, { headers }),
        fetch(`${API}/collections?limit=100`, { headers })
      ]);

      if (!urlsRes.ok || !colsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const urlsData = await urlsRes.json();
      const colsData = await colsRes.json();

      if (urlsData.success && colsData.success) {
        const urls: Url[] = urlsData.data?.urls || [];
        const collections: Collection[] = colsData.data?.collections || [];
        
        setAllCollections(collections);
        processGroups(urls, collections);
      } else {
        throw new Error(urlsData.message || colsData.message || "Failed to load data");
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const processGroups = (urls: Url[], collections: Collection[]) => {
    // 1. Initialize groups with "Uncategorized"
    const uncategorized: GroupedUrls = {
      id: "uncategorized",
      name: "Uncategorized",
      urls: [],
      isCollection: false
    };

    // 2. Create a map for collection groups
    const colGroupsMap = new Map<string, GroupedUrls>();
    collections.forEach(col => {
      colGroupsMap.set(col._id, {
        id: col._id,
        name: col.name,
        urls: [],
        isCollection: true
      });
    });

    // 3. Distribute URLs
    urls.forEach(url => {
      if (url.collection && url.collection._id && colGroupsMap.has(url.collection._id)) {
        colGroupsMap.get(url.collection._id)!.urls.push(url);
      } else {
        uncategorized.urls.push(url);
      }
    });

    // 4. Convert map to array and filter out empty collections if desired (or keep them)
    const colGroups = Array.from(colGroupsMap.values()).filter(g => g.urls.length > 0);
    
    const finalGroups: GroupedUrls[] = [];
    if (uncategorized.urls.length > 0) finalGroups.push(uncategorized);
    finalGroups.push(...colGroups);

    setGroups(finalGroups);
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  const handleMoveUrl = async (urlId: string, targetCollectionId: string | null) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API}/url/update/${urlId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collection: targetCollectionId
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("URL moved successfully");
        // Refresh data to update UI
        fetchData(); 
      } else {
        throw new Error(data.message || "Failed to move URL");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleShowQrCode = async (url: Url) => {
    try {
      const fullShortUrl = `${window.location.origin}/${url.shortUrl}`;
      setCurrentQrUrl(fullShortUrl);
      
      const res = await fetch(`${API}/url/qrcode?url=${encodeURIComponent(fullShortUrl)}`);
      const data = await res.json();
      
      if (data.success) {
        setQrCodeData(data.data);
        setShowQrDialog(true);
      } else {
        toast.error("Failed to generate QR code");
      }
    } catch (err) {
      toast.error("Error generating QR code");
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeData) return;
    const link = document.createElement("a");
    link.href = qrCodeData;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} className="h-64 w-full rounded-3xl" />
                    ))}
                </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Error Loading URLs</h2>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <LinkIcon className="h-6 w-6" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">My URLs</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl ml-14">
              Manage, track, and share your shortened links.
            </p>
          </div>
          <Button 
            size="lg" 
            className="gap-2 shadow-lg hover:shadow-xl transition-all rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push("/urls/create")}
          >
            <Sparkles className="h-4 w-4" />
            Create URL
          </Button>
        </div>

        {/* Category Chips Navigation */}
        {groups.length > 0 && (
          <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/60" />
            <div className="relative px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full h-8 px-5 text-sm font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  All
                </Button>
                
                <div className="w-px h-5 bg-border mx-1 shrink-0" />
                
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    variant="secondary"
                    size="sm"
                    className="rounded-full h-8 px-4 text-sm font-medium bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-border hover:border-primary/20 transition-all duration-200 shrink-0 group"
                    onClick={() => {
                      const element = document.getElementById(`group-${group.id}`);
                      if (element) {
                        const offset = 120;
                        const elementPosition = element.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - offset;
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: "smooth"
                        });
                      }
                    }}
                  >
                    {group.name}
                    <span className="ml-2 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full group-hover:bg-primary/20 transition-colors">
                      {group.urls.length}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {groups.length > 0 ? (
          <div className="space-y-12">
            {groups.map((group) => (
              <div key={group.id} id={`group-${group.id}`} className="space-y-6 scroll-mt-24">
                <div className="flex items-center gap-3 border-b border-border pb-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">{group.name}</h2>
                    <span className="text-sm text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shadow-sm">
                        {group.urls.length} links
                    </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {group.urls.map((url, index) => (
                    <div
                      key={`${url._id}-${index}`}
                      className="group relative"
                    >
                      <Card 
                        className="overflow-hidden border border-border bg-card hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer rounded-2xl h-full flex flex-col p-0 gap-0"
                        onClick={() => router.push(`/urls/${url._id}`)}
                      >
                        {/* Image Section */}
                        <div className="relative h-44 bg-muted overflow-hidden">
                          {url.image ? (
                            <img
                              src={url.image}
                              alt={url.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <UrlImagePlaceholder title={url.title} />
                          )}
                          
                          {/* Overlay Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Top Right Actions (Visible on Hover) */}
                          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                             <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground shadow-sm transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/${url.shortUrl}`
                                  );
                                  toast.success("Copied to clipboard!");
                                }}
                                title="Copy Link"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground shadow-sm transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`${window.location.origin}/${url.shortUrl}`);
                                }}
                                title="Open Link"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                          </div>
                        </div>

                        <CardContent className="p-5 flex-1 flex flex-col gap-4">
                          {/* Title & Date */}
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1">
                                <h3 className="font-bold text-lg leading-tight line-clamp-1 text-foreground group-hover:text-primary transition-colors" title={url.title}>
                                {url.title || "Untitled URL"}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(url.createdAt)}
                            </div>
                          </div>

                          {/* URL Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                                <LinkIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="text-sm font-medium text-primary truncate">
                                    /{url.shortUrl}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 truncate px-1">
                              {url.longUrl}
                            </p>
                          </div>

                          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                             {/* Stats */}
                             <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MousePointer2 className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-medium text-primary">{url.clickCount || 0} clicks</span>
                             </div>

                             {/* Bottom Actions */}
                             <div className="flex items-center gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/urls/${url._id}?tab=settings`);
                                        }}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit URL
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/urls/${url._id}?tab=analytics`);
                                        }}>
                                            <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <FolderInput className="mr-2 h-4 w-4" /> Move to Collection
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMoveUrl(url._id, null);
                                                    }}
                                                    disabled={!url.collection}
                                                >
                                                    <span className={!url.collection ? "font-medium text-primary" : ""}>Uncategorized</span>
                                                    {!url.collection && <Check className="ml-auto h-4 w-4 text-primary" />}
                                                </DropdownMenuItem>
                                                {allCollections.map(col => (
                                                    <DropdownMenuItem 
                                                        key={col._id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMoveUrl(url._id, col._id);
                                                        }}
                                                        disabled={url.collection?._id === col._id}
                                                    >
                                                        <span className={url.collection?._id === col._id ? "font-medium text-primary" : ""}>
                                                            {col.name}
                                                        </span>
                                                        {url.collection?._id === col._id && <Check className="ml-auto h-4 w-4 text-primary" />}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleShowQrCode(url);
                                        }}>
                                            <QrCode className="mr-2 h-4 w-4" /> QR Code
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-3xl border border-border shadow-sm">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <LinkIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No URLs yet</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
              Create your first short link to start tracking and sharing.
            </p>
            <Button 
              size="lg" 
              className="gap-2 rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => router.push("/urls/create")}
            >
              <Sparkles className="h-4 w-4" />
              Create URL
            </Button>
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-6">
            {qrCodeData ? (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/50 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-card p-4 rounded-xl border border-border shadow-sm">
                  <img src={qrCodeData} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 bg-muted rounded-xl animate-pulse" />
            )}
            
            <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground break-all px-4">
                    {currentQrUrl}
                </p>
                <p className="text-xs text-muted-foreground">
                    Scan to visit this link
                </p>
            </div>

            <div className="flex gap-3 w-full">
                <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => {
                        if (currentQrUrl) {
                            navigator.clipboard.writeText(currentQrUrl);
                            toast.success("Link copied!");
                        }
                    }}
                >
                    <Copy className="h-4 w-4" />
                    Copy Link
                </Button>
                <Button 
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={downloadQrCode}
                >
                    <Download className="h-4 w-4" />
                    Download
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
