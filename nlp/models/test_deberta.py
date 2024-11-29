from transformers import AutoTokenizer, BertForQuestionAnswering
import torch

# Carregando o tokenizador e o modelo
tokenizer = AutoTokenizer.from_pretrained("deepset/bert-base-cased-squad2")
model = BertForQuestionAnswering.from_pretrained("deepset/bert-base-cased-squad2")

# Texto de entrada
text = "O nome é Maria José, com 90 anos. A Ferida é Pequena e não tem pus."

# Perguntas
questions = [
    "Qual é o nome da pessoa?",
    "Quantos anos tem Maria José?",
    "Qual é o tamanho da ferida?",
    "A ferida tem pus?"
]

# Função para responder a perguntas
def answer_question(question, text):
    inputs = tokenizer(question, text, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)

    # Obtendo as posições de início e fim da resposta
    answer_start_index = outputs.start_logits.argmax()
    answer_end_index = outputs.end_logits.argmax()

    # Extraindo e decodificando a resposta
    predict_answer_tokens = inputs.input_ids[0, answer_start_index : answer_end_index + 1]
    return tokenizer.decode(predict_answer_tokens, skip_special_tokens=True)

# Respondendo às perguntas
for question in questions:
    answer = answer_question(question, text)
    print(f"Pergunta: {question}\nResposta: {answer}\n")
