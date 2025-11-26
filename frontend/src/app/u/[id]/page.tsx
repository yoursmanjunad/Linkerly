"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Eye,
  Lock,
  LockOpen,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Calendar,
  Activity,
  Clock,
  Download,
  Share2,
} from "lucide-react";
import {
  IconLoader,
  IconChartBar,
  IconDeviceMobile,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

// ================== ENV / API BASE ==================
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE
  : `${RAW_API_BASE}/api`;
const SHORT_BASE_URL =
  process.env.NEXT_PUBLIC_SHORT_BASE_URL || "http://localhost:5000";

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "API request failed");
  }
  return data;
};

// ================== TYPES ==================
interface UrlCollection {
  _id: string;
  name: string;
  color?: string;
}

interface UrlDetails {
  _id: string;
  title: string;
  description?: string;
  shortUrl: string;
  customShortUrl?: string;
  longUrl: string;
  image?: string;
  tags?: string[];
  collection?: UrlCollection | null;
  clickCount?: number;
  uniqueVisitors?: number;
  createdAt: string;
  updatedAt: string;
  expiry?: string | null;
  isActive?: boolean;
  hasQR?: boolean;
  qrImageUrl?: string;
  password?: string;
  hasPassword?: boolean;
}

interface UrlAnalyticsSummary {
  totalClicks: number;
  uniqueVisitors: number;
  clickGrowth: number;
  averageClicksPerDay: number | string;
}

interface ClickByDate {
  date: string;
  clicks: number;
}

interface DeviceBreakdown {
  mobile: number;
  desktop: number;
  tablet: number;
  other: number;
}

interface UrlAnalytics {
  summary: UrlAnalyticsSummary;
  clicksByDate: ClickByDate[];
  clicksByHour: number[];
  clicksByDay: number[];
  deviceBreakdown: DeviceBreakdown;
  topBrowsers?: Record<string, number>;
  browserBreakdown?: Record<string, number>;
  osBreakdown?: Record<string, number>;
  topCountries?: Record<string, number>;
  countryBreakdown?: Record<string, number>;
  topCities?: Record<string, number>;
  cityBreakdown?: Record<string, number>;
  topReferrers?: Record<string, number>;
  referrerBreakdown?: Record<string, number>;
  urlInfo: {
    title: string;
    shortUrl: string;
    longUrl: string;
    createdAt: string;
  };
}

