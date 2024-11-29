from flask import Flask, request, jsonify
import requests
import json

app = Flask(__name__)

model = "llama3.2:3b"
OLLAMA_URL = 'http://ollama:11434'

@app.route('/generate-schema', methods=['POST'])
def generate_schema():
    data = request.get_json()
    form_code = data.get('formCode')

    if not form_code:
        return jsonify({'error': 'Form code is required'}), 400

    payload = {
        'model': model,
        'messages': [
            {
                'role': "system",
                'content': "You are an AI assistant specialized in analyzing React form code and generating corresponding JSON schemas. Your task is to create a schema that describes the structure and types of the form fields."
            },
            {
                'role': "user",
                'content': f'Given the following React form code, generate a JSON schema that describes the structure and types of the form fields. The schema should include field names, types, and descriptions based on the form inputs. Do not include any React-specific elements in the schema. For example: {{ "name": {{ "type": "string", "description": "The name of the person" }} }}\n\nHere\'s the form code:\n\n{form_code}\n\nPlease provide the schema in JSON format.'
            }
        ],
        'format': "json",
        'stream': False,
        'options': {
            'temperature': 0.1
        }
    }

    try:
        response = requests.post(f'{OLLAMA_URL}/api/chat', json=payload)
        response.raise_for_status()  # Raise an error for bad responses
        content = response.json().get('message', {}).get('content')
        if content:
            # Para testar
            json_schema = json.loads(content)
            print(json_schema)
            return jsonify(content)

    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/fields', methods=['POST'])
def fields():
    data = request.get_json()
    schema = data.get('schema')
    text = data.get('text')

    payload = {
        'model': model,
        'messages': [
            {
                'role': "assistant",
                'content': f'You are a helpful AI Assistant with the main goal to extract information from the text to fill a form. You must extract the information according to the schema defined here: {json.dumps(schema)}. Output must be in JSON, always using the schema defined and for the fields that are not present in the text, return null.'
            },
            {
                'role': "user",
                'content': text
            }
        ],
        'format': "json",
        'stream': False,
        'options': {
            'seed': 123,
            'temperature': 0.01
        }
    }

    try:
        response = requests.post(f'{OLLAMA_URL}/api/chat', json=payload)
        response.raise_for_status()  # Raise an error for bad responses
        content = response.json().get('message', {}).get('content')
        if content:
            # Para testar
            json_schema = json.loads(content)
            print(json_schema)
            return jsonify(content)

    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
