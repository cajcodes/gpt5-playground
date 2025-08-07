from openai import AsyncOpenAI

# In-memory storage for conversation summaries and memory toggle state
summaries = {}
memory_enabled = {}

async def get_context(thread_id: str, messages: list) -> list:
    """
    If memory is enabled and the conversation is long enough, it generates a summary
    of the last assistant reply and prepends it to the next request as a system message.
    """
    if not memory_enabled.get(thread_id, False) or len(messages) <= 10:
        return messages

    # Get summary of last assistant message if it exists
    if thread_id in summaries:
        summary = summaries[thread_id]
        return [{"role": "system", "content": f"Summary of previous conversation: {summary}"}] + messages[-1:]

    return messages


async def update_summary(thread_id: str, messages: list, client: AsyncOpenAI):
    """
    Updates the summary for a given thread ID if the conversation is long enough.
    """
    if not memory_enabled.get(thread_id, False) or len(messages) <= 10:
        return

    last_assistant_message = next((msg for msg in reversed(messages) if msg['role'] == 'assistant'), None)

    if last_assistant_message:
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",  # Using a smaller model for summarization
                messages=[
                    {"role": "system", "content": "Summarize the following in 50 tokens or less."},
                    {"role": "user", "content": last_assistant_message['content']}
                ],
            )
            summaries[thread_id] = response.choices[0].message.content
        except Exception as e:
            print(f"Error creating summary: {e}")
