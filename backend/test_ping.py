import requests
import json
import argparse

def test_ping(model: str):
    """
    Sends a POST request to the /chat endpoint with a simple "ping" message
    and prints the response.
    """
    url = "http://localhost:8000/chat"
    data = {
        "messages": [
            {"role": "user", "content": "ping"}
        ],
        "model": model
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, data=json.dumps(data), headers=headers, stream=True)
        response.raise_for_status()  # Raise an exception for bad status codes

        full_response = ""
        usage_data = None

        print("Response from /chat endpoint:")
        for chunk in response.iter_content(chunk_size=None):
            if chunk:
                chunk_text = chunk.decode('utf-8')
                try:
                    # Check if the chunk is the final usage data
                    data = json.loads(chunk_text)
                    if data.get("type") == "usage":
                        usage_data = data
                        continue
                except json.JSONDecodeError:
                    # It's a regular text chunk
                    pass
                
                full_response += chunk_text

        print(full_response[:100])
        
        if usage_data:
            print("\n--- Usage ---")
            print(f"Cost: ${usage_data['usage']['cost']:.6f}")
            print(f"Total Tokens: {usage_data['usage']['total_tokens']}")
        else:
            print("\nUsage data not found in response.")


    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the /chat endpoint.")
    parser.add_argument("--model", type=str, default="gpt-4o-mini", help="The model to use for the chat.")
    args = parser.parse_args()
    test_ping(args.model)
