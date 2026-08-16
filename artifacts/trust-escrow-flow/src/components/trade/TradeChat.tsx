import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTradeMessages } from "@/hooks/use-trade-messages";
import { useAuth } from "@/hooks/use-auth";

interface TradeChatProps {
  tradeId: string;
  disabled?: boolean;
}

export default function TradeChat({ tradeId, disabled }: TradeChatProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useTradeMessages(tradeId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
    setText("");
  };

  return (
    <div className="flex flex-col h-[300px] border rounded-lg bg-card">
      <div className="px-3 py-2 border-b">
        <span className="text-sm font-medium text-foreground">Trade Chat</span>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Say hello!</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    <p>{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
      <div className="flex gap-2 px-3 py-2 border-t">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? "Chat disabled" : "Type a message…"}
          disabled={disabled}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={disabled || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
