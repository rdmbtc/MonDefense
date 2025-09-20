"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { api, secureApi, apiEndpoints } from "../lib/api";
import {
  EndGameSessionRequest,
  StartGameSessionRequest,
  StartGameSessionResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
} from "../types";
import { monitoringService } from "../lib/monitoring";

export function useGameSession(gameSessionToken: string | null) {
  const queryClient = useQueryClient();

  const startGameSession = useMutation({
    mutationFn: async (
      data: StartGameSessionRequest
    ): Promise<StartGameSessionResponse> => {
      try {
        monitoringService.logGameEvent(
          'session_start',
          `Game session started for player: ${data.walletAddress}`,
          { walletAddress: data.walletAddress }
        );

        const response: AxiosResponse<StartGameSessionResponse> = await secureApi.post(
          apiEndpoints.startGameSession,
          data
        );
        return response.data;
      } catch (error: any) {
        monitoringService.logSecurityEvent(
          'validation',
          'error',
          `Failed to start game session: ${error.message}`,
          { 
            error: error.message,
            requestData: data,
            endpoint: apiEndpoints.startGameSession
          },
          data.walletAddress
        );
        throw error;
      }
    },
    onSuccess: (response, variables) => {
      // Invalidate related queries when session starts
      queryClient.invalidateQueries({ queryKey: ["playerTotalScore"] });
      
      monitoringService.logGameEvent(
        'session_start',
        `Game session successfully started for player: ${variables.walletAddress}`,
        { 
          walletAddress: variables.walletAddress,
          sessionId: response.sessionId,
          success: true
        }
      );
    },
    onError: (error: any, variables) => {
      monitoringService.logSecurityEvent(
        'validation',
        'error',
        `Game session start failed: ${error.message}`,
        { 
          error: error.message,
          requestData: variables,
          endpoint: apiEndpoints.startGameSession
        },
        variables.walletAddress
      );
    },
  });

  const endGameSession = useMutation({
    mutationFn: async (data: EndGameSessionRequest): Promise<void> => {
      if (!gameSessionToken) {
        throw new Error("No session token available");
      }
      
      try {
        await secureApi.post(apiEndpoints.endGameSession, data, {
          headers: {
            Authorization: `Bearer ${gameSessionToken}`,
          },
        });

        monitoringService.logGameEvent(
          'session_end',
          `Game session ended for session: ${data.sessionId}`,
          { 
            sessionId: data.sessionId,
            success: true
          }
        );
      } catch (error: any) {
        monitoringService.logSecurityEvent(
          'validation',
          'error',
          `Failed to end game session: ${error.message}`,
          { 
            error: error.message,
            requestData: data,
            endpoint: apiEndpoints.endGameSession
          },
          undefined,
          data.sessionId
        );
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries when session ends
      queryClient.invalidateQueries({ queryKey: ["playerTotalScore"] });
    },
    onError: (error: any, variables) => {
      monitoringService.logSecurityEvent(
        'validation',
        'error',
        `Game session end failed: ${error.message}`,
        { 
          error: error.message,
          requestData: variables,
          endpoint: apiEndpoints.endGameSession
        },
        undefined,
        variables.sessionId
      );
    },
  });

  const submitScore = useMutation({
    mutationFn: async (
      data: SubmitScoreRequest
    ): Promise<SubmitScoreResponse> => {
      if (!gameSessionToken) {
        throw new Error("No session token available");
      }
      
      console.log("Submitting score with data:", data);
      console.log("Using session token:", gameSessionToken);
      
      try {
        monitoringService.logGameEvent(
          'score_submit',
          `Score submission attempt: ${data.scoreAmount} for player: ${data.player}`,
          { 
            player: data.player,
            scoreAmount: data.scoreAmount,
            sessionId: data.sessionId
          }
        );
        
        const response: AxiosResponse<SubmitScoreResponse> = await secureApi.post(
          apiEndpoints.submitScore,
          data,
          {
            headers: {
              Authorization: `Bearer ${gameSessionToken}`,
            },
          }
        );
        
        console.log("Score submission response:", response.data);
        
        monitoringService.logGameEvent(
          'score_submit',
          `Score successfully submitted: ${data.scoreAmount} for player: ${data.player}`,
          { 
            player: data.player,
            scoreAmount: data.scoreAmount,
            sessionId: data.sessionId,
            success: true,
            transactionHash: response.data.transactionHash
          }
        );
        
        return response.data;
      } catch (error: any) {
        console.error("Score submission error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });

        monitoringService.logSecurityEvent(
          'validation',
          'error',
          `Score submission failed: ${error.message}`,
          { 
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            requestData: data,
            endpoint: apiEndpoints.submitScore
          },
          data.player,
          data.sessionId
        );
        
        throw new Error(`Submission failed: ${error.response?.data?.error || error.message}`);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate player score queries when score is submitted
      queryClient.invalidateQueries({ queryKey: ["playerTotalScore"] });
    },
    onError: (error: any, variables) => {
      monitoringService.logSecurityEvent(
        'validation',
        'error',
        `Score submission failed: ${error.message}`,
        { 
          error: error.message,
          requestData: variables,
          endpoint: apiEndpoints.submitScore
        },
        variables.player,
        variables.sessionId
      );
    },
  });

  return {
    startGameSession,
    endGameSession,
    submitScore,
  };
}
