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
      Je bent een expert in het maken van educatief materiaal. Jouw taak is om een set van 10 tot 15 flashcards te genereren op basis van de volgende leerstof.
      
      De flashcards moeten voldoen aan de volgende eisen:
      1.  **Zakelijk en Feitelijk:** Gebruik een formele, objectieve toon. Vermijd meningen of onnodig complexe taal. De inhoud moet direct en to-the-point zijn.
      2.  **Essentieel:** Focus uitsluitend op de belangrijkste concepten, definities, formules, en onmisbare feiten. Elke flashcard moet een cruciaal, onmisbaar stukje kennis uit de tekst toetsen.
      3.  **Duidelijk en Beknopt:** De vraag (question) moet eenduidig zijn. Het antwoord (answer) moet correct en zo kort mogelijk zijn, zonder essentiële informatie weg te laten.

      Structureer de output als een JSON-array van objecten, waarbij elk object een "question" en "answer" key heeft.
      
      ${didacticsText}
      ${pedagogyText}
      
      Leerstof:
      """
      ${baseContent}
      """
      
      Voorbeeld output voor een zakelijke tekst:
      [
        { "question": "Definieer 'inflatie'.", "answer": "Een aanhoudende stijging van het algemene prijsniveau van goederen en diensten." },
        { "question": "Wat is de primaire functie van de Europese Centrale Bank (ECB)?", "answer": "Het handhaven van prijsstabiliteit in de eurozone." }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonText = response.text();
    
    // Verwijder markdown codeblok-indicators
    const cleanedJsonText = jsonText.replace(/```json\n?|```/g, '');

    // Probeer de JSON te parsen om te valideren
    const flashcards = JSON.parse(cleanedJsonText);

    return NextResponse.json({ flashcards });

  } catch (error) {
    console.error("Fout bij het genereren van flashcards:", error);
    return NextResponse.json({ error: 'Interne serverfout bij het genereren van flashcards' }, { status: 500 });
  }
}
