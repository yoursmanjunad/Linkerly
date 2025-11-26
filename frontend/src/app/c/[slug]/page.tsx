"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ExternalLink,
  Share2,
  Clock,
  Link2,
  Sparkles,
  Loader2,
  CheckCircle2,
  Bookmark,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { UrlImagePlaceholder } from "@/components/url-image-placeholder";

export default function PublicCollectionPage() {
  const { slug } = useParams();
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [redirecting, setRedirecting] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  const SHORT_BASE_URL = process.env.NEXT_PUBLIC_SHORT_BASE_URL;

  const getDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'link';
    }
  };

  const fetchCollection = (pwd?: string) => {
    if (!API_BASE || !slug) return;
    
    setLoading(true);
    const baseUrl = API_BASE.replace("/api", "");
    const url = pwd 
      ? `${baseUrl}/c/${slug}?password=${encodeURIComponent(pwd)}`
      : `${baseUrl}/c/${slug}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.data.links && Array.isArray(data.data.links)) {
            const uniqueLinks = Array.from(
              new Map(data.data.links.map((item: any) => [item._id, item])).values()
            );
            data.data.links = uniqueLinks;
          }
          setCollection(data.data);
          setPasswordRequired(false);
          setError(false);
        } else if (data.passwordRequired) {
          setPasswordRequired(true);
          setCollection(null);
        } else {
          if (pwd) {
            alert(data.message || "Invalid password");
          } else {
            setError(true);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching collection:", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
        setSubmittingPassword(false);
      });
  };

  useEffect(() => {
    fetchCollection();
  }, [slug, API_BASE]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsAuthenticated(!!token);

    if (token && collection?._id) {
      fetch(`${API_BASE}/users/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const bookmarked = data.data.some((b: any) => b._id === collection._id);
            setIsBookmarked(bookmarked);
          }
        })
        .catch((err) => console.error("Error checking bookmark status:", err));
    }
  }, [collection, API_BASE]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch {
      // Silent fail
    }
  };

  const handleRedirect = async (url: string) => {
    setRedirecting(url);
    await new Promise((r) => setTimeout(r, 400));
    window.open(url, "_blank");
    setRedirecting(null);
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      alert("Please log in to bookmark collections");
      return;
    }
    if (!collection?._id) return;

    setBookmarkLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/collections/${collection._id}/bookmark`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        setIsBookmarked(data.bookmarked);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPassword(true);
    fetchCollection(passwordInput);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Password Protected</h2>
              <p className="text-muted-foreground">This collection is password protected. Please enter the password to view it.</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="text-center"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={submittingPassword}>
                {submittingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Access Collection
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-500">
        <Link2 className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Collection not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ===================== HEADER ===================== */}
      <div className="relative w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
        {/* Ambient Background Blur */}
        {collection.image && (
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none scale-110 blur-3xl"
            style={{
              backgroundImage: `url(${collection.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        <div className="relative px-5 py-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-500">
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <Sparkles className="h-3 w-3" /> Collection
                </Badge>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Link2 className="h-3.5 w-3.5" />
                  {collection.links?.length} links
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight animate-in fade-in slide-in-from-left-3 duration-700">
                {collection.name}
              </h1>

              {collection.description && (
                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl animate-in fade-in slide-in-from-left-4 duration-900">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center gap-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
                <a
                  href={`/profile/${collection.owner?.userName}`}
                  className="flex items-center gap-2 hover:text-foreground transition-all duration-300 group"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-background group-hover:ring-primary/20 transition-all duration-300">
                    <AvatarImage src={collection.owner?.profilePicUrl} />
                    <AvatarFallback>
                      {collection.owner?.userName?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm group-hover:underline underline-offset-4">
                    {collection.owner?.userName}
                  </span>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleBookmark}
                  disabled={bookmarkLoading}
                  className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm hover:bg-background transition-all duration-200"
                >
                  {bookmarkLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bookmark 
                      className={`h-4 w-4 transition-all duration-200 ${
                        isBookmarked ? 'fill-current text-primary' : ''
                      }`} 
                    />
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm hover:bg-background transition-all duration-200"
              >
                {shareSuccess ? (
                  <CheckCircle2 className="h-4 w-4 animate-in zoom-in-50 duration-200 text-green-500" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== CONTENT LAYOUT ===================== */}
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className={`gap-10 items-start ${collection.image ? 'grid lg:grid-cols-[350px_1fr]' : 'max-w-4xl mx-auto'}`}>
          
          {/* LEFT — IMAGE (STICKY DESKTOP) */}
          {collection.image && (
            <div className="hidden lg:block sticky top-8 animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50">
                <img
                  src={collection.image}
                  alt="Collection cover"
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          {/* MOBILE IMAGE */}
          {collection.image && (
            <div className="lg:hidden w-full animate-in fade-in zoom-in-95 duration-700 delay-300 mb-6">
              <img
                src={collection.image}
                alt="Collection cover"
                className="w-full h-auto rounded-xl shadow-lg border"
              />
            </div>
          )}

          {/* RIGHT — LINKS */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            {!collection.links?.length ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No links added yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {collection.links.map((link: any, index: number) => (
                  <Card
                    key={link._id}
                    className="group relative overflow-hidden border bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    style={{ animationDelay: `${index * 50 + 200}ms` }}
                    onClick={() => handleRedirect(`${SHORT_BASE_URL}/${link.customShortUrl || link.shortUrl}`)}
                  >
                    <CardContent className="p-0 sm:p-5 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                      {/* Link Image */}
                      <div className="w-full sm:w-56 aspect-video shrink-0 sm:rounded-lg overflow-hidden border-b sm:border bg-muted shadow-sm group-hover:shadow-md transition-all duration-300">
                        {link.image ? (
                          <img
                            src={link.image}
                            alt={link.title}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <UrlImagePlaceholder title={link.title} className="text-sm p-4" />
                        )}
                      </div>

                      {/* Link Details */}
                      <div className="flex-1 min-w-0 py-3 px-4 sm:py-1 sm:px-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
                            {link.title || "Untitled Link"}
                          </h3>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 -translate-x-2 group-hover:translate-x-0 hidden sm:block" />
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2 mb-4">
                          {link.description || link.longUrl}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="font-normal text-[10px] h-5 px-1.5 bg-secondary/50">
                            {getDomain(link.longUrl)}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(link.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Loading Overlay */}
                    {redirecting === `${SHORT_BASE_URL}/${link.customShortUrl || link.shortUrl}` && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t py-10 text-center text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
        <p className="text-sm">
          Powered by{" "}
          <a 
            href="https://linkerly.it" 
            className="font-medium text-foreground hover:text-primary transition-all duration-300 hover:underline underline-offset-4"
          >
            Linkerly
          </a>
        </p>
      </footer>
    </div>
  );
}