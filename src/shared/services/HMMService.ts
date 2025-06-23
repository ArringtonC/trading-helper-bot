import { z } from 'zod';

// Define the base URL for the HMM microservice
// TODO: Make this configurable (e.g., via environment variables)
const HMM_MICROSERVICE_BASE_URL = 'http://127.0.0.1:5001'; // Updated to avoid port conflicts

// Define Zod schemas for request and response data validation
// Schema for the /train request payload
const TrainRequestSchema = z.object({
  symbol: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  model_params: z.record(z.string(), z.any()).optional(), // Optional HMM model parameters
  market_data_filepath: z.string().optional(), // Optional path to market data CSV
  trade_data: z.string().optional(), // Optional raw trade data as a string
  nComponents: z.number().optional(),
  nIter: z.number().optional(),
  covarianceType: z.string().optional(),
  includeVix: z.boolean().optional(), // Optional flag to include VIX features
});

// Schema for the /train response body
const TrainResponseSchema = z.object({
  message: z.string(),
  modelFile: z.string(), // Expects this now
});

// Schema for the /predict request payload
const PredictRequestSchema = z.object({
  symbol: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  return_probabilities: z.boolean().optional(), // Optional flag to return probabilities
  market_data_filepath: z.string().optional(), // Optional path to market data CSV
  trade_data: z.string().optional(), // Optional raw trade data as a string
  tradeDataFilepath: z.string().optional(),
  marketDataFilepath: z.string().optional(),
  includeVix: z.boolean().optional(), // Optional flag to include VIX features
});

// Schema for the /predict response body (simplified for now)
// The actual response includes dates, predicted_states, predicted_regime_labels, and optionally state_probabilities
const PredictResponseSchema = z.object({
  regimeHistory: z.array(z.object({
    date: z.string(),
    regime: z.string(),
  })),
});

// Define TypeScript types based on Zod schemas
export type TrainRequest = z.infer<typeof TrainRequestSchema>;
export type TrainResponse = z.infer<typeof TrainResponseSchema>;
export type PredictRequest = z.infer<typeof PredictRequestSchema>;
export type PredictResponse = z.infer<typeof PredictResponseSchema>;

/**
 * Sends a request to the HMM microservice to train a model.
 * @param data The training parameters.
 * @returns A promise resolving with the training response.
 * @throws An error if the request fails or the response is invalid.
 */
export const trainHMMModel = async (data: TrainRequest): Promise<TrainResponse> => {
  const url = `${HMM_MICROSERVICE_BASE_URL}/train`;
  console.log(`Sending training request to ${url} with data:`, data);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Training failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    // Validate the response data against the schema
    const validatedData = TrainResponseSchema.parse(responseData);
    console.log('Training response received:', validatedData);
    return validatedData;

  } catch (error) {
    console.error('Error during HMM model training:', error);
    throw error; // Re-throw the error for the calling component to handle
  }
};

/**
 * Sends a request to the HMM microservice to predict regimes.
 * @param data The prediction parameters.
 * @returns A promise resolving with the prediction response.
 * @throws An error if the request fails or the response is invalid.
 */
export const predictHMMRegimes = async (data: PredictRequest): Promise<PredictResponse> => {
  const url = `${HMM_MICROSERVICE_BASE_URL}/predict`;
  console.log(`Sending prediction request to ${url} with data:`, data);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Prediction failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
     // Validate the response data against the schema
    const validatedData = PredictResponseSchema.parse(responseData);
    console.log('Prediction response received:', validatedData);
    return validatedData;

  } catch (error) {
    console.error('Error during HMM regime prediction:', error);
    throw error; // Re-throw the error for the calling component to handle
  }
};

// You can add other functions here for future HMM-related interactions
// For example: loading model parameters, checking service status, etc. 