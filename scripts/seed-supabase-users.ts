import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('[SEED] SUPABASE_SERVICE_ROLE_KEY is required for server-side seed script.');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedOfficer {
  email: string;
  password: string;
  name: string;
  role: 'LEARNER' | 'TRAINER' | 'ADMINISTRATOR';
  designation: string;
  ministry: string;
  department: string;
  cadre: string;
  employeeId: string;
  payLevel: number;
  yearsOfExperience: number;
}

const SEED_OFFICERS: SeedOfficer[] = [
  {
    email: 'aarav.sharma@mospi.gov.in',
    password: 'Learner@2026',
    name: 'Aarav Sharma',
    role: 'LEARNER',
    designation: 'Assistant Director (Statistics)',
    ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
    department: 'Data Analytics & Survey Division',
    cadre: 'Indian Statistical Service (ISS)',
    employeeId: 'ISS-2019-7482',
    payLevel: 11,
    yearsOfExperience: 5,
  },
  {
    email: 'rajesh.verma@mospi.gov.in',
    password: 'Trainer@2026',
    name: 'Dr. Rajeshwar Rao',
    role: 'TRAINER',
    designation: 'Director of Training & Academic Faculty',
    ministry: 'National Statistical Systems Training Academy (NSSTA)',
    department: 'Training & Academic Faculty Division',
    cadre: 'Indian Statistical Service (ISS)',
    employeeId: 'NSSTA-2015-4019',
    payLevel: 13,
    yearsOfExperience: 15,
  },
  {
    email: 'vikram.sen@mospi.gov.in',
    password: 'Admin@2026',
    name: 'Vikram Sen',
    role: 'ADMINISTRATOR',
    designation: 'Joint Secretary & Chief Data Officer',
    ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
    department: 'Capacity Building & Training Division',
    cadre: 'Indian Statistical Service (ISS)',
    employeeId: 'MOSPI-2010-1002',
    payLevel: 14,
    yearsOfExperience: 18,
  },
];

export async function seedOfficialAccounts() {
  console.log('====================================================');
  console.log('   NIPUN — SEEDING OFFICIAL SUPABASE AUTH ACCOUNTS   ');
  console.log('====================================================\n');

  // List existing users in Supabase auth.users
  const { data: listData, error: listError } = await adminSupabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list Supabase auth users:', listError.message);
    throw listError;
  }

  const existingAuthUsers = listData.users || [];

  for (const officer of SEED_OFFICERS) {
    console.log(`Checking officer account: ${officer.email}...`);
    let authUserId: string;

    const existingUser = existingAuthUsers.find(
      (u) => u.email?.toLowerCase() === officer.email.toLowerCase()
    );

    if (existingUser) {
      authUserId = existingUser.id;
      console.log(`  -> Found existing auth.users record: ${authUserId}`);

      // Ensure password and metadata are updated and email is confirmed
      const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(authUserId, {
        password: officer.password,
        email_confirm: true,
        user_metadata: {
          name: officer.name,
          full_name: officer.name,
          role: officer.role,
          designation: officer.designation,
          ministry: officer.ministry,
          department: officer.department,
          cadre: officer.cadre,
          employeeId: officer.employeeId,
        },
      });

      if (updateErr) {
        console.warn(`  Warning updating user ${officer.email}:`, updateErr.message);
      } else {
        console.log(`  -> Updated password and metadata for ${officer.email}`);
      }
    } else {
      console.log(`  -> Creating new auth.users account...`);
      const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
        email: officer.email,
        password: officer.password,
        email_confirm: true,
        user_metadata: {
          name: officer.name,
          full_name: officer.name,
          role: officer.role,
          designation: officer.designation,
          ministry: officer.ministry,
          department: officer.department,
          cadre: officer.cadre,
          employeeId: officer.employeeId,
        },
      });

      if (createErr || !created.user) {
        console.error(`  Failed to create ${officer.email}:`, createErr?.message);
        continue;
      }
      authUserId = created.user.id;
      console.log(`  -> Created auth.users record: ${authUserId}`);
    }

    // Upsert into public.users
    const { error: userTableErr } = await adminSupabase.from('users').upsert({
      id: authUserId,
      email: officer.email,
      name: officer.name,
      role: officer.role,
      status: 'ACTIVE',
      auth_provider: 'SUPABASE_AUTH',
      updated_at: new Date().toISOString(),
    });

    if (userTableErr) {
      console.error(`  Failed to upsert public.users for ${officer.email}:`, userTableErr.message);
    } else {
      console.log(`  -> Synced public.users row for ${authUserId}`);
    }

    // Upsert into official_profiles
    const { error: profileTableErr } = await adminSupabase.from('official_profiles').upsert({
      user_id: authUserId,
      employee_id: officer.employeeId,
      cadre: officer.cadre,
      pay_level: officer.payLevel,
      years_of_experience: officer.yearsOfExperience,
      preferred_language: 'English / Hindi',
      updated_at: new Date().toISOString(),
    });

    if (profileTableErr) {
      console.error(`  Failed to upsert official_profiles for ${officer.email}:`, profileTableErr.message);
    } else {
      console.log(`  -> Synced official_profiles row for ${authUserId}`);
    }
  }

  console.log('\n[SEED COMPLETE] All official accounts are ready in Supabase Auth and database tables.\n');
}

// Run directly if executed as main module
seedOfficialAccounts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[SEED FATAL ERROR]:', err);
    process.exit(1);
  });
