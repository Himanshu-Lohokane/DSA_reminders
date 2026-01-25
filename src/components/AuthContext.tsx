"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    leetcodeUsername: string;
    phoneNumber?: string;
    github: string;
    linkedin?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, leetcodeUsername: string, github: string, linkedin?: string, phoneNumber?: string) => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for stored token on mount
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUser(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUser = async (authToken: string) => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                // Token invalid, clear it
                localStorage.removeItem('token');
                setToken(null);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);

        // Check if user is admin and redirect accordingly
        const isAdmin = data.user.email.toLowerCase().includes('admin') ||
            data.user.email.toLowerCase() === 'admin@dsagrinders.com'

        if (isAdmin) {
            router.push('/admin');
        } else {
            router.push('/home');
        }
    };

    const register = async (name: string, email: string, password: string, leetcodeUsername: string, github: string, linkedin?: string, phoneNumber?: string) => {
        const body: any = { name, email, password, leetcodeUsername, github };
        if (linkedin) {
            body.linkedin = linkedin;
        }
        if (phoneNumber) {
            body.phoneNumber = phoneNumber;
        }

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);

        // Check if user is admin and redirect accordingly
        const isAdmin = data.user.email.toLowerCase().includes('admin') ||
            data.user.email.toLowerCase() === 'admin@dsagrinders.com'

        if (isAdmin) {
            router.push('/admin');
        } else {
            router.push('/home');
        }
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...userData });
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
