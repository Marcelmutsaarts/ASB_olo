import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ThirtySecondsCard {
  id: number;
  terms: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { baseContent, didactics, pedagogy, level } = await req.json();

    if (!baseContent) {
      return NextResponse.json({ error: 'Basis content is vereist' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Je bent een expert in het maken van educatieve spellen. Jouw taak is om een set van minimaal 8 en idealiter 10 "30 Seconds" kaartjes te genereren op basis van de volgende leerstof. Het is cruciaal dat er voldoende kaartjes zijn om het spel leuk te maken.

      **Instructies:**
      1.  **Analyseer de Leerstof:** Identificeer de belangrijkste sleutelbegrippen, namen, en concepten in de tekst.
      2.  **Maak Kaartjes:** Genereer de gevraagde 8 tot 10 kaartjes. Elk kaartje moet een lijst van 5 samenhangende begrippen bevatten. Deze begrippen moeten direct uit de leerstof komen. De moeilijkheidsgraad moet passen bij het volgende niveau: ${level}.
      3.  **Relevantie:** De 5 begrippen op één kaartje moeten thematisch met elkaar verbonden zijn om het spel speelbaar te maken.
      4.  **Kwaliteit boven kwantiteit (bij twijfel):** Als de leerstof zeer beperkt is en het onmogelijk is om 8 kwalitatieve kaartjes te maken, genereer er dan minder, maar zorg ervoor dat elk kaartje voldoet aan de eisen. Liever 5 goede kaartjes dan 10 herhalende of onzinnige kaartjes.

      **Leerstof:**
      """
      ${baseContent}
      """

      **Output Formaat:**
      Geef je antwoord ALLEEN als een JSON-object dat direct kan worden geparsed. Start met '{' en eindig met '}'. De structuur moet zijn:
      {
        "title": "30 Seconds: [Onderwerp van de leerstof]",
        "cards": [
          {
            "id": 0,
            "terms": ["Begrip 1", "Begrip 2", "Begrip 3", "Begrip 4", "Begrip 5"]
          },
          {
            "id": 1,
            "terms": ["Ander Begrip 1", "Ander Begrip 2", "Ander Begrip 3", "Ander Begrip 4", "Ander Begrip 5"]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();
    
    const jsonString = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
    const gameData = JSON.parse(jsonString);

    return NextResponse.json({ gameData });

  } catch (error) {
    console.error("Fout bij het genereren van 30 Seconds spel:", error);
    return NextResponse.json({ error: 'Interne serverfout bij het genereren van het spel' }, { status: 500 });
  }
} 