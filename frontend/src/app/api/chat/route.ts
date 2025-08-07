import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge"; // Vercel Edge

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    const stream = await client.chat.completions.create({
      model: model || process.env.OPENAI_MODEL || "gpt-5",
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices?.[0]?.delta?.content ?? "";
            if (token) controller.enqueue(encoder.encode(`data: ${token}\n\n`));
          }
          // Non-streamed call to fetch usage for pricing
          const finalModel = (model || process.env.OPENAI_MODEL || "gpt-5") as string;
          const completion = await client.chat.completions.create({
            model: finalModel,
            messages,
            stream: false,
          });

          const usage = completion.usage;
          const PRICING: Record<string, { prompt: number; completion: number }> = {
            "gpt-5": { prompt: 1.25, completion: 10.0 },
            "gpt-5-mini": { prompt: 0.25, completion: 2.0 },
            "gpt-5-nano": { prompt: 0.05, completion: 0.4 },
          };
          const TOKEN_DENOMINATOR = 1_000_000;
          const calcCost = (promptTokens = 0, completionTokens = 0, m: string) => {
            const p = PRICING[m];
            if (!p) return 0;
            return (
              (promptTokens / TOKEN_DENOMINATOR) * p.prompt +
              (completionTokens / TOKEN_DENOMINATOR) * p.completion
            );
          };

          const prompt_tokens = usage?.prompt_tokens ?? 0;
          const completion_tokens = usage?.completion_tokens ?? 0;
          const total_tokens = usage?.total_tokens ?? prompt_tokens + completion_tokens;
          const cost = calcCost(prompt_tokens, completion_tokens, finalModel);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "usage",
                usage: { prompt_tokens, completion_tokens, total_tokens, cost },
              })}\n\n`
            )
          );

          controller.enqueue(encoder.encode(`data: [END_OF_STREAM]\n\n`));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    return new Response(`Error: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}
