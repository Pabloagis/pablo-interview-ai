import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File | null;

    if (!audio) {
      return Response.json({ error: 'No audio provided' }, { status: 400 });
    }

    // Optional, additive fields. Callers that send only `audio` (e.g. ChatPanel)
    // keep the previous behaviour exactly (English).
    // - prompt: biases Whisper toward domain vocabulary / proper-noun spelling.
    // - language: an ISO-639-1 code pins that language; the literal 'auto' lets
    //   Whisper detect it from the audio; absent → English (unchanged default).
    const prompt    = (formData.get('prompt') as string | null)?.slice(0, 900) || undefined;
    const langField = (formData.get('language') as string | null);
    const language  = langField === 'auto' ? undefined : (langField || 'en');

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language,          // undefined → Whisper auto-detects
      prompt,
      // Lower temperature → less "creative" guessing, more faithful transcription.
      temperature: 0,
    });

    return Response.json({ text: transcription.text });
  } catch (error) {
    console.error('[transcribe]', error);
    return Response.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
