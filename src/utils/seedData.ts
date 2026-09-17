import { collection, getDocs, writeBatch, doc, serverTimestamp, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Donation, DonationStatus } from '../types';

export const SAMPLE_DONATIONS = [
  {
    foodName: 'Vegetable Biryani with Raita [DEMO]',
    description: 'Freshly prepared aromatic Basmati rice with mixed vegetables and rich spices. Kept in warm containers.',
    category: 'RICE' as const,
    foodType: 'VEGETARIAN' as const,
    quantity: 25,
    unit: 'MEALS' as const,
    allergens: 'Dairy',
    preparedAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),  // Expires in 4 hours
    pickupStart: new Date(Date.now()).toISOString(),
    pickupEnd: new Date(Date.now() + 3 * 3600000).toISOString(),
    pickupAddress: '789 Gourmet Row, West Village',
    city: 'New York',
    area: 'Manhattan',
    latitude: 40.7359,
    longitude: -74.0030,
    storageCondition: 'Hot cabinet (kept above 60°C)',
    packagingAvailable: true,
    specialInstructions: 'Please bring insulated bags for transport.',
    status: 'AVAILABLE' as DonationStatus,
  },
  {
    foodName: 'Assorted Bakery Breads & Croissants [DEMO]',
    description: 'Freshly baked sourdough baguettes, butter croissants, and whole wheat bread rolls.',
    category: 'BAKERY' as const,
    foodType: 'VEGETARIAN' as const,
    quantity: 15,
    unit: 'KG' as const,
    allergens: 'Gluten, Wheat',
    preparedAt: new Date(Date.now() - 8 * 3600000).toISOString(), // 8 hours ago
    expiresAt: new Date(Date.now() + 12 * 3600000).toISOString(), // 12 hours left
    pickupStart: new Date(Date.now()).toISOString(),
    pickupEnd: new Date(Date.now() + 8 * 3600000).toISOString(),
    pickupAddress: '12 Baker Street, Chelsea',
    city: 'New York',
    area: 'Manhattan',
    latitude: 40.7465,
    longitude: -74.0014,
    storageCondition: 'Room temperature (dry)',
    packagingAvailable: true,
    specialInstructions: 'Already packed in paper boxes. Ready for hand-carry.',
    status: 'AVAILABLE' as DonationStatus,
  },
  {
    foodName: 'Paneer Butter Masala & Garlic Naan [DEMO]',
    description: 'Rich tomato gravy paneer with 30 freshly made garlic naans. Perfectly delicious.',
    category: 'MEALS' as const,
    foodType: 'VEGETARIAN' as const,
    quantity: 30,
    unit: 'MEALS' as const,
    allergens: 'Dairy, Gluten',
    preparedAt: new Date(Date.now() - 1 * 3600000).toISOString(), // 1 hour ago
    expiresAt: new Date(Date.now() + 3 * 3600000).toISOString(),  // Expires in 3 hours
    pickupStart: new Date(Date.now()).toISOString(),
    pickupEnd: new Date(Date.now() + 2 * 3600000).toISOString(),
    pickupAddress: '45 Curry Lane, Curry Hill',
    city: 'New York',
    area: 'Manhattan',
    latitude: 40.7410,
    longitude: -73.9780,
    storageCondition: 'Insulated warmer boxes',
    packagingAvailable: true,
    specialInstructions: 'Must collect before 11 PM.',
    status: 'CLAIM_REQUESTED' as DonationStatus,
  },
  {
    foodName: 'Assorted Organic Apples & Bananas [DEMO]',
    description: 'Boxes of crisp honeycrisp apples and ripe yellow bananas, perfect for immediate snack redistribution.',
    category: 'FRUITS' as const,
    foodType: 'VEGETARIAN' as const,
    quantity: 4,
    unit: 'BOXES' as const,
    allergens: 'None',
    preparedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 48 * 3600000).toISOString(), // 2 days left
    pickupStart: new Date(Date.now()).toISOString(),
    pickupEnd: new Date(Date.now() + 24 * 3600000).toISOString(),
    pickupAddress: '99 Green Grocer Avenue, Astoria',
    city: 'New York',
    area: 'Queens',
    latitude: 40.7644,
    longitude: -73.9235,
    storageCondition: 'Cold storage / Crates',
    packagingAvailable: false,
    specialInstructions: 'Bring crates or bags to load fruit boxes.',
    status: 'AVAILABLE' as DonationStatus,
  },
  {
    foodName: 'Chicken Alfredo Pasta [DEMO]',
    description: 'Creamy Alfredo pasta with sliced grilled chicken breasts. Served in large buffet catering trays.',
    category: 'MEALS' as const,
    foodType: 'NON_VEGETARIAN' as const,
    quantity: 40,
    unit: 'MEALS' as const,
    allergens: 'Dairy, Gluten, Poultry',
    preparedAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago
    expiresAt: new Date(Date.now() + 1 * 3600000).toISOString(),  // Expires in 1 hour
    pickupStart: new Date(Date.now()).toISOString(),
    pickupEnd: new Date(Date.now() + 1 * 3600000).toISOString(),
    pickupAddress: '55 Catering Hall, Midtown East',
    city: 'New York',
    area: 'Manhattan',
    latitude: 40.7549,
    longitude: -73.9700,
    storageCondition: 'Refrigerated container (chilled)',
    packagingAvailable: false,
    specialInstructions: 'Catering containers must be returned or swapped. Bring your own pots/trays!',
    status: 'AVAILABLE' as DonationStatus,
  },
  {
    foodName: 'Overripe Avocados & Salads (Past Expiry) [DEMO]',
    description: 'Soft avocados and garden salad bowls, suitable for composting or immediate farm feed use only.',
    category: 'VEGETABLES' as const,
    foodType: 'VEGETARIAN' as const,
    quantity: 10,
    unit: 'KG' as const,
    allergens: 'None',
    preparedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 3600000).toISOString(), // Expired 2 hours ago
    pickupStart: new Date(Date.now() - 24 * 3600000).toISOString(),
    pickupEnd: new Date(Date.now() - 2 * 3600000).toISOString(),
    pickupAddress: '23 Fresh Mart Way, Williamsburg',
    city: 'New York',
    area: 'Brooklyn',
    latitude: 40.7081,
    longitude: -73.9571,
    storageCondition: 'Ambient basket',
    packagingAvailable: true,
    specialInstructions: 'Marked expired. Cannot be claimed for human food consumption.',
    status: 'EXPIRED' as DonationStatus,
  },
  {
    foodName: 'Deluxe Mixed Rice Bowls [DEMO]',
    description: 'Steamed rice with chicken and stir fried tofu, individually packaged in sustainable bowls.',
    category: 'RICE' as const,
    foodType: 'NON_VEGETARIAN' as const,
    quantity: 12,
    unit: 'PACKETS' as const,
    allergens: 'Soy, Poultry',
    preparedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    pickupStart: new Date(Date.now() - 10 * 3600000).toISOString(),
    pickupEnd: new Date(Date.now() - 6 * 3600000).toISOString(),
    pickupAddress: '88 Bento Box Diner, Manhattan',
    city: 'New York',
    area: 'Manhattan',
    latitude: 40.7580,
    longitude: -73.9855,
    storageCondition: 'Refrigerated',
    packagingAvailable: true,
    status: 'COMPLETED' as DonationStatus,
    claimedBy: 'ngo_approved_uid',
    claimedByName: 'Care & Share Food Bank',
    pickedUpBy: 'Care & Share Food Bank',
    pickedUpAt: new Date(Date.now() - 4 * 3600000),
    deliveredAt: new Date(Date.now() - 3.5 * 3600000),
    completedAt: new Date(Date.now() - 3.5 * 3600000),
    deliveredTo: 'Midtown Shelter Homes',
    peopleServed: 12,
    deliveryNotes: 'Delivered in time. Everyone enjoyed the fresh bento boxes!'
  }
];

