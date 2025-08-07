"use client";

import { useState, useEffect, useRef, useContext } from "react";
import CostMeter from "../../components/CostMeter";
import ModelSelector from "../../components/ModelSelector";
import MemorySwitch from "../../components/MemorySwitch";
import { ModelContext } from "../../context/ModelContext";
import { parseSlashCommand } from "../../utils/parseSlash";

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

  const onMessageHandler = (event: MessageEvent) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === "usage") {
          setUsage(data.usage);
          return;
        }
      } catch (error) {
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

  const connect = () => {
    ws.current = new WebSocket("ws://localhost:8000/ws");
    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        // Attempt to reconnect after a short delay
        setTimeout(connect, 1000);
    };
    ws.current.onmessage = onMessageHandler;
  }

  useEffect(() => {
    setThreadId(`thread_${Date.now()}`);
    connect();

    // Cleanup WebSocket connection on component unmount
    return () => {
      ws.current?.close();
    };
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
        ws.current.send(JSON.stringify({ messages: newMessages, model: context.model, thread_id: threadId }));
      }
    } else {
      const userMessage: Message = { role: "user", content: input };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      ws.current.send(JSON.stringify({ messages: newMessages, model: context.model, thread_id: threadId }));
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
              className={`max-w-lg p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-black"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-700">
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
