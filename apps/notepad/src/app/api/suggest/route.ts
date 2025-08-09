import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const systemPrompt = (isPartial: boolean) =>
  `
You are a creative lyricist helping to write song lyrics.
Given the existing lyrics, ${
    isPartial
      ? "complete the line with text"
      : "suggest a single additional line"
  } that flows naturally and maintains the style, rhythm, and theme.
Only respond with the ${
    isPartial ? "line completion" : "suggested line"
  }, no explanations or quotes.
`.trim();

const inspirationPrompt = (inspiration?: string) =>
  `
${inspiration ? `Inspiration/Style guidance:\n\n${inspiration}\n\n` : ""}
`.trim();

const userPrompt = (content: string, isPartial: boolean) =>
  `
${content ? `Here are the current lyrics:\n\n${content}` : ""}


${
  isPartial
    ? `Complete this line:\n\n${content.split("\n").pop()}\n\n`
    : "Suggest the next line:"
}


`.trim();

export const POST = async (req: NextRequest) => {
  try {
    const { content, inspiration } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const lastLine = content.split("\n").pop();
    const isPartial = lastLine !== "";

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt(isPartial),
      },
    ];

    if (inspiration) {
      messages.push({
        role: "user",
        content: inspirationPrompt(inspiration),
      });
    }

    messages.push({
      role: "user",
      content: userPrompt(content, isPartial),
    });

    const response = await client.chat.completions.create(
      {
        messages,
        model: "gpt-5-nano",
        reasoning_effort: "minimal",
        verbosity: "low",
      },
      {
        signal: req.signal,
      }
    );

    const suggestion = response.choices[0]?.message?.content?.trim();

    if (!suggestion) {
      throw new Error("No suggestion received from OpenAI");
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }

    console.error("Error in suggest API:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
};
