"use client";

import { useState, useEffect, useRef, useContext, useCallback } from "react";
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
  const [threadId, setThreadId] = useState("");
  const context = useContext(ModelContext);
  const ws = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // API endpoint (Edge function on Vercel)
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""; // when hosted on Vercel, empty = same origin

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
    // You can add any specific logic here if needed
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
    if (!res.ok || !res.body) return;
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
  };

  useEffect(() => {
    setThreadId(`thread_${Date.now()}`);
  }, []);

  useEffect(() => {
    if (ws.current) {
        ws.current.onmessage = onMessageHandler;
    }
  }, [messages]);


  useEffect(() => {
    // Auto-scroll to the bottom
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN || !context) {
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
        fetchStream({ messages: newMessages, model: context.model });
      }
    } else {
      const userMessage: Message = { role: "user", content: input };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
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
        <ModelSelector />
        {threadId && <MemorySwitch threadId={threadId} />}
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
            <button onClick={handleSendMessage} className="ml-2 p-2 bg-blue-600 rounded-lg">Send</button>
        </div>
        <CostMeter totalTokens={usage.total_tokens} totalCost={usage.cost} />
      </div>
    </div>
  );
}
