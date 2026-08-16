import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Receipt, Send, ShieldCheck, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSendTradeMessage, useAttachmentUrl, describeTradeError, type TradeMessageContext } from "@/hooks/use-demo-trade";
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
  viewerRole = "buyer",
  canUploadReceipt,
  tradeContext,
}: {
  tradeId: string;
  messages: TradeMessage[];
  isLoading: boolean;
  readOnly?: boolean;
  viewerRole?: "buyer" | "admin";
  /** When true, shows the "Upload receipt" quick button in Documents tab. */
  canUploadReceipt?: boolean;
  /** Optional trade metadata used for admin email notifications. */
  tradeContext?: TradeMessageContext;
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNote, setDocNote] = useState("");
  const [docSending, setDocSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);
  const send = useSendTradeMessage(tradeId, tradeContext);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Chat attachments — attached alongside a message
  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) { toast.error("File is larger than 5 MB."); return; }
    if (!ACCEPTED_ATTACHMENT_MIME.includes(file.type)) { toast.error("Attach a PNG, JPEG, WebP, HEIC or PDF."); return; }
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

  // Doc-tab uploads — standalone document or receipt
  const pickDoc = (e: React.ChangeEvent<HTMLInputElement>, isReceipt = false) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) { toast.error("File is larger than 5 MB."); return; }
    if (!ACCEPTED_ATTACHMENT_MIME.includes(file.type)) { toast.error("Attach a PNG, JPEG, WebP, HEIC or PDF."); return; }
    setDocFile(file);
    if (isReceipt) setDocNote("Payment receipt");
  };

  const handleDocUpload = async (isReceipt = false) => {
    if (!docFile) return;
    setDocSending(true);
    try {
      await send.mutateAsync({
        message: docNote.trim() || (isReceipt ? "Payment receipt" : "Document"),
        file: docFile,
        isReceipt,
      });
      toast.success(isReceipt ? "Receipt uploaded." : "Document uploaded.");
      setDocFile(null);
      setDocNote("");
    } catch (error) {
      toast.error(describeTradeError(error));
    } finally {
      setDocSending(false);
    }
  };

  // All messages that have attachments (shown in Documents tab)
  const attachments = messages.filter((m) => m.attachment_path);

  return (
    <Card className="flex h-[36rem] flex-col">
      <CardHeader className="flex-shrink-0 pb-0 pt-4 px-6">
        <Tabs defaultValue="chat" className="w-full">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base">Trade chat</CardTitle>
            <TabsList className="h-8">
              <TabsTrigger value="chat" className="h-7 text-xs px-3">Chat</TabsTrigger>
              <TabsTrigger value="docs" className="h-7 text-xs px-3">
                Documents
                {attachments.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {attachments.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Chat tab ──────────────────────────────────────────────── */}
          <TabsContent value="chat" className="mt-0 flex min-h-0 flex-col" style={{ height: "calc(36rem - 72px)" }}>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-0 pt-3">
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
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{pending.name}</span>
                      <span className="flex-shrink-0 font-mono text-[11px] text-muted-foreground">{formatBytes(pending.size)}</span>
                      <button type="button" onClick={() => setPending(null)} className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" /><span className="sr-only">Remove</span>
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input ref={fileRef} type="file" className="hidden" accept={ACCEPTED_ATTACHMENT_MIME.join(",")} onChange={pickFile} />
                    <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={send.isPending} title="Attach a file">
                      <Paperclip className="h-4 w-4" /><span className="sr-only">Attach</span>
                    </Button>
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={pending ? "Add a note (optional)…" : "Write a message… (Shift+Enter for new line)"}
                      maxLength={2000}
                      aria-label="Message"
                      rows={1}
                      className="resize-none min-h-[36px] max-h-32 overflow-y-auto"
                    />
                    <Button onClick={handleSend} disabled={(!draft.trim() && !pending) || send.isPending} size="icon">
                      {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </TabsContent>

          {/* ── Documents tab ────────────────────────────────────────── */}
          <TabsContent value="docs" className="mt-0 flex min-h-0 flex-col" style={{ height: "calc(36rem - 72px)" }}>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-0 pt-3">
              <ScrollArea className="flex-1 px-6">
                {attachments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No documents uploaded yet.
                  </p>
                ) : (
                  <div className="space-y-2 pb-4">
                    <p className="text-xs text-muted-foreground">{attachments.length} file{attachments.length !== 1 ? "s" : ""} shared in this trade</p>
                    {attachments.map((m) => (
                      <DocRow key={m.id} message={m} viewerRole={viewerRole} />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {!readOnly && (
                <div className="flex-shrink-0 space-y-3 border-t border-border p-4">
                  {/* Receipt quick-upload when payment details have been sent */}
                  {canUploadReceipt && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-foreground">Upload payment receipt</p>
                      <ReceiptUploadArea
                        receiptRef={receiptRef}
                        docFile={docFile}
                        setDocFile={setDocFile}
                        setDocNote={setDocNote}
                        onUpload={() => handleDocUpload(true)}
                        isSending={docSending}
                        pickDoc={pickDoc}
                        docNote={docNote}
                      />
                    </div>
                  )}

                  {/* General document upload */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground">Upload additional document</p>
                    <DocUploadArea
                      docRef={docRef}
                      docFile={docFile}
                      setDocFile={setDocFile}
                      docNote={docNote}
                      setDocNote={setDocNote}
                      onUpload={() => handleDocUpload(false)}
                      isSending={docSending}
                      pickDoc={(e) => pickDoc(e, false)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}

// ── Upload area sub-components ───────────────────────────────────────────────

function DocUploadArea({
  docRef, docFile, setDocFile, docNote, setDocNote, onUpload, isSending, pickDoc,
}: {
  docRef: React.RefObject<HTMLInputElement>;
  docFile: File | null;
  setDocFile: (f: File | null) => void;
  docNote: string;
  setDocNote: (s: string) => void;
  onUpload: () => void;
  isSending: boolean;
  pickDoc: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <input ref={docRef} type="file" className="hidden" accept={ACCEPTED_ATTACHMENT_MIME.join(",")} onChange={pickDoc} />
      {docFile ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5">
          <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{docFile.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{formatBytes(docFile.size)}</span>
          <button type="button" onClick={() => setDocFile(null)} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => docRef.current?.click()}
          className="flex w-full flex-col items-center gap-1 rounded-md border border-dashed border-border px-3 py-4 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Upload className="h-4 w-4" />
          <span className="text-xs font-medium">Choose a document</span>
          <span className="text-[11px]">PNG, JPEG, WebP, HEIC or PDF · up to 5 MB</span>
        </button>
      )}
      {docFile && (
        <div className="flex gap-2">
          <Input
            value={docNote}
            onChange={(e) => setDocNote(e.target.value)}
            placeholder="Brief description (optional)…"
            maxLength={120}
            className="text-xs"
          />
          <Button size="sm" onClick={onUpload} disabled={isSending || !docFile}>
            {isSending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
            Send
          </Button>
        </div>
      )}
    </div>
  );
}

function ReceiptUploadArea({
  receiptRef, docFile, setDocFile, setDocNote, onUpload, isSending, pickDoc, docNote,
}: {
  receiptRef: React.RefObject<HTMLInputElement>;
  docFile: File | null;
  setDocFile: (f: File | null) => void;
  setDocNote: (s: string) => void;
  onUpload: () => void;
  isSending: boolean;
  pickDoc: (e: React.ChangeEvent<HTMLInputElement>, isReceipt?: boolean) => void;
  docNote: string;
}) {
  return (
    <div className="space-y-2">
      <input
        ref={receiptRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_ATTACHMENT_MIME.join(",")}
        onChange={(e) => pickDoc(e, true)}
      />
      {docFile ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/[0.05] px-2.5 py-1.5">
          <Receipt className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{docFile.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{formatBytes(docFile.size)}</span>
          <button type="button" onClick={() => setDocFile(null)} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => receiptRef.current?.click()}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-emerald-500/40 bg-emerald-500/[0.04] px-4 py-3 text-emerald-700 dark:text-emerald-400 transition-colors hover:border-emerald-500/60"
        >
          <Receipt className="h-4 w-4 flex-shrink-0" />
          <div className="text-left">
            <p className="text-xs font-medium">Attach payment receipt</p>
            <p className="text-[11px] opacity-70">Bank screenshot, PDF confirmation · up to 5 MB</p>
          </div>
        </button>
      )}
      {docFile && (
        <Button size="sm" className="w-full" onClick={onUpload} disabled={isSending}>
          {isSending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Receipt className="mr-1.5 h-3.5 w-3.5" />}
          Upload receipt
        </Button>
      )}
    </div>
  );
}

// ── Message bubble (chat tab) ─────────────────────────────────────────────────

function MessageBubble({ message, viewerRole }: { message: TradeMessage; viewerRole: "buyer" | "admin" }) {
  const isOwn = message.sender_role === viewerRole;
  const isSystem = message.sender_role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <p className="rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">{message.message}</p>
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
            : isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
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
          <p className={cn("whitespace-pre-wrap break-words", message.is_payment_details && "font-mono text-xs")}>
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

// ── Doc row (documents tab) ───────────────────────────────────────────────────

function DocRow({ message, viewerRole }: { message: TradeMessage; viewerRole: "buyer" | "admin" }) {
  const isOwn = message.sender_role === viewerRole;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md", message.is_receipt ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary")}>
        {message.is_receipt ? <Receipt className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {message.attachment_name ?? (message.is_receipt ? "Receipt" : "Document")}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {isOwn ? "You" : ROLE_LABELS[message.sender_role]} · {timeOf(message.created_at)}
          {message.is_receipt && " · Payment receipt"}
          {message.attachment_size ? ` · ${formatBytes(message.attachment_size)}` : ""}
        </p>
        {message.message && message.message !== "Payment receipt" && message.message !== "Document" && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{message.message}</p>
        )}
      </div>
      <AttachmentOpenButton message={message} />
    </div>
  );
}

function AttachmentOpenButton({ message }: { message: TradeMessage }) {
  const signed = useAttachmentUrl();
  const open = async () => {
    try {
      const url = await signed.mutateAsync(message.attachment_path!);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("That attachment could not be opened.");
    }
  };
  return (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={open} disabled={signed.isPending}>
      {signed.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Open"}
    </Button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Attachments live in a private bucket, so there is no durable URL to render.
 * The link mints a short-lived signed URL on click.
 */
function AttachmentLink({ message, isOwn, hasText }: { message: TradeMessage; isOwn: boolean; hasText: boolean }) {
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
        isOwn ? "border-primary-foreground/25 hover:bg-primary-foreground/10" : "border-border bg-background/60 hover:bg-background",
      )}
    >
      {signed.isPending ? <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" /> : message.is_receipt ? <Receipt className="h-4 w-4 flex-shrink-0" /> : <FileText className="h-4 w-4 flex-shrink-0" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{message.attachment_name ?? "Attachment"}</span>
        <span className={cn("block text-[11px]", isOwn ? "opacity-75" : "text-muted-foreground")}>
          {message.is_receipt ? "Payment receipt · " : ""}
          {isImage ? "Image" : "PDF"}
          {message.attachment_size ? ` · ${formatBytes(message.attachment_size)}` : ""}
        </span>
      </span>
    </button>
  );
}
