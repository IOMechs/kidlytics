import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { environment } from '../environments/environment';
import { vertexAI } from '@genkit-ai/vertexai';

const ai = genkit({
  plugins: [
    googleAI({
      apiKey: environment.GEMINI_API_KEY,
    }),
  ],
});

export const storyGenerationFlow = ai.defineFlow(
  {
    name: 'storyGenerationFlow',
    inputSchema: z.object({ userContext: z.string() }),
    outputSchema: z.array(
      z.object({
        content: z.string(),
        imagePrompt: z
          .string()
          .describe(
            'Simple prompt which can be given to an image generation model to generate a picture suitable for this part of the story'
          ),
      })
    ),
  },
  async ({ userContext }) => {
    try {
      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: `Create an intresting story for the kid with this these detail and interest
        ${userContext}. The story should be in 4-5 parts, each part in a different object in the array.
        With each part, give a simple short prompt for generating a very simple picture for representing that part of the story
        `,
        output: {
          schema: z.array(
            z.object({
              content: z.string().describe('nth Part of the story'),
              imagePrompt: z
                .string()
                .describe(
                  'Simple prompt which can be given to an image generation model to generate a picture suitable for this part of the story'
                ),
            })
          ),
        },
      });

      return output || [];
    } catch (e) {
      console.log(e);
      return [];
    }
  }
);
