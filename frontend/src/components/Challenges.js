import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Users, Calendar, ChevronRight, Plus, Dumbbell, X } from 'lucide-react';

function Challenges() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    exerciseType: 'pushup',
    targetReps: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchChallenges = async () => {
    try {
      console.log('Fetching challenges...');
      const token = await currentUser.getIdToken();
      console.log('Got token for fetch:', token);
      
      const response = await axios.get('http://localhost:5001/challenges', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Fetched challenges:', response.data);
      setChallenges(response.data);
    } catch (error) {
      console.error('Error fetching challenges:', error.response?.data || error.message);
      alert('Failed to fetch challenges: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating challenge with data:', newChallenge);
      const token = await currentUser.getIdToken();
      console.log('Got token:', token);
      
      const response = await axios.post('http://localhost:5001/challenges', newChallenge, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Challenge created:', response.data);
      setShowCreateForm(false);
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error.response?.data || error.message);
      alert('Failed to create challenge: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await axios.post(`http://localhost:5001/challenges/${challengeId}/join`, {}, {
        headers: { Authorization: `Bearer ${await currentUser.getIdToken()}` }
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const handleStartChallenge = (challenge) => {
    if (!challenge.exerciseType) {
      console.error('No exercise type specified');
      return;
    }
    
    console.log('Starting challenge:', {
      exerciseType: challenge.exerciseType,
      challengeId: challenge._id,
      targetReps: challenge.targetReps
    });

    navigate('/exercise', {
      state: {
        exerciseType: challenge.exerciseType.toLowerCase(),
        challengeId: challenge._id,
        targetReps: challenge.targetReps
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Fitness Challenges
            </h1>
            <p className="mt-2 text-black dark:text-white">
              Join challenges and compete with others
            </p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create Challenge
          </button>
        </div>

        {/* Create Challenge Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black dark:text-white">Create New Challenge</h2>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateChallenge} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Title</label>
                  <input
                    type="text"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Exercise Type</label>
                  <select
                    value={newChallenge.exerciseType}
                    onChange={(e) => setNewChallenge({...newChallenge, exerciseType: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="pushup">Push-ups</option>
                    <option value="squat">Squats</option>
                    <option value="lunges">Lunges</option>
                    <option value="plank">Plank</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Description</label>
                  <textarea
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Target Reps</label>
                  <input
                    type="number"
                    value={newChallenge.targetReps}
                    onChange={(e) => setNewChallenge({...newChallenge, targetReps: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Duration</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={newChallenge.startDate}
                      onChange={(e) => setNewChallenge({...newChallenge, startDate: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      required
                    />
                    <input
                      type="date"
                      value={newChallenge.endDate}
                      onChange={(e) => setNewChallenge({...newChallenge, endDate: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5" />
                  Create Challenge
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div 
              key={challenge._id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden border dark:border-gray-700"
            >
              {/* Challenge Header */}
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-black dark:text-white">{challenge.title}</h3>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-black dark:text-white">{challenge.description}</p>
              </div>

              {/* Challenge Stats */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b dark:border-gray-700">
                <div className="text-center">
                  <Target className="h-5 w-5 text-green-500 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-sm text-black dark:text-white font-medium">{challenge.targetReps} reps</p>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-sm text-black dark:text-white font-medium">{challenge.participants.length}</p>
                </div>
                <div className="text-center">
                  <Calendar className="h-5 w-5 text-purple-500 dark:text-purple-400 mx-auto mb-1" />
                  <p className="text-sm text-black dark:text-white font-medium">
                    {new Date(challenge.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-4">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-black dark:text-white">Progress</span>
                  {challenge.participants.map(participant => {
                    if (participant.userId === currentUser.uid) {
                      const progress = (participant.completedReps / challenge.targetReps) * 100;
                      return (
                        <span key={participant.userId} className="text-sm text-black dark:text-white">
                          {participant.completedReps}/{challenge.targetReps}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  {challenge.participants.map(participant => {
                    if (participant.userId === currentUser.uid) {
                      const progress = (participant.completedReps / challenge.targetReps) * 100;
                      return (
                        <div
                          key={participant.userId}
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="px-6 py-4">
                {!challenge.participants.some(p => p.userId === currentUser.uid) ? (
                  <button
                    onClick={() => handleJoinChallenge(challenge._id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Join Challenge
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartChallenge(challenge)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                    Continue Challenge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Challenges; 