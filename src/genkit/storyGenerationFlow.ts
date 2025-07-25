import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
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
      title: z.string(),
      parts: z.array(
        z.object({
          content: z.string(),
          imagePrompt: z
            .string()
            .describe(
              'Simple prompt which can be given to an image generation model to generate a picture suitable for this part of the story'
            ),
        })
      ),
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

          ---

          ## 🔐 INPUT (provided as JSON):

          The user has provided some story preferences and ideas in the form of a structured object:

          ${userContext}
`,
        output: {
          schema: z.object({
            title: z.string(),
            parts: z.array(
              z.object({
                content: z.string().describe('nth Part of the story'),
                imagePrompt: z
                  .string()
                  .describe(
                    'Simple prompt which can be given to an image generation model to generate a picture suitable for this part of the story'
                  ),
              })
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

export const imageGenerationFlow = ai.defineFlow(
  {
    name: 'imageGenerationFlow',
    inputSchema: z.object({
      imagePrompt: z.string(),
      seed: z.number().optional(),
    }),
    outputSchema: z.object({
      imageUri: z.string(),
    }),
  },
  async ({ imagePrompt, seed }) => {
    try {
      const response = await ai.generate({
        model: vertexAI.model('imagen-3.0-fast-generate-001'),
        prompt: imagePrompt,

        output: { format: 'media' },
        config: {
          safetySetting: 'block_few',
          aspectRatio: '16:9',
          personGeneration: 'allow_all',
          addWatermark: false,
          outputOptions: {
            mimeType: 'image/jpeg',
            compressionQuality: 40,
          },
          seed,
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
