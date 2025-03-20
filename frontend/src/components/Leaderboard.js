import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const isCurrentUser = (entry) => {
    return currentUser?.uid === entry.userId;
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await axios.get('http://localhost:5001/routes/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Add current user's ID to each entry for easier comparison
        const leaderboardData = response.data.map(entry => ({
          ...entry,
          isCurrentUser: entry.userId === currentUser.uid
        }));
        
        setLeaderboard(leaderboardData);
        setError(null);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchLeaderboard();
    }
  }, [currentUser]);

  if (loading) return <div>Loading leaderboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
            <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">
              Points
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">
              Exercises
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {leaderboard.map((entry, index) => (
            <tr 
              key={index} 
              className={`
                ${entry.isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} 
                transition-colors duration-150 ease-in-out
              `}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-white">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                {entry.username}
                {entry.isCurrentUser && " (You)"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                {entry.totalPoints}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                {entry.totalExercises}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;