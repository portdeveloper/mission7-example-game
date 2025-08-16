import { useState, useEffect } from 'react';

interface MonadGamesUser {
  id: number;
  username: string;
  walletAddress: string;
}

interface UserResponse {
  hasUsername: boolean;
  user?: MonadGamesUser;
}

interface UseMonadGamesUserReturn {
  user: MonadGamesUser | null;
  hasUsername: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useMonadGamesUser(walletAddress: string): UseMonadGamesUserReturn {
  const [user, setUser] = useState<MonadGamesUser | null>(null);
  const [hasUsername, setHasUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setUser(null);
      setHasUsername(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: UserResponse = await response.json();
        
        setHasUsername(data.hasUsername);
        setUser(data.user || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setHasUsername(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [walletAddress]);

  return {
    user,
    hasUsername,
    isLoading,
    error,
  };
}