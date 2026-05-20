import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File | null;

    if (!audio) {
      return Response.json({ error: 'No audio provided' }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
    });

    return Response.json({ text: transcription.text });
  } catch (error) {
    console.error('[transcribe]', error);
    return Response.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
