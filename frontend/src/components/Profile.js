import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { User, Save, Edit2, TrendingUp, Activity, Target } from 'lucide-react';

function Profile() {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    username: '',
    email: currentUser?.email || '',
    profile: {
      height: '',
      weight: '',
      fitnessLevel: 'beginner'
    },
    exerciseStats: {
      points: 0,
      totalExercises: 0,
      accuracy: 0
    }
  });

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const token = await currentUser.getIdToken();
      
      // Fetch both profile and exercise stats
      const [profileResponse, exerciseResponse] = await Promise.all([
        axios.get('http://localhost:5001/routes/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5001/routes/exercise/history', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Calculate stats from exercise history
      const exercises = exerciseResponse.data;
      const totalPoints = exercises.reduce((sum, ex) => sum + (ex.points || 0), 0);
      const totalExercises = exercises.length;
      const averageAccuracy = exercises.length > 0
        ? Math.round(exercises.reduce((sum, ex) => sum + (ex.accuracy || 0), 0) / exercises.length)
        : 0;

      setProfile({
        ...profileResponse.data,
        email: currentUser.email,
        exerciseStats: {
          points: totalPoints,
          totalExercises,
          accuracy: averageAccuracy
        }
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await currentUser.getIdToken();
      await axios.put('http://localhost:5001/routes/auth/profile', 
        {
          username: profile.username,
          email: profile.email,
          profile: profile.profile
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setIsEditing(false);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
      <div className="text-xl text-black dark:text-white">Loading profile...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
      <div className="text-xl text-red-500 dark:text-red-400">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="absolute -bottom-12 left-8">
              <div className="bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg">
                <User className="w-20 h-20 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 pt-16">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  {profile.username || currentUser.email.split('@')[0]}
                </h1>
                <p className="text-blue-600 dark:text-blue-400">{profile.email}</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-black dark:text-white border-b dark:border-gray-700 pb-2">
                    Basic Information
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={profile.username}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                    />
                  </div>
                </div>

                {/* Physical Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-black dark:text-white border-b dark:border-gray-700 pb-2">
                    Physical Information
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        name="profile.height"
                        value={profile.profile.height}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="profile.weight"
                        value={profile.profile.weight}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">
                      Fitness Level
                    </label>
                    <select
                      name="profile.fitnessLevel"
                      value={profile.profile.fitnessLevel}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black dark:text-white">Total Points</h3>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-4 text-black dark:text-white">
              {profile.exerciseStats?.points || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black dark:text-white">Exercises Done</h3>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-4 text-black dark:text-white">
              {profile.exerciseStats?.totalExercises || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black dark:text-white">Accuracy</h3>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-4 text-black dark:text-white">
              {profile.exerciseStats?.accuracy || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;