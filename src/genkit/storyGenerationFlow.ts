import { genkit } from 'genkit';
import { z } from 'zod';
import { environment } from '../environments/environment';
import { vertexAI } from '@genkit-ai/vertexai';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

const ai = genkit({
  plugins: [
    vertexAI({
      location: 'us-central1',
      projectId: environment.gcpProjectId,
    }),
  ],
});

export const storyGenerationFlow = ai.defineFlow(
  {
    name: 'storyGenerationFlow',
    inputSchema: z.object({ userContext: z.string() }),
    outputSchema: z.object({
      name: z.string(),
      storyParts: z.array(
        z.object({
          content: z.string(),
          imageUrl: z.string(),
        })
      ),
      language: z.string(),
      ageGroup: z.string(),
    }),
  },
  async ({ userContext }) => {
    try {
      const { output } = await ai.generate({
        model: vertexAI.model('gemini-2.0-flash'),
        prompt: `You are a helpful AI designed to generate short, creative, and age-appropriate stories for young children. Your goal is to create fun, imaginative stories that are safe and consistent.

          ---

          ## ✍️ TASK:

          Your task is to generate a complete story object based on the user's input. Follow these steps precisely:

          **Step 1: Define Characters**
          First, create a 'characterSheet'. This is a JSON object where keys are character names and values are brief, definitive descriptions. This sheet is the absolute source of truth for character appearance.
          - Example: { "Aslan": "A 5-year-old human boy with brown hair", "Barnaby": "A small, brown teddy bear with a blue bow tie." }

          **Step 2: Generate Story Parts**
          Next, generate the story, broken into 4-5 parts. Each part should be 3-6 sentences long and suitable for children (ages 4-10).

          **Step 3: Generate Image Prompts**
          For each story part, create a simple, Imagen-safe image prompt in a **cartoon/digital art** style.

          ---

          ## 📜 RULES FOR CONSISTENCY:

          1.  **CHARACTER ADHERENCE:** The appearance of characters in each image prompt **MUST** strictly adhere to their description in the 'characterSheet'.
          2.  **NO TRANSFORMATIONS:** Do **NOT** change a character's species or fundamental attributes (e.g., a human boy must remain a human boy). Do not confuse a character's name with other famous characters. For example, a boy named "Aslan" is a boy, not a lion.
          3.  **VISUAL DETAILS:** The image prompt must contain all specific visual details. The story text should focus on narrative.
          4.  **VARY THE PERSPECTIVE:** To make the story visually engaging, each image prompt should describe the scene from a different angle or perspective (e.g., close-up on a character's face, a wide shot of the room, a view from behind the character).
          5.  **LANGUAGE:** All image prompts must be in English.

          ---

          ## 🔐 INPUT (provided as JSON):

          The user has provided some story preferences and ideas:

          ${userContext}
`,
        output: {
          schema: z.object({
            name: z.string(),
            characterSheet: z
              .record(z.string())
              .describe(
                'A JSON object defining the main characters and their appearance.'
              ),
            storyParts: z.array(
              z.object({
                content: z.string().describe('nth Part of the story'),
                imagePrompt: z
                  .string()
                  .describe(
                    'A simple, consistent prompt for an image generation model.'
                  ),
              })
            ),
            language: z
              .string()
              .describe(
                "The language of the story. Please include the full name of the language e.g. 'English'"
              ),
            ageGroup: z
              .string()
              .describe('Age group for which this story is ideal'),
          }),
        },
      });

      if (!output) throw new Error('Error While Generating Story');

      const storyPartsWithImages: { content: string; imageUrl: string }[] = [];
      let prevImgUrl = '';

      // Generate the first image
      const firstPart = output.storyParts[0];
      if (firstPart) {
        const { imageUri } = await imagenGenerationFlow({
          imagePrompt: firstPart.imagePrompt,
        });
        prevImgUrl = imageUri;
        storyPartsWithImages.push({
          content: firstPart.content,
          imageUrl: imageUri,
        });
      }

      // Generate subsequent images consistently
      for (let i = 1; i < output.storyParts.length; i++) {
        const part = output.storyParts[i];
        const { imageUri } = await consistentImageGenerationFlow({
          imagePrompt: part.imagePrompt,
          prevImgUrl: prevImgUrl,
        });
        prevImgUrl = imageUri;
        storyPartsWithImages.push({
          content: part.content,
          imageUrl: imageUri,
        });
      }

      return {
        name: output.name,
        storyParts: storyPartsWithImages,
        language: output.language,
        ageGroup: output.ageGroup,
      };
    } catch (e) {
      console.log(e);
      throw new Error('Error while generating story');
    }
  }
);

