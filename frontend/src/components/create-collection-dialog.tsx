"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Loader2, Plus, Folder, Globe, Lock } from "lucide-react"



interface CreateCollectionDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateCollectionDialog({ trigger, onSuccess, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreateCollectionDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // State for uncategorized URLs
  const [uncategorizedUrls, setUncategorizedUrls] = useState<any[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [loadingUrls, setLoadingUrls] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
    password: "",
    tags: "",
    image: ""
  })

  // Fetch uncategorized URLs when dialog opens
  useEffect(() => {
    if (open) {
      fetchUncategorizedUrls()
    }
  }, [open])

  const fetchUncategorizedUrls = async () => {
    try {
      setLoadingUrls(true)
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/url/user/links?collection=null&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setUncategorizedUrls(data.data.urls || [])
      }
    } catch (error) {
      console.error("Failed to fetch urls", error)
    } finally {
      setLoadingUrls(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      // Dynamically import to avoid server-side issues if any, though this is a client component
      const { uploadImageToImageKit } = await import("@/lib/upload-kit")
      const url = await uploadImageToImageKit(file)
      if (url) {
        setFormData(prev => ({ ...prev, image: url }))
        toast.success("Image uploaded successfully")
      }
    } catch (error) {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const toggleUrlSelection = (urlId: string) => {
    setSelectedUrls(prev => 
      prev.includes(urlId) 
        ? prev.filter(id => id !== urlId)
        : [...prev, urlId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      
      // 1. Create Collection
      const payload = {
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
        password: formData.password,
        image: formData.image,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to create collection")
      }

      const newCollectionId = data.data._id

      // 2. Import selected URLs if any
      if (selectedUrls.length > 0) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections/${newCollectionId}/urls/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ urlIds: selectedUrls })
        })
      }

      toast.success("Collection created successfully")
      setOpen(false)
      setFormData({
        name: "",
        description: "",
        isPublic: false,
        password: "",
        tags: "",
        image: ""
      })
      setSelectedUrls([])
      router.refresh()
      onSuccess?.()

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Organize your links into a new collection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 sm:gap-6 py-4 grid-cols-1 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="flex flex-col gap-2">
                <Label>Collection Image</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Folder className="h-8 w-8 text-muted-foreground/50" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a cover image for your collection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Marketing Campaign"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add some details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-32"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-base">Public Collection</Label>
                    {formData.isPublic ? (
                      <Globe className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.isPublic
                      ? "Anyone can view this collection."
                      : "Only you can view this collection."}
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublic: checked })
                  }
                />
              </div>

              {formData.isPublic && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="password">Password Protection (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Set a password for public access"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unrestricted public access.
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="marketing, social (comma separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              {/* Import Uncategorized URLs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Import Uncategorized URLs ({selectedUrls.length} selected)</Label>
                  {uncategorizedUrls.length > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (selectedUrls.length === uncategorizedUrls.length) {
                          setSelectedUrls([])
                        } else {
                          setSelectedUrls(uncategorizedUrls.map(u => u._id))
                        }
                      }}
                    >
                      {selectedUrls.length === uncategorizedUrls.length ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>
                
                <div className="border rounded-md p-2 space-y-1 bg-muted/10 max-h-[200px] overflow-y-auto">
                  {loadingUrls ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : uncategorizedUrls.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No uncategorized URLs found.
                    </p>
                  ) : (
                    uncategorizedUrls.map((url) => (
                      <div 
                        key={url._id} 
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedUrls.includes(url._id) ? "bg-primary/10" : "hover:bg-muted"
                        }`}
                        onClick={() => toggleUrlSelection(url._id)}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedUrls.includes(url._id) ? "bg-primary border-primary" : "border-muted-foreground"
                        }`}>
                          {selectedUrls.includes(url._id) && <Plus className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{url.title || url.shortUrl}</p>
                          <p className="text-xs text-muted-foreground truncate">{url.longUrl}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Collection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
