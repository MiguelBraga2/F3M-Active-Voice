import requests
import json
import sys 

# Define the schema for health-related information
schema = {
    "name": {
        "type": "string",
        "description": "The name of the person"
    },
    "age": {
        "type": "number",
        "description": "The age of the person"
    },
    "wound": {
        "type": "object",
        "properties": {
            "size": {
                "type": "number",
                "description": "The size of the wound"
            },
            "unit_of_measure": {
                "type": "string",
                "description": "The unit of measure of the size of the wound, e.g, cm or mm" 
            },
            "has_pus": {
                "type": "boolean",
                "description": "Whether the wound has pus"
            }
        },
        "required": ["size", "has_pus"]
    }
}

# Modify the payload with health-related messages
payload = {
    "model": "llama3.2:3b",
    "messages": [
        {
            "role": "assistant",
            "content": f"You are a helpful AI Assistant. You must extract the name, age, and wound details (size, unit_of_measure, has_pus) from the following messages. Output must be in JSON, always using the schema defined here: {json.dumps(schema)}"
        },
        {
            "role": "user",
            "content": "A paciente chama-se Maria, com 90 anos. A ferida tem 4 mm e têm pus."
        }
    ],
    "format": "json",
    "stream": False,
    "options": {
        "seed": 123,
        "temperature": 0.01
    }
}

response= requests.post(
    "http://localhost:11434/api/chat",
    json= payload
)

formatted_response = json.dumps(json.loads(response.json()["message"]["content"]), indent=4)
print(formatted_response)