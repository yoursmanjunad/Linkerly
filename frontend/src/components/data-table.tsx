"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconExternalLink,
  IconGripVertical,
  IconLink,
  IconLoader,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Edit,
  ExternalLink,
  Eye,
  Loader2,
  MoreVertical,
  Trash,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "./ui/textarea";
import { CgRemove } from "react-icons/cg";
import { uploadImageToImageKit } from "@/lib/upload-kit";
import { Empty } from "./ui/empty";
import { CreateUrlDialog } from "./create-url-dialog";
import { CreateCollectionDialog } from "./create-collection-dialog";

// ================== ENV / BASES ==================
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE
  : `${RAW_API_BASE}/api`;

const SHORT_BASE_URL =
  process.env.NEXT_PUBLIC_SHORT_BASE_URL || "http://localhost:5000";

if (typeof window !== "undefined" && !RAW_API_BASE.endsWith("/api")) {
  console.warn(
    `[linkerly] NEXT_PUBLIC_API_URL does not end with /api. Using normalized base: ${API_BASE_URL}`
  );
}

// ================== TYPES ==================
export const collectionSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  slug: z.string(),
  isPublic: z.boolean(),
  image: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  links: z.any(), // Can be number or array of IDs
  linkCount: z.number().optional(),
  collectionShortUrl: z.string().optional(),
  createdAt: z.string(),
  analytics: z
    .object({
      totalClicks: z.number(),
      uniqueVisitors: z.number(),
    })
    .optional(),
});

export const urlSchema = z.object({
  _id: z.string(),
  title: z.string(),
  shortUrl: z.string(),
  customShortUrl: z.string().optional(),
  longUrl: z.string(),
  description: z.string().optional(),
  links: z.number(),
  uniqueVisitors: z.number(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  collection: z.any().optional(),
});

type Collection = z.infer<typeof collectionSchema>;
type URLT = z.infer<typeof urlSchema>;

// ================== API HELPER ==================
const getAuthToken = () => localStorage.getItem("token");

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "API request failed");
  }
  return data;
};

