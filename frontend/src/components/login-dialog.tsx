"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Bookmark } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function LoginDialog({
  open,
  onOpenChange,
  title = "Login Required",
  description = "Please login to bookmark this collection and access more features.",
}: LoginDialogProps) {
  const router = useRouter();

  const handleLogin = () => {
    onOpenChange(false);
    router.push("/login");
  };

  const handleSignup = () => {
    onOpenChange(false);
    router.push("/signup");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-3 pt-4">
          <Button
            onClick={handleLogin}
            className="w-full gap-2 h-11 text-base font-semibold"
            size="lg"
          >
            <LogIn className="h-5 w-5" />
            Login to Continue
          </Button>
          
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t" />
          </div>

          <Button
            onClick={handleSignup}
            variant="outline"
            className="w-full gap-2 h-11 text-base font-semibold"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
