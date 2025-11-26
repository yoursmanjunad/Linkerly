import { useState, useEffect } from "react";
import { Copy, Plus, LogOut, ArrowLeft, Check } from "lucide-react";

export function Main({ token, user, onLogout }: any) {
  const [view, setView] = useState<"main" | "create-collection">("main");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchCollections = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCollections(data.data.collections || []);
      }
    } catch (err) {
      console.error("Failed to fetch collections", err);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [token]);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        const activeTab = tabs[0];
        if (activeTab?.url) {
          setUrl(activeTab.url);
          setTitle(activeTab.title || "");
        }
      });
    } else {
        setUrl("https://example.com");
        setTitle("Example Website");
    }
  }, []);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShortenedUrl(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/url/shorten`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
            longUrl: url,
            title: title,
            collectionId: collectionId || null
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShortenedUrl(data.data);
      } else {
        setError(data.message || "Failed to shorten URL");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shortenedUrl) {
        const baseUrl = import.meta.env.VITE_SHORT_BASE_URL || "http://localhost:3000";
        navigator.clipboard.writeText(`${baseUrl}/${shortenedUrl.shortUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (view === "create-collection") {
      return <CreateCollection token={token} onBack={() => setView("main")} onSuccess={() => {
          fetchCollections();
          setView("main");
      }} />;
  }

  return (
    <div className="p-4 space-y-4 bg-background text-foreground min-h-[400px] w-[350px]">
      <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold">Shorten URL</h2>
          <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{user?.userName}</span>
              <button onClick={onLogout} className="text-muted-foreground hover:text-destructive transition-colors" title="Logout">
                  <LogOut className="h-4 w-4" />
              </button>
          </div>
      </div>

      {shortenedUrl ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                  <p className="text-sm font-medium text-primary">Successfully Shortened!</p>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-md px-2 py-1">
                      <input 
                        readOnly 
                        value={`${import.meta.env.VITE_SHORT_BASE_URL || "http://localhost:3000"}/${shortenedUrl.shortUrl}`} 
                        className="flex-1 bg-transparent text-sm border-none focus:ring-0 p-1 text-foreground"
                      />
                      <button onClick={handleCopy} className="text-primary hover:text-primary/80 p-1">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                  </div>
              </div>
              <button 
                onClick={() => setShortenedUrl(null)}
                className="w-full py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors"
              >
                  Shorten Another
              </button>
          </div>
      ) : (
          <form onSubmit={handleShorten} className="space-y-4">
              <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Destination URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-transparent border-border focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    required
                    placeholder="https://..."
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Title (Optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-transparent border-border focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="My Link"
                  />
              </div>
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Collection</label>
                      <button 
                        type="button" 
                        onClick={() => setView("create-collection")}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                          <Plus className="h-3 w-3" /> New
                      </button>
                  </div>
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-transparent border-border focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  >
                      <option value="">Uncategorized</option>
                      {collections.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                  </select>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                  {loading ? "Shortening..." : "Shorten URL"}
              </button>
          </form>
      )}
    </div>
  );
}

function CreateCollection({ token, onBack, onSuccess }: any) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/collections`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, isPublic: false }) // Default to private for quick create
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
            } else {
                setError(data.message || "Failed to create collection");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-4 bg-background text-foreground min-h-[400px] w-[350px]">
            <div className="flex items-center gap-2 border-b border-border pb-4">
                <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-lg font-bold">New Collection</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Collection Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-transparent border-border focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                        required
                        placeholder="e.g. Work, Personal"
                        autoFocus
                    />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {loading ? "Creating..." : "Create Collection"}
                </button>
            </form>
        </div>
    );
}
