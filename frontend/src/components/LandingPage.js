import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Camera, ChartBar, Users, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-6 pt-32 pb-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 animate-fade-in">
            Transform Your Fitness Journey with AI
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Experience the future of fitness with real-time AI form detection, personalized workouts, and progress tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
            <Link 
              to="/login"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full text-lg font-semibold backdrop-blur-sm transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-900/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            Why Choose FlexItOut?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Camera className="w-8 h-8 text-blue-400" />}
              title="AI Form Detection"
              description="Get real-time feedback on your exercise form using advanced AI technology"
            />
            <FeatureCard 
              icon={<ChartBar className="w-8 h-8 text-blue-400" />}
              title="Progress Tracking"
              description="Monitor your improvements with detailed analytics and insights"
            />
            <FeatureCard 
              icon={<Activity className="w-8 h-8 text-blue-400" />}
              title="Daily Challenges"
              description="Stay motivated with daily challenges and earn rewards"
            />
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            How It Works
          </h2>
          <div className="max-w-3xl mx-auto space-y-12">
            <Step 
              number="1"
              title="Create Your Account"
              description="Sign up and set your fitness goals"
            />
            <Step 
              number="2"
              title="Choose Your Workout"
              description="Select from a variety of AI-powered exercises"
            />
            <Step 
              number="3"
              title="Start Training"
              description="Get real-time feedback and track your progress"
            />
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-900/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Benefit
              icon={<CheckCircle className="w-6 h-6 text-green-400" />}
              title="Improve Form"
              description="Get instant feedback on your exercise form to prevent injuries"
            />
            <Benefit
              icon={<CheckCircle className="w-6 h-6 text-green-400" />}
              title="Track Progress"
              description="Monitor your fitness journey with detailed metrics"
            />
            <Benefit
              icon={<CheckCircle className="w-6 h-6 text-green-400" />}
              title="Stay Motivated"
              description="Join challenges and compete with others"
            />
            <Benefit
              icon={<CheckCircle className="w-6 h-6 text-green-400" />}
              title="Community Support"
              description="Connect with like-minded fitness enthusiasts"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to Start Your Fitness Journey?
          </h2>
          <Link
            to="/signup"
            className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all inline-block"
          >
            Get Started Now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>© 2024 FlexItOut. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Helper Components
const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center hover:transform hover:-translate-y-2 transition-all">
    <div className="inline-block p-3 bg-blue-500/10 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const Step = ({ number, title, description }) => (
  <div className="flex items-center gap-8">
    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
      {number}
    </div>
    <div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  </div>
);

const Benefit = ({ icon, title, description }) => (
  <div className="flex items-start gap-4">
    {icon}
    <div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  </div>
);

export default LandingPage; 