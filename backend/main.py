import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
import json
from pydantic import BaseModel
from . import memory

# --- Pricing ---
# todo: load from config
PRICING = {
    "gpt-4o-mini": {"prompt": 0.00015, "completion": 0.0006},
    "gpt-4o": {"prompt": 0.005, "completion": 0.015},
}

def calc_cost(prompt_tokens: int, completion_tokens: int, model: str):
    """Calculates the cost of a request."""
    if model not in PRICING:
        return 0  # or raise an error
    
    prompt_cost = (prompt_tokens / 1000) * PRICING[model]["prompt"]
    completion_cost = (completion_tokens / 1000) * PRICING[model]["completion"]
    
    return prompt_cost + completion_cost



# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key and model from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Initialize the FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize the AsyncOpenAI client
# It's a good practice to initialize it once and reuse it across the application
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Pydantic model for the chat request
class ChatRequest(BaseModel):
    messages: list
    model: str | None = None

# Placeholder for the chat endpoints for now.
# I will implement these in the next steps.


async def chat_stream_generator(messages: list, model: str):
    """
    Asynchronous generator function to stream chat completions from OpenAI.
    It yields the content of each chunk as it's received.
    After the stream is finished, it yields a final chunk with usage statistics.
    """
    try:
        # Create a completion to get the full response with usage stats
        completion = await client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
        )

        # Yield each chunk's content
        async for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                yield content
        
        # After streaming, get the final response to access usage
        final_response = await completion.with_raw_response.parse()
        usage = final_response.usage
        cost = calc_cost(usage.prompt_tokens, usage.completion_tokens, model)

        usage_data = {
            "type": "usage",
            "usage": {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens,
                "cost": cost,
            }
        }
        yield json.dumps(usage_data)

    except Exception as e:
        # Handle potential exceptions, e.g., from the OpenAI API
        print(f"An error occurred: {e}")
        yield f"Error: {e}"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest, x_model: str | None = Header(default=None)):
    """
    POST endpoint to handle chat requests.
    It uses a streaming response to send back the chat completions.
    The model can be specified in the request body or with the 'X-Model' header.
    """
    model = request.model or x_model or OPENAI_MODEL
    return StreamingResponse(
        chat_stream_generator(request.messages, model),
        media_type="text/plain",
    )

class MemoryRequest(BaseModel):
    thread_id: str

@app.patch("/toggle_memory")
async def toggle_memory(request: MemoryRequest):
    """
    Toggles the memory feature for a given thread ID.
    """
    thread_id = request.thread_id
    memory.memory_enabled[thread_id] = not memory.memory_enabled.get(thread_id, False)
    return {"thread_id": thread_id, "memory_enabled": memory.memory_enabled[thread_id]}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for streaming chat completions.
    It accepts a JSON object with a 'messages' key and streams tokens back.
    After the stream is complete, it sends a final JSON chunk with usage statistics.
    """
    await websocket.accept()
    try:
        while True:
            # Receive message from the client
            data = await websocket.receive_json()
            messages = data["messages"]
            model = data.get("model", OPENAI_MODEL)
            thread_id = data.get("thread_id")

            if not thread_id:
                await websocket.close(code=1008, reason="Thread ID is required")
                return

            # Get context from memory
            messages_with_context = await memory.get_context(thread_id, messages)

            # Stream the response back to the client
            stream = await client.chat.completions.create(
                model=model,
                messages=messages_with_context,
                stream=True,
            )
            
            # Collect the full response for summary
            full_response_content = ""
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    full_response_content += content
                    await websocket.send_text(content)

            # Update summary
            assistant_message = {"role": "assistant", "content": full_response_content}
            await memory.update_summary(thread_id, messages + [assistant_message])

            # After streaming, get the full completion to access usage
            completion = await client.chat.completions.create(
                model=model,
                messages=messages_with_context,
                stream=False,
            )
            usage = completion.usage
            cost = calc_cost(usage.prompt_tokens, usage.completion_tokens, model)

            usage_data = {
                "type": "usage",
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens,
                    "cost": cost,
                }
            }
            await websocket.send_text(json.dumps(usage_data))
            
            # Send a closing message to indicate the end of the stream
            await websocket.send_text("[END_OF_STREAM]")

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"An error occurred in WebSocket: {e}")
        await websocket.close(code=1011, reason=f"An error occurred: {e}")