export const seedDonations = async (currentProviderUid?: string, currentProviderName?: string) => {
  try {
    const donationsRef = collection(db, 'donations');
    const existingSnap = await getDocs(query(donationsRef, limit(1)));
    
    // Only seed if empty
    if (!existingSnap.empty) {
      return { success: true, message: "Database already contains donation records." };
    }

    // Attempt to locate demo provider user
    let providerId = currentProviderUid || 'provider_demo_uid';
    let providerName = currentProviderName || 'Green Table Restaurant';

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'provider@foodrescue.org'), limit(1));
    const userSnap = await getDocs(q);
    
    if (!userSnap.empty) {
      const providerDoc = userSnap.docs[0];
      providerId = providerDoc.id;
      providerName = providerDoc.data().name || providerName;
    }

    const batch = writeBatch(db);
    SAMPLE_DONATIONS.forEach((donationData) => {
      const newDocRef = doc(collection(db, 'donations'));
      
      const claimDetails: Partial<Donation> = {};
      if (donationData.status === 'COMPLETED') {
        claimDetails.claimedBy = 'ngo-approved-uid';
      } else if (donationData.status === 'CLAIM_REQUESTED') {
        claimDetails.claimedBy = 'ngo-approved-uid';
        claimDetails.claimedByName = 'Care & Share Food Bank';
      }

      const finalDonation: Donation = {
        ...donationData,
        providerId,
        providerName,
        pickupCode: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit code
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...claimDetails
      };

      batch.set(newDocRef, finalDonation);
    });

    await batch.commit();
    return { success: true, message: `Successfully seeded ${SAMPLE_DONATIONS.length} demo donations.` };
  } catch (error: any) {
    console.error("Failed to seed donations:", error);
    throw error;
  }
};
