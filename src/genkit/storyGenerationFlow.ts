import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { environment } from '../environments/environment';

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
      z.object({ content: z.string() }).describe('nth Part of the story')
    ),
  },
  async ({ userContext }) => {
    try {
      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: `Create an intresting story for the kid with this these detail and interest
        ${userContext}
        `,
        output: {
          schema: z.array(
            z.object({ content: z.string() }).describe('nth Part of the story')
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
