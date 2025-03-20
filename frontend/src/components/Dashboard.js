import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Leaderboard from './Leaderboard';
import axios from 'axios';
import { Activity, Award, TrendingUp, Users, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import ExerciseHistory from './ExerciseHistory';

function Dashboard() {
  const { currentUser } = useAuth();
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    completedChallenges: 0,
    exerciseStats: {
      totalWorkouts: 0,
      totalExercises: 0,
      accuracy: 0,
      points: 0
    }
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = await currentUser.getIdToken();
        
        // Fetch both challenge and regular exercise records
        const [exerciseResponse, challengeResponse] = await Promise.all([
          axios.get('http://localhost:5001/routes/exercise/history', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5001/challenges/exercise-history', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Combine both types of exercises
        const allExercises = [
          ...exerciseResponse.data,
          ...challengeResponse.data
        ];
        
        // Calculate stats from all exercise records
        const totalPoints = allExercises.reduce((sum, ex) => sum + (ex.points || 0), 0);
        const totalExercises = allExercises.length;
        const averageAccuracy = allExercises.length > 0
          ? Math.round(allExercises.reduce((sum, ex) => sum + (ex.accuracy || 0), 0) / allExercises.length)
          : 0;
        
        // Count unique workout days
        const uniqueWorkoutDays = new Set(
          allExercises.map(ex => new Date(ex.completedAt).toDateString())
        ).size;

        // Count completed challenges
        const completedChallenges = challengeResponse.data.length;

        setUserStats({
          totalPoints,
          completedChallenges,
          exerciseStats: {
            totalWorkouts: uniqueWorkoutDays,
            totalExercises,
            accuracy: averageAccuracy,
            points: totalPoints
          }
        });

      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    if (currentUser) {
      fetchUserStats();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:scale-105">
      <div className={`inline-flex items-center justify-center p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mt-4 text-black dark:text-white">{title}</h3>
      <p className="text-2xl font-bold mt-2 text-black dark:text-white">
        {value}{suffix}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Welcome back, {currentUser?.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-black dark:text-white">
            Track your fitness journey and compete with others
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Points"
            value={userStats.totalPoints}
            icon={TrendingUp}
            color="bg-purple-500"
          />
          <StatCard
            title="Completed Challenges"
            value={userStats.completedChallenges}
            icon={Target}
            color="bg-orange-500"
          />
          <StatCard
            title="Total Workouts"
            value={userStats.exerciseStats.totalWorkouts}
            icon={Activity}
            color="bg-blue-500"
          />
          <StatCard
            title="Exercises Done"
            value={userStats.exerciseStats.totalExercises}
            icon={Award}
            color="bg-green-500"
          />
          <StatCard
            title="Average Accuracy"
            value={userStats.exerciseStats.accuracy}
            icon={TrendingUp}
            color="bg-purple-500"
            suffix="%"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/exercise"
                className="flex items-center justify-center px-4 py-3 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Start Workout
              </Link>
              <Link
                to="/challenges"
                className="flex items-center justify-center px-4 py-3 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
              >
                View Challenges
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Recent Activity
            </h2>
            {/* Add recent activity component here */}
            <p className="text-gray-600 dark:text-gray-400">No recent activities</p>
          </div>
        </div>

        {/* Exercise History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <ExerciseHistory />
        </div>

        {/* Leaderboard Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-black dark:text-white">
            Global Leaderboard
          </h2>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;