import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInCustomer: (username: string, password: string) => Promise<void>;
  signInAdmin: (username: string, password: string) => Promise<void>;
  signInCashier: (idNumber: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signUpCustomer: (username: string, password: string, fullName: string) => Promise<void>;
  signUpAdmin: (username: string, email: string, password: string, fullName: string) => Promise<void>;
  signUpCashier: (fullName: string, idNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isCashier: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInCustomer = async (username: string, password: string) => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setLoading(false);
        throw new Error('Wrong username');
      }

      if (profileData.role !== 'customer') {
        setLoading(false);
        throw new Error('Invalid credentials for customer login');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });
      if (error) {
        setLoading(false);
        throw new Error('Wrong password');
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer',
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user.id);
    }
  };

  const signUpCustomer = async (username: string, password: string, fullName: string) => {
    const email = `${username}@customer.local`;

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName,
          role: 'customer',
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user.id);
    }
  };

  const signInAdmin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setLoading(false);
        throw new Error('Wrong username');
      }

      if (profileData.role !== 'admin') {
        setLoading(false);
        throw new Error('Invalid credentials for admin login');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });
      if (error) {
        setLoading(false);
        throw new Error('Wrong password');
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUpAdmin = async (username: string, email: string, password: string, fullName: string) => {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName,
          role: 'admin',
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user.id);
    }
  };

  const signInCashier = async (idNumber: string, password: string) => {
    setLoading(true);
    try {
      const { data: credData, error: credError } = await supabase
        .from('cashier_credentials')
        .select('id_number, profile_id, profiles(email, role)')
        .eq('id_number', idNumber)
        .maybeSingle();

      if (credError) throw credError;
      if (!credData) {
        setLoading(false);
        throw new Error('Invalid ID number');
      }

      const profileData = credData.profiles as unknown as { email: string; role: string };
      if (!profileData || profileData.role !== 'cashier') {
        setLoading(false);
        throw new Error('Invalid cashier credentials');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });
      if (error) {
        setLoading(false);
        throw new Error('Wrong password');
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUpCashier = async (fullName: string, idNumber: string, password: string) => {
    const { data: existingId } = await supabase
      .from('cashier_credentials')
      .select('id_number')
      .eq('id_number', idNumber)
      .maybeSingle();

    if (existingId) {
      throw new Error('ID number already exists');
    }

    const adminId = user?.id;
    if (!adminId) {
      throw new Error('You must be logged in as admin to create a cashier');
    }

    const { data: { session: adminSession } } = await supabase.auth.getSession();
    const adminAccessToken = adminSession?.access_token;
    const adminRefreshToken = adminSession?.refresh_token;

    const email = `${idNumber}@cashier.local`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: idNumber,
          full_name: fullName,
          role: 'cashier',
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      const { error: credError } = await supabase.from('cashier_credentials').insert({
        profile_id: data.user.id,
        full_name: fullName,
        id_number: idNumber,
        created_by: adminId,
      });

      if (credError) {
        console.error('Error creating cashier credentials:', credError);
      }

      if (adminAccessToken && adminRefreshToken) {
        await supabase.auth.setSession({
          access_token: adminAccessToken,
          refresh_token: adminRefreshToken,
        });
      }

      await fetchProfile(adminId);
    }
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signInCustomer,
    signInAdmin,
    signInCashier,
    signUp,
    signUpCustomer,
    signUpAdmin,
    signUpCashier,
    signOut,
    isAdmin: profile?.role === 'admin',
    isCashier: profile?.role === 'cashier',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
