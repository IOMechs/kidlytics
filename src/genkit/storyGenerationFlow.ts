import { genkit } from 'genkit';
import { z } from 'zod';
import { environment } from '../environments/environment';
import { vertexAI } from '@genkit-ai/vertexai';

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
          imagePrompt: z
            .string()
            .describe(
              'Simple prompt which can be given to an image generation model to generate a picture suitable for this part of the story'
            ),
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
        prompt: `You are a helpful AI designed to generate short, creative, and age-appropriate stories for young children based on answers provided by a user. Your goal is to create fun, imaginative stories that are completely safe, free of inappropriate themes, avoiding controversial and politcal topics and respectful of safety standards.

          ---

          ## ✍️ TASK:

          Using the provided input, generate a story that is:

          - Broken into 4–5 parts (each as a separate object in an array)
          - Each part should be:
            - 3–6 sentences long
            - Simple enough for children (ages 4–10) to understand
            - Wholesome, imaginative, and positive
            - Must be relatable to the person whom the story is for. This info can be found in the provided input
            - Rich in visuals and emotions to inspire picture generation
          - For each part, also return a **simple, Imagen-safe image prompt** that represents the scene in a **cartoon/digital art** style
          - The image prompt of each part should be deterministic such that the imagegen model maintains visual consistency across the images.
          - In each Image Prompt , make sure visual attributes of each character and object is specified and attributes of one character or object must remain same across all story parts
          - Even if the story content is in some other content write the image prompt in English only
          - Also, provide the idead age group for this story e.g. 5+
          - If the language of the story is specified, make sure the story is in that language strictly
          ---

          ## 🔐 INPUT (provided as JSON):

          The user has provided some story preferences and ideas in the form of a structured object:

          ${userContext}
`,
        output: {
          schema: z.object({
            name: z.string(),
            storyParts: z.array(
              z.object({
                content: z.string().describe('nth Part of the story'),
                imagePrompt: z
                  .string()
                  .describe(
                    'Simple prompt which can be given to an image generation model to generate a picture suitable for this part of the story'
                  ),
              })
            ),
            language: z
              .string()
              .describe(
                "The language of the story. Please include full name of the language e.g. 'English'"
              ),
            ageGroup: z
              .string()
              .describe('Age group for which this story is ideal'),
          }),
        },
      });

      if (!output) throw new Error('Error While Generating Story');

      return output;
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

export const imageGenerationFlow = ai.defineFlow(
  {
    name: 'imageGenerationFlow',
    inputSchema: z.object({
      imagePrompt: z.string(),
      prevImgUrl: z.string().optional(),
      seed: z.number().optional(),
    }),
    outputSchema: z.object({
      imageUri: z.string(),
    }),
  },
  async ({ imagePrompt, prevImgUrl, seed }) => {
    try {
      const response = await ai.generate({
        model: vertexAI.model('imagen-3.0-fast-generate-001'),
        prompt: prevImgUrl
          ? [
              { text: imagePrompt },
              {
                text: `
                  This image (to be generated) continues the story from the previously generated image see attached media. However, you have to create a new complete scene (do not include the previous scene).
                  - Ensure the same characters and objects appear with consistent looks across both images (e.g., facial features, clothing, colors, accessories).
                  - Maintain overall visual consistency with the previous image in terms of character design, objects, and setting.`,
              },
              { media: { url: prevImgUrl || '' } },
            ]
          : [
              {
                text: imagePrompt,
              },
            ],

        output: { format: 'media' },

        config: {
          safetySetting: 'block_few',
          aspectRatio: '16:9',
          personGeneration: 'allow_all',
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
