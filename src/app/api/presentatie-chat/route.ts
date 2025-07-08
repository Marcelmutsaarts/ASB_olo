import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { message, slide, presentationTitle, baseContent, didactics, pedagogy, level } = await req.json();

    if (!message || !slide) {
      return NextResponse.json({ error: 'Message en slide data zijn verplicht' }, { status: 400 });
    }

    const systemInstruction = `
      Je bent een AI-tutor die studenten helpt met het begrijpen van een presentatie slide.
      
      PRESENTATIE: ${presentationTitle}
      
      HUIDIGE SLIDE:
      - Type: ${slide.type}
      - Titel: ${slide.title}
      - Inhoud: ${slide.content.mainText || ''}
      - Bullet points: ${slide.content.bulletPoints?.join(', ') || 'Geen'}
      - Speaker notes: ${slide.content.speakerNotes || 'Geen'}
      
      ORIGINELE LEERSTOF:
      ${baseContent}
      
      NIVEAU: ${level}
      DIDACTIEK: ${didactics || 'Standaard'}
      PEDAGOGIE: ${pedagogy || 'Ondersteunend'}
      
      INSTRUCTIES:
      1. Beantwoord vragen specifiek over deze slide
      2. Geef verduidelijking en extra voorbeelden waar nodig
      3. Suggereer verbeteringen als de student daarom vraagt
      4. Blijf gefocust op de slide content, maar gebruik de originele leerstof voor context
      5. Als gevraagd om aanpassingen, geef concrete suggesties voor tekst of voorbeelden
      6. Pas je toon aan op het opgegeven niveau en pedagogische stijl
    `;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
    });

    const chat = model.startChat({
      history: [],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in presentatie chat:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het verwerken van je vraag' },
      { status: 500 }
    );
  }
}