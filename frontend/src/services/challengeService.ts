import { Challenge } from '../types/challenge';
import { challengesData } from '../challengesData';

const API_BASE_URL = 'http://localhost:8000';

class ChallengeService {
  async getAllChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges`);
      if (!response.ok) {
        throw new Error(`Failed to fetch challenges: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Challenges API unavailable, returning local Scratch data.', error);
      return challengesData;
    }
  }

  async getChallengeById(id: string): Promise<Challenge> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch challenge: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Challenge API unavailable for ${id}, using local Scratch challenge.`, error);
      const fallback = challengesData.find((challenge) => challenge.id === id);
      if (!fallback) {
        throw error;
      }
      return fallback;
    }
  }

  async createChallenge(challenge: Challenge): Promise<Challenge> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challenge),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create challenge: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  async updateChallenge(id: string, challenge: Partial<Challenge>): Promise<Challenge> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challenge),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update challenge: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating challenge ${id}:`, error);
      throw error;
    }
  }

  async deleteChallenge(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete challenge: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting challenge ${id}:`, error);
      throw error;
    }
  }

  async generateWorkspace(challenge: Challenge): Promise<{ blocks: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/generate-workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate workspace: ${response.statusText}`);
    }

    return response.json();
  }
}

export const challengeService = new ChallengeService();
