import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { api, tokenStorage } from './api';

export const supabaseService = {
  /**
   * Check if user is returning from a Supabase OAuth Redirect Auth flow
   */
  async checkRedirectAuth(): Promise<{ user: UserProfile } | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('[SupabaseAuth] getSession warning:', error.message);
        return null;
      }

      if (session?.user) {
        tokenStorage.set(session.access_token);
        const mappedUser = this.mapSessionUserToProfile(session.user);
        return { user: mappedUser };
      }
    } catch (err: any) {
      console.warn('[SupabaseAuth] checkRedirectAuth note:', err?.message || err);
    }
    return null;
  },

  /**
   * Supabase Google Sign-In (OAuth Flow)
   */
  async signInWithGoogle(): Promise<{ user: UserProfile | null }> {
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : 'https://nipun-test.vercel.app';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
          throw new Error('Google OAuth provider is not yet enabled in the Supabase project. Please configure Google provider under Supabase Dashboard → Authentication → Providers or sign in with your official email & password.');
        }
        throw error;
      }

      return { user: null };
    } catch (error: any) {
      console.error('[Supabase/Google] Authentication processing error:', error);
      throw error;
    }
  },

  /**
   * Helper: Map Supabase Auth User object to UserProfile
   */
  mapSessionUserToProfile(authUser: any): UserProfile {
    const meta = authUser.user_metadata || {};
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Official Officer',
      role: meta.role || 'LEARNER',
      employeeId: meta.employeeId || `ISS-${authUser.id.substring(0, 8)}`,
      ministry: meta.ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)',
      department: meta.department || 'National Statistical Office (NSO)',
      organization: 'Government of India',
      designation: meta.designation || 'Senior Statistical Officer',
      currentRole: meta.designation || 'Senior Statistical Officer',
      targetRole: meta.targetRole || 'Deputy Director (Statistics)',
      level: meta.level || 11,
      cadre: meta.cadre || 'Indian Statistical Service (ISS)',
      yearsOfExperience: meta.yearsOfExperience || 5,
      education: meta.education || 'M.Sc. Statistics',
      specialization: meta.specialization || 'Survey Data Analysis & Official Statistics',
      location: meta.location || 'New Delhi',
      preferredLanguage: 'English / Hindi',
      previousRoles: ['Junior Statistical Officer'],
      currentProjects: ['National Indicator Framework (NIF) Tracking'],
      technologiesUsed: ['Python', 'SQL', 'R'],
      trainingHours: 24,
      roleReadiness: 80,
      verifiedSkillsCount: 12,
      developingSkillsCount: 3,
    };
  },

  /**
   * Email and Password Sign-In using Supabase Auth
   */
  async loginWithEmail(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(error.message || 'Invalid authentication credentials');
    }

    if (!data.user || !data.session) {
      throw new Error('Supabase Auth session was not returned');
    }

    tokenStorage.set(data.session.access_token);
    const user = this.mapSessionUserToProfile(data.user);

    // Ensure public.users and official_profiles rows exist
    try {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        name: user.name,
        role: user.role,
        status: 'ACTIVE',
        auth_provider: 'SUPABASE_AUTH',
        updated_at: new Date().toISOString(),
      });
      await supabase.from('official_profiles').upsert({
        user_id: data.user.id,
        employee_id: user.employeeId,
        cadre: user.cadre,
        pay_level: user.level,
        years_of_experience: user.yearsOfExperience,
        preferred_language: user.preferredLanguage,
        updated_at: new Date().toISOString(),
      });
    } catch (syncErr) {
      console.warn('[SupabaseAuth] Non-blocking profile sync notice:', syncErr);
    }

    return { user, token: data.session.access_token };
  },

  /**
   * Email and Password Registration using Supabase Auth
   * Creates auth.users and links public.users record
   */
  async registerWithEmail(
    userData: Partial<UserProfile> & { password?: string }
  ): Promise<{ user: UserProfile; token?: string }> {
    const email = userData.email?.trim().toLowerCase();
    const password = userData.password;

    if (!email) throw new Error('Official email is required');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

    const name = userData.name?.trim() || email.split('@')[0];
    const role = userData.role || 'LEARNER';
    const designation = userData.designation || 'Statistical Officer';
    const cadre = userData.cadre || 'Subordinate Statistical Service (SSS)';
    const ministry = userData.ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)';
    const department = userData.department || 'National Statistical Office (NSO)';
    const employeeId = userData.employeeId || `MOSPI-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          role,
          designation,
          cadre,
          ministry,
          department,
          employeeId,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Registration failed');
    }

    const authUser = data.user;
    if (!authUser) {
      throw new Error('User record was not created in Supabase Auth');
    }

    // Immediately link/create the corresponding public.users record
    try {
      await supabase.from('users').upsert({
        id: authUser.id,
        email,
        name,
        role,
        status: 'ACTIVE',
        auth_provider: 'SUPABASE_AUTH',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Link official_profiles
      await supabase.from('official_profiles').upsert({
        user_id: authUser.id,
        employee_id: employeeId,
        cadre,
        pay_level: userData.level || 11,
        years_of_experience: userData.yearsOfExperience || 5,
        preferred_language: 'English / Hindi',
        updated_at: new Date().toISOString(),
      });
    } catch (dbErr: any) {
      console.warn('[SupabaseAuth] public.users sync notice:', dbErr?.message || dbErr);
    }

    if (data.session?.access_token) {
      tokenStorage.set(data.session.access_token);
    }

    const user = this.mapSessionUserToProfile(authUser);
    return { user, token: data.session?.access_token };
  },

  /**
   * Sign out from Supabase Auth
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('[SupabaseAuth] Sign out warning:', error);
    } finally {
      tokenStorage.clear();
    }
  },

  /**
   * Listen for Supabase Auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => subscription.unsubscribe();
  },

  /**
   * Request password reset email using real Supabase Auth
   */
  async resetPasswordForEmail(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your registered official email address.');
    }

    // Configure canonical redirect URL pointing to application root with trailing slash.
    // GoTrue appends the authentication hash (#access_token=...&type=recovery) cleanly
    // without double-hashing.
    const redirectTo =
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? `${window.location.origin}/`
        : 'https://nipun-test.vercel.app/';

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      if (error.code === 'email_address_invalid' && cleanEmail.endsWith('@mospi.gov.in')) {
        throw new Error(
          'Supabase SMTP requires a domain with valid public MX DNS records. The simulated address @mospi.gov.in cannot receive external email. Please provide a live address or test with an authorized administrator.'
        );
      }
      if (
        (error as any).status === 429 ||
        error.code === 'over_email_send_rate_limit' ||
        error.message?.toLowerCase().includes('rate')
      ) {
        throw new Error('Too many reset requests. Please wait before requesting another reset email.');
      }
      throw new Error(error.message || 'Unable to dispatch recovery link. Please verify your connection.');
    }

    return {
      success: true,
      message: 'Password reset link dispatched. Please check your email inbox and spam folder.',
    };
  },

  /**
   * Update officer password for the authenticated recovery session
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean }> {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters in length.');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message || 'Failed to update password. Your recovery session may have expired.');
    }

    return { success: true };
  },
};

