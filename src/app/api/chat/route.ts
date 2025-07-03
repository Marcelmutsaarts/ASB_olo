import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { messages, baseContent, didactics, pedagogy, level } = await req.json();

    const systemInstruction = `
      Je bent een AI-tutor. Gebruik de volgende context als je primaire kennisbank.
      CONTEXT:
      ${baseContent}
      ---
      Als een vraag buiten deze context valt, mag je je algemene kennis gebruiken, maar vermeld expliciet dat het antwoord van buiten de verstrekte leerstof komt.
      Houd rekening met de volgende instructies voor je toon en aanpak:
      [NIVEAU]
      Pas je antwoorden, complexiteit en toon aan op het volgende niveau:
      ${level || 'Algemeen HBO-niveau'}
      [/NIVEAU]
      [DIDACTISCHE INSTRUCTIES]
      ${didactics || 'Geen specifieke didactische instructies.'}
      [/DIDACTISCHE INSTRUCTIES]
      [PEDAGOGISCHE INSTRUCTIES]
      ${pedagogy || 'Geen specifieke pedagogische instructies.'}
      [/PEDAGOGISCHE INSTRUCTIES]
    `;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
    });
    
    let conversationHistory = [...messages];

    if (conversationHistory.length > 0 && conversationHistory[0].role === 'model') {
      conversationHistory.unshift({ role: 'user', text: 'Start het gesprek.' });
    }

    const historyForChat: Content[] = conversationHistory.slice(0, -1).map((msg: { role: 'user' | 'model', text: string }) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({ history: historyForChat });
    
    const lastMessage = conversationHistory[conversationHistory.length - 1].text;

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error: any) {
    console.error(`Error in /api/chat: ${error.message}`);
    return NextResponse.json({ error: 'Fout bij communicatie met de AI.', details: error.message }, { status: 500 });
  }
}
