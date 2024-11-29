from math import e
from langsmith import expect
import requests
import json
import time 
from prettytable import PrettyTable
import os

models = ["llama3:8b", "llama3.2:3b", "phi3.5:3.8b"]

def compare_strings(key, value1, value2):
    correct = value1.lower() == value2.lower()
    print(f"Comparing field '{key}': Expected='{value1}', Generated='{value2}' -> {'Correct' if correct else 'Incorrect'}")
    return correct

def compare_lists(key, list1, list2):
    if len(list1) != len(list2):
        print(f"Comparing field '{key}': List lengths differ -> Incorrect")
        return False
    return all(compare_values(f"{key}[{i}]", v1, v2) for i, (v1, v2) in enumerate(zip(list1, list2)))

def compare_dicts(key, dict1, dict2):
    if dict1.keys() != dict2.keys():
        print(f"Comparing field '{key}': Dictionary keys differ -> Incorrect")
        return False
    return all(compare_values(f"{key}.{k}", dict1[k], dict2[k]) for k in dict1)

def compare_values(key, value1, value2):
    # Se ambos são strings, compara ignorando maiúsculas/minúsculas
    if isinstance(value1, str) and isinstance(value2, str):
        return compare_strings(key, value1, value2)
    # Se ambos são listas, compara cada elemento
    elif isinstance(value1, list) and isinstance(value2, list):
        return compare_lists(key, value1, value2)
    # Se ambos são dicionários, compara chave por chave
    elif isinstance(value1, dict) and isinstance(value2, dict):
        return compare_dicts(key, value1, value2)
    # Caso contrário, compara diretamente, incluindo valores None e booleanos
    else:
        correct = value1 == value2
        print(f"Comparing field '{key}': Expected={value1}, Generated={value2} -> {'Correct' if correct else 'Incorrect'}")
        return correct

def count_values(data):
    if isinstance(data, dict):
        return sum(count_values(v) for v in data.values())
    elif isinstance(data, list):
        return sum(count_values(v) for v in data)
    else:
        return 1

def count_correct(expected, generated, parent_key=""):
    if isinstance(expected, dict) and isinstance(generated, dict):
        return sum(count_correct(expected[k], generated.get(k), f"{parent_key}.{k}" if parent_key else k) for k in expected if k in generated)
    elif isinstance(expected, list) and isinstance(generated, list):
        return sum(count_correct(v1, v2, f"{parent_key}[{i}]" if parent_key else str(i)) for i, (v1, v2) in enumerate(zip(expected, generated)))
    else:
        return 1 if compare_values(parent_key, expected, generated) else 0

def calculate_accuracy(expected, generated):
    total_values = count_values(expected)
    correct_values = count_correct(expected, generated)
    print(total_values)
    print(correct_values)
    # Calcula a accuracy como a proporção de campos corretos
    return correct_values / total_values if total_values > 0 else 0

# Caminho da pasta principal
base_dir = 'models'

# Nomes das subpastas
subpastas = ['compras', 'creche', 'dados', 'feridas']

schema_path = f'schema.json'


# Loop por cada subpasta
for subpasta in subpastas:
    # Caminho completo da subpasta
    subpasta_path = os.path.join(base_dir, subpasta)
    
    # Lista os arquivos dentro da subpasta
    arquivos = sorted(os.listdir(subpasta_path))
    schema_file_path = os.path.join(subpasta_path, schema_path)
    
    # Filtra e emparelha os arquivos JSON e TXT
    for i in range(1, 4):
        table = PrettyTable()
        table.field_names = ["Modelo", "Tempo de Resposta", "Accuracy"]
        
        expected_path = f'expected_{i}.json'
        texto_path = f'texto_{i}.txt'
        
        # Caminho completo para cada arquivo
        #expected_file_path = os.path.join(subpasta_path, expected_path)
        texto_file_path = os.path.join(subpasta_path, texto_path)
        
        # Verifica se ambos os arquivos existem
        #if os.path.exists(expected_file_path) and 
        if os.path.exists(texto_file_path) and os.path.exists(schema_file_path):
            print(f"A acessar os ficheiros na pasta {subpasta}:")
            print(f" - {expected_path}")
            print(f" - {texto_path}")
            
            # Carregar o schema a partir de um arquivo JSON
            #with open(expected_file_path, 'r') as expected_file:
            #    expected = json.load(expected_file)

            with open(schema_file_path, 'r') as schema_file:
                schema = json.load(schema_file)

            # Carregar o texto a partir de um arquivo .txt
            with open(texto_file_path, 'r') as texto_file:
                texto = texto_file.read()
            
            # Loop por cada modelo
            for model in models:
                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "assistant",
                            "content": f"You are an AI assistant with the main goal of extracting relevant informations from a text in order to fill a schema {schema}. For the fields that are not explicitly mentioned in the text, fill them with null. Do not logically infer for boolean fields, if the text does not mention the field, fill it with null. For example, for a field 'hasfever' if it does not mention 'has fever' clearly in the text, it should return 'hasfever':null. Ensure the output JSON is valid and complete. Return only the filled JSON, without any additional content"
                            },
                        {
                            "role": "user",
                            "content": texto
                        }
                    ],
                    "format": "json",
                    "stream": False,
                    "options": {
                        "seed": 123,
                        "temperature": 0.01
                    }
                }


                start_time = time.time()
                
                print("Requesting model", model)
                
                try:
                    response= requests.post(
                        "http://localhost:11434/api/chat",
                        json= payload
                    )
                    end_time = time.time()

                    response.raise_for_status()

                    # A resposta já está em JSON, então podemos acessar diretamente
                    formatted_response = response.json()["message"]["content"]
                    #print(formatted_response)
                    json_response = json.loads(formatted_response)

                    #print("A comparar...")
                    #accuracy = calculate_accuracy(expected, json_response)
                    #print(accuracy)

                    # Salva a resposta diretamente no arquivo
                    file_name = f"./models/{subpasta}/res/{model}_{texto_path}_response.json"
                    with open(file_name, 'w', encoding='utf-8') as f:
                        json.dump(json_response, f, ensure_ascii=False, indent=4)  

                    # Adiciona os resultados à tabela
                    #table.add_row([model, end_time - start_time, accuracy])

                except requests.exceptions.HTTPError as http_err:
                    if response.status_code == 404:
                        print(f"Erro 404: Recurso não encontrado. {http_err}")
                    else:
                        print(f"Erro HTTP: {http_err}")
                except requests.exceptions.ConnectionError:
                    print("Erro de conexão.")
                except requests.exceptions.Timeout:
                    print("Timeout.")
                except requests.exceptions.RequestException as req_err:
                    print(f"Erro relacionado à requisição: {req_err}")
                except Exception as err:
                    print(f"Ocorreu um erro inesperado: {err}")           
            
            #print(table)
            csv_file = table.get_csv_string()
            with open(f"./models/{subpasta}/res/{texto_path}_resultados.csv", "w") as f:
                f.write(csv_file)

            print(f"Os resultados para {subpasta} - {texto_path} foram salvos com sucesso!")
        else:
            print(f"Erro ao encontrar os ficheiros na pasta {subpasta}.")
