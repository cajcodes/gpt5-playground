"use client";

import { useContext } from "react";
import { ModelContext } from "../context/ModelContext";

const models = ["gpt-4o-mini", "gpt-4o", "gpt-5 (soon)"];

export default function ModelSelector() {
  const context = useContext(ModelContext);

  if (!context) {
    throw new Error("ModelSelector must be used within a ModelProvider");
  }

  const { model, setModel } = context;

  return (
    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      className="p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {models.map((m) => (
        <option key={m} value={m} disabled={m.includes("soon")}>
          {m}
        </option>
      ))}
    </select>
  );
}

