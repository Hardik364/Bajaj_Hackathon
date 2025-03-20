import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Auth = () => {
    // Use location to determine if we're in signup mode
    const location = useLocation();
    const isSignUp = location.pathname === '/signup';
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/home');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center mb-8">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600 text-center mb-8">
                    {isSignUp 
                        ? 'Create your account to start your fitness journey'
                        : 'Sign in to continue your fitness journey'
                    }
                </p>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="flex flex-col space-y-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </button>
                        <p className="text-center text-gray-600">
                            {isSignUp ? (
                                <>
                                    Already have an account?{' '}
                                    <a 
                                        href="/login"
                                        className="text-blue-500 hover:text-blue-800"
                                    >
                                        Sign in
                                    </a>
                                </>
                            ) : (
                                <>
                                    Don't have an account?{' '}
                                    <a 
                                        href="/signup"
                                        className="text-blue-500 hover:text-blue-800"
                                    >
                                        Create one
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Auth;