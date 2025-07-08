import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types voor de presentatie data
interface SlideContent {
  mainText?: string;
  bulletPoints?: string[];
  visualElement?: {
    type: 'emoji' | 'diagram' | 'chart' | 'icon-grid';
    data: any;
  };
  speakerNotes?: string;
}

interface Slide {
  id: string;
  type: 'title' | 'intro' | 'concept' | 'example' | 'visual' | 'summary' | 'questions';
  title: string;
  content: SlideContent;
  layout: 'center' | 'two-column' | 'bullets' | 'visual-focus';
  theme: 'primary' | 'accent' | 'neutral';
}

interface PresentationData {
  title: string;
  slides: Slide[];
  metadata: {
    totalSlides: number;
    estimatedDuration: string;
    targetAudience: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { baseContent, didactics, pedagogy, level } = await req.json();

    if (!baseContent) {
      return NextResponse.json({ error: 'baseContent is verplicht' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Je bent een expert in het maken van educatieve presentaties voor het hoger onderwijs.

Maak een presentatie over de volgende content:
${baseContent}

INSTRUCTIES:
- Genereer tussen de 8 en 12 slides, afhankelijk van de complexiteit van de content
- Pas het niveau aan: ${level}
- Gebruik didactische aanpak: ${didactics || 'Standaard tutor aanpak'}
- Gebruik pedagogische stijl: ${pedagogy || 'Ondersteunend begeleidend'}

SLIDE TYPES:
- title: Titel slide met onderwerp
- intro: Introductie/overzicht van wat komt
- concept: Uitleg van een kernbegrip
- example: Praktijkvoorbeeld of case
- visual: Slide met focus op visuele representatie
- summary: Samenvatting van key points
- questions: Discussievragen of verdieping

LAYOUT OPTIES:
- center: Gecentreerde content
- two-column: Twee kolommen layout
- bullets: Bullet points layout
- visual-focus: Grote visual met begeleidende tekst

Voor elke slide, bepaal:
1. Het meest geschikte slide type
2. Een pakkende, duidelijke titel
3. Content die past bij het niveau
4. Visuele elementen (emoji's, diagrammen beschrijving, etc.)
5. Layout die het beste past
6. Speaker notes voor de docent

BELANGRIJK:
- Bouw de kennis logisch op
- Gebruik veel emoji's en visuele elementen
- Maak het interactief en engaging
- Pas de complexiteit aan op het niveau
- Voeg altijd speaker notes toe

Genereer de presentatie in het volgende JSON formaat:
{
  "title": "Hoofdtitel van de presentatie",
  "slides": [
    {
      "id": "slide-1",
      "type": "title",
      "title": "Slide titel",
      "content": {
        "mainText": "Hoofd tekst",
        "bulletPoints": ["punt 1", "punt 2"],
        "visualElement": {
          "type": "emoji",
          "data": "🎯"
        },
        "speakerNotes": "Notities voor de spreker"
      },
      "layout": "center",
      "theme": "primary"
    }
  ],
  "metadata": {
    "totalSlides": 10,
    "estimatedDuration": "15-20 minuten",
    "targetAudience": "HBO Propedeuse studenten"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse de JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Geen geldige JSON response van AI');
    }

    const presentationData: PresentationData = JSON.parse(jsonMatch[0]);

    // Valideer dat we slides hebben
    if (!presentationData.slides || presentationData.slides.length === 0) {
      throw new Error('Geen slides gegenereerd');
    }

    // Zorg ervoor dat elke slide een unieke ID heeft
    presentationData.slides = presentationData.slides.map((slide, index) => ({
      ...slide,
      id: slide.id || `slide-${index + 1}`
    }));

    return NextResponse.json({ presentationData });
  } catch (error) {
    console.error('Error generating presentation:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het genereren van de presentatie' },
      { status: 500 }
    );
  }
}