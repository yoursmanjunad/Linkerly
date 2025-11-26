// lib/hooks/useBookmark.ts
"use client";
import { useState, useEffect } from "react";
import { apiClient } from "./api";
export function useBookmark(collectionId: string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // try to read from localStorage for quick state (or call GET /users/bookmarks)
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(`bookmarked:${collectionId}`) : null;
      if (saved) setIsBookmarked(saved === "1");
    } catch {}
  }, [collectionId]);

  const toggleBookmark = async () => {
    setToggling(true);
    try {
      const resp = await apiClient(`/collections/${collectionId}/bookmark`, {
        method: "POST"
      });
      // backend returns { success, bookmarked: true/false }
      setIsBookmarked(!!resp.bookmarked);
      try {
        localStorage.setItem(`bookmarked:${collectionId}`, resp.bookmarked ? "1" : "0");
      } catch {}
    } catch (err) {
      // if not logged in, you might get 401. handle gracefully
      if ((err as any).message?.toLowerCase?.().includes("unauthorized")) {
        alert("Please login to bookmark collections.");
      } else {
        console.error(err);
        alert("Failed to toggle bookmark");
      }
    } finally {
      setToggling(false);
    }
  };

  return { isBookmarked, toggleBookmark, toggling };
}
