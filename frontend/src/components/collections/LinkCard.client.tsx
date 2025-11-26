// components/collections/LinkCard.client.tsx
"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function LinkCard({ link }: any) {
  return (
    <Card className="p-4 flex items-center justify-between hover:shadow-lg transition">
      <div className="min-w-0">
        <div className="font-medium truncate">{link.title}</div>
        <div className="text-xs text-muted-foreground truncate">{link.description || link.longUrl}</div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <a href={link.longUrl} target="_blank" rel="noreferrer" className="inline-flex">
          <Button variant="ghost" size="icon" aria-label={`Open ${link.title}`}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>
    </Card>
  );
}
