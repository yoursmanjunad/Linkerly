"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Loader2, 
  Link as LinkIcon, 
  Wand2, 
  Settings2, 
  Calendar as CalendarIcon,
  QrCode,
  Lock,
  Tag,
  FileText,
  Globe,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { uploadImageToImageKit } from "@/lib/upload-kit";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Collection {
  _id: string;
  name: string;
}

export default function CreateUrlPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(true); // Default open for better UX on this page
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkUrls, setBulkUrls] = useState("");

  const [formData, setFormData] = useState({
    longUrl: "",
    customShortUrl: "",
    title: "",
    description: "",
    image: "",
    collection: "",
    password: "",
    expiry: undefined as Date | undefined,
    tags: "",
    notes: "",
    generateQR: false
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCollections(data.data.collections);
      }
    } catch (error) {
      console.error("Failed to fetch collections", error);
    }
  };

  const fetchMetadata = async () => {
    if (!formData.longUrl) {
      toast.error("Please enter a URL first");
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.longUrl);
    } catch {
      toast.error("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setMetaLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/url/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: formData.longUrl })
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          title: data.data.title || prev.title,
          description: data.data.description || prev.description,
          image: data.data.image || prev.image
        }));
        if (data.data.image) {
          setPreview(data.data.image);
          setImageFile(null);
        }
        toast.success("Metadata fetched successfully");
      } else {
        toast.error("Could not fetch metadata");
      }
    } catch (error) {
      console.error("Metadata fetch error:", error);
      toast.error("Failed to fetch metadata");
    } finally {
      setMetaLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (mode === "bulk") {
        const urls = bulkUrls.split("\n").map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) {
          toast.error("Please enter at least one URL");
          setLoading(false);
          return;
        }

        const payload: any = {
          urls,
          tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : []
        };
        
        if (formData.collection && formData.collection !== "none") {
          payload.collection = formData.collection;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/url/shorten/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
          toast.success(`Successfully created ${data.data.count} URLs`);
          if (data.data.errors) {
            console.error("Bulk creation errors:", data.data.errors);
            toast.warning(`Some URLs failed to create. Check console for details.`);
          }
          router.push("/urls");
        } else {
          throw new Error(data.message || "Failed to create URLs");
        }
      } else {
        // Single URL creation
        let finalImageUrl = formData.image;
        if (imageFile) {
          try {
            finalImageUrl = await uploadImageToImageKit(imageFile);
          } catch (err) {
            console.error("Image upload failed", err);
            toast.error("Failed to upload image");
            setLoading(false);
            return;
          }
        }
        
        const payload: any = {
          longUrl: formData.longUrl,
          generateQR: formData.generateQR
        };

        if (formData.customShortUrl) payload.customShortUrl = formData.customShortUrl;
        if (formData.title) payload.title = formData.title;
        if (formData.description) payload.description = formData.description;
        if (finalImageUrl) payload.image = finalImageUrl;
        if (formData.collection && formData.collection !== "none") payload.collection = formData.collection;
        if (formData.password) payload.password = formData.password;
        if (formData.expiry) payload.expiry = formData.expiry;
        if (formData.tags) payload.tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
        if (formData.notes) payload.notes = formData.notes;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/url/shorten`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
          toast.success("URL shortened successfully");
          router.push("/urls");
        } else {
          throw new Error(data.message || "Failed to shorten URL");
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Create New Link</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "bulk")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="single">Single URL</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Creation</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-8">
              {/* Main URL Input Section */}
              <Card className="border-primary/20 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    Destination URL
                  </CardTitle>
                  <CardDescription>
                    Enter the long URL you want to shorten. We'll try to fetch details automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/very/long/url/that/needs/shortening"
                      value={formData.longUrl}
                      onChange={(e) => setFormData({ ...formData, longUrl: e.target.value })}
                      className="h-12 text-lg"
                      required={mode === "single"}
                      autoFocus
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="h-12 px-6"
                      onClick={fetchMetadata}
                      disabled={metaLoading || !formData.longUrl}
                    >
                      {metaLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Fetch Meta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-8">
              <Card className="border-primary/20 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    Bulk URLs
                  </CardTitle>
                  <CardDescription>
                    Enter multiple URLs, one per line. Max 50 URLs at once.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="https://example.com/link1&#10;https://example.com/link2&#10;https://example.com/link3"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    className="min-h-[200px] font-mono"
                    required={mode === "bulk"}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {bulkUrls.split("\n").filter(Boolean).length} URLs entered
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Metadata & Details */}
            <div className={cn("lg:col-span-2 space-y-6", mode === "bulk" && "hidden lg:block lg:opacity-50 lg:pointer-events-none")}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Link Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Control */}
                  <div className="space-y-2 mb-6">
                    <Label>Image</Label>
                    {preview ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted/50">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setPreview(null);
                            setImageFile(null);
                            setFormData(prev => ({ ...prev, image: "" }));
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
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageFile(file);
                              setPreview(URL.createObjectURL(file));
                              setFormData(prev => ({ ...prev, image: "" }));
                            }
                          }}
                          className="h-12 pt-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload an image to display with this link
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. My Awesome Project"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of where this link goes..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>


                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card>
                <CardHeader className="cursor-pointer select-none" onClick={() => setShowAdvanced(!showAdvanced)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings2 className="h-4 w-4" />
                      Advanced Settings
                    </CardTitle>
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {showAdvanced && (
                  <CardContent className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password Protection</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Optional password"
                            className="pl-9"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Expiration Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.expiry && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.expiry ? format(formData.expiry, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.expiry}
                              onSelect={(date) => setFormData({ ...formData, expiry: date })}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="tags"
                          placeholder="marketing, social, promo (comma separated)"
                          className="pl-9"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Private Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Internal notes for your team..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                  </CardContent>
                )}
              </Card>
            </div>

            {/* Right Column: Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="customShortUrl">Custom Alias</Label>
                    <div className="flex items-center">
                      <div className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground">
                        /
                      </div>
                      <Input
                        id="customShortUrl"
                        placeholder="my-link"
                        className="rounded-l-none"
                        value={formData.customShortUrl}
                        onChange={(e) => setFormData({ ...formData, customShortUrl: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave empty for auto-generated alias
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Collection</Label>
                    <Select
                      value={formData.collection}
                      onValueChange={(value) => setFormData({ ...formData, collection: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select collection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {collections.map((col) => (
                          <SelectItem key={col._id} value={col._id}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        QR Code
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Generate QR code
                      </p>
                    </div>
                    <Switch
                      checked={formData.generateQR}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, generateQR: checked })
                      }
                    />
                  </div>

                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full h-11 text-lg" 
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Short Link"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
