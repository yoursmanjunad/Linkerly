import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Link2,
} from "lucide-react";

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

export default function SocialLinks({ links = [] }: { links: any[] }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {links.map((s: any, i: number) => {
        const Icon = SOCIAL_ICONS[s.platform?.toLowerCase()] || Link2;
        const colorClass = SOCIAL_COLORS[s.platform?.toLowerCase()] || "hover:bg-primary hover:text-primary-foreground hover:border-primary";
        
        return (
          <Button
            key={s._id || i}
            variant="outline"
            size="icon"
            className={`h-11 w-11 rounded-full hover:scale-110 transition-all duration-300 shadow-sm ${colorClass}`}
            asChild
          >
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.platform}
            >
              <Icon className="h-5 w-5" />
            </a>
          </Button>
        );
      })}
    </div>
  );
}