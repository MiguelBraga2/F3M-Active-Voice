import { OpenAI } from "openai";

export async function fetchFormData(schema: any, text: string): Promise<any> {
    const client = new OpenAI({
        apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY,
    });

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4-0613",
            messages: [
                {
                    role: "system",
                    content: "You are an assistant that fills out forms with information from the provided text."
                },
                {
                    role: "user",
                    content: `Fill out the form based on the following text: "${text}"`
                }
            ],
            tools: [
                {
                    "type": "function",
                    "function": {
                        "name": "fill_out_form",
                        "description": "Fills out a form based on the provided text.",
                        "parameters": schema
                    }
                }
            ]
        });
        
        const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
        const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;

        if (args) {
            console.log("Form automatically filled:", args);
            return args;
        } else {
            console.log("Function call did not return the expected data.");
            return null;
        }
    } catch (error) {
        console.error("Error filling out the form:", error);
        //throw error;
    }
}

const manual = {
    "descricao": "Esta aplicação foi criada, para simplificar o processo de preenchimento de formulários na área médica, utilizando para tal comandos de voz.",
    "nota": "A gravação termina automaticamente quando detectado um período de silêncio.",
    "janelas_aplicacao": {
        "home": {
            "nome": "Home",
            "descricao": "Manual de instruções"
        },
        "form": {
            "nome": "Form",
            "descricao": "Formulários disponíveis"
        },
        "complete_form": {
            "nome": "Complete Form",
            "descricao": "Todos os formulários a preencher"
        },
        "settings": {
            "nome": "Settings", 
            "descricao": "Opções de idioma"
        }
    },
    "comandos_voz": {
        "avancar_pagina": {
            "nome": "Avançar página",
            "comandos": [
              "Avança",
              "Avançar", 
              "Próximo",
              "Submete",
              "Submeter"
            ]
        },
        "recuar_pagina": {
            "nome": "Recuar página",
            "comandos": [
              "Recua",
              "Recuar",
              "Volta",
              "Voltar",
              "Retroceder", 
              "Volta Atrás",
              "Voltar Atrás"
            ]
        },
        "iniciar_gravacao": {
            "nome": "Iniciar gravação",
            "comandos": [
              "Começa a gravar",
              "Começar a gravar",
              "Começa a gravação",
              "Começar a gravação",
              "Começa gravar",
              "Começar gravar", 
              "Começa gravação",
              "Começar gravação",
              "Iniciar",
              "Iniciar a gravação",
              "Iniciar gravação"
            ]
        },
        "exibir_transcricao": {
            "nome": "Exibir transcrição",
            "comandos": [
              "Mostrar",
              "Mostra",
              "Exibe a transcrição",
              "Exibir a transcrição",
              "Exibir transcrição",
              "Exibe transcrição"
            ]
        },
        "ajuda_assistente": {
            "nome": "Solicitar ajuda",
            "comandos": [
              "ajuda",
              "assistente",
              "preciso de ajuda"
            ],
        }
    }
  };

export async function fetchHelp(schema: any, text: string, currentFormData: any): Promise<string> {
    const client = new OpenAI({
        apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY,
    });

    try {
        const schemaDescription = JSON.stringify(schema);

        const response = await client.chat.completions.create({
            model: "gpt-4-0613",
            messages: [
                {
                    role: "system",
                    content: `You are an assistant that answers questions about a specific form. Here is the form schema in JSON format for reference: ${schemaDescription}. Here is the current form data, including filled and unfilled fields: ${JSON.stringify(currentFormData)}. If asked about missing fields, identify which fields are empty in the form data and specify only those. Answer only what was asked, and in a concise and friendly way. Do not mention the schema's original key names. If asked about the application usage, follow this manual: ${JSON.stringify(manual)} to provide the necessary information.`
                },
                {
                    role: "user",
                    content: `Answer this question: "${text}"`
                }
            ]
        });
        
        const responseMessage = response.choices?.[0]?.message?.content;

        if (responseMessage) {
            console.log("Question successfully answered:", responseMessage);
            return responseMessage;
        } else {
            console.log("No response message available.");
            return "Não consegui responder a pergunta com os dados fornecidos.";
        }
    } catch (error) {
        console.error("Error answering the question:", error);
        throw error;
    }
}

export async function fetchHelpInstructionsManual(referenceText: string, text: string): Promise<string> {
    const client = new OpenAI({
        apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY,
    });

    try {
        // O 'referenceText' agora é o texto completo sobre o qual as perguntas serão feitas
        const response = await client.chat.completions.create({
            model: "gpt-4-0613",
            messages: [
                {
                    role: "system",
                    content: `You are an assistant that answers questions based on the following text: ${referenceText}. Answer concisely and only what was asked.`
                },
                {
                    role: "user",
                    content: `Answer this question: "${text}"`
                }
            ]
        });
        
        const responseMessage = response.choices?.[0]?.message?.content;

        if (responseMessage) {
            console.log("Question successfully answered:", responseMessage);
            return responseMessage;
        } else {
            console.log("No response message available.");
            return "Não consegui responder a pergunta com os dados fornecidos.";
        }
    } catch (error) {
        console.error("Error answering the question:", error);
        throw error;
    }
}