const blueprintOutputSchema = z.object({
  'Who is this story for?': z
    .string()
    .describe(
      'If the name of the person is giving, design the story for him/her'
    ),
  'What is their age group': z.enum([
    '1-5 years',
    '6-10 years',
    '11-15 years',
    '15 and above',
  ]),
  'Which language would you like the story to be in': z.string(),
  'What are their favorite things?': z.string(),
  'What kind of world should the story happen in?': z.enum([
    '🌌 Space',
    '🏞️ Jungle',
    '🏰 Magic Kingdom',
    '🌊 Underwater',
    '🏫 School',
    '🏡 Everyday life',
  ]),
  'What should the story teach or focus on?': z.enum([
    '🧡 Kindness',
    '💪 Courage',
    '🧠 Curiosity',
    '👫 Friendship',
    '✨ Just for fun',
  ]),
  'What mood should the story have?': z.enum([
    '😂 Funny',
    '🧙 Magical',
    '😴 Calm',
    '🧗 Adventurous',
  ]),
});

export const blueprintGenerationFlow = ai.defineFlow(
  {
    name: 'blueprintGenerationFlow',
    inputSchema: z.object({ userContext: z.string() }),
    outputSchema: blueprintOutputSchema,
  },
  async ({ userContext }) => {
    try {
      const { output } = await ai.generate({
        model: vertexAI.model('gemini-2.0-flash'),
        prompt: `
You are a story planning assistant. Based on the user's story idea, fill out the following questionnaire. Use the exact wording for each question as keys in your output JSON.

Questions:
1. "Who is this story for?"
2. "What is their age group"
3. "Which language would you like the story to be in"
4. "What are their favorite things?"
5. "What kind of world should the story happen in?"
   (Choose one: '🌌 Space', '🏞️ Jungle', '🏰 Magic Kingdom', '🌊 Underwater', '🏫 School', '🏡 Everyday life')
6. "What should the story teach or focus on?"
   (Choose one: '🧡 Kindness', '💪 Courage', '🧠 Curiosity', '👫 Friendship', '✨ Just for fun')
7. "What mood should the story have?"
   (Choose one: '😂 Funny', '🧙 Magical', '😴 Calm', '🧗 Adventurous')

Here is the user's story idea:
---
${userContext}
---

Return a JSON object with the exact question strings as keys, and answers as values. For multiple-choice, pick **only** from the options provided. For open-ended, infer from the idea or provide a default.
Do infer an age group from age (if given in inital prompt) or from other info given
`,
        output: {
          schema: blueprintOutputSchema,
        },
      });

      if (!output) throw new Error('No output returned from Gemini');
      return output;
    } catch (e) {
      console.error(e);
      throw new Error('Error while generating blueprint');
    }
  }
);

export const imagenGenerationFlow = ai.defineFlow(
  {
    name: 'imagenGenerationFlow',
    inputSchema: z.object({
      imagePrompt: z.string(),
    }),
    outputSchema: z.object({
      imageUri: z.string(),
    }),
  },
  async ({ imagePrompt }) => {
    try {
      // Use Imagen for the first image
      const response = await ai.generate({
        model: vertexAI.model('imagen-3.0-fast-generate-001'),
        prompt: [{ text: imagePrompt }],
        output: { format: 'data_url' },
        config: {
          personGeneration: 'allow_all',
          aspectRatio: '16:9',
          outputOptions: {
            mimeType: 'image/jpeg',
            compressionQuality: 40,
          },
        },
      });

      const imagePart = response.message?.content[0]?.media?.url;
      return {
        imageUri: imagePart || '',
      };
    } catch (e) {
      console.log(e);
      throw new Error(
        e instanceof Error ? e.message : 'Error while generating image for you'
      );
    }
  }
);

export const consistentImageGenerationFlow = ai.defineFlow(
  {
    name: 'consistentImageGenerationFlow',
    inputSchema: z.object({
      imagePrompt: z.string(),
      prevImgUrl: z.string(),
    }),
    outputSchema: z.object({
      imageUri: z.string(),
    }),
  },
  async ({ imagePrompt, prevImgUrl }) => {
    try {
      const genAI = new GoogleGenAI({
        apiKey: environment.GEMINI_API_KEY || '',
      });

      // Fetch the previous image and convert it to base64
      const imageResponse = await axios.get(prevImgUrl, {
        responseType: 'arraybuffer',
      });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');
      const imageBase64 = imageBuffer.toString('base64');

      const model = 'gemini-2.5-flash-image-preview';

      const response = await genAI.models.generateContent({
        model,
        config: {
          temperature: 0.7,
        },
        contents: [
          {
            parts: [
              { text: imagePrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          if (imageData) {
            return { imageUri: `data:${mimeType};base64,${imageData}` };
          }
        }
      }

      throw new Error('No image data in response from Gemini.');
    } catch (e) {
      console.log(e);
      throw new Error(
        e instanceof Error ? e.message : 'Error while generating image for you'
      );
    }
  }
);
