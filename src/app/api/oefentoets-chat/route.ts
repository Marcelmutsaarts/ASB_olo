import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { question, correctAnswer, userAnswer, feedback, chatHistory } = await req.json();

    if (!question || !correctAnswer || !userAnswer || !chatHistory || chatHistory.length === 0) {
      return NextResponse.json({ error: 'Vereiste velden ontbreken of chatgeschiedenis is leeg' }, { status: 400 });
    }

    const systemInstruction = `
      Je bent een gespecialiseerde AI-tutor in een oefentoets-omgeving. Je taak is om een student te helpen die zojuist een vraag heeft beantwoord. Focus ALLEEN op de context van de gegeven vraag.

      **Context:**
      - De vraag was: "${question}"
      - Het juiste antwoord is: "${correctAnswer}"
      - De student gaf als antwoord: "${userAnswer}"
      - De initiële feedback die de student kreeg was: "${feedback}"

      **Jouw Rol:**
      - Beantwoord de vragen van de student over dit specifieke onderwerp.
      - Geef duidelijke, beknopte en correcte uitleg.
      - Als de student vraagt naar een ander onderwerp, leid het gesprek dan vriendelijk terug naar de context van de vraag.
      - Wees een geduldige en behulpzame tutor.
      - Geef een direct, behulpzaam antwoord op de vraag van de student.
    `;

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: systemInstruction,
    });
    
    const historyForApi = chatHistory.map((msg: { role: string; text: string }) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const lastMessage = historyForApi.pop();
    
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Laatste bericht in de geschiedenis is niet van de gebruiker.' }, { status: 400 });
    }
    
    const chat = model.startChat({
        history: historyForApi
    });
    
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error("Fout bij het verwerken van de oefentoets-chat:", error);
    return NextResponse.json({ error: 'Interne serverfout bij de chat' }, { status: 500 });
  }
} 