"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./MoodToggle";
import { CgProfile } from "react-icons/cg";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [username, setUsername] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUsername(data.user.userName || null);
          setProfileImage(data.user.profileImage || null); // 👈 fetch image
        }
      })
      .catch(() => {
        setUsername(null);
        setProfileImage(null);
      });
  }, []);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />

        <div className="ml-auto flex items-center gap-2">

          {/* ======================= DESKTOP PROFILE ======================= */}
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href={username ? `/profile/${username}` : "/login"}
              className="dark:text-foreground flex items-center gap-2"
            >
              {/* IMAGE OR ICON */}
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <CgProfile className="h-5 w-5" />
              )}

              Profile
            </a>
          </Button>

          {/* ======================= MOBILE PROFILE ======================= */}
          <Button variant="ghost" size="icon" asChild className="flex sm:hidden">
            <a href={username ? `/profile/${username}` : "/login"}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <CgProfile className="h-6 w-6" />
              )}
            </a>
          </Button>

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
