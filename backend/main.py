import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key and model from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Initialize the FastAPI app
app = FastAPI()

# Initialize the AsyncOpenAI client
# It's a good practice to initialize it once and reuse it across the application
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Pydantic model for the chat request
class ChatRequest(BaseModel):
    messages: list

# Placeholder for the chat endpoints for now.
# I will implement these in the next steps.

async def chat_stream_generator(messages: list):
    """
    Asynchronous generator function to stream chat completions from OpenAI.
    It yields the content of each chunk as it's received.
    """
    try:
        stream = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            stream=True,
        )
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    except Exception as e:
        # Handle potential exceptions, e.g., from the OpenAI API
        print(f"An error occurred: {e}")
        yield f"Error: {e}"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    POST endpoint to handle chat requests.
    It uses a streaming response to send back the chat completions.
    """
    return StreamingResponse(
        chat_stream_generator(request.messages),
        media_type="text/plain",
    )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for streaming chat completions.
    It accepts a JSON object with a 'messages' key and streams tokens back.
    """
    await websocket.accept()
    try:
        while True:
            # Receive message from the client
            data = await websocket.receive_json()
            messages = data["messages"]

            # Stream the response back to the client
            stream = await client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                stream=True,
            )
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    await websocket.send_text(content)
            
            # Send a closing message to indicate the end of the stream
            # This is a custom convention, you can adjust it as needed.
            await websocket.send_text("[END_OF_STREAM]")

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"An error occurred in WebSocket: {e}")
        await websocket.close(code=1011, reason=f"An error occurred: {e}")


