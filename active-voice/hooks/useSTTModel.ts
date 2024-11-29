
import FormData from 'form-data';

export async function transcribeAudio(uri: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
        uri: uri,
        type: 'audio/flac',
        name: 'audio.flac',
    });

    formData.append('model', 'whisper-1'); 

    try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}`,
                'Content-Type': 'multipart/form-data',
            },
            body: formData as any, // envia o form data manualmente
        });
        const data = await response.json();
        console.log(`Speech to text model response: ${data.text}`); // log the transcription
        return data.text; // return the transcription text
    } catch (err) {
        console.error('Error during transcription:', err);
        throw err;
    }
}