// ================== APIs ==================
const collectionsApi = {
  getAll: async (page = 1, limit = 10) => {
    const resp = await apiCall(`/collections?page=${page}&limit=${limit}`);
    return resp?.data;
  },
  getById: async (id: string) => apiCall(`/collections/${id}`),
  create: async (payload: {
    name: string;
    description?: string;
    isPublic?: boolean;
    image?: string;
  }) =>
    apiCall(`/collections`, { method: "POST", body: JSON.stringify(payload) }),
  update: async (id: string, data: Partial<Collection>) =>
    apiCall(`/collections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: async (id: string, deleteUrls = false) =>
    apiCall(`/collections/${id}?deleteUrls=${deleteUrls}`, {
      method: "DELETE",
    }),
  addUrl: async (collectionId: string, urlId: string) =>
    apiCall(`/collections/${collectionId}/urls`, {
      method: "POST",
      body: JSON.stringify({ urlId }),
    }),
  removeUrl: async (collectionId: string, urlId: string) =>
    apiCall(`/collections/${collectionId}/urls/${urlId}`, { method: "DELETE" }),
  moveUrlViaCollection: async (
    currentCollectionId: string,
    urlId: string,
    targetCollectionId: string
  ) =>
    apiCall(`/collections/${currentCollectionId}/urls/move`, {
      method: "PUT",
      body: JSON.stringify({ urlId, targetCollectionId }),
    }),
  bulkAddUrls: async (collectionId: string, urlIds: string[]) =>
    apiCall(`/collections/${collectionId}/urls/bulk`, {
      method: "POST",
      body: JSON.stringify({ urlIds }),
    }),
};

const urlsApi = {
  getAll: async (page = 1, limit = 10, collection?: string) => {
    let url = `/url/user/links?page=${page}&limit=${limit}`;
    if (collection) url += `&collection=${collection}`;
    const resp = await apiCall(url);
    return resp?.data;
  },
  getById: async (id: string) => apiCall(`/url/details/${id}`),
  create: async (data: any) =>
    apiCall(`/url/shorten`, { method: "POST", body: JSON.stringify(data) }),
  update: async (id: string, data: Partial<URLT>) => {
    console.log("🔧 urlsApi.update called");
    console.log("🔧 URL ID:", id);
    console.log("🔧 Data before stringify:", data);
    console.log("🔧 Data.image:", data.image);
    
    const stringified = JSON.stringify(data);
    console.log("🔧 Stringified body:", stringified);
    
    const result = await apiCall(`/url/update/${id}`, { 
      method: "PUT", 
      body: stringified,
      headers: {
        "Content-Type": "application/json",
      }
    });
    
    console.log("🔧 API call result:", result);
    return result;
  },
  delete: async (id: string) =>
    apiCall(`/url/delete/${id}`, { method: "DELETE" }),
};

// ================== Small utils ==================
const shortHref = (u: URLT) =>
  `${SHORT_BASE_URL}/${u.customShortUrl || u.shortUrl}`;

// ================== Drag Handle ==================
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-9 hover:bg-transparent touch-none"
    >
      <IconGripVertical className="text-muted-foreground size-4" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// ================== Collections columns ==================
const collectionColumns: ColumnDef<Collection>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original._id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="h-5 w-5"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          className="h-5 w-5"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Collections",
    cell: ({ row }) => <TableCellViewer collection={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "links",
    header: "Links",
    cell: ({ row }) => {
      const links = row.original.links;
      const count = Array.isArray(links) ? new Set(links).size : 0;
      return (
        <div className="text-center text-sm md:text-base">
          {count}
        </div>
      );
    },
  },
  {
    accessorKey: "analytics.totalClicks",
    header: "Clicks",
    cell: ({ row }) => (
      <div className="text-center text-sm md:text-base">
        {row.original.analytics?.totalClicks || 0}
      </div>
    ),
  },
  {
    accessorKey: "analytics.uniqueVisitors",
    header: "Visitors",
    cell: ({ row }) => (
      <div className="text-center text-sm md:text-base">
        {row.original.analytics?.uniqueVisitors || 0}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CollectionActions collection={row.original} />,
  },
];

// ================== Collection actions ==================
function CollectionActions({ collection }: { collection: Collection }) {
  const [openEdit, setOpenEdit] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [name, setName] = React.useState(collection.name);
  const [description, setDescription] = React.useState(
    collection.description || ""
  );
  const [visibility, setVisibility] = React.useState(
    collection.isPublic ? "public" : "private"
  );

  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState(collection.image || null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = collection.image;

      if (imageFile) {
        imageUrl = await uploadImageToImageKit(imageFile);
      }

      await collectionsApi.update(collection._id, {
        name,
        description,
        isPublic: visibility === "public",
        image: imageUrl,
      });

      toast.success("Collection updated");
      setOpenEdit(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Delete this collection?")) return;

    try {
      await collectionsApi.delete(id);
      toast.success("Collection deleted");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete collection");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-9 md:size-8"
            size="icon"
          >
            <IconDotsVertical className="h-5 w-5 md:h-4 md:w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setOpenEdit(true)} className="py-3 md:py-2">
            <Edit className="h-4 w-4 mr-2" /> Edit
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="py-3 md:py-2">
            <IconChartBar className="h-4 w-4 mr-2" /> Analytics
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleDeleteCollection(collection._id)}
            className="text-red-600 py-3 md:py-2"
          >
            <IconTrash className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>Modify your collection details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Title</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 md:h-10 text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Image</Label>

              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    className="h-40 md:h-32 w-full rounded-lg object-cover border"
                  />

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-9 md:h-8"
                    onClick={() => {
                      setPreview(null);
                      setImageFile(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  className="h-11 md:h-10"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-11 md:h-10">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public" className="py-3 md:py-2">Public</SelectItem>
                  <SelectItem value="private" className="py-3 md:py-2">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit" disabled={saving} className="h-11 md:h-10 text-base md:text-sm">
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ================== Collection drawer cell ==================
function TableCellViewer({ collection }: { collection: Collection }) {
  const isMobile = useIsMobile();
  const [urls, setUrls] = React.useState<URLT[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openCreateUrl, setOpenCreateUrl] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [openEditUrl, setOpenEditUrl] = React.useState(false);
  const [activeUrl, setActiveUrl] = React.useState<URLT | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [editImageFile, setEditImageFile] = React.useState<File | null>(null);
  const [editPreview, setEditPreview] = React.useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const createUrlFormRef = React.useRef<HTMLFormElement>(null);

  const [isCopying, setIsCopying] = React.useState(false);



  const loadCollectionUrls = async () => {
    setLoading(true);
    try {
      const response = await collectionsApi.getById(collection._id);
      const links = response.data.links || [];
      // Remove duplicates by filtering unique _id values
      const uniqueLinks = links.filter((link: URLT, index: number, self: URLT[]) => 
        index === self.findIndex((l) => l._id === link._id)
      );
      setUrls(uniqueLinks);
    } catch (error) {
      toast.error("Failed to load URLs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUrl = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setIsCreating(true);

    let imageUrl: string | undefined;
    const imgFile = form.get("image") as File;

    try {
      // Upload image first if provided
      if (imgFile && imgFile.size > 0) {
        try {
          imageUrl = await uploadImageToImageKit(imgFile);
          toast.success("Image uploaded successfully");
        } catch (err: any) {
          toast.error(`Image upload failed: ${err?.message || "unknown error"}`);
          setIsCreating(false);
          return; // Stop if image upload fails
        }
      }

      const payload = {
        title: (form.get("title") as string) || "",
        longUrl: (form.get("longUrl") as string) || "",
        description: (form.get("description") as string) || "",
        collection: collection._id,
        ...(imageUrl ? { image: imageUrl } : {}),
      };

      await urlsApi.create(payload);
      toast.success("URL created successfully");
      setOpenCreateUrl(false);
      
      // Reset form safely
      if (createUrlFormRef.current) {
        createUrlFormRef.current.reset();
      }
      
      await loadCollectionUrls();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create URL");
      console.error("Create URL error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        onOpenChange={(open) => {
          if (open) loadCollectionUrls();
        }}
      >
        <DrawerTrigger asChild>
          <Button variant="link" className="text-foreground w-fit px-0 text-left text-base md:text-sm h-auto py-0">
            {collection.name}
          </Button>
        </DrawerTrigger>
        <DrawerContent className={isMobile ? "max-h-[95vh]" : "h-full"}>
          {/* Scrollable Container */}
          <div className="flex flex-col h-full overflow-hidden">
            {/* Fixed Header */}
            <DrawerHeader className="px-4 md:px-6 flex-shrink-0 border-b pb-4">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex flex-col flex-1 min-w-0">
                  <DrawerTitle className="text-lg md:text-xl font-semibold mb-1">
                    {collection.name}
                  </DrawerTitle>
                  <DrawerDescription className="text-sm line-clamp-1 md:line-clamp-2 text-muted-foreground">
                    {collection.description || "No description"}
                  </DrawerDescription>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 md:h-8 md:w-8 hover:bg-muted active:scale-95 transition-all duration-200"
                    onClick={async () => {
                      setIsCopying(true);
                      const url = collection.collectionShortUrl
                        ? `${window.location.origin}/c/${collection.collectionShortUrl}`
                        : `${window.location.origin}/c/${collection.slug}`;
                      await navigator.clipboard.writeText(url);
                      toast.success("Collection URL copied!");
                      setTimeout(() => setIsCopying(false), 1000);
                    }}
                  >
                    {isCopying ? (
                      <Check className="h-4 w-4 text-green-500 animate-in zoom-in duration-200" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 md:h-8 md:w-8 hover:bg-muted active:scale-95 transition-all duration-200"
                    onClick={() => {
                      const url = collection.collectionShortUrl
                        ? `${window.location.origin}/c/${collection.collectionShortUrl}`
                        : `${window.location.origin}/c/${collection.slug}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DrawerHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Collection Image - Full Width */}
              {collection.image && (
                <div className="w-full mb-6">
                  <img 
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* URLs Section */}
              <div className="px-4 md:px-6 pb-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader className="animate-spin h-6 w-6" />
                  </div>
                ) : urls.length === 0 ? (
                  <Empty
                    title="No URLs in this Collection"
                    description="Add your first link to this collection."
                    actionLabel="Create URL"
                    onAction={() => setOpenCreateUrl(true)}
                    icon={<IconLink className="h-6 w-6 text-primary" />}
                  />
                ) : (
                  <>
                    <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                      Links ({urls.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {urls.map((url, index) => (
                        <div
                          key={`${url._id}-${index}`}
                          className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300"
                        >
                          {/* URL Image/Icon */}
                          {url.image ? (
                            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                              <img
                                src={url.image}
                                alt={url.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                              
                              {/* Three Dots Menu - Always Visible */}
                              <div className="absolute top-2 right-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="secondary" 
                                      size="icon" 
                                      className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem asChild className="py-3 md:py-2">
                                      <a href={shortHref(url)} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4" /> Visit Link
                                      </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="py-3 md:py-2">
                                      <Eye className="h-4 w-4 mr-2" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setActiveUrl(url);
                                        setEditPreview(url.image || null);
                                        setEditImageFile(null);
                                        setOpenEditUrl(true);
                                      }}
                                      className="flex items-center gap-2 py-3 md:py-2"
                                    >
                                      <Edit className="h-4 w-4" /> Edit
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        try {
                                          await collectionsApi.removeUrl(collection._id, url._id);
                                          toast.success("URL removed from collection");
                                          loadCollectionUrls();
                                        } catch (error) {
                                          toast.error("Failed to remove URL");
                                        }
                                      }}
                                      className="text-red-600 py-3 md:py-2"
                                    >
                                      <CgRemove className="h-4 w-4 mr-2" /> Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ) : (
                            <div className="relative aspect-video w-full bg-muted flex items-center justify-center">
                              <IconLink className="h-10 w-10 text-muted-foreground/30" />
                              
                              {/* Three Dots Menu - Always Visible */}
                              <div className="absolute top-2 right-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="secondary" 
                                      size="icon" 
                                      className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem asChild className="py-3 md:py-2">
                                      <a href={shortHref(url)} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4" /> Visit Link
                                      </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="py-3 md:py-2">
                                      <Eye className="h-4 w-4 mr-2" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setActiveUrl(url);
                                        setEditPreview(url.image || null);
                                        setEditImageFile(null);
                                        setOpenEditUrl(true);
                                      }}
                                      className="flex items-center gap-2 py-3 md:py-2"
                                    >
                                      <Edit className="h-4 w-4" /> Edit
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        try {
                                          await collectionsApi.removeUrl(collection._id, url._id);
                                          toast.success("URL removed from collection");
                                          loadCollectionUrls();
                                        } catch (error) {
                                          toast.error("Failed to remove URL");
                                        }
                                      }}
                                      className="text-red-600 py-3 md:py-2"
                                    >
                                      <CgRemove className="h-4 w-4 mr-2" /> Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )}

                          {/* URL Content */}
                          <div className="p-3 md:p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm md:text-base line-clamp-2 flex-1">
                                {url.title}
                              </h4>
                            </div>

                            {url.description && (
                              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                                {url.description}
                              </p>
                            )}

                            {/* Short URL with Copy */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <a
                                href={shortHref(url)}
                                target="_blank"
                                className="text-xs text-primary hover:underline truncate flex-1"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {shortHref(url)}
                              </a>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0 hover:bg-muted active:scale-95 transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(shortHref(url));
                                  toast.success("URL copied!");
                                  setCopiedId(url._id);
                                  setTimeout(() => setCopiedId(null), 1000);
                                }}
                              >
                                {copiedId === url._id ? (
                                  <Check className="h-3 w-3 text-green-500 animate-in zoom-in duration-200" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
            <DrawerFooter className="px-4 md:px-6 pt-4 flex-shrink-0 border-t bg-background">
              <Button onClick={() => setOpenCreateUrl(true)} className="h-11 md:h-10 text-base md:text-sm w-full active:scale-95 transition-all duration-200">
                <IconPlus className="h-4 w-4 mr-2" />
                Create New URL
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={openCreateUrl} onOpenChange={setOpenCreateUrl}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New URL</DialogTitle>
            <DialogDescription>Add a URL to {collection.name}</DialogDescription>
          </DialogHeader>

          <form ref={createUrlFormRef} onSubmit={handleCreateUrl} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Title</Label>
              <Input name="title" placeholder="My Website" required className="h-11 md:h-10 text-base" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Long URL</Label>
              <Input name="longUrl" type="url" placeholder="https://example.com..." required className="h-11 md:h-10 text-base" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Description</Label>
              <Textarea name="description" placeholder="Optional description…" className="min-h-[100px] text-base" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Image (optional)</Label>
              <Input 
                name="image" 
                type="file" 
                accept="image/*" 
                className="h-11 md:h-10"
              />
              <p className="text-xs text-muted-foreground">Upload an image to display with this URL</p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit" disabled={isCreating} className="h-11 md:h-10 text-base md:text-sm">
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditUrl} onOpenChange={(open) => {
        setOpenEditUrl(open);
        if (!open) {
          // Reset states when closing
          setActiveUrl(null);
          setEditImageFile(null);
          setEditPreview(null);
          setRemoveExistingImage(false);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit URL</DialogTitle>
            <DialogDescription>Update details for this URL.</DialogDescription>
          </DialogHeader>

          {activeUrl && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);

                try {
                  let finalImageUrl = activeUrl.image || "";

                  // Handle image removal
                  if (removeExistingImage) {
                    finalImageUrl = "";
                  }

                  // Upload new image if selected
                  if (editImageFile) {
                    try {
                      const uploadedUrl = await uploadImageToImageKit(editImageFile);
                      finalImageUrl = uploadedUrl;
                      console.log("✅ Image uploaded to ImageKit:", uploadedUrl);
                      console.log("✅ Image URL length:", uploadedUrl.length);
                      console.log("✅ Image URL type:", typeof uploadedUrl);
                      toast.success("Image uploaded successfully");
                    } catch (err: any) {
                      console.error("❌ ImageKit upload error:", err);
                      toast.error(`Image upload failed: ${err?.message || "unknown error"}`);
                      setSaving(false);
                      return;
                    }
                  }

                  // Build payload - make sure image is at root level
                  const payload = {
                    title: activeUrl.title.trim(),
                    longUrl: activeUrl.longUrl.trim(),
                    description: activeUrl.description?.trim() || "",
                    image: finalImageUrl,
                  };

                  console.log("📦 Complete payload object:", payload);
                  console.log("📦 Payload.image value:", payload.image);
                  console.log("📦 Payload.image length:", payload.image?.length);
                  console.log("🎯 Updating URL ID:", activeUrl._id);
                  console.log("🔧 Stringified payload:", JSON.stringify(payload));

                  const response = await urlsApi.update(activeUrl._id, payload);
                  console.log("📥 Full server response:", JSON.stringify(response, null, 2));
                  console.log("🖼️ Response image field:", response?.data?.image);
                  
                  // Check if image was actually saved
                  if (finalImageUrl && response?.data?.image !== finalImageUrl) {
                    console.error("⚠️ WARNING: Image was NOT saved to database!");
                    console.error("⚠️ Sent image URL:", finalImageUrl);
                    console.error("⚠️ Received image URL:", response?.data?.image);
                    toast.error("Image uploaded but not saved. Please check backend configuration.");
                    setSaving(false);
                    return;
                  }

                  toast.success("URL updated successfully");
                  
                  // Reset states
                  setOpenEditUrl(false);
                  setActiveUrl(null);
                  setEditImageFile(null);
                  setEditPreview(null);
                  setRemoveExistingImage(false);
                  
                  // Force reload to get fresh data from server
                  setTimeout(async () => {
                    await loadCollectionUrls();
                  }, 500);
                } catch (err: any) {
                  console.error("Edit URL error:", err);
                  toast.error(err.message || "Failed to update");
                } finally {
                  setSaving(false);
                }
              }}
              className="flex flex-col gap-4 mt-2"
            >
              <div className="flex flex-col gap-2">
                <Label className="text-base md:text-sm">Title</Label>
                <Input
                  value={activeUrl.title}
                  onChange={(e) => setActiveUrl({ ...activeUrl, title: e.target.value })}
                  required
                  className="h-11 md:h-10 text-base"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-base md:text-sm">Long URL</Label>
                <Input
                  value={activeUrl.longUrl}
                  onChange={(e) => setActiveUrl({ ...activeUrl, longUrl: e.target.value })}
                  required
                  className="h-11 md:h-10 text-base"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-base md:text-sm">Description</Label>
                <Textarea
                  value={activeUrl.description || ""}
                  onChange={(e) => setActiveUrl({ ...activeUrl, description: e.target.value })}
                  className="min-h-[100px] text-base"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-base md:text-sm">Image</Label>

                {/* Show existing image or preview */}
                {(editPreview || (activeUrl.image && !removeExistingImage)) && (
                  <div className="relative mb-2">
                    <img 
                      src={editPreview || activeUrl.image} 
                      className="h-40 md:h-32 w-full rounded-lg object-cover border" 
                      alt="Preview" 
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-9 md:h-8"
                      onClick={() => {
                        if (editPreview) {
                          // Remove new upload preview
                          setEditPreview(null);
                          setEditImageFile(null);
                        } else {
                          // Mark existing image for removal
                          setRemoveExistingImage(true);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}

                {/* Show upload input if no image or image removed */}
                {(!activeUrl.image || removeExistingImage) && !editPreview && (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="h-11 md:h-10"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditImageFile(file);
                          setEditPreview(URL.createObjectURL(file));
                          setRemoveExistingImage(false);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload an image for this URL
                    </p>
                  </div>
                )}

                {/* Show replace button if existing image and not editing */}
                {activeUrl.image && !removeExistingImage && !editPreview && (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="h-11 md:h-10"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditImageFile(file);
                          setEditPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a new image to replace the current one
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" disabled={saving} className="h-11 md:h-10 text-base md:text-sm">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ================== Draggable row ==================
function DraggableRow({ row }: { row: Row<Collection> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id,
  });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="py-4 md:py-3">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ================== URLs Tab (cards-only) ==================
function UrlsTab() {
  const [urls, setUrls] = React.useState<URLT[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openEditUrl, setOpenEditUrl] = React.useState(false);
  const [viewMode] = React.useState<"cards">("cards");

  const [moveOpen, setMoveOpen] = React.useState(false);
  const [moveTargetCollection, setMoveTargetCollection] = React.useState<string>("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [activeUrl, setActiveUrl] = React.useState<URLT | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [editImageFile, setEditImageFile] = React.useState<File | null>(null);
  const [editPreview, setEditPreview] = React.useState<string | null>(null);

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 12, // 12 items per page for grid view
  });
  const [pageCount, setPageCount] = React.useState(0);

  const loadUrls = async () => {
    setLoading(true);
    try {
      console.log("Fetching uncategorized URLs...");
      // Fetch only uncategorized URLs (collection="null")
      const data = await urlsApi.getAll(pagination.pageIndex + 1, pagination.pageSize, "null");
      setUrls(data?.urls || []);
      setPageCount(data?.pagination?.totalPages || 0);
    } catch (e) {
      toast.error("Failed to load URLs");
      console.error("UrlsTab.loadUrls error:", e);
      setUrls([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUrls();

    const handler = () => loadUrls();
    window.addEventListener("urls:reload", handler);
    return () => window.removeEventListener("urls:reload", handler);
  }, [pagination.pageIndex, pagination.pageSize]);

  // Reset page if out of bounds
  React.useEffect(() => {
    if (pageCount > 0 && pagination.pageIndex >= pageCount) {
      setPagination((p) => ({ ...p, pageIndex: Math.max(0, pageCount - 1) }));
    }
  }, [pageCount, pagination.pageIndex]);

  const loadCollections = async () => {
    try {
      const data = await collectionsApi.getAll(1, 100); // Get first 100 collections for dropdown
      setCollections(data?.collections || []);
    } catch (e) {
      console.error("loadCollections error:", e);
      setCollections([]);
    }
  };

  const openMoveDialog = async (url: URLT) => {
    setActiveUrl(url);
    setMoveTargetCollection("");
    await loadCollections();
    setMoveOpen(true);
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUrl || !moveTargetCollection) {
      toast.error("Pick a collection");
      return;
    }
    try {
      if (activeUrl.collection) {
        await collectionsApi.moveUrlViaCollection(String(activeUrl.collection), activeUrl._id, moveTargetCollection);
      } else {
        await collectionsApi.addUrl(moveTargetCollection, activeUrl._id);
      }
      toast.success("URL moved");
      setMoveOpen(false);
      setActiveUrl(null);
      loadUrls();
    } catch (e: any) {
      toast.error(e?.message || "Failed to move URL");
      console.error("handleMove error:", e);
    }
  };

  const handleUpdateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUrl) return;

    setSaving(true);
    try {
      let imageUrl = activeUrl.image;
      
      // Upload new image if selected
      if (editImageFile) {
        try {
          imageUrl = (await uploadImageToImageKit(editImageFile)) as string;
          toast.success("Image uploaded successfully");
        } catch (err: any) {
          toast.error(`Image upload failed: ${err?.message || "unknown error"}`);
          setSaving(false);
          return; // Stop if image upload fails
        }
      }

      const payload: any = {
        title: activeUrl.title,
        longUrl: activeUrl.longUrl,
        description: activeUrl.description || "",
      };

      // Only include image if we have one
      if (imageUrl) {
        payload.image = imageUrl;
      }

      await urlsApi.update(activeUrl._id, payload);
      toast.success("URL updated");
      setOpenEditUrl(false);
      setActiveUrl(null);
      setEditImageFile(null);
      setEditPreview(null);
      loadUrls();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
      console.error("handleUpdateUrl error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this URL?")) return;
    try {
      await urlsApi.delete(id);
      toast.success("URL deleted");
      loadUrls();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete URL");
      console.error("delete error:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader className="animate-spin h-6 w-6" />
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="mx-4 lg:mx-6">
        <Empty
          title="No Uncategorized URLs"
          description="URLs not added to any collection will appear here."
          icon={<IconPlus className="h-6 w-6 text-primary" />}
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 px-4 lg:px-6">
        {urls.map((url) => (
          <div
            key={url._id}
            className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-xl transition-all duration-300"
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              {url.image ? (
                <img
                  src={url.image}
                  alt={url.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IconLink className="h-12 w-12 md:h-10 md:w-10 text-muted-foreground/30" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            </div>

            <div className="p-4 md:p-5 space-y-3">
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-1 line-clamp-1">{url.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {url.description || "No description provided"}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <a href={shortHref(url)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate flex-1">
                  {shortHref(url)}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-7 md:w-7 shrink-0 hover:bg-muted active:scale-95 transition-all duration-200"
                  onClick={() => {
                    navigator.clipboard.writeText(shortHref(url));
                    toast.success("URL copied!");
                    setCopiedId(url._id);
                    setTimeout(() => setCopiedId(null), 1000);
                  }}
                >
                  {copiedId === url._id ? (
                    <Check className="h-4 w-4 md:h-3 md:w-3 text-green-500 animate-in zoom-in duration-200" />
                  ) : (
                    <Copy className="h-4 w-4 md:h-3 md:w-3" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(shortHref(url), "_blank")} className="h-9 md:h-8 text-sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8">
                      <MoreVertical className="h-5 w-5 md:h-4 md:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => {
                        window.open(`/url/${url._id}`, "_blank");
                      }}
                      className="py-3 md:py-2"
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        setActiveUrl(url);
                        setEditPreview(url.image || null);
                        setEditImageFile(null);
                        setOpenEditUrl(true);
                      }}
                      className="py-3 md:py-2"
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 py-3 md:py-2"
                      onClick={async () => {
                        await handleDelete(url._id);
                      }}
                    >
                      <Trash className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Controls for URLs */}
      {urls.length > 0 && (
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Page {pagination.pageIndex + 1} of {pageCount || 1}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPagination(p => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
              disabled={pagination.pageIndex === 0}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
              disabled={pagination.pageIndex >= pageCount - 1}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={openEditUrl} onOpenChange={setOpenEditUrl}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit URL</DialogTitle>
            <DialogDescription>Update details for this URL.</DialogDescription>
          </DialogHeader>

          {activeUrl && (
            <form onSubmit={handleUpdateUrl} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <Label className="text-base md:text-sm">Title</Label>
                <Input value={activeUrl.title} onChange={(e) => setActiveUrl({ ...activeUrl, title: e.target.value })} required className="h-11 md:h-10 text-base" />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-base md:text-sm">Long URL</Label>
                <Input value={activeUrl.longUrl} onChange={(e) => setActiveUrl({ ...activeUrl, longUrl: e.target.value })} required className="h-11 md:h-10 text-base" />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-base md:text-sm">Description</Label>
                <Textarea value={activeUrl.description || ""} onChange={(e) => setActiveUrl({ ...activeUrl, description: e.target.value })} className="min-h-[100px] text-base" />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-base md:text-sm">Image</Label>
                {editPreview ? (
                  <div className="relative">
                    <img src={editPreview} className="h-40 md:h-32 w-full rounded-lg object-cover border" />
                    <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2 h-9 md:h-8" onClick={() => { setEditPreview(null); setEditImageFile(null); }}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Input type="file" accept="image/*" className="h-11 md:h-10" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setEditImageFile(file); setEditPreview(URL.createObjectURL(file)); } }} />
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" disabled={saving} className="h-11 md:h-10 text-base md:text-sm">
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Move to Collection</DialogTitle>
            <DialogDescription>{activeUrl ? `Choose a collection for "${activeUrl.title}".` : "Choose a collection."}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMove} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label className="text-base md:text-sm">Collection</Label>
              <Select value={moveTargetCollection} onValueChange={(v) => setMoveTargetCollection(v)}>
                <SelectTrigger className="w-full h-11 md:h-10">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c._id} value={c._id} className="py-3 md:py-2">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit" className="h-11 md:h-10 text-base md:text-sm">Move</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ================== Main DataTable ==================
export function DataTable() {
  const router = useRouter();
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openCollectionDialog, setOpenCollectionDialog] = React.useState(false);
  const [openCreateUrlDialog, setOpenCreateUrlDialog] = React.useState(false);
  const [visibility, setVisibility] = React.useState<"public" | "private">("private");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const sortableId = React.useId();
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}));

  const [pageCount, setPageCount] = React.useState(0);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setCollections([]);
        return;
      }
      const data = await collectionsApi.getAll(
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      
      setCollections(data?.collections || []);
      setPageCount(data?.pagination?.totalPages || 0);
    } catch (err: any) {
      if (`${err?.message}`.toLowerCase().includes("not found")) {
        toast.error("Collections endpoint not found. Check NEXT_PUBLIC_API_URL (must end with /api).");
      } else {
        toast.error(err?.message || "Failed to load collections");
      }
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCollections();
  }, [pagination.pageIndex, pagination.pageSize]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => collections.map(({ _id }) => _id), [collections]);

  const table = useReactTable({
    data: collections,
    columns: collectionColumns,
    pageCount,
    state: { sorting, columnVisibility, rowSelection, pagination },
    getRowId: (row) => row._id,
    enableRowSelection: true,
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setCollections((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }



  // Listen for "open:create:url" event from Empty state
  React.useEffect(() => {
    const handleOpenCreateUrl = () => setOpenCreateUrlDialog(true);
    window.addEventListener("open:create:url", handleOpenCreateUrl);
    return () => window.removeEventListener("open:create:url", handleOpenCreateUrl);
  }, []);





  return (
    <Tabs defaultValue="collections" className="w-full flex-col justify-start gap-4 md:gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6 gap-3">
        <TabsList className="h-11 md:h-10">
          <TabsTrigger value="collections" className="text-sm md:text-sm px-4 md:px-3">Collections</TabsTrigger>
          <TabsTrigger value="urls" className="text-sm md:text-sm px-4 md:px-3">Uncategorized</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 h-10 md:h-9 text-sm">
                <IconPlus className="h-4 w-4" /> <span className="hidden sm:inline">Create</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setOpenCollectionDialog(true)} className="py-3 md:py-2">
                Create Collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpenCreateUrlDialog(true)} className="py-3 md:py-2">
                Create URL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TabsContent value="collections" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 mt-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader className="animate-spin h-6 w-6" />
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border">
              <DndContext collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd} sensors={sensors} id={sortableId}>
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((header) => (
                          <TableHead key={header.id} colSpan={header.colSpan} className="text-sm md:text-sm">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody className="**:data-[slot=table-cell]:first:w-8">
                    {table.getRowModel().rows?.length ? (
                      <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                        {table.getRowModel().rows.map((row) => (
                          <DraggableRow key={row.id} row={row} />
                        ))}
                      </SortableContext>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={collectionColumns.length}>
                          <Empty title="No Collections Yet" description="Create a collection to start organizing your URLs." icon={<IconPlus className="h-6 w-6 text-primary" />} />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 md:px-4">
              <div className="text-muted-foreground text-sm order-2 sm:order-1">
                {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-4 order-1 sm:order-2">
                <div className="hidden lg:flex items-center gap-2">
                  <Label htmlFor="rows-per-page" className="text-sm font-medium whitespace-nowrap">
                    Rows per page
                  </Label>
                  <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                    <SelectTrigger size="sm" className="w-20 h-9" id="rows-per-page">
                      <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`} className="py-2">
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-center text-sm font-medium">
                  <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                  <div className="flex items-center gap-1 sm:hidden">
                    <Button variant="outline" className="size-9" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="size-9" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="outline" className="hidden lg:flex h-9 w-9 p-0" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                    <IconChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="size-9" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="size-9" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="hidden lg:flex size-9" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                    <IconChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="urls" className="flex flex-col px-0 mt-0">
        <UrlsTab />
      </TabsContent>

      <CreateCollectionDialog 
        open={openCollectionDialog} 
        onOpenChange={setOpenCollectionDialog} 
        onSuccess={() => {
          loadCollections();
          window.dispatchEvent(new Event("collections:reload"));
        }}
      />

      <CreateUrlDialog 
        open={openCreateUrlDialog} 
        onOpenChange={setOpenCreateUrlDialog} 
        onSuccess={() => window.dispatchEvent(new Event("urls:reload"))}
      />
    </Tabs>
  );
}
