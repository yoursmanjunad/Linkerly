"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Loader2, Plus, Calendar as CalendarIcon, ChevronDown, ChevronUp, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadImageToImageKit } from "@/lib/upload-kit"

interface Collection {
  _id: string
  name: string
}

interface CreateUrlDialogProps {
  trigger?: React.ReactNode
  defaultCollectionId?: string
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateUrlDialog({ trigger, defaultCollectionId, onSuccess, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreateUrlDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  
  const [formData, setFormData] = useState({
    longUrl: "",
    customShortUrl: "",
    title: "",
    description: "",
    collection: defaultCollectionId || "",
    password: "",
    expiry: undefined as Date | undefined,
    tags: "",
    notes: "",
    generateQR: false,
    image: ""
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchCollections()
    }
  }, [open])

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setCollections(data.data.collections)
      }
    } catch (error) {
      console.error("Failed to fetch collections", error)
    }
  }

  const fetchMetadata = async () => {
    if (!formData.longUrl) {
      toast.error("Please enter a URL first")
      return
    }

    try {
      new URL(formData.longUrl)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    setMetaLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/url/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: formData.longUrl })
      })

      const data = await res.json()
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          title: data.data.title || prev.title,
          description: data.data.description || prev.description,
          image: data.data.image || prev.image
        }))
        if (data.data.image) {
          setPreview(data.data.image)
          setImageFile(null)
        }
        toast.success("Metadata fetched")
      } else {
        toast.error("Could not fetch metadata")
      }
    } catch (error) {
      console.error("Metadata fetch error:", error)
      toast.error("Failed to fetch metadata")
    } finally {
      setMetaLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      
      let finalImageUrl = formData.image
      if (imageFile) {
        try {
          finalImageUrl = await uploadImageToImageKit(imageFile)
        } catch (err) {
          console.error("Image upload failed", err)
          toast.error("Failed to upload image")
          setLoading(false)
          return
        }
      }

      // Prepare payload
      const payload: any = {
        longUrl: formData.longUrl,
        generateQR: formData.generateQR
      }
      
      if (finalImageUrl) payload.image = finalImageUrl

      if (formData.customShortUrl) payload.customShortUrl = formData.customShortUrl
      if (formData.title) payload.title = formData.title
      if (formData.description) payload.description = formData.description
      if (formData.collection && formData.collection !== "none") payload.collection = formData.collection
      if (formData.password) payload.password = formData.password
      if (formData.expiry) payload.expiry = formData.expiry
      if (formData.tags) payload.tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean)
      if (formData.notes) payload.notes = formData.notes

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/url/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success("URL shortened successfully")
        setOpen(false)
        setFormData({
          longUrl: "",
          customShortUrl: "",
          title: "",
          description: "",
          collection: defaultCollectionId || "",
          password: "",
          expiry: undefined,
          tags: "",
          notes: "",
          generateQR: false,
          image: ""
        })
        setPreview(null)
        setImageFile(null)
        router.refresh()
        onSuccess?.()
      } else {
        throw new Error(data.message || "Failed to shorten URL")
      }
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Shorten New URL</DialogTitle>
            <DialogDescription>
              Create a shortened link with optional customization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="longUrl">Destination URL</Label>
              <Input
                id="longUrl"
                placeholder="https://example.com/very/long/url..."
                value={formData.longUrl}
                onChange={(e) => setFormData({ ...formData, longUrl: e.target.value })}
                required
              />
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                className="mt-2 w-full sm:w-auto"
                onClick={fetchMetadata}
                disabled={metaLoading || !formData.longUrl}
              >
                {metaLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Fetch Metadata
              </Button>
            </div>

            {/* Image Control */}
            <div className="space-y-2">
              <Label>Image</Label>
              {preview ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted/50">
                  <img 
                    src={preview} 
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
                      setPreview(null)
                      setImageFile(null)
                      setFormData(prev => ({ ...prev, image: "" }))
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
                        setImageFile(file)
                        setPreview(URL.createObjectURL(file))
                        setFormData(prev => ({ ...prev, image: "" }))
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customShortUrl">Custom Alias (Optional)</Label>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2 whitespace-nowrap">
                    /
                  </span>
                  <Input
                    id="customShortUrl"
                    placeholder="my-link"
                    value={formData.customShortUrl}
                    onChange={(e) => setFormData({ ...formData, customShortUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
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
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Generate QR Code</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically generate a QR code for this link.
                </p>
              </div>
              <Switch
                checked={formData.generateQR}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, generateQR: checked })
                }
              />
            </div>

            <div className="border rounded-lg p-4">
              <button
                type="button"
                className="flex items-center justify-between w-full text-sm font-medium"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>Advanced Options</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {showAdvanced && (
                <div className="mt-4 grid gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="Custom title for dashboard"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Internal description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password Protection</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Optional password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
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
                        <PopoverContent className="w-auto p-0">
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

                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="marketing, social, promo (comma separated)"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Private Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Internal notes for your team..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create URL
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
