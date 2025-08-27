import { processAllUsersHistoricalData, calculateUserStats, getUserStatistics } from '../src/services/cloudFunctions';

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn()),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
}));

describe('Cloud Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processAllUsersHistoricalData', () => {
    it('should call the Cloud Function successfully', async () => {
      const mockResult = {
        totalUsers: 5,
        successful: 4,
        failed: 1,
        results: [
          { uid: '1', username: 'user1', success: true },
          { uid: '2', username: 'user2', success: false, error: 'Test error' },
        ],
      };

      const mockCallable = jest.fn().mockResolvedValue({ data: mockResult });
      require('firebase/functions').httpsCallable.mockReturnValue(mockCallable);

      const result = await processAllUsersHistoricalData();

      expect(result).toEqual(mockResult);
      expect(mockCallable).toHaveBeenCalledTimes(1);
    });

    it('should handle errors properly', async () => {
      const mockError = new Error('Cloud Function error');
      const mockCallable = jest.fn().mockRejectedValue(mockError);
      require('firebase/functions').httpsCallable.mockReturnValue(mockCallable);

      await expect(processAllUsersHistoricalData()).rejects.toThrow('Cloud Function error');
    });
  });

  describe('calculateUserStats', () => {
    it('should call the Cloud Function successfully', async () => {
      const mockResult = {
        totalGames: 10,
        currentStreak: 5,
        longestStreak: 7,
        averageReactionTime: 1200,
        emotionCounts: { happiness: 5, sadness: 3, anger: 2 },
      };

      const mockCallable = jest.fn().mockResolvedValue({ data: mockResult });
      require('firebase/functions').httpsCallable.mockReturnValue(mockCallable);

      const result = await calculateUserStats();

      expect(result).toEqual(mockResult);
      expect(mockCallable).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserStatistics', () => {
    it('should call the Cloud Function successfully', async () => {
      const mockResult = {
        totalGames: 15,
        currentStreak: 3,
        longestStreak: 10,
        averageReactionTime: 1100,
        emotionCounts: { happiness: 8, sadness: 4, anger: 3 },
      };

      const mockCallable = jest.fn().mockResolvedValue({ data: mockResult });
      require('firebase/functions').httpsCallable.mockReturnValue(mockCallable);

      const result = await getUserStatistics();

      expect(result).toEqual(mockResult);
      expect(mockCallable).toHaveBeenCalledTimes(1);
    });
  });
}); 