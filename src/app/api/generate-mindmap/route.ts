import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { baseContent, didactics, pedagogy, level } = await req.json();

    if (!baseContent) {
      return NextResponse.json({ error: 'Basis content is vereist' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const didacticsText = didactics ? `De vakdidactiek is: ${didactics}.` : '';
    const pedagogyText = pedagogy ? `Houd rekening met de volgende pedagogische aanpak: ${pedagogy}.` : '';
    const levelText = level ? `Het gevraagde niveau is: ${level}. Pas de hiërarchie, het detailniveau en de complexiteit van de mindmap hierop aan.` : '';

    const prompt = `
      Je bent een expert in het structureren van informatie. Jouw taak is om een hiërarchische mindmap te genereren op basis van de volgende leerstof.

      ${didacticsText}
      ${pedagogyText}
      ${levelText}

      Structureer de output als een JSON-object. Begin je antwoord direct met de '{' en eindig met '}'. Voeg geen inleidende tekst, commentaar of markdown-blokken toe. De output moet direct parseerbaar zijn als JSON.

      Leerstof:
      """
      ${baseContent}
      """

      Voorbeeld output:
      {
        "name": "Zonnestelsel",
        "children": [
          { 
            "name": "Zon",
            "children": [] 
          },
          {
            "name": "Planeten",
            "children": [
              { "name": "Mercurius", "children": [] },
              { "name": "Aarde", "children": [] }
            ]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();
    
    // Functie om JSON uit de tekst te extraheren
    const jsonString = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
    const mindmapData = JSON.parse(jsonString);

    return NextResponse.json({ mindmap: mindmapData });

  } catch (error) {
    console.error("Fout bij het genereren van de mindmap:", error);
    return NextResponse.json({ error: 'Interne serverfout bij het genereren van de mindmap' }, { status: 500 });
  }
} 