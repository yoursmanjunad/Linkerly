"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Globe, 
  Smartphone, 
  BarChart3,
  Settings,
  Link as LinkIcon,
  Folder,
  MoreVertical,
  Copy,
  ExternalLink,
  Trash2,
  Edit3,
  QrCode,
  Loader2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImageToImageKit } from "@/lib/upload-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CollectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [editSettings, setEditSettings] = useState({
    name: "",
    description: "",
    isPublic: false,
    image: "",
    tags: [] as string[]
  });
  const [settingsImageFile, setSettingsImageFile] = useState<File | null>(null);
  const [settingsPreview, setSettingsPreview] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteCollection = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/collections/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Collection deleted successfully");
        router.push("/collections");
      } else {
        toast.error(data.message || "Failed to delete collection");
      }
    } catch (err) {
      toast.error("Error deleting collection");
    }
  };

  const handleShowQrCode = async () => {
    try {
      // Use the public collection URL
      const publicUrl = `${window.location.origin}/c/${collectionData.slug}`;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/url/qrcode?url=${encodeURIComponent(publicUrl)}`);
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

  const handleUpdateCollection = async () => {
    try {
      setIsSavingSettings(true);
      const token = localStorage.getItem("token");
      
      let finalImageUrl = editSettings.image;
      if (settingsImageFile) {
        try {
          finalImageUrl = await uploadImageToImageKit(settingsImageFile);
        } catch (err) {
          console.error("Image upload failed", err);
          toast.error("Failed to upload image");
          setIsSavingSettings(false);
          return;
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editSettings.name,
          description: editSettings.description,
          isPublic: editSettings.isPublic,
          image: finalImageUrl,
          tags: editSettings.tags
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Collection updated successfully");
        setCollectionData(data.data);
        setSettingsPreview(null);
        setSettingsImageFile(null);
      } else {
        toast.error(data.message || "Failed to update collection");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch details and analytics in parallel
        const [detailsRes, analyticsRes] = await Promise.all([
          fetch(`${API}/collections/${id}`, { headers }),
          fetch(`${API}/collections/${id}/analytics?period=30d`, { headers })
        ]);

        if (!detailsRes.ok) {
          const errorText = await detailsRes.text();
          console.error("Collection details error:", detailsRes.status, errorText);
          throw new Error("Failed to fetch collection details");
        }
        
        if (!analyticsRes.ok) {
          const errorText = await analyticsRes.text();
          console.error("Analytics error:", analyticsRes.status, errorText);
          // Don't throw - just continue without analytics
          console.warn("Continuing without analytics data");
        } else {
          const analytics = await analyticsRes.json();
          console.log("Analytics response:", analytics);
          if (analytics.success) setAnalyticsData(analytics.data);
        }

        const details = await detailsRes.json();
        if (details.success) {
          setCollectionData(details.data);
          setEditSettings({
            name: details.data.name,
            description: details.data.description || "",
            isPublic: details.data.isPublic,
            image: details.data.image || "",
            tags: details.data.tags || []
          });
          setSettingsPreview(details.data.image || null);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !collectionData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Error Loading Collection</h2>
        <p className="text-muted-foreground">{error || "Collection not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full -ml-2"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight truncate max-w-[300px] sm:max-w-md">
                    {collectionData.name}
                  </h1>
                  {collectionData.isPublic ? (
                    <Badge variant="default" className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20">Public</Badge>
                  ) : (
                    <Badge variant="secondary">Private</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Folder className="h-3.5 w-3.5" />
                  <span>{collectionData.links?.length || 0} links</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2">
              <div className="hidden md:flex items-center bg-muted/50 rounded-full px-4 py-1.5 border max-w-full overflow-hidden">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground mr-2 truncate">
                  {typeof window !== 'undefined' ? `${window.location.host}/c/${collectionData.slug}` : `/c/${collectionData.slug}`}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full hover:bg-background" 
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/c/${collectionData.slug}` : '';
                    navigator.clipboard.writeText(url);
                    toast.success("Collection link copied!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0" onClick={handleShowQrCode}>
                <QrCode className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-8">
          <TabsList className="bg-muted/50 p-1 rounded-xl border w-full grid grid-cols-3">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm">
              <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Links</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-8 animate-in fade-in-50 duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData?.summary?.totalClicks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all links
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData?.summary?.uniqueVisitors || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Created</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Date(collectionData.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(collectionData.createdAt).getFullYear()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Clicks/Link</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData?.summary?.averageClicksPerLink || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Chart */}
              <Card className="lg:col-span-2 border-primary/10 shadow-sm">
                <CardHeader>
                  <CardTitle>Collection Performance</CardTitle>
                  <CardDescription>Aggregated daily clicks over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData?.clicksByDate || []}>
                        <defs>
                          <linearGradient id="colorClicksCol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--background))", 
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="clicks" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorClicksCol)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Device Breakdown */}
              <Card className="border-primary/10 shadow-sm">
                <CardHeader>
                  <CardTitle>Devices</CardTitle>
                  <CardDescription>Traffic sources by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.deviceBreakdown && Object.entries(analyticsData.deviceBreakdown).map(([device, count]: [string, any]) => {
                      const total = analyticsData.summary.totalClicks || 1;
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={device} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize flex items-center gap-2">
                              {device === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                              {device}
                            </span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Links in Collection */}
            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>Most clicked URLs in this collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.topLinks && analyticsData.topLinks.slice(0, 5).map((link: any) => (
                    <div key={link.linkId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/urls/${link.linkId}`)}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-background rounded-full border">
                          <LinkIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-sm truncate">{link.urlDetails?.title || "Untitled Link"}</p>
                          <p className="text-xs text-muted-foreground truncate">{link.urlDetails?.shortUrl}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{link.clicks} clicks</Badge>
                    </div>
                  ))}
                  {(!analyticsData?.topLinks || analyticsData.topLinks.length === 0) && (
                      <div className="text-center text-muted-foreground py-8">No link data yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LINKS TAB */}
          <TabsContent value="links" className="animate-in fade-in-50 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectionData.links?.map((link: any) => (
                   <Card key={link._id} className="cursor-pointer hover:shadow-md transition-all group p-0 gap-0 overflow-hidden" onClick={() => router.push(`/urls/${link._id}`)}>
                      {link.image && (
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          <img
                            src={link.image}
                            alt={link.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                         <div className="flex items-start gap-3">
                            {!link.image && (
                              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                 <LinkIcon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                               <h4 className="font-medium truncate">{link.title || "Untitled"}</h4>
                               <p className="text-xs text-muted-foreground truncate">{link.longUrl}</p>
                               <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-[10px] h-5">{link.clickCount || 0} clicks</Badge>
                                  <span className="text-[10px] text-muted-foreground">{new Date(link.createdAt).toLocaleDateString()}</span>
                               </div>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                ))}
             </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="animate-in fade-in-50 duration-500">
            <div className="max-w-3xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Update your collection details and visibility.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Collection Image */}
                  <div className="space-y-2">
                    <Label>Collection Image</Label>
                    {settingsPreview ? (
                      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted/50">
                        <img 
                          src={settingsPreview} 
                          alt="Preview" 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg"
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setSettingsPreview(null)
                            setSettingsImageFile(null)
                            setEditSettings(prev => ({ ...prev, image: "" }))
                          }}
                        >
                          <span className="sr-only">Remove image</span>
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setSettingsImageFile(file)
                              setSettingsPreview(URL.createObjectURL(file))
                            }
                          }}
                          className="h-12 pt-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload a cover image for your collection
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Collection Name */}
                  <div className="space-y-2">
                    <Label htmlFor="collection-name">Collection Name</Label>
                    <Input
                      id="collection-name"
                      value={editSettings.name}
                      onChange={(e) => setEditSettings({ ...editSettings, name: e.target.value })}
                      placeholder="My Collection"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="collection-description">Description</Label>
                    <Textarea
                      id="collection-description"
                      value={editSettings.description}
                      onChange={(e) => setEditSettings({ ...editSettings, description: e.target.value })}
                      placeholder="Describe your collection..."
                      rows={4}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="collection-tags">Tags</Label>
                    <Input
                      id="collection-tags"
                      value={editSettings.tags.join(", ")}
                      onChange={(e) => setEditSettings({ ...editSettings, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                      placeholder="marketing, social, work (comma separated)"
                    />
                  </div>

                  {/* Public/Private Toggle */}
                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label className="text-base">Public Collection</Label>
                        {editSettings.isPublic ? (
                          <Globe className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {editSettings.isPublic
                          ? "Anyone can view this collection"
                          : "Only you can view this collection"}
                      </p>
                    </div>
                    <Switch
                      checked={editSettings.isPublic}
                      onCheckedChange={(checked) =>
                        setEditSettings({ ...editSettings, isPublic: checked })
                      }
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleUpdateCollection} disabled={isSavingSettings}>
                      {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for this collection.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Collection</p>
                      <p className="text-sm text-muted-foreground">Permanently remove this collection and all its data</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collection QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to view this collection.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 p-4">
            {qrCodeData && (
              <img src={qrCodeData} alt="Collection QR Code" className="w-48 h-48 border rounded-lg" />
            )}
            <Button variant="outline" onClick={() => {
               const link = document.createElement('a');
               link.href = qrCodeData || '';
               link.download = `collection-${collectionData.slug}-qr.png`;
               link.click();
            }}>
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCollection}
        title={`Delete "${collectionData.name}"?`}
        description="Are you sure you want to delete this collection? This action cannot be undone and will permanently remove the collection and all links within it."
      />
    </div>
  );
}
