import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clearChatHistory } from "@/lib/assistant.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, Trash2, User, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/assistant")({ component: AssistantPage });

type Msg = { id: string; role: string; content: string; created_at: string };

function AssistantPage() {
  const qc = useQueryClient();
  const clearFn = useServerFn(clearChatHistory);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat_messages"],
    queryFn: async (): Promise<Msg[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id,role,content,created_at")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming]);

  const send = useMutation({
    mutationFn: async (message: string) => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        const match = text.match(/data:\s*({.*})/);
        if (match) {
          try {
            const j = JSON.parse(match[1]);
            throw new Error(j.message || `Request failed (${res.status})`);
          } catch (e) {
            if (e instanceof Error && e.message) throw e;
          }
        }
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let errored: string | null = null;

      setStreaming("");
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const evt of events) {
            const lines = evt.split("\n");
            let eventName = "message";
            let dataStr = "";
            for (const l of lines) {
              if (l.startsWith("event:")) eventName = l.slice(6).trim();
              else if (l.startsWith("data:")) dataStr += l.slice(5).trim();
            }
            if (!dataStr) continue;
            if (dataStr === "[DONE]") continue;
            if (eventName === "error") {
              try {
                errored = JSON.parse(dataStr).message ?? "Stream error";
              } catch {
                errored = "Stream error";
              }
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.delta) {
                acc += parsed.delta;
                setStreaming(acc);
              }
            } catch {
              // ignore
            }
          }
        }
      } finally {
        setStreaming(null);
      }

      if (errored) throw new Error(errored);
      return acc;
    },
    onSuccess: () => {
      setInput("");
      qc.invalidateQueries({ queryKey: ["chat_messages"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clear = useMutation({
    mutationFn: async () => clearFn({}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat_messages"] });
      toast.success("Chat cleared");
    },
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">2 credits per message · Powered by Gemini</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => clear.mutate()} disabled={!messages.length}>
          <Trash2 className="h-4 w-4 mr-2" />Clear
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-start gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-neon" aria-hidden="true" />
          <p>
            AI-generated guidance, not licensed financial/legal/immigration advice. Always confirm with a professional before acting.
          </p>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streaming && (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Ask me about investments, currencies, countries, or your portfolio.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role !== "user" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-muted grid place-items-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {streaming !== null && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center shrink-0">
                <Bot className={`h-4 w-4 text-primary ${streaming === "" ? "animate-pulse" : ""}`} />
              </div>
              <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap bg-muted">
                {streaming === "" ? "Thinking…" : streaming}
              </div>
            </div>
          )}
        </div>

        <form
          className="border-t p-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = input.trim();
            if (!v || send.isPending) return;
            send.mutate(v);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a stock, country, currency, or your portfolio…"
            disabled={send.isPending}
          />
          <Button type="submit" disabled={send.isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
