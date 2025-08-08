"use client";

import { useState, useEffect, useRef, useContext } from "react";
import CostMeter from "../../components/CostMeter";
import ModelSelector from "../../components/ModelSelector";
import MemorySwitch from "../../components/MemorySwitch";
import { ModelContext } from "../../context/ModelContext";
import { parseSlashCommand } from "../../utils/parseSlash";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';


interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
}


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<Usage>({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 });
  const [isSending, setIsSending] = useState(false);
  const [threadId, setThreadId] = useState("");
  const context = useContext(ModelContext);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Edge API endpoint lives at /api/chat (same origin on Vercel)

  const onMessageHandler = (event: MessageEvent) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === "usage") {
          setUsage(data.usage);
          return;
        }
      } catch {
        // It's a regular text chunk
      }

  if (event.data === "[END_OF_STREAM]") {
    // End of stream message
    return;
  }

  setMessages((prevMessages) => {
    const lastMessage = prevMessages[prevMessages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      // Append to the last assistant message
      const updatedMessages = [...prevMessages];
      updatedMessages[prevMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + event.data,
      };
      return updatedMessages;
    } else {
      // Start a new assistant message
      return [...prevMessages, { role: "assistant", content: event.data }];
    }
  });
  };

  // SSE fetch helper
  const fetchStream = async (payload: unknown) => {
    const res = await fetch(`/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok || !res.body) { setIsSending(false); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      chunk.split("\n\n").forEach((line) => {
        if (!line.startsWith("data: ")) return;
        const data = line.slice(6);
        if (data === "[END_OF_STREAM]") return;
        onMessageHandler({ data } as MessageEvent);
      });
    }
    setIsSending(false);
  };

  useEffect(() => {
    setThreadId(`thread_${Date.now()}`);
  }, []);

  useEffect(() => {
    // Auto-scroll to the bottom
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !context) {
      return;
    }

    const slashResult = parseSlashCommand(input);

    if (slashResult.handled) {
      if (slashResult.reset) {
        setMessages([]);
        setUsage({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 });
      } else if (slashResult.payload) {
        // This is where you would handle the /image command.
        // For now, we'll just log it to the console.
        console.log("Image generation payload:", slashResult.payload);
      } else if (slashResult.systemMessage) {
        const systemMessage: Message = { role: "system", content: slashResult.systemMessage };
        const newMessages = [...messages, systemMessage];
        setMessages(newMessages); // Update the state with the system message
        setIsSending(true);
        fetchStream({ messages: newMessages, model: context.model });
      }
    } else {
      const userMessage: Message = { role: "user", content: input };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsSending(true);
      fetchStream({ messages: newMessages, model: context.model });
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold">Hi Chris 👋</h2>
          <span className="text-sm text-white/60">Welcome back</span>
        </div>
        <div className="flex items-center gap-3">
          <ModelSelector />
          {threadId && <MemorySwitch threadId={threadId} />}
          <button
            onClick={() => {
              document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              window.location.href = "/login";
            }}
            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        {messages.filter(msg => msg.role !== 'system').map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`prose dark:prose-invert max-w-lg p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-black"
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                >
                    {msg.content}
                </ReactMarkdown>
                ) : (
                msg.content
                )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 pb-16 border-t border-gray-700">
        <div className="flex items-center">
            <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
            style={{ overflowY: 'hidden' }}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
            }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !input.trim()}
              className={`ml-2 p-2 rounded-lg ${isSending ? "bg-blue-400 cursor-not-allowed opacity-70" : "bg-blue-600"}`}
            >
              {isSending ? "Sending…" : "Send"}
            </button>
        </div>
        <CostMeter totalTokens={usage.total_tokens} totalCost={usage.cost} />
      </div>
    </div>
  );
}
