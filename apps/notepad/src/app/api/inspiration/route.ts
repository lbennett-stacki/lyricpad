import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import Genius from "genius-lyrics";

export const POST = async (req: NextRequest) => {
  try {
    const { inspiration } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    if (!process.env.GENIUS_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Genius API access token not configured" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const searchLyrics = async (artist: string): Promise<string> => {
      try {
        const Client = new Genius.Client(process.env.GENIUS_ACCESS_TOKEN);

        const searches = await Client.songs.search(`${artist}`);

        console.log("\n\n\nSEARCHES", searches);

        if (searches.length > 0) {
          const firstSong = searches[0];

          const lyrics = await firstSong.lyrics();

          console.log("\n\n\nLYRICS", lyrics);

          if (lyrics) {
            return `
            ### Lyrics from "${firstSong.title}" by ${firstSong.artist.name}
            
            ${lyrics}
            `.trim();
          }
        }

        return `No lyrics found.`;
      } catch (error) {
        console.error("Error searching lyrics:", error);
        return `Error searching for lyrics.`;
      }
    };

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
        You are an inspiration context generator for a song lyricist.
        You will be given a description of inspiration for a song that you will expand upon.
        You can use a lyrics search tool to find existing lyrics to include that match the provided inspiration.

        For example, if the inspiration includes "Brysol Tiller" as an artist, you can search for Bryson Tiller's lyrics as well as provide an expanded description of the artist.

        You can describe the artist, their genre and style.
        You should not write your own lyrics for inspiration. Lyrics found in the lyrics search tool will be included automatically after you have called the tool and they do not need to be included or repeated in your response.
        You are not directly communicating with the user. You should not ask any questions or suggest any additional steps to gather more inspiration context.
        `.trim(),
      },
      {
        role: "user",
        content: `
        Inspiration:
        
        ${inspiration}

        Additional inspiration context:
        `.trim(),
      },
    ];

    const response = await client.chat.completions.create(
      {
        messages,
        model: "gpt-5",
        reasoning_effort: "minimal",
        verbosity: "low",
        tools: [
          {
            type: "function",
            function: {
              name: "search_lyrics",
              description: "Search for lyrics by an artist",
              parameters: {
                type: "object",
                properties: {
                  artist: {
                    type: "string",
                    description: "The artist to search for",
                  },
                },
                required: ["artist"],
              },
            },
          },
        ],
      },
      {
        signal: req.signal,
      }
    );

    const responseMessage = response.choices[0]?.message;

    console.log("\n\n\nRESPONSE MESSAGE", responseMessage);

    if (!responseMessage) {
      throw new Error("No response received from OpenAI");
    }

    let hasToolCalls = false;
    let lyrics = "";
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        if (
          toolCall.type === "function" &&
          toolCall.function?.name === "search_lyrics"
        ) {
          hasToolCalls = true;
          const args = JSON.parse(toolCall.function.arguments);
          lyrics = await searchLyrics(args.artist);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: lyrics,
          });
        }
      }

      const finalResponse = hasToolCalls
        ? await client.chat.completions.create(
            {
              messages,
              model: "gpt-5-nano",
              reasoning_effort: "minimal",
              verbosity: "low",
            },
            {
              signal: req.signal,
            }
          )
        : response;

      const suggestion = finalResponse.choices[0]?.message?.content?.trim();

      if (!suggestion) {
        throw new Error("No final suggestion received from OpenAI");
      }

      return NextResponse.json({
        suggestion: [suggestion, lyrics].join("\n\n"),
      });
    } else {
      const suggestion = responseMessage.content?.trim();

      if (!suggestion) {
        throw new Error("No suggestion received from OpenAI");
      }

      return NextResponse.json({
        suggestion: [suggestion, lyrics].join("\n\n"),
      });
    }
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
