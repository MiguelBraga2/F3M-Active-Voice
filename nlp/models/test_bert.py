from transformers import AutoTokenizer, BertForQuestionAnswering
import torch

# Carregando o tokenizador e o modelo
tokenizer = AutoTokenizer.from_pretrained("deepset/bert-base-cased-squad2")
model = BertForQuestionAnswering.from_pretrained("deepset/bert-base-cased-squad2")

# Texto de entrada
text = "O nome é Maria José, com 90 anos. A Ferida é Pequena e não tem pus."

# Perguntas a serem feitas
questions = [
    "Qual é o nome da pessoa?",
    "Quantos anos tem Maria José?",
    "Qual é o tamanho da ferida?",
    "A ferida tem pus?"
]

# Respostas
answers = []

for question in questions:
    # Tokenizando a entrada
    inputs = tokenizer(question, text, return_tensors="pt")
    
    # Gerando a resposta
    with torch.no_grad():
        outputs = model(**inputs)

    # Encontrando os índices de início e fim da resposta
    answer_start_index = outputs.start_logits.argmax()
    answer_end_index = outputs.end_logits.argmax()

    # Extraindo os tokens da resposta
    predict_answer_tokens = inputs.input_ids[0, answer_start_index : answer_end_index + 1]
    answer = tokenizer.decode(predict_answer_tokens, skip_special_tokens=True)
    answers.append(answer)

# Mostrando as respostas
for question, answer in zip(questions, answers):
    print(f"Pergunta: {question}")
    print(f"Resposta: {answer}\n")