// ================== API HELPERS ==================
const urlsApi = {
  getDetails: async (id: string) => {
    const resp = await apiCall(`/url/details/${id}`);
    return resp?.data as UrlDetails & {
      analytics?: { totalClicks: number; uniqueVisitors: number };
    };
  },
  getAnalytics: async (id: string, period: string) => {
    const resp = await apiCall(`/url/analytics/${id}?period=${period}`);
    return resp?.data;
  },
  update: async (id: string, data: Partial<UrlDetails> & any) =>
    apiCall(`/url/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

const shortHref = (u: { shortUrl: string; customShortUrl?: string }) =>
  `${SHORT_BASE_URL}/${u.customShortUrl || u.shortUrl}`;

// Helper to safely get numeric value from potentially complex data
const safeGetCount = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object' && value !== null) {
    // Try common property names for count
    if ('count' in value && typeof value.count === 'number') return value.count;
    if ('value' in value && typeof value.value === 'number') return value.value;
    if ('total' in value && typeof value.total === 'number') return value.total;
  }
  return 0;
};

// ================== PAGE COMPONENT ==================
export default function UrlDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [url, setUrl] = React.useState<UrlDetails | null>(null);
  const [analytics, setAnalytics] = React.useState<UrlAnalytics | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<"7d" | "30d" | "90d" | "all">(
    "30d"
  );

  const [updatingSettings, setUpdatingSettings] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState("");
  const [expiryInput, setExpiryInput] = React.useState<string>("");

  React.useEffect(() => {
    if (!id) return;

    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in to view this URL");
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await urlsApi.getDetails(id);
        setUrl(data);

        if (data.expiry) {
          const d = new Date(data.expiry);
          const iso = new Date(
            d.getTime() - d.getTimezoneOffset() * 60000
          ).toISOString();
          setExpiryInput(iso.slice(0, 16));
        } else {
          setExpiryInput("");
        }
      } catch (err: any) {
        console.error("getDetails error:", err);
        toast.error(err?.message || "Failed to load URL details");
        router.push("/urls");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, router]);

  React.useEffect(() => {
    if (!id) return;
    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const data = await urlsApi.getAnalytics(id, period);
        console.log('Analytics data received:', data);
        setAnalytics(data);
      } catch (err: any) {
        console.error("getAnalytics error:", err);
        // Don't show error toast, just fail silently with null analytics
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [id, period]);

  const handleToggleActive = async (value: boolean) => {
    if (!url) return;
    setUpdatingSettings(true);
    try {
      await urlsApi.update(url._id, { isActive: value });
      toast.success(`Link ${value ? "activated" : "deactivated"}`);
      setUrl({ ...url, isActive: value });
    } catch (err: any) {
      console.error("toggleActive error:", err);
      toast.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleUpdateExpiry = async () => {
    if (!url) return;
    setUpdatingSettings(true);
    try {
      let expiryDate: Date | null = null;
      if (expiryInput) {
        expiryDate = new Date(expiryInput);
      }

      await urlsApi.update(url._id, {
        expiry: expiryDate ? expiryDate.toISOString() : null,
      });

      toast.success("Expiry updated");
      setUrl({
        ...url,
        expiry: expiryDate ? expiryDate.toISOString() : null,
      });
    } catch (err: any) {
      console.error("updateExpiry error:", err);
      toast.error(err?.message || "Failed to update expiry");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSetPassword = async () => {
    if (!url) return;
    if (!passwordInput.trim()) {
      toast.error("Enter a password first");
      return;
    }
    setUpdatingSettings(true);
    try {
      await urlsApi.update(url._id, { password: passwordInput.trim() });
      toast.success("Password set/updated");
      setPasswordInput("");
      const fresh = await urlsApi.getDetails(url._id);
      setUrl(fresh);
    } catch (err: any) {
      console.error("setPassword error:", err);
      toast.error(err?.message || "Failed to update password");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!url) return;
    setUpdatingSettings(true);
    try {
      await urlsApi.update(url._id, { password: null });
      toast.success("Password removed");
      const fresh = await urlsApi.getDetails(url._id);
      setUrl(fresh);
    } catch (err: any) {
      console.error("removePassword error:", err);
      toast.error(err?.message || "Failed to remove password");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleCopy = (text: string, message = "Copied!") => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  if (loading || !url) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <IconLoader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading URL details...</p>
      </div>
    );
  }

  const fullShort = shortHref(url);
  const createdAt = new Date(url.createdAt);
  const isExpired =
    url.expiry && new Date(url.expiry).getTime() < Date.now() ? true : false;

  const clicksByDateChartData =
    analytics?.clicksByDate?.map((d) => ({
      date: d.date.slice(5),
      clicks: d.clicks,
    })) ?? [];

  const clicksByHourData =
    analytics?.clicksByHour?.map((val, idx) => ({
      hour: `${idx}:00`,
      clicks: val,
    })) ?? [];

  const deviceData = analytics
    ? [
        { name: "Desktop", value: analytics.deviceBreakdown.desktop },
        { name: "Mobile", value: analytics.deviceBreakdown.mobile },
        { name: "Tablet", value: analytics.deviceBreakdown.tablet },
        { name: "Other", value: analytics.deviceBreakdown.other },
      ].filter((d) => d.value > 0)
    : [];

  const totalDeviceClicks = deviceData.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                  {url.title || "Untitled Link"}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {url.isActive ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                    >
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                    >
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                  {isExpired && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {url.collection && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: url.collection.color || "#3b82f6",
                        }}
                      />
                      {url.collection.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/urls")}
              className="gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to URLs
            </Button>
            <Button
              size="sm"
              onClick={() => window.open(fullShort, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(fullShort, "Short URL copied!")}
              className="gap-2"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN - 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            {/* Enhanced URL Card with Better Image */}
            <Card className="overflow-hidden">
              {url.image && (
                <div className="relative w-full aspect-video bg-gradient-to-br from-muted to-muted/50 overflow-hidden group">
                  <img
                    src={url.image}
                    alt={url.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2"
                    onClick={() => window.open(url.image!, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </Button>
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {url.title || "Untitled Link"}
                    </CardTitle>
                    {url.description && (
                      <CardDescription className="mt-1.5 line-clamp-2">
                        {url.description}
                      </CardDescription>
                    )}
                  </div>
                  {url.tags && url.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-w-[140px] justify-end">
                      {url.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {url.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{url.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Short URL
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        readOnly
                        value={fullShort}
                        className="pr-20 font-mono text-sm"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleCopy(fullShort, "Short URL copied!")
                          }
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Destination URL
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        readOnly
                        value={url.longUrl}
                        className="pr-20 font-mono text-xs"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => window.open(url.longUrl, "_blank")}
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code - More Prominent */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </CardTitle>
                <CardDescription>
                  Share this link offline using a QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {url.hasQR && url.qrImageUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-40 h-40 rounded-xl border-2 bg-white p-3 shadow-sm">
                      <img
                        src={url.qrImageUrl}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => window.open(url.qrImageUrl!, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() =>
                          handleCopy(url.qrImageUrl!, "QR URL copied!")
                        }
                      >
                        <Copy className="h-4 w-4" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed bg-muted flex items-center justify-center mb-3">
                      <QrCode className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No QR code generated yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate one when editing this URL
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4" />
                  Security & Access
                </CardTitle>
                <CardDescription>Control access and expiration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Link Status</p>
                    <p className="text-xs text-muted-foreground">
                      {url.isActive
                        ? "Link is active and accessible"
                        : "Link is currently deactivated"}
                    </p>
                  </div>
                  <Switch
                    checked={!!url.isActive}
                    onCheckedChange={handleToggleActive}
                    disabled={updatingSettings}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Expiration Date
                  </Label>
                  <div className="space-y-2">
                    <Input
                      type="datetime-local"
                      value={expiryInput}
                      onChange={(e) => setExpiryInput(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdateExpiry}
                        disabled={updatingSettings}
                        className="flex-1"
                      >
                        Update Expiry
                      </Button>
                      {url.expiry && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setExpiryInput("");
                            handleUpdateExpiry();
                          }}
                          disabled={updatingSettings}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {url.hasPassword ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <LockOpen className="h-4 w-4" />
                      )}
                      Password Protection
                    </Label>
                    {url.hasPassword && (
                      <Badge variant="secondary" className="text-xs">
                        Protected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {url.hasPassword
                      ? "Users need a password to access this link"
                      : "Anyone with the link can access it"}
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder={
                        url.hasPassword ? "New password" : "Set a password"
                      }
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSetPassword}
                        disabled={updatingSettings}
                        className="flex-1"
                      >
                        {url.hasPassword ? "Update" : "Set"} Password
                      </Button>
                      {url.hasPassword && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRemovePassword}
                          disabled={updatingSettings}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* Analytics Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconChartBar className="h-5 w-5" />
                    Analytics Overview
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Track your link performance
                  </CardDescription>
                </div>
                <Select
                  value={period}
                  onValueChange={(v: any) =>
                    setPeriod(v as "7d" | "30d" | "90d" | "all")
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <IconLoader className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Loading analytics...
                    </p>
                  </div>
                ) : !analytics ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <IconChartBar className="h-12 w-12 text-muted-foreground/40" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        Analytics Unavailable
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Unable to load analytics data at this time
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-4">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                          <Eye className="h-4 w-4" />
                          <p className="text-xs font-medium uppercase tracking-wide">
                            Visitors
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {analytics.summary.uniqueVisitors}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 p-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                          <Activity className="h-4 w-4" />
                          <p className="text-xs font-medium uppercase tracking-wide">
                            Clicks
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                          {analytics.summary.totalClicks}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/30 p-4">
                        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-2">
                          <IconChartBar className="h-4 w-4" />
                          <p className="text-xs font-medium uppercase tracking-wide">
                            Avg/Day
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {analytics.summary?.averageClicksPerDay ?? "No data"}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 p-4">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                          <Activity className="h-4 w-4" />
                          <p className="text-xs font-medium uppercase tracking-wide">
                            Growth
                          </p>
                        </div>
                        <p
                          className={`text-2xl font-bold ${
                            analytics.summary.clickGrowth >= 0
                              ? "text-emerald-900 dark:text-emerald-100"
                              : "text-rose-900 dark:text-rose-100"
                          }`}
                        >
                          {analytics.summary.clickGrowth > 0 ? "+" : ""}
                          {analytics.summary.clickGrowth.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Clicks Over Time Chart */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Clicks Over Time
                      </Label>
                      {clicksByDateChartData.length === 0 ? (
                        <div className="text-center py-12 border rounded-xl bg-muted/30">
                          <IconChartBar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                          <p className="text-sm text-muted-foreground">
                            No data yet
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Share your link to start tracking
                          </p>
                        </div>
                      ) : (
                        <div className="h-64 rounded-xl border bg-muted/30 p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={clicksByDateChartData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="currentColor"
                                opacity={0.1}
                              />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11 }}
                                tickMargin={8}
                                stroke="currentColor"
                                opacity={0.5}
                              />
                              <YAxis
                                tick={{ fontSize: 11 }}
                                width={35}
                                allowDecimals={false}
                                stroke="currentColor"
                                opacity={0.5}
                              />
                              <Tooltip
                                contentStyle={{
                                  fontSize: 12,
                                  borderRadius: 8,
                                  border: "1px solid hsl(var(--border))",
                                }}
                                formatter={(val) => [`${val} clicks`, "Clicks"]}
                              />
                              <Line
                                type="monotone"
                                dataKey="clicks"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device & Time Analytics */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconDeviceMobile className="h-4 w-4" />
                    Device Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics && deviceData.length > 0 ? (
                    <div className="space-y-4">
                      {deviceData.map((d) => {
                        const pct = Math.round(
                          (d.value / totalDeviceClicks) * 100
                        );
                        return (
                          <div key={d.name} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{d.name}</span>
                              <span className="text-muted-foreground">
                                {d.value} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <IconDeviceMobile className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No device data yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Clicks by Hour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics && clicksByHourData.length > 0 ? (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clicksByHourData}>
                          <XAxis
                            dataKey="hour"
                            tick={{ fontSize: 9 }}
                            tickLine={false}
                            interval={3}
                            stroke="currentColor"
                            opacity={0.5}
                          />
                          <Tooltip
                            contentStyle={{
                              fontSize: 11,
                              borderRadius: 8,
                              border: "1px solid hsl(var(--border))",
                            }}
                            formatter={(v) => [`${v} clicks`, "Clicks"]}
                          />
                          <Bar
                            dataKey="clicks"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hourly data yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Geography & Referrers */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Top Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    if (!analytics) {
                      return (
                        <div className="text-center py-8">
                          <Globe className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No location data yet
                          </p>
                        </div>
                      );
                    }

                    const countries = analytics.topCountries || analytics.countryBreakdown;
                    
                    if (!countries || typeof countries !== 'object') {
                      return (
                        <div className="text-center py-8">
                          <Globe className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No location data yet
                          </p>
                        </div>
                      );
                    }

                    const entries = Object.entries(countries)
                      .map(([key, val]) => ({
                        country: key,
                        count: safeGetCount(val)
                      }))
                      .filter(item => item.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5);

                    if (entries.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <Globe className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No location data yet
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {entries.map((item, idx) => (
                          <div
                            key={item.country}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {idx + 1}
                              </div>
                              <span className="font-medium text-sm">
                                {item.country}
                              </span>
                            </div>
                            <Badge variant="secondary">
                              {item.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Top Referrers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    if (!analytics) {
                      return (
                        <div className="text-center py-8">
                          <ExternalLink className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No referral data yet
                          </p>
                        </div>
                      );
                    }

                    const referrers = analytics.topReferrers || analytics.referrerBreakdown;
                    
                    if (!referrers || typeof referrers !== 'object') {
                      return (
                        <div className="text-center py-8">
                          <ExternalLink className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No referral data yet
                          </p>
                        </div>
                      );
                    }

                    const entries = Object.entries(referrers)
                      .map(([key, val]) => ({
                        referrer: key || "Direct / Unknown",
                        count: safeGetCount(val)
                      }))
                      .filter(item => item.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 6);

                    if (entries.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <ExternalLink className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No referral data yet
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {entries.map((item) => (
                          <div
                            key={item.referrer}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                          >
                            <span className="text-sm truncate max-w-[180px]">
                              {item.referrer}
                            </span>
                            <Badge variant="secondary">
                              {item.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}