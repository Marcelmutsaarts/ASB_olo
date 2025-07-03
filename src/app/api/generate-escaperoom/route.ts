import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { baseContent, didactics, pedagogy } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Je bent een expert in het ontwerpen van educatieve games. Jouw taak is om een boeiende en uitdagende "Escape Room" te creëren op basis van de volgende leerstof.

      **Leerstof:**
      ${baseContent}

      **Context voor de AI-Tutor:**
      - Didactiek: ${didactics}
      - Pedagogiek: ${pedagogy}

      **Instructies:**
      1.  **Thema en Verhaal:** Creëer een kort, meeslepend achtergrondverhaal dat past bij de leerstof. De student is "opgesloten" en moet ontsnappen door kennisvragen te beantwoorden.
      2.  **Puzzels:** Genereer 3 tot 5 opeenvolgende puzzels. Elke puzzel moet een duidelijke vraag bevatten die direct gerelateerd is aan de leerstof. De moeilijkheidsgraad moet vergelijkbaar zijn met die van flashcards of een basiskennisquiz.
      3.  **Antwoorden:** Geef voor elke puzzel een exact, correct antwoord.
      4.  **Hints:** Geef voor elke puzzel 2-3 hints die de student op weg helpen zonder het antwoord direct te verklappen.
      5.  **Feedback:** Schrijf een korte, positieve feedbackboodschap voor als een student een puzzel correct oplost.
      6.  **Eindes:** Schrijf een "succes" boodschap voor als de student ontsnapt, en een "mislukt" boodschap voor als de tijd om is.

      **Output Formaat:**
      Geef je antwoord ALLEEN in JSON-formaat, volgens deze structuur:
      {
        "title": "Titel van de Escape Room",
        "story": "Het achtergrondverhaal...",
        "puzzles": [
          {
            "id": 1,
            "question": "De eerste vraag...",
            "answer": "Het exacte antwoord op vraag 1",
            "hints": ["Hint 1", "Hint 2"],
            "successFeedback": "Goed gedaan! Op naar de volgende."
          },
          {
            "id": 2,
            "question": "De tweede vraag...",
            "answer": "Het exacte antwoord op vraag 2",
            "hints": ["Hint 1", "Hint 2"],
            "successFeedback": "Uitstekend! Nog een paar te gaan."
          }
        ],
        "successMessage": "Gefeliciteerd, je bent ontsnapt!",
        "failureMessage": "Helaas, de tijd is om! De kamer is ontploft. Probeer het opnieuw."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonText = response.text();
    
    // Verwijder markdown codeblok-indicators
    const cleanedJsonText = jsonText.replace(/```json\n?|```/g, '');
    const escapeRoomData = JSON.parse(cleanedJsonText);

    return NextResponse.json(escapeRoomData);
  } catch (error) {
    console.error('Fout bij het genereren van de escape room:', error);
    return NextResponse.json({ error: 'Kon de escape room niet genereren.' }, { status: 500 });
  }
} 