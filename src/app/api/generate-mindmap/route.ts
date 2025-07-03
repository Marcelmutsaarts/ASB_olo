import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { baseContent, didactics, pedagogy } = await req.json();

    if (!baseContent) {
      return NextResponse.json({ error: 'Basis content is vereist' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const didacticsText = didactics ? `De vakdidactiek is: ${didactics}.` : '';
    const pedagogyText = pedagogy ? `Houd rekening met de volgende pedagogische aanpak: ${pedagogy}.` : '';

    const prompt = `
      Je bent een expert in het structureren van informatie. Jouw taak is om een hiërarchische mindmap te genereren op basis van de volgende leerstof.

      ${didacticsText}
      ${pedagogyText}

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
    const jsonText = response.text();
    
    // Verwijder markdown codeblok-indicators
    const cleanedJsonText = jsonText.replace(/```json\n?|```/g, '');
    const mindmapData = JSON.parse(cleanedJsonText);

    return NextResponse.json({ mindmap: mindmapData });

  } catch (error) {
    console.error("Fout bij het genereren van de mindmap:", error);
    return NextResponse.json({ error: 'Interne serverfout bij het genereren van de mindmap' }, { status: 500 });
  }
} 