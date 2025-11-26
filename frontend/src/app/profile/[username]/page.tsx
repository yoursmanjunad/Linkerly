"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Link2,
  Calendar,
  Share2,
  Mail,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Sparkles,
  Eye,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const SOCIAL_ICONS: Record<string, any> = {
  website: Globe,
  github: Github,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  email: Mail,
};

const SOCIAL_COLORS: Record<string, string> = {
  github: "hover:bg-[#333] hover:text-white hover:border-[#333]",
  twitter: "hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]",
  x: "hover:bg-black hover:text-white hover:border-black",
  linkedin: "hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]",
  instagram: "hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:text-white hover:border-transparent",
  facebook: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
  youtube: "hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]",
  email: "hover:bg-primary hover:text-primary-foreground hover:border-primary",
  website: "hover:bg-primary hover:text-primary-foreground hover:border-primary",
};

function SocialLinks({ links = [] }: { links: any[] }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {links.map((s: any, i: number) => {
        const Icon = SOCIAL_ICONS[s.platform?.toLowerCase()] || Link2;
        const colorClass =
          SOCIAL_COLORS[s.platform?.toLowerCase()] ||
          "hover:bg-primary hover:text-primary-foreground hover:border-primary";

        return (
          <Button
            key={s._id || i}
            variant="outline"
            size="icon"
            className={`h-10 w-10 rounded-full hover:scale-110 transition-all duration-300 shadow-sm ${colorClass}`}
            asChild
          >
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.platform}
            >
              <Icon className="h-4 w-4" />
            </a>
          </Button>
        );
      })}
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!username) {
      setError("No username provided");
      setLoading(false);
      return;
    }

    if (!API) {
      setError("API URL not configured");
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`📡 Fetching profile: ${API}/profiles/${username}?page=1&limit=1000`);
        
        const response = await fetch(`${API}/profiles/${username}?page=1&limit=1000`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("📦 Profile data:", data);

        if (!isMounted) return;

        if (data.success && data.data) {
          setProfileData(data.data);
        } else {
          throw new Error(data.message || "Failed to load profile");
        }
      } catch (err: any) {
        console.error("❌ Error fetching profile:", err);
        
        if (!isMounted) return;
        
        const errorMessage = err.message || "Failed to load profile";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [username, API]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profileData?.user?.userName}'s Profile`,
          text: profileData?.user?.bio || `Check out ${username}'s collections!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied to clipboard!");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Failed to share");
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="relative h-56 sm:h-80 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <Skeleton className="w-full h-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 sm:-mt-24">
            <Skeleton className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-background shadow-2xl" />
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-24 w-full max-w-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto ring-4 ring-destructive/5">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Profile not found</h2>
            <p className="text-muted-foreground text-lg">
              {error || "This profile doesn't exist or has been removed."}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const user = profileData.user;
  const collections = profileData.collections || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Cover Section */}
      <div className="relative">
        <div className="relative h-56 sm:h-80 overflow-hidden">
          {user.coverImage ? (
            <>
              <img
                src={user.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>
          )}
        </div>

        {/* Share Button */}
        <div className="absolute top-6 right-4 sm:right-8">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleShare}
            className="rounded-full backdrop-blur-xl bg-background/95 hover:bg-background shadow-xl border h-12 w-12 hover:scale-110 transition-transform"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 sm:-mt-24 pb-20">
          <div className="space-y-8">
            {/* Avatar & User Info */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-[6px] border-background shadow-2xl ring-4 ring-primary/10">
                  <AvatarImage src={user.profilePicUrl} />
                  <AvatarFallback className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-primary/30 to-primary/10">
                    {user.userName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {(user.isVerified || user.isPremium) && (
                  <div className="absolute -bottom-2 -right-2 h-11 w-11 rounded-full bg-background flex items-center justify-center shadow-xl ring-4 ring-background">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* User Details */}
              <div className="flex-1 space-y-5 min-w-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() 
                        : user.displayName || user.userName}
                    </h1>
                    {user.isVerified && (
                      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                        <Sparkles className="h-4 w-4" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xl">
                    @{user.userName}
                  </p>
                </div>

                {user.bio && (
                  <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
                    {user.bio}
                  </p>
                )}

                {/* Social Links */}
                {user.socialLinks && user.socialLinks.length > 0 && (
                  <SocialLinks links={user.socialLinks} />
                )}
              </div>
            </div>
          </div>

          {/* Collections Section - Pinterest Style */}
          <div className="mt-16">
            {collections.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {collections.map((collection: any, index: number) => {
                  const linkCount = Array.isArray(collection.links) 
                    ? collection.links.length 
                    : collection.linkCount ?? 0;

                  return (
                    <div
                      key={`${collection._id}-${index}`}
                      className="break-inside-avoid mb-6"
                    >
                      <div
                        className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.01] active:scale-[0.99]"
                        onClick={() => router.push(`/c/${collection.collectionShortUrl}`)}
                        style={{
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {/* Collection Image */}
                        {collection.image ? (
                          <div className="relative overflow-hidden">
                            <img
                              src={collection.image}
                              alt={collection.name}
                              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Premium Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                          </div>
                        ) : (
                          <div className="relative h-80 bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                              <div className="absolute top-0 left-0 w-40 h-40 bg-primary rounded-full blur-3xl" />
                              <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent rounded-full blur-3xl" />
                            </div>
                            <Link2 className="h-14 w-14 text-muted-foreground/40 relative z-10" />
                            {/* Gradient Overlay for consistency */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </div>
                        )}
                        
                        {/* Top Right Badge - Link Count */}
                        <div className="absolute top-3 right-3 z-20">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/90 shadow-sm transition-all duration-300 group-hover:bg-black/30">
                            <Link2 className="w-3 h-3" />
                            <span className="text-xs font-medium">{linkCount}</span>
                          </div>
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-5 z-20">
                          <div className="space-y-1.5">
                            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
                              {collection.name}
                            </h3>
                            
                            {collection.description && (
                              <p className="text-xs text-white/80 line-clamp-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
                                {collection.description}
                              </p>
                            )}
                            
                            {/* View Action */}
                            <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                              <div className="h-0.5 w-8 bg-white/60 rounded-full" />
                              <span className="text-xs text-white/90 font-medium uppercase tracking-wider">
                                View
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6 ring-4 ring-muted/20">
                  <Link2 className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground text-lg">No collections yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="border-t bg-muted/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left space-y-2">
              <p className="text-sm text-muted-foreground">
                Powered by{" "}
                <a
                  href="https://linkerly.it"
                  className="font-semibold hover:text-foreground transition-colors inline-flex items-center gap-1.5 group"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  linkerly.it
                  <Sparkles className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                </a>
              </p>
              <p className="text-xs text-muted-foreground/80">
                Beautiful link management for everyone
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}