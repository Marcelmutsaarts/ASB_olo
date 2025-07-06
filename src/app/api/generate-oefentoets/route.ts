import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface OefentoetsData {
  title: string;
  questions: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    feedback: string;
  }[];
}

function getQuestionTypeDescription(type: string) {
    switch (type) {
        case 'mc3': return 'Multiple choice vragen met 3 antwoordopties.';
        case 'mc4': return 'Multiple choice vragen met 4 antwoordopties.';
        case 'true-false': return 'Juist/onjuist vragen.';
        default: return 'Multiple choice vragen met 4 antwoordopties.';
    }
}

export async function POST(req: NextRequest) {
  try {
    const { baseContent, didactics, pedagogy, level, testQuestions, testType } = await req.json();

    if (!baseContent) {
      return NextResponse.json({ error: 'Basis content is vereist' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const didacticsText = didactics ? `De vakdidactiek is: ${didactics}.` : '';
    const pedagogyText = pedagogy ? `Houd rekening met de volgende pedagogische aanpak: ${pedagogy}.` : '';
    const levelText = level ? `Het gevraagde niveau is: ${level}. Pas de complexiteit van de vragen en de diepgang van de feedback hierop aan.` : '';

    const prompt = `
      Je bent een expert in het ontwerpen van educatieve toetsen. Jouw taak is om een oefentoets te genereren op basis van de volgende leerstof en specificaties.

      **Specificaties:**
      - Aantal Vragen: ${testQuestions}
      - Vraagvorm: ${getQuestionTypeDescription(testType)}
      - Niveau: ${levelText}
      - Didactiek: ${didacticsText}
      - Pedagogiek: ${pedagogyText}

      **Instructies:**
      1.  **Genereer Vragen:** Maak exact ${testQuestions} vragen die de kern van de leerstof toetsen.
      2.  **Genereer Antwoordopties:** Zorg voor plausibele afleiders voor de multiple choice vragen.
      3.  **Genereer Feedback:** Schrijf voor ELKE vraag een korte, inhoudelijke feedbacktekst. Deze feedback moet uitleggen WAAROM het juiste antwoord correct is en eventueel waarom de belangrijkste afleiders incorrect zijn. De feedback is cruciaal voor het leerproces.
      
      **Leerstof:**
      """
      ${baseContent}
      """

      **Output Formaat:**
      Geef je antwoord ALLEEN als een JSON-object dat direct kan worden geparsed. Start met '{' en eindig met '}'. Gebruik de volgende structuur:
      {
        "title": "Titel van de Oefentoets",
        "questions": [
          {
            "questionText": "De eerste vraag...",
            "options": ["Optie A", "Optie B", "Optie C", "Optie D"],
            "correctOptionIndex": 2,
            "feedback": "Uitleg waarom C het juiste antwoord is, gebaseerd op de leerstof."
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();
    
    const jsonString = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
    const testData = JSON.parse(jsonString);

    return NextResponse.json({ testData });

  } catch (error) {
    console.error("Fout bij het genereren van de oefentoets:", error);
    return NextResponse.json({ error: 'Interne serverfout bij het genereren van de oefentoets' }, { status: 500 });
  }
} 