import time
import openai
import os
import json
from dotenv import load_dotenv
from prettytable import PrettyTable

load_dotenv()  # Load environment variables from .env file
openai.api_key = os.getenv("OPENAI_API_KEY")

base_dir = 'models'
subpastas = ['compras', 'creche', 'dados', 'feridas']
schema_path = 'schema.json'

def fetch_form_data(schema, text, result_name):
    function_schema = {"type": "object", "properties": schema}
    fill_form_function = {
        "name": "fill_form",
        "description": "Fills out the form fields with information extracted from the text.",
        "parameters": function_schema
    }

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-0613",
            messages=[
                {
                    "role": "system",
                    "content": "You are an assistant that fills out forms with information from the provided text."
                },
                {
                    "role": "user",
                    "content": f"Fill out the form based on the following text: '{text}'"
                }
            ],
            functions=[fill_form_function],
            function_call={"name": "fill_form"}
        )

        function_response = response.choices[0].message.get(
            "function_call", {}).get("arguments")

        if function_response:
            extracted_data = json.loads(function_response)
            with open(result_name, "w") as outfile:
                json.dump(extracted_data, outfile, indent=4, ensure_ascii=False)
            print(f"Result saved in '{result_name}'")
        else:
            print("Function Call did not return the expected data.")
    except Exception as error:
        print("Error filling out the form:", error)
        raise error

for subpasta in subpastas:
    subpasta_path = os.path.join(base_dir, subpasta)
    schema_file_path = os.path.join(subpasta_path, schema_path)
    print(schema_file_path)
    for i in range(1, 4):
        table = PrettyTable()
        table.field_names = ["Subpasta", "Tempo de Resposta"]
        
        texto_path = f'texto_{i}.txt'
        texto_file_path = os.path.join(subpasta_path, texto_path)

        if os.path.exists(texto_file_path) and os.path.exists(schema_file_path):
            print(f"Acessando os arquivos na pasta {subpasta}:")
            print(f" - {texto_path}")

            with open(schema_file_path, 'r') as schema_file:
                schema = json.load(schema_file)

            with open(texto_file_path, 'r') as texto_file:
                texto = texto_file.read()
                
            start = time.time()
            fetch_form_data(schema, texto, f'resultado_form_{subpasta}_{i}.json')
            end = time.time()

            table.add_row([subpasta, end - start])
            print(table)
