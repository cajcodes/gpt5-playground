"use client";

interface CostMeterProps {
  totalTokens: number;
  totalCost: number;
}

export default function CostMeter({ totalTokens, totalCost }: CostMeterProps) {
  return (
    <div className="text-sm text-gray-400">
      <span>Tokens: {totalTokens}</span>
      <span className="mx-2">•</span>
      <span>Cost: ${totalCost.toFixed(6)}</span>
    </div>
  );
}

