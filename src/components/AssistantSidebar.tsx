import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import AssistantChat from "@/components/AssistantChat";

export default function AssistantSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        aria-label="Abrir assistente"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          ></div>
          <div className="relative w-full max-w-md h-full bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
              aria-label="Fechar assistente"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-full pt-10">
              <AssistantChat />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
