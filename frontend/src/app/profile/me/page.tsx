"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { uploadImageToImageKit } from "@/lib/upload-kit";

export default function ProfileEditor() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>({
    userName: "",
    bio: "",
    socialLinks: [],
    profilePicUrl: "",
  });

  useEffect(() => {
    fetch(`${API}/profiles/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfile(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/profiles/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated!");
      } else {
        toast.error(data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadImageToImageKit(file);
    setProfile((prev: any) => ({ ...prev, profilePicUrl: url }));
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <Card className="p-6 space-y-6">
        <h2 className="text-2xl font-semibold">Edit Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <img
            src={profile.profilePicUrl || "/placeholder.svg"}
            className="w-20 h-20 rounded-full object-cover border"
          />
          <Input type="file" onChange={handleImageUpload} />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input
            value={profile.userName}
            onChange={(e) =>
              setProfile({ ...profile, userName: e.target.value })
            }
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <Textarea
            value={profile.bio}
            onChange={(e) =>
              setProfile({ ...profile, bio: e.target.value })
            }
          />
        </div>

        {/* Social Links */}
        <Button onClick={() =>
          setProfile({
            ...profile,
            socialLinks: [...profile.socialLinks, { platform: "", url: "" }],
          })
        }>
          Add Social Link
        </Button>

        {profile.socialLinks.map((s: any, i: number) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Platform"
              value={s.platform}
              onChange={(e) => {
                const newLinks = [...profile.socialLinks];
                newLinks[i].platform = e.target.value;
                setProfile({ ...profile, socialLinks: newLinks });
              }}
            />
            <Input
              placeholder="URL"
              value={s.url}
              onChange={(e) => {
                const newLinks = [...profile.socialLinks];
                newLinks[i].url = e.target.value;
                setProfile({ ...profile, socialLinks: newLinks });
              }}
            />
          </div>
        ))}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Card>
    </div>
  );
}
