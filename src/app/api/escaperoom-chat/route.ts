import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { puzzle, userAnswer, chatHistory } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Je bent een Game Master voor een educatieve Escape Room. Jouw rol is om studenten te begeleiden zonder de antwoorden direct te geven.

      **De Huidige Puzzel:**
      - Vraag: "${puzzle.question}"
      - Correct Antwoord: "${puzzle.answer}"
      - Beschikbare Hints: ${puzzle.hints.join(', ')}

      **De Interactie:**
      De student heeft het volgende antwoord of vraag gegeven: "${userAnswer}"

      **Jouw Taak:**
      1.  **Evalueer het antwoord:** Vergelijk het antwoord van de student met het correcte antwoord. Wees flexibel met kleine spelfouten of andere formuleringen, maar de essentie moet kloppen.
      2.  **Geef Feedback:**
          - **Indien Correct:** Antwoord met "CORRECT:" gevolgd door de succesfeedback van de puzzel: "${puzzle.successFeedback}". Geef GEEN extra informatie.
          - **Indien Incorrect:** Geef een Socratic-stijl hint. Stel een wedervraag die de student aan het denken zet, of wijs ze subtiel in de juiste richting. GEBRUIK DE EXACTE HINTS UIT DE PUZZELDATA NIET, maar baseer je hints erop. Het doel is om ze zelf tot het antwoord te laten komen.
          - **Indien de student om een hint vraagt:** Geef een van de hints uit de puzzeldata. Zeg bijvoorbeeld: "Hier is een hint voor je: [hint]".
      
      **Belangrijke Regels:**
      - GEHEIMHOUD HET ANTWOORD! Zelfs als de student erom smeekt.
      - Houd je antwoorden kort en gericht op de puzzel.
      - Begin je antwoord NOOIT met "User:" of "Model:".
    `;

    // Start de chat sessie
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Fout bij de escape room chat:', error);
    return NextResponse.json({ error: 'Kon niet communiceren met de Game Master.' }, { status: 500 });
  }
} 