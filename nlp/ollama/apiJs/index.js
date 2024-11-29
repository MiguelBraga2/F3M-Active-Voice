import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const model = "llama3.2:3b";

app.post('/generate-schema', async (req, res) => {
    const { formCode } = req.body;

    if (!formCode) {
        return res.status(400).json({ error: 'Form code is required' });
    }

    const payload = {
        model: model,
        messages: [
            {
                role: "system",
                content: "You are an AI assistant specialized in analyzing React form code and generating corresponding JSON schemas. Your task is to create a schema that describes the structure and types of the form fields."
            },
            {
                role: "user",
                content: `Given the following React form code, generate a JSON schema that describes the structure and types of the form fields. The schema should include field names, types, and descriptions based on the form inputs. Do not include any React-specific elements in the schema. For example: { "name": { "type": "string", "description": "The name of the person" } }

                    Here's the form code:

                    ${formCode}

                    Please provide the schema in JSON format.`
            }
        ],
        format: "json",
        stream: false,
        options: {
            temperature: 0.1
        }
    };

    
    try {
        const response = await axios.post('http://localhost:11434/api/chat', payload);

        // apenas a resposta
        const content = response.data.message.content;
        res.json(content);
        
        // Para testar
        const jsonSchema = JSON.parse(content);
        console.log(jsonSchema);

        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}); 


app.post('/fields', async (req, res) => {

    const schema = req.body.schema;
    const text = req.body.text;

    /* const schema = {
        name: {
            type: "string",
            description: "The name of the person"
        },
        age: {
            type: "number",
            description: "The age of the person"
        },
        painLevel: {
            type: "number",
            description: "The pain level of the person"
        },
        wound: {
            type: "object",
            properties: {
                size: {
                    type: "number",
                    description: "The size of the wound"
                },
                unit_of_measure: {
                    type: "string",
                    description: "The unit of measure of the size of the wound, e.g., cm or mm"
                },
                has_pus: {
                    type: "boolean",
                    description: "Whether the wound has pus"
                }
            },
            required: ["size", "has_pus"]
        }
    }; */

    // Payload fixo que será enviado na requisição
    const payload = {
        model: model,
        messages: [
            {
                role: "assistant",
                content: `You are a helpful AI Assistant with the main goal to extract information from the text to fill a form. You must extract the information according to the schema defined here: ${JSON.stringify(schema)}. Output must be in JSON, always using the schema defined and for the fields that are not present in the text, return null.`
            },
            {
                role: "user",
                content: text
            }
        ],
        format: "json",
        stream: false,
        options: {
            seed: 123,
            temperature: 0.01
        }
    };

    try {
        const response = await axios.post('http://localhost:11434/api/chat', payload);
        const content = response.data.message.content;
        res.json(content);
        
        // Para testar
        const jsonSchema = JSON.parse(content);
        console.log(jsonSchema);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});


/* 
Body para teste no Postman de generate-schema:
{
    "formCode": "<ThemedText>Name:</ThemedText>\n<Controller\n  control={control}\n  render={({ field: { onChange, onBlur, value } }) => (\n    <ThemedInput\n      onBlur={onBlur}\n      onChangeText={onChange}\n      value={value}\n      placeholder=\"Enter patient's name\"\n    />\n  )}\n  name=\"name\"\n  rules={{ required: true }}\n  defaultValue=\"\"\n/>\n\n<ThemedText>Age:</ThemedText>\n<Controller\n  control={control}\n  render={({ field: { onChange, onBlur, value } }) => (\n    <ThemedInput\n      onBlur={onBlur}\n      onChangeText={onChange}\n      value={value}\n      placeholder=\"Enter patient's age\"\n      keyboardType=\"numeric\"\n    />\n  )}\n  name=\"age\"\n  rules={{ required: true }}\n  defaultValue=\"\"\n/>\n\n<ThemedText>Pain Level (0-10):</ThemedText>\n<Controller\n  control={control}\n  render={({ field: { onChange, onBlur, value } }) => (\n    <ThemedInput\n      onBlur={onBlur}\n      onChangeText={onChange}\n      value={value}\n      placeholder=\"Enter pain level\"\n      keyboardType=\"numeric\"\n    />\n  )}\n  name=\"painLevel\"\n  rules={{ required: true, min: 0, max: 10 }}\n  defaultValue=\"\"\n/>\n\n<ThemedText>Wound Size:</ThemedText>\n<Controller\n  control={control}\n  render={({ field: { onChange, onBlur, value } }) => (\n    <ThemedInput\n      onBlur={onBlur}\n      onChangeText={onChange}\n      value={value}\n      placeholder=\"Enter wound size\"\n      keyboardType=\"numeric\"\n    />\n  )}\n  name=\"woundSize\"\n  rules={{ required: true }}\n  defaultValue=\"\"\n/>\n\n<ThemedText>Unit of Measure:</ThemedText>\n<Controller\n  control={control}\n  render={({ field: { onChange, value } }) => (\n    <Picker\n      selectedValue={value}\n      onValueChange={onChange}\n      style={{ height: 50, width: 150 }}\n    >\n      <Picker.Item label=\"mm\" value=\"mm\" />\n      <Picker.Item label=\"cm\" value=\"cm\" />\n    </Picker>\n  )}\n  name=\"unitOfMeasure\"\n  rules={{ required: true }}\n  defaultValue=\"mm\"\n/>\n\n<ThemedText>Has Pus:</ThemedText>\n<Controller\n  control={control}\n  render={({ field: { onChange, value } }) => (\n    <View>\n      <ThemedText>Yes</ThemedText>\n      <RadioButton\n        value=\"yes\"\n        status={value === 'yes' ? 'checked' : 'unchecked'}\n        onPress={() => onChange('yes')}\n      />\n      <ThemedText>No</ThemedText>\n      <RadioButton\n        value=\"no\"\n        status={value === 'no' ? 'checked' : 'unchecked'}\n        onPress={() => onChange('no')}\n      />\n    </View>\n  )}\n  name=\"hasPus\"\n  rules={{ required: true }}\n  defaultValue=\"\"\n/>"
}
*/

