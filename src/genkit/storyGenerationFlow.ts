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
// const ai = genkit({
//   plugins: [
//     googleAI({
//       apiKey: environment.GEMINI_API_KEY,
//     }),
//   ],
// });

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
    }),
  },
  async ({ userContext }) => {
    try {
      const { output } = await ai.generate({
        model: vertexAI.model('gemini-2.0-flash'),
        prompt: `Create an intresting story for the kid with this these detail and interest
        ${userContext}. The story should be in 4-5 parts, each part in a different object in the array.
        With each part, give a simple short prompt for generating a very simple picture for representing that part of the story
        
        **IMPORTANT NOTE** 
        Make sure the image prompts comply with the Imagen Model's Content Filter, as we will be feeding this to Imagen 3 to generate images

        Below are the guidlines and examples to generate comply with Google's Safet Filters

        Consider rephrasing your prompts to avoid trigger words like "child," "infant," or "kid," and instead use alternatives such as "young person," "youth," "student," "boy," "girl," or specify the age (e.g., "a fifteen-year-old girl"). Be sure to emphasize the art style by clearly stating that you're looking for a comic or cartoon style, using phrases like "comic book illustration," "cartoon character," "animated style," or "digital painting" to indicate a non-realistic image. Additionally, include contextual clues that reinforce the non-sexual, educational nature of the scene, such as "a young student in a classroom," "children playing in a park under adult supervision," or "a group of children listening to a storyteller.
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
    }),
    outputSchema: z.object({
      imageUri: z.string(),
    }),
  },
  async ({ imagePrompt }) => {
    try {
      const response = await ai.generate({
        model: vertexAI.model('imagen-3.0-fast-generate-001'),
        prompt: imagePrompt,
        output: { format: 'media' },
        config: {
          safetySetting: 'block_few',
          personGeneration: 'allow_all',
        },
      });

      const imagePart = response.message?.content[0]?.media?.url;
      return {
        imageUri: imagePart || '',
      };
    } catch (e) {
      console.log(e);
      return {
        imageUri: '',
      };
    }
  }
);
