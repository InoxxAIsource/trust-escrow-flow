import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Receipt, Send, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSendTradeMessage, useAttachmentUrl, describeTradeError } from "@/hooks/use-demo-trade";
import {
  ACCEPTED_ATTACHMENT_MIME,
  MAX_ATTACHMENT_BYTES,
  type TradeMessage,
} from "@/integrations/supabase/demo";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ROLE_LABELS: Record<TradeMessage["sender_role"], string> = {
  buyer: "You",
  seller: "Counterparty",
  admin: "P2PxBT Operator",
  system: "System",
};

export function DemoTradeChat({
  tradeId,
  messages,
  isLoading,
  readOnly,
  /** When viewing as an operator, "buyer" messages are the other party. */
  viewerRole = "buyer",
}: {
  tradeId: string;
  messages: TradeMessage[];
  isLoading: boolean;
  readOnly?: boolean;
  viewerRole?: "buyer" | "admin";
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const send = useSendTradeMessage(tradeId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so re-picking the same file still fires onChange.
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("That file is larger than 5 MB.");
      return;
    }
    if (!ACCEPTED_ATTACHMENT_MIME.includes(file.type)) {
      toast.error("Attach a PNG, JPEG, WebP, HEIC or PDF.");
      return;
    }
    setPending(file);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text && !pending) return;
    try {
      await send.mutateAsync({ message: text, file: pending ?? undefined });
      setDraft("");
      setPending(null);
    } catch (error) {
      toast.error(describeTradeError(error));
    }
  };

  return (
    <Card className="flex h-[32rem] flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="font-display text-base">Trade chat</CardTitle>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-0">
        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. An operator will be in touch with payment details shortly.
            </p>
          ) : (
            <div className="space-y-3 pb-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} viewerRole={viewerRole} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {!readOnly && (
          <div className="flex-shrink-0 border-t border-border p-4">
            {pending && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5">
                <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {pending.name}
                </span>
                <span className="flex-shrink-0 font-mono text-[11px] text-muted-foreground">
                  {formatBytes(pending.size)}
                </span>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Remove attachment</span>
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_ATTACHMENT_MIME.join(",")}
                onChange={pickFile}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileRef.current?.click()}
                disabled={send.isPending}
                title="Attach a receipt or document"
              >
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach a file</span>
              </Button>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={pending ? "Add a note (optional)…" : "Write a message…"}
                maxLength={2000}
                aria-label="Message"
              />
              <Button
                onClick={handleSend}
                disabled={(!draft.trim() && !pending) || send.isPending}
                size="icon"
              >
                {send.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MessageBubble({
  message,
  viewerRole,
}: {
  message: TradeMessage;
  viewerRole: "buyer" | "admin";
}) {
  const isOwn = message.sender_role === viewerRole;
  const isSystem = message.sender_role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <p className="rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
          {message.message}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-[11px] font-medium text-muted-foreground">
          {isOwn ? "You" : ROLE_LABELS[message.sender_role]}
        </span>
        <time dateTime={message.created_at} className="text-[11px] text-muted-foreground/70">
          {timeOf(message.created_at)}
        </time>
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          message.is_payment_details
            ? "w-full max-w-full border border-amber-500/30 bg-amber-500/[0.06]"
            : isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
        )}
      >
        {message.is_payment_details && (
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Payment details
            </span>
          </div>
        )}
        {message.message && (
          <p
            className={cn(
              "whitespace-pre-wrap break-words",
              message.is_payment_details && "font-mono text-xs",
            )}
          >
            {message.message}
          </p>
        )}

        {message.attachment_path && (
          <AttachmentLink message={message} isOwn={isOwn} hasText={!!message.message} />
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Attachments live in a private bucket, so there is no durable URL to render.
 * The link mints a short-lived signed URL on click, which also means the read
 * is authorised at the moment of viewing rather than when the page loaded.
 */
function AttachmentLink({
  message,
  isOwn,
  hasText,
}: {
  message: TradeMessage;
  isOwn: boolean;
  hasText: boolean;
}) {
  const signed = useAttachmentUrl();

  const open = async () => {
    try {
      const url = await signed.mutateAsync(message.attachment_path!);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("That attachment could not be opened.");
    }
  };

  const isImage = message.attachment_mime?.startsWith("image/");

  return (
    <button
      type="button"
      onClick={open}
      disabled={signed.isPending}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
        hasText && "mt-2",
        isOwn
          ? "border-primary-foreground/25 hover:bg-primary-foreground/10"
          : "border-border bg-background/60 hover:bg-background",
      )}
    >
      {signed.isPending ? (
        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
      ) : message.is_receipt ? (
        <Receipt className="h-4 w-4 flex-shrink-0" />
      ) : (
        <FileText className="h-4 w-4 flex-shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">
          {message.attachment_name ?? "Attachment"}
        </span>
        <span className={cn("block text-[11px]", isOwn ? "opacity-75" : "text-muted-foreground")}>
          {message.is_receipt ? "Payment receipt · " : ""}
          {isImage ? "Image" : "PDF"}
          {message.attachment_size ? ` · ${formatBytes(message.attachment_size)}` : ""}
        </span>
      </span>
    </button>
  );
}
