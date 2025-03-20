import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function ExerciseHistory() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchExerciseHistory = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await axios.get('http://localhost:5001/challenges/exercise-history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExercises(response.data);
      } catch (error) {
        console.error('Error fetching exercise history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseHistory();
  }, [currentUser]);

  if (loading) return <div>Loading exercise history...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Exercise History</h2>
      <div className="grid gap-4">
        {exercises.map((exercise) => (
          <div key={exercise._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold capitalize">{exercise.exerciseType}</h3>
              <span className="text-green-600 font-semibold">+{exercise.points} points</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Reps:</span> {exercise.reps}
              </div>
              <div>
                <span className="text-gray-600">Accuracy:</span> {exercise.accuracy}%
              </div>
              <div>
                <span className="text-gray-600">Score:</span> {exercise.score}
              </div>
              <div>
                <span className="text-gray-600">Completed:</span>{' '}
                {new Date(exercise.completedAt).toLocaleDateString()}
              </div>
            </div>
            {exercise.challengeId && (
              <div className="mt-2 text-sm text-blue-600">
                Challenge: {exercise.challengeId.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExerciseHistory; 