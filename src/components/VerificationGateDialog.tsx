import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Shield } from "lucide-react";
import type { KycLevel } from "@/hooks/use-auth";

const levelMessages: Record<string, { title: string; description: string }> = {
  basic: {
    title: "Email & Phone Verification Required",
    description: "Verify your email and phone number to unlock this feature. This helps protect your account and other traders.",
  },
  verified: {
    title: "Identity Verification Required",
    description: "Complete identity verification to create sell offers and access higher trading limits up to ₹5,00,000.",
  },
  trusted: {
    title: "Advanced Verification Required",
    description: "Complete AML screening to unlock unlimited trading volume and full platform access.",
  },
};

interface VerificationGateDialogProps {
  open: boolean;
  onClose: () => void;
  requiredLevel: KycLevel;
  action?: string;
}

export default function VerificationGateDialog({ open, onClose, requiredLevel, action }: VerificationGateDialogProps) {
  const navigate = useNavigate();
  const msg = levelMessages[requiredLevel] ?? levelMessages.basic;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {msg.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action && <span className="block mb-2 font-medium text-foreground">{action}</span>}
            {msg.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => { onClose(); navigate("/verify"); }}>
            Verify Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
