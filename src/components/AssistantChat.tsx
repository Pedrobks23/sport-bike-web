import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { handleSlashCommand } from "@/modules/assistant/actions";
import { sendToExtension, watchDocOnce } from "@/modules/assistant/genai";
import type { ChatMessage } from "@/types";

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 shadow
        ${isUser ? "bg-blue-600 text-white" : "bg-neutral-200 text-neutral-900"}`}
      >
        {msg.text.split("\n").map((line, i) => (
          <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
            {line}
          </p>
        ))}
        {msg.status && <div className="text-xs opacity-70 mt-1">status: {msg.status}</div>}
      </div>
    </div>
  );
}

export default function AssistantChat() {
  const [threadId] = useState(() => uuid());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      text:
        "Assistente Administrativo – Sport Bike. Use /help para comandos (clientes, serviços, OS, etc.).",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setBusy(true);

    try {
      // 1) Slash-commands: executa no Firestore sem IA
      if (text.startsWith("/")) {
        const result = await handleSlashCommand(text);
        setMessages((prev) => [...prev, { role: "assistant", text: result }]);
        setBusy(false);
        return;
      }

      // 2) Mensagem normal → EXTENSÃO (coleção "generate")
      const { id } = await sendToExtension(text, threadId);
      watchDocOnce(id, ({ response, status }) => {
        if (status?.state === "ERROR") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: "Erro ao processar pela extensão. Verifique os logs.",
              status: "ERROR",
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: response ?? "(sem resposta)" },
          ]);
        }
        setBusy(false);
      });
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Falha: ${e?.message ?? e}` },
      ]);
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy) void handleSend();
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <header className="p-3 border-b bg-neutral-50">
        <h1 className="text-lg font-semibold">Assistente Administrativo</h1>
        <p className="text-xs text-neutral-500">
          IA via extensão Firestore GenAI Chatbot · Digite /help
        </p>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
        {busy && <div className="text-xs text-neutral-500 px-2">Processando…</div>}
      </div>

      <div className="p-3 border-t bg-neutral-50">
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-xl px-3 py-2 outline-none focus:ring"
            placeholder='Escreva aqui… ex.: /cliente get nome:"João Silva"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
          />
          <button
            onClick={handleSend}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
