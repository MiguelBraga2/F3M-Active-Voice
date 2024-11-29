# start_model.sh
#!/bin/bash

# Comando para servir o modelo
ollama serve &

# Comando para rodar o modelo
ollama run llama3.2:3b