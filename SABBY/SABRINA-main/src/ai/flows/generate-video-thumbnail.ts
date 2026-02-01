'use server';

/**
 * @fileOverview AI flow to generate video thumbnails based on a text prompt.
 *
 * - generateVideoThumbnail - A function that generates a video thumbnail using AI.
 * - GenerateVideoThumbnailInput - The input type for the generateVideoThumbnail function.
 * - GenerateVideoThumbnailOutput - The return type for the generateVideoThumbnail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVideoThumbnailInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired thumbnail.'),
});

export type GenerateVideoThumbnailInput = z.infer<
  typeof GenerateVideoThumbnailInputSchema
>;

const GenerateVideoThumbnailOutputSchema = z.object({
  thumbnailDataUri: z
    .string()
    .describe(
      'The generated video thumbnail as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    ),
});

export type GenerateVideoThumbnailOutput = z.infer<
  typeof GenerateVideoThumbnailOutputSchema
>;

export async function generateVideoThumbnail(
  input: GenerateVideoThumbnailInput
): Promise<GenerateVideoThumbnailOutput> {
  return generateVideoThumbnailFlow(input);
}

const generateVideoThumbnailPrompt = ai.definePrompt({
  name: 'generateVideoThumbnailPrompt',
  input: {schema: GenerateVideoThumbnailInputSchema},
  output: {schema: GenerateVideoThumbnailOutputSchema},
  prompt: `Generate a video thumbnail based on the following prompt: {{{prompt}}}`,
});

const generateVideoThumbnailFlow = ai.defineFlow(
  {
    name: 'generateVideoThumbnailFlow',
    inputSchema: GenerateVideoThumbnailInputSchema,
    outputSchema: GenerateVideoThumbnailOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: input.prompt,
      model: 'googleai/imagen-4.0-fast-generate-001',
    });

    if (!media?.url) {
      throw new Error('Failed to generate thumbnail.');
    }

    return {thumbnailDataUri: media.url};
  }
);
