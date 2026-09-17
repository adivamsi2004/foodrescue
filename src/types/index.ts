export type UserRole = 'PROVIDER' | 'NGO' | 'VOLUNTEER' | 'ADMIN';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'VERIFIED' | 'SUSPENDED';

export type FoodType = 'VEGETARIAN' | 'NON_VEGETARIAN';

export type FoodUnit = 'MEALS' | 'KG' | 'LITRES' | 'PACKETS' | 'BOXES' | 'OTHER';

export type FoodCategory = 'RICE' | 'MEALS' | 'BAKERY' | 'FRUITS' | 'VEGETABLES' | 'SNACKS' | 'PACKAGED_FOOD' | 'OTHER';

export type DonationStatus =
  | 'DRAFT'
  | 'AVAILABLE'
  | 'CLAIM_REQUESTED'
  | 'CLAIMED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REJECTED';

export type TransportType = 'WALK' | 'BIKE' | 'CAR' | 'VAN' | 'OTHER';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profileImage?: string;
  verificationStatus: VerificationStatus;
  city: string;
  area: string;
  registrationId?: string;
  verificationDocUrl?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  isActive: boolean;
}

export interface Organization {
  id?: string;
  ownerId: string;
  name: string;
  type: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: VerificationStatus;
  documents?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface Donation {
  id?: string;
  providerId: string;
  providerName: string;
  foodName: string;
  description: string;
  category: FoodCategory;
  foodType: FoodType;
  imageUrl?: string;
  quantity: number;
  unit: FoodUnit;
  allergens?: string;
  preparedAt: string; // ISO string or format
  expiresAt: string; // ISO string or format
  pickupStart: string; // ISO string or format
  pickupEnd: string; // ISO string or format
  pickupAddress: string;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
  storageCondition?: string;
  packagingAvailable?: boolean;
  specialInstructions?: string;
  status: DonationStatus;
  claimedBy?: string; // UID of claimant (NGO or Volunteer)
  claimedByName?: string;
  claimedAt?: any;
  volunteerId?: string;
  volunteerName?: string;
  pickupCode?: string; // 6-digit verification code
  pickedUpAt?: any;
  pickedUpBy?: string;
  deliveredAt?: any;
  completedAt?: any;
  createdAt: any;
  updatedAt: any;
  deliveredTo?: string;
  peopleServed?: number;
  deliveryNotes?: string;
}

export interface Claim {
  id?: string;
  donationId: string;
  claimantId: string;
  claimantType: 'NGO' | 'VOLUNTEER';
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  requestedAt: any;
  approvedAt?: any;
  pickupTime?: string;
  completedAt?: any;
}

export interface AppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'CLAIM' | 'STATUS_CHANGE' | 'VERIFICATION' | 'SYSTEM' | 'REPORT';
  relatedDonationId?: string;
  isRead: boolean;
  createdAt: any;
}

export interface Report {
  id?: string;
  reportedBy: string;
  reportedByName?: string;
  targetType: 'DONATION' | 'USER';
  targetId: string;
  targetName?: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: any;
  resolvedAt?: any;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any;
  status: 'NEW' | 'READ' | 'REPLIED';
}
