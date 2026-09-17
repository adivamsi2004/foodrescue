import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { AppUser, UserRole } from '../types';

export const DEMO_ACCOUNTS = [
  {
    role: 'PROVIDER' as UserRole,
    email: 'provider@foodrescue.org',
    password: 'password123',
    name: 'Green Table Restaurant',
    phone: '+1 (555) 019-2834',
    city: 'New York',
    area: 'Manhattan',
    desc: 'Family owned organic bistro dedicated to reducing food wastage.',
    status: 'VERIFIED'
  },
  {
    role: 'NGO' as UserRole,
    email: 'ngo-approved@foodrescue.org',
    password: 'password123',
    name: 'Care & Share Food Bank',
    phone: '+1 (555) 014-9988',
    city: 'New York',
    area: 'Brooklyn',
    desc: 'An approved non-profit distributing meals across the metropolitan area.',
    status: 'APPROVED'
  },
  {
    role: 'NGO' as UserRole,
    email: 'ngo-pending@foodrescue.org',
    password: 'password123',
    name: 'Hope Outreach Association',
    phone: '+1 (555) 018-7711',
    city: 'New York',
    area: 'Queens',
    desc: 'A newly formed rescue community awaiting credentials verification.',
    status: 'PENDING'
  },
  {
    role: 'VOLUNTEER' as UserRole,
    email: 'volunteer@foodrescue.org',
    password: 'password123',
    name: 'Alex Mercer',
    phone: '+1 (555) 012-3456',
    city: 'New York',
    area: 'Manhattan',
    desc: 'Eco-conscious volunteer using a bicycle for fast neighborhood deliveries.',
    status: 'APPROVED'
  },
  {
    role: 'ADMIN' as UserRole,
    email: 'admin@foodrescue.org',
    password: 'password123',
    name: 'FoodRescue Operations Admin',
    phone: '+1 (555) 011-0000',
    city: 'New York',
    area: 'Corporate HQ',
    desc: 'Global operations and compliance manager.',
    status: 'APPROVED'
  }
];

export const loginOrRegisterDemoUser = async (email: string) => {
  const demoAccount = DEMO_ACCOUNTS.find(a => a.email === email);
  if (!demoAccount) {
    throw new Error("Invalid demo account email specified.");
  }

  try {
    // Attempt standard sign-in
    await signInWithEmailAndPassword(auth, demoAccount.email, demoAccount.password);
  } catch (error: any) {
    // If user is not found, automatically register them
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          demoAccount.email, 
          demoAccount.password
        );
        const uid = userCredential.user.uid;

        // Create user profile document
        const newUserProfile: AppUser = {
          uid,
          name: demoAccount.name,
          email: demoAccount.email,
          phone: demoAccount.phone,
          role: demoAccount.role,
          verificationStatus: demoAccount.status as any,
          city: demoAccount.city,
          area: demoAccount.area,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isActive: true
        };

        await setDoc(doc(db, 'users', uid), newUserProfile);

        // Create organization record if NGO
        if (demoAccount.role === 'NGO') {
          await setDoc(doc(db, 'organizations', `org_${uid}`), {
            ownerId: uid,
            name: demoAccount.name,
            type: 'FOOD_BANK',
            description: demoAccount.desc,
            phone: demoAccount.phone,
            email: demoAccount.email,
            address: `${demoAccount.area}, ${demoAccount.city}`,
            city: demoAccount.city,
            verificationStatus: demoAccount.status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        // Return to sign in again after creation to establish session
        await signInWithEmailAndPassword(auth, demoAccount.email, demoAccount.password);
      } catch (regErr: any) {
        console.error("Auto registration failed for demo user:", regErr);
        throw regErr;
      }
    } else {
      throw error;
    }
  }
};
