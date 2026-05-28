import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const template =
      body.template || "Street Food";

    const imageCount =
      body.imageCount || 5;

    const prompt = `
Generate an Instagram food storytelling carousel.

Template style: ${template}

Create:
- 1 hook
- ${imageCount - 2} storytelling slides
- 1 CTA ending

The tone should feel:
- cinematic
- emotional
- short-form Instagram storytelling
- highly engaging
- creator-style captions

Return ONLY valid JSON.

Example:

{
  "hook": "Street food isn't just food, it's emotion.",
  "slide1": "Every corner has a story to tell.",
  "slide2": "From spicy bites to sweet delights.",
  "slide3": "Flavors that bring people together.",
  "slide4": "Some meals become memories forever.",
  "cta": "Tag your foodie crew & explore your city."
}
`;

    const completion =
      await client.chat.completions.create({
        model: "gpt-4.1-mini",

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const text =
      completion.choices[0]?.message
        ?.content || "{}";

    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        hook:
          "Street food isn't just food, it's emotion.",
        slide1:
          "Every corner has a story to tell.",
        slide2:
          "From spicy bites to sweet delights.",
        slide3:
          "Flavors that bring people together.",
        slide4:
          "Some meals become memories forever.",
        cta:
          "Tag your foodie crew & explore your city.",
      },
      { status: 200 }
    );
  }
}