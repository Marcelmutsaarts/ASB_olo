import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { baseContent, didactics, pedagogy, level } = body;

    if (!baseContent) {
      return NextResponse.json({ error: 'baseContent is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Je bent een AI-tutor. Je taak is om een kort, uitnodigend en vriendelijk welkomstbericht te schrijven om een gesprek met een student te beginnen.
      Jouw taak is om een korte, uitnodigende openingsboodschap te schrijven op basis van de CONTEXT en de bijgevoegde INSTRUCTIES.
      De boodschap moet het gesprek starten, de student welkom heten bij het onderwerp en hen actief uitnodigen om vragen te stellen.
      Spreek de student direct aan met 'je' of 'jij'.
      Houd de boodschap bondig, ongeveer 2-3 zinnen.

      CONTEXT:
      ---
      ${baseContent}
      ---
      
      INSTRUCTIES:
      ---
      Vakdidactiek: ${didactics || 'Algemene benadering'}
      Pedagogiek: ${pedagogy || 'Neutrale en behulpzame toon'}
      Niveau: ${level || 'Algemeen HBO-niveau'}
      ---

      Voorbeeld output:
      "Hallo! Welkom bij de les over [Onderwerp]. Ik ben je AI-assistent en ik sta klaar om al je vragen over de lesstof te beantwoorden. Waar wil je mee beginnen?"

      Genereer nu de openingsboodschap voor de gegeven CONTEXT, rekening houdend met de INSTRUCTIES.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ welcomeMessage: text, success: true });

  } catch (error) {
    console.error('Error calling Gemini API for welcome message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'An error occurred while generating the welcome message',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
} 