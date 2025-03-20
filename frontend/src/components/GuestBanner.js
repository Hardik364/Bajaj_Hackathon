import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GuestBanner = () => {
    const { currentUser } = useAuth();

    if (!currentUser?.isAnonymous) return null;

    return (
        <div className="bg-yellow-50 border-b border-yellow-100">
            <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between flex-wrap">
                    <div className="w-0 flex-1 flex items-center">
                        <p className="text-yellow-700">
                            <span className="hidden md:inline">You're in guest mode. Some features are limited. </span>
                            <Link to="/login" className="font-medium underline">
                                Sign up for full access
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestBanner; 