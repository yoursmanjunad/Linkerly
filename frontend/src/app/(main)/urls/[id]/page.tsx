"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  Globe, 
  Lock, 
  Settings, 
  Trash2, 
  Edit3, 
  X, 
  Upload, 
  ImageIcon,
  QrCode,
  FolderInput,
  Check,
  Download,
  Calendar,
  MousePointer2,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function UrlDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";

  const [loading, setLoading] = useState(true);
  const [urlData, setUrlData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [allCollections, setAllCollections] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // QR Code State
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const [detailsRes, analyticsRes, collectionsRes] = await Promise.all([
          fetch(`${API}/url/details/${id}`, { headers }),
          fetch(`${API}/url/analytics/${id}?period=30d`, { headers }),
          fetch(`${API}/collections?limit=100`, { headers })
        ]);
        
        if (!detailsRes.ok) throw new Error("Failed to fetch URL details");
        if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");
        
        const details = await detailsRes.json();
        const analytics = await analyticsRes.json();
        const collections = await collectionsRes.json();
        
        if (details.success) setUrlData(details.data);
        if (analytics.success) setAnalyticsData(analytics.data);
        if (collections.success) setAllCollections(collections.data?.collections || []);
        
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

  const handleMoveUrl = async (targetCollectionId: string | null) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/url/update/${id}`, {
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
        setUrlData({ ...urlData, collection: targetCollectionId ? allCollections.find(c => c._id === targetCollectionId) : null });
        toast.success("URL moved successfully");
      } else {
        throw new Error(data.message || "Failed to move URL");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleShowQrCode = async () => {
    try {
      if (urlData.qrCodeUrl) {
        setQrCodeData(urlData.qrCodeUrl);
        setShowQrDialog(true);
        return;
      }

      const fullShortUrl = `${window.location.origin}/${urlData.shortUrl}`;
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
    link.download = `qrcode-${urlData.shortUrl}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
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

  if (error || !urlData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background">
        <div className="bg-destructive/10 p-4 rounded-full">
          <X className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Error Loading URL</h2>
        <p className="text-muted-foreground">{error || "URL not found"}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-md" title={urlData.title}>
                    {urlData.title || "Untitled Link"}
                  </h1>
                  {urlData.isActive ? (
                    <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-none">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Globe className="h-3.5 w-3.5" />
                  <a href={urlData.longUrl} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline truncate max-w-[300px] transition-colors">
                    {urlData.longUrl}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="hidden sm:flex items-center bg-muted/50 rounded-full px-4 py-1.5 border border-border">
                <span className="text-sm font-medium text-muted-foreground mr-2">
                  {window.location.host}/{urlData.shortUrl}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-background hover:text-primary" onClick={() => copyToClipboard(`${window.location.origin}/${urlData.shortUrl}`)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <Button variant="outline" size="icon" onClick={handleShowQrCode} title="QR Code">
                <QrCode className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title="Move to Collection">
                    <FolderInput className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Move to Collection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleMoveUrl(null)}
                    disabled={!urlData.collection}
                  >
                    <span className={!urlData.collection ? "font-medium text-primary" : ""}>Uncategorized</span>
                    {!urlData.collection && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                  {allCollections.map((col: any) => (
                    <DropdownMenuItem 
                      key={col._id}
                      onClick={() => handleMoveUrl(col._id)}
                      disabled={urlData.collection?._id === col._id}
                    >
                      <span className={urlData.collection?._id === col._id ? "font-medium text-primary" : ""}>
                        {col.name}
                      </span>
                      {urlData.collection?._id === col._id && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={() => window.open(`${window.location.origin}/${urlData.shortUrl}`, "_blank")} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"> 
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-card border border-border p-1 rounded-xl shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <Edit3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <Globe className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="animate-in fade-in-50 duration-500 space-y-6">
            <UrlOverview urlData={urlData} />
          </TabsContent>
          
          <TabsContent value="analytics" className="animate-in fade-in-50 duration-500 space-y-6">
            <UrlAnalytics analyticsData={analyticsData} />
          </TabsContent>
          
          <TabsContent value="settings" className="animate-in fade-in-50 duration-500 space-y-6">
            <UrlSettings urlData={urlData} setUrlData={setUrlData} router={router} />
          </TabsContent>
        </Tabs>
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
                  {window.location.origin}/{urlData.shortUrl}
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
                        navigator.clipboard.writeText(`${window.location.origin}/${urlData.shortUrl}`);
                        toast.success("Link copied!");
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

// ------------------- UrlSettings Component -------------------
function UrlSettings({ urlData, setUrlData, router }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: urlData.title || "",
    description: urlData.description || "",
    longUrl: urlData.longUrl || "",
    image: urlData.image || "",
  });
  const [hasPassword, setHasPassword] = useState(!!urlData.password);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState(urlData.expiry ? new Date(urlData.expiry).toISOString().slice(0, 16) : "");
  const [tags, setTags] = useState<string[]>(urlData.tags || []);
  const [newTag, setNewTag] = useState("");
  const [notes, setNotes] = useState(urlData.notes || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info("Uploading image...");
      const sigRes = await fetch(`${API}/upload/signature`);
      const sigData = await sigRes.json();
      if (!sigData.token) throw new Error("Failed to get upload signature");
      const form = new FormData();
      form.append("file", file);
      form.append("fileName", file.name);
      form.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "");
      form.append("signature", sigData.signature);
      form.append("expire", sigData.expire);
      form.append("token", sigData.token);
      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (uploadData.url) {
        setFormData({ ...formData, image: uploadData.url });
        toast.success("Image uploaded! Don't forget to save changes.");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    }
  };

  const handleSaveBasicInfo = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/url/update/${urlData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setUrlData(data.data);
        toast.success("URL updated successfully!");
        setIsEditing(false);
      } else {
        toast.error(data.message || "Failed to update URL");
      }
    } catch (err) {
      toast.error("Error updating URL");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordToggle = async () => {
    if (hasPassword && !password) {
      // remove password
      try {
        setIsSaving(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/url/update/${urlData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ password: null }),
        });
        const data = await res.json();
        if (data.success) {
          setUrlData(data.data);
          toast.success("Password removed!");
          setHasPassword(false);
        }
      } catch (err) {
        toast.error("Error removing password");
      } finally {
        setIsSaving(false);
      }
    } else {
      setHasPassword(!hasPassword);
    }
  };

  const handlePasswordSave = async () => {
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/url/update/${urlData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setUrlData(data.data);
        toast.success("Password set successfully!");
        setPassword("");
      } else {
        toast.error(data.message || "Failed to set password");
      }
    } catch (err) {
      toast.error("Error setting password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpiryUpdate = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/url/update/${urlData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ expiry: expiry || null }),
      });
      const data = await res.json();
      if (data.success) {
        setUrlData(data.data);
        toast.success(expiry ? "Expiry date set!" : "Expiry date removed!");
      } else {
        toast.error(data.message || "Failed to update expiry");
      }
    } catch (err) {
      toast.error("Error updating expiry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSaveTagsAndNotes = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/url/update/${urlData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tags, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setUrlData(data.data);
        toast.success("Settings saved!");
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/url/delete/${urlData._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("URL deleted successfully!");
        router.push("/urls");
      } else {
        toast.error(data.message || "Failed to delete URL");
      }
    } catch (err) {
      toast.error("Error deleting URL");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Basic Information Card */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Basic Information</CardTitle>
          <CardDescription>Edit title, description and destination URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter title" className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longUrl">Destination URL</Label>
              <Input id="longUrl" value={formData.longUrl} onChange={(e) => setFormData({ ...formData, longUrl: e.target.value })} placeholder="https://example.com" className="bg-muted/30 border-border" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" rows={3} className="bg-muted/30 border-border" />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-border hover:bg-muted">
                <Upload className="h-4 w-4 mr-2" />
                {formData.image ? "Change Image" : "Upload Image"}
              </Button>
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
              {formData.image && (
                <img src={formData.image} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-border" />
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button onClick={handleSaveBasicInfo} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Security</CardTitle>
          <CardDescription>Enable password protection for this URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border">
            <Switch id="password-protect" checked={hasPassword} onCheckedChange={handlePasswordToggle} />
            <Label htmlFor="password-protect" className="font-medium cursor-pointer">Password Protect</Label>
          </div>
          {hasPassword && (
            <div className="grid gap-4 p-4 border border-border rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label htmlFor="password">Set Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" />
              </div>
              <Button onClick={handlePasswordSave} disabled={isSaving} className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSaving ? "Saving..." : "Save Password"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Options Card */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Additional Options</CardTitle>
          <CardDescription>Set expiry date, tags, and private notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[2.5rem] p-2 bg-muted/30 rounded-lg border border-border">
                {tags.length > 0 ? tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-card border border-border">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                )) : <span className="text-sm text-muted-foreground">No tags added</span>}
              </div>
              <div className="flex space-x-2">
                <Input placeholder="New tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} className="bg-muted/30 border-border" />
                <Button onClick={handleAddTag} variant="secondary">Add</Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Private Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add private notes..." className="bg-muted/30 border-border" />
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button onClick={handleSaveTagsAndNotes} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-destructive/80">Permanently delete this URL and all its analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="bg-destructive hover:bg-destructive/90">
            Delete URL Permanently
          </Button>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={`Delete "${urlData.title || 'this URL'}"?`}
        description="Are you sure you want to delete this URL? This action cannot be undone and will permanently remove the URL and all associated analytics data."
      />
    </div>
  );
}

// ------------------- UrlOverview Component -------------------
function UrlOverview({ urlData }: any) {
  const SHORT_BASE = process.env.NEXT_PUBLIC_SHORT_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const shortLink = `${SHORT_BASE}/${urlData.customShortUrl || urlData.shortUrl}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      <Card className="border-border shadow-sm h-full bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Link Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Short Link</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-primary/5 rounded-lg border border-primary/10 text-primary font-medium truncate">
                {shortLink}
              </div>
              <Button size="icon" variant="outline" className="shrink-0 hover:bg-primary/10 hover:text-primary" onClick={() => {
                navigator.clipboard.writeText(shortLink);
                toast.success("Copied!");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Destination URL</Label>
            <div className="p-3 bg-muted/30 rounded-lg border border-border text-foreground break-all text-sm">
              {urlData.longUrl}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Created</Label>
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{new Date(urlData.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {urlData.expiry && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Expires</Label>
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{new Date(urlData.expiry).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border shadow-sm bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-primary-foreground/90">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-primary-foreground/80">Total Clicks</Label>
                <p className="text-4xl font-bold mt-1">{urlData.clickCount || 0}</p>
              </div>
              <div>
                <Label className="text-primary-foreground/80">Unique Visitors</Label>
                <p className="text-4xl font-bold mt-1">{urlData.uniqueVisitors || 0}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-primary-foreground/10 flex justify-between items-center">
              <div>
                <Label className="text-primary-foreground/80 text-xs">Last Clicked</Label>
                <p className="text-sm font-medium mt-1">
                  {urlData.analytics?.lastClickedAt 
                    ? new Date(urlData.analytics.lastClickedAt).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <Badge className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0">
                {urlData.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {urlData.image && (
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Preview Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img src={urlData.image} alt={urlData.title} className="w-full h-48 object-cover rounded-lg border border-border" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ------------------- UrlAnalytics Component -------------------
function UrlAnalytics({ analyticsData }: any) {
  if (!analyticsData || !analyticsData.summary) {
    return (
      <Card className="border-border shadow-sm bg-card">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Globe className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            This URL hasn't received any clicks yet. Share it to start collecting analytics data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary, deviceBreakdown, topCountries, topReferrers } = analyticsData;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{summary.totalClicks || 0}</p>
              <MousePointer2 className="h-4 w-4 text-chart-1" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{summary.uniqueVisitors || 0}</p>
              <Globe className="h-4 w-4 text-chart-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Daily Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{summary.averageClicksPerDay || 0}</p>
              <Calendar className="h-4 w-4 text-chart-3" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${summary.clickGrowth >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                {summary.clickGrowth > 0 ? '+' : ''}{summary.clickGrowth}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <Card className="border-border shadow-sm lg:col-span-1 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">Mobile</span>
                </div>
                <span className="font-bold text-foreground">{deviceBreakdown?.mobile || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">Desktop</span>
                </div>
                <span className="font-bold text-foreground">{deviceBreakdown?.desktop || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Tablet className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">Tablet</span>
                </div>
                <span className="font-bold text-foreground">{deviceBreakdown?.tablet || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card className="border-border shadow-sm lg:col-span-1 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            {topCountries && Object.keys(topCountries).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(topCountries).slice(0, 5).map(([country, count]: [string, any], i) => (
                  <div key={country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                      <span className="text-sm font-medium text-foreground">{country}</span>
                    </div>
                    <Badge variant="secondary" className="bg-chart-1/10 text-chart-1 hover:bg-chart-1/20">{count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No country data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card className="border-border shadow-sm lg:col-span-1 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            {topReferrers && Object.keys(topReferrers).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(topReferrers).slice(0, 5).map(([referrer, count]: [string, any], i) => (
                  <div key={referrer} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                      <span className="text-sm font-medium text-foreground truncate" title={referrer}>{referrer}</span>
                    </div>
                    <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 shrink-0">{count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ExternalLink className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No referrer data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
