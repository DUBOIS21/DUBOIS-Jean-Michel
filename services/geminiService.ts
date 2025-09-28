
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { AspectRatio } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("Clé API manquante. Veuillez définir la variable d'environnement API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const handleApiError = (error: any): Error => {
    console.error("Erreur API Gemini:", JSON.stringify(error, null, 2));

    // Check for specific safety-related blocks
    if (error.response?.promptFeedback?.blockReason === 'SAFETY') {
        return new Error("Votre demande a été bloquée pour des raisons de sécurité. Évitez les prompts qui pourraient générer des images de personnes réelles, du contenu sensible ou enfreindre les politiques d'utilisation.");
    }

    const errorMessage = JSON.stringify(error).toLowerCase();
    
    // Check for quota issues
    if (errorMessage.includes('quota') || errorMessage.includes('resource_exhausted') || errorMessage.includes('429')) {
        return new Error("Vous avez dépassé votre quota d'utilisation de l'API. Veuillez vérifier votre plan et vos détails de facturation.");
    }

    // Check for API key issues
    if (errorMessage.includes('permission_denied') || errorMessage.includes('api key not valid')) {
        return new Error("La clé API semble être invalide ou manquante. Veuillez vérifier sa configuration.");
    }

    // Generic fallback
    return new Error("Une erreur inattendue est survenue avec l'API. La console contient plus de détails techniques.");
}

export const generateImage = async (prompt: string, negativePrompt: string, aspectRatio: AspectRatio, numberOfImages: number, inputImage?: string | null): Promise<string[]> => {
  const fullPrompt = negativePrompt ? `${prompt}. Ne pas inclure : ${negativePrompt}` : prompt;
  
  if (!inputImage) {
    // Logique texte-vers-image existante
    try {
      const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: fullPrompt,
          config: {
            numberOfImages: numberOfImages,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
          },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
      }
      throw new Error("Aucune image n'a été générée.");
    } catch (error) {
      throw handleApiError(error);
    }
  } else {
    // Nouvelle logique image+texte-vers-image (génère une seule image)
    const mimeType = inputImage.match(/data:(.*);base64,/)?.[1] || 'image/png';
    const base64Data = inputImage.split(',')[1];

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                  },
                },
                {
                  text: fullPrompt,
                },
              ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
          });
        
        let imageUrl: string | null = null;

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
              break; // On a trouvé l'image, on arrête
            }
        }
        
        if (imageUrl) {
            return [imageUrl];
        }

        throw new Error("Aucune image n'a été retournée par l'API pour la génération avec image.");
    } catch (error) {
        throw handleApiError(error);
    }
  }
};


export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<{imageUrl: string, text: string}> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
          });
        
        let imageUrl: string | null = null;
        let text: string = '';

        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              text = part.text;
            } else if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        if (imageUrl) {
            return { imageUrl, text };
        }

        throw new Error("Aucune image n'a été retournée par l'API d'édition.");
    } catch (error) {
        throw handleApiError(error);
    }
}