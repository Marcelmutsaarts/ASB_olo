import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { question, correctAnswer, userAnswer } = await req.json();

    if (!question || !correctAnswer || !userAnswer) {
      return NextResponse.json({ error: 'Vereiste velden ontbreken' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Je bent een slimme, behulpzame tutor. Jouw taak is om het antwoord van een student op een flashcard-vraag te beoordelen. Wees flexibel en kijk naar de betekenis, niet alleen naar de exacte woorden.

      **Beoordeel het volgende:**
      - Vraag: "${question}"
      - Correct antwoord volgens de flashcard: "${correctAnswer}"
      - Antwoord van de student: "${userAnswer}"

      **Instructies:**
      1.  **Analyseer de inhoud:** Vergelijk de *essentie* van het antwoord van de student met het correcte antwoord. Kleine typefouten, synoniemen of een andere woordvolgorde mogen niet als fout worden gerekend, zolang de kern van het antwoord maar klopt.
      2.  **Bepaal correctheid:** Is het antwoord van de student conceptueel juist?
      3.  **Geef feedback:** 
          - Als het antwoord **correct** is, geef een korte, positieve bevestiging.
          - Als het antwoord **incorrect** is, geef een korte, constructieve hint die de student in de goede richting helpt ZONDER het juiste antwoord direct te verklappen. Focus op het belangrijkste gemiste concept.

      **Output Formaat:**
      Geef je antwoord ALLEEN als een JSON-object. Begin direct met '{' en eindig met '}'. Geen markdown, geen extra tekst. Het formaat moet zijn:
      {
        "isCorrect": boolean,
        "feedback": "Jouw korte, behulpzame feedback hier."
      }

      **Voorbeeld 1 (Correct):**
      - Vraag: "Wat is de hoofdstad van Frankrijk?"
      - Correct antwoord: "Parijs"
      - Antwoord van de student: "parijs"
      - Jouw output:
      {
        "isCorrect": true,
        "feedback": "Precies, dat klopt!"
      }

      **Voorbeeld 2 (Incorrect):**
      - Vraag: "Wat is de functie van de mitochondriën?"
      - Correct antwoord: "Ze zijn de energiecentrales van de cel, verantwoordelijk voor de productie van ATP."
      - Antwoord van de student: "Ze hebben iets met energie te maken."
      - Jouw output:
      {
        "isCorrect": false,
        "feedback": "Je bent op de goede weg! Kun je specifieker zijn over *hoe* ze energie voor de cel produceren?"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();
    
    const jsonString = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
    const feedbackData = JSON.parse(jsonString);

    return NextResponse.json(feedbackData);

  } catch (error) {
    console.error("Fout bij het controleren van antwoord:", error);
    return NextResponse.json({ error: 'Interne serverfout bij het controleren van het antwoord' }, { status: 500 });
  }
} 