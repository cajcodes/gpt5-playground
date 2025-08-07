"use client";

import { useState } from "react";

interface MemorySwitchProps {
  threadId: string;
}

export default function MemorySwitch({ threadId }: MemorySwitchProps) {
  const [isMemoryEnabled, setIsMemoryEnabled] = useState(false);

  const handleToggle = async () => {
    try {
      const response = await fetch("http://localhost:8000/toggle_memory", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ thread_id: threadId }),
      });
      const data = await response.json();
      setIsMemoryEnabled(data.memory_enabled);
    } catch (error) {
      console.error("Failed to toggle memory:", error);
    }
  };

  return (
    <div className="flex items-center">
      <label htmlFor="memory-switch" className="mr-2 text-sm">
        Memory
      </label>
      <button
        id="memory-switch"
        onClick={handleToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out ${
          isMemoryEnabled ? "bg-green-500" : "bg-gray-600"
        }`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
            isMemoryEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

