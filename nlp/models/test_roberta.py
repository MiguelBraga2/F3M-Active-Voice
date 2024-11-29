from transformers import AutoTokenizer, RobertaForQuestionAnswering
import torch

# Carregar o tokenizer e o modelo
tokenizer = AutoTokenizer.from_pretrained("deepset/roberta-base-squad2")
model = RobertaForQuestionAnswering.from_pretrained("deepset/roberta-base-squad2")

# Texto de contexto
text = "O nome é Maria José, com 90 anos. A ferida é pequena e não tem pus."

# Lista de perguntas
questions = [
    "Qual é o nome da pessoa?",
    "Qual a idade da pessoa?",
    "Qual é o tamanho da ferida?",
    "A ferida tem pus?",
]

# Lista para armazenar as respostas
answers = []

for question in questions:
    # Tokenizar as entradas
    inputs = tokenizer(question, text, return_tensors="pt")
    
    # Fazer a inferência sem gradientes
    with torch.no_grad():
        outputs = model(**inputs)

    # Obter os índices de início e fim da resposta
    answer_start_index = outputs.start_logits.argmax()
    answer_end_index = outputs.end_logits.argmax()

    # Decodificar a resposta
    predict_answer_tokens = inputs.input_ids[0, answer_start_index: answer_end_index + 1]
    answer = tokenizer.decode(predict_answer_tokens, skip_special_tokens=True)
    
    # Adicionar a resposta à lista
    answers.append(answer)

# Exibir as respostas
for question, answer in zip(questions, answers):
    print(f"Pergunta: {question} \nResposta: {answer}\n")
