"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  Globe, 
  MousePointer2, 
  TrendingUp,
  Link as LinkIcon,
  Monitor
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Area, 
  AreaChart, 
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis, 
  YAxis, 
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL;

const chartConfig = {
  clicks: {
    label: "Total Clicks",
    color: "#3b82f6",
  },
  uniqueVisitors: {
    label: "Unique Visitors",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const deviceConfig = {
  mobile: {
    label: "Mobile",
    color: "#3b82f6",
  },
  desktop: {
    label: "Desktop",
    color: "#60a5fa",
  },
  tablet: {
    label: "Tablet",
    color: "#2563eb",
  },
  other: {
    label: "Other",
    color: "#93c5fd",
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${API}/url/user/analytics?period=${period}d`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Analytics fetch failed:", res.status, errorText);
          throw new Error(`Failed to fetch analytics: ${res.status}`);
        }
        const json = await res.json();
        console.log("Analytics API response:", json);
        
        if (json.success) {
          setData(json.data);
        } else {
          throw new Error(json.message || "Failed to load analytics");
        }
      } catch (err: any) {
        console.error("Analytics error:", err);
        toast.error(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Analytics Data Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create some short URLs and get clicks to see analytics data here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const deviceData = Object.entries(data.deviceBreakdown || {}).map(([name, value]) => ({
    device: name,
    visitors: value as number,
    fill: deviceConfig[name as keyof typeof deviceConfig]?.color || "#3b82f6"
  }));

  const osData = Object.entries(data.osBreakdown || {})
    .map(([name, value]) => ({ os: name, visitors: value as number }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your link performance across all collections.
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointer2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(data.summary?.totalClicks || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {data.summary?.totalLinks || 0} links
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Globe className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(data.summary?.uniqueVisitors || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique IP addresses
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Clicks/Link</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary?.averageClicksPerLink || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Performance ratio
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate" title={data.topLink?.title || "No data"}>
                {data.topLink?.title || "No data"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {data.topLink?.clickCount || 0} clicks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>Daily clicks and unique visitors over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <AreaChart data={data.clicksByDate} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <defs>
                  <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="clicks"
                  type="monotone"
                  fill="url(#fillClicks)"
                  fillOpacity={1}
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Area
                  dataKey="uniqueVisitors"
                  type="monotone"
                  fill="url(#fillVisitors)"
                  fillOpacity={1}
                  stroke="#60a5fa"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Device Breakdown */}
          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Devices & Systems
              </CardTitle>
              <CardDescription>Traffic sources by device and OS</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="devices">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="devices">Device Type</TabsTrigger>
                  <TabsTrigger value="os">Operating System</TabsTrigger>
                </TabsList>
                
                <TabsContent value="devices" className="space-y-4">
                  <ChartContainer config={deviceConfig} className="h-[280px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={deviceData}
                        dataKey="visitors"
                        nameKey="device"
                        innerRadius={60}
                        strokeWidth={2}
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="device" />} />
                    </PieChart>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="os" className="space-y-4">
                  <ChartContainer config={{
                    visitors: {
                      label: "Visitors",
                      color: "#3b82f6",
                    },
                  }} className="h-[280px] w-full">
                    <BarChart data={osData} layout="vertical" margin={{ left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="os"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="visitors" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Geographic & Referrers */}
          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Locations & Sources
              </CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent>
               <Tabs defaultValue="countries">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="countries">Top Countries</TabsTrigger>
                  <TabsTrigger value="referrers">Top Referrers</TabsTrigger>
                </TabsList>

                <TabsContent value="countries" className="space-y-4">
                  {Object.entries(data.topCountries).length > 0 ? (
                    Object.entries(data.topCountries).map(([country, count]: [string, any], i) => (
                      <div key={country} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium w-6 text-muted-foreground">#{i + 1}</span>
                          <span className="text-sm">{country}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400" 
                              style={{ width: `${(count / data.summary.totalClicks) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <Globe className="h-8 w-8 mb-2 opacity-20" />
                      <p>No location data yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="referrers" className="space-y-4">
                  {Object.entries(data.topReferrers).length > 0 ? (
                    Object.entries(data.topReferrers).map(([referrer, count]: [string, any], i) => (
                      <div key={referrer} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium w-6 text-muted-foreground">#{i + 1}</span>
                          <span className="text-sm truncate max-w-[150px]" title={referrer}>{referrer}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-400" 
                              style={{ width: `${(count / data.summary.totalClicks) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <LinkIcon className="h-8 w-8 mb-2 opacity-20" />
                      <p>No referrer data yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
