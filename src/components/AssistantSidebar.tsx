import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import AssistantChat from "@/components/AssistantChat";

export default function AssistantSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-blue-600 text-white p-4 shadow-lg hover:bg-blue-700"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="w-full max-w-md h-full bg-white shadow-xl flex flex-col">
            <div className="p-2 border-b flex justify-end">
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssistantChat />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
