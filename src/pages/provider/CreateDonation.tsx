import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { FoodCategory, FoodType, FoodUnit, DonationStatus } from '../../types';
import { 
  Plus, 
  UtensilsCrossed, 
  ShieldAlert, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export const CreateDonation: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();

  // Wizard state: 1, 2, 3, 4
  const [step, setStep] = useState(1);

  // Form states
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('MEALS');
  const [foodType, setFoodType] = useState<FoodType>('VEGETARIAN');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<FoodUnit>('MEALS');

  // Safety
  const [allergens, setAllergens] = useState('');
  const [preparedAt, setPreparedAt] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date(Date.now() + 6 * 3600000); // 6 hours later
    return d.toISOString().slice(0, 16);
  });
  const [storageCondition, setStorageCondition] = useState('Kept in insulated warmer box');
  const [packagingAvailable, setPackagingAvailable] = useState(true);

  // Pickup
  const [pickupStart, setPickupStart] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [pickupEnd, setPickupEnd] = useState(() => {
    const d = new Date(Date.now() + 4 * 3600000); // 4 hours later
    return d.toISOString().slice(0, 16);
  });
  const [pickupAddress, setPickupAddress] = useState(userProfile ? `${userProfile.area}, ${userProfile.city}` : '');
  const [city, setCity] = useState(userProfile?.city || 'New York');
  const [area, setArea] = useState(userProfile?.area || '');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Image Upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Drag and drop handles
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const validateAndProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Only image files are permitted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("File exceeds maximum 5MB storage limit.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  // Perform Firebase Storage uploading if applicable
  const uploadImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!imageFile || !currentUser) {
        resolve('');
        return;
      }

      const fileExtension = imageFile.name.split('.').pop();
      const storagePath = `donations/${currentUser.uid}/${Date.now()}.${fileExtension}`;
      const imageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(imageRef, imageFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Firebase storage upload failed:", error);
          // Standard fallback: resolving gracefully to prevent blocking user
          resolve('');
        }, 
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  };

  const handleNext = () => {
    // Validate Step 1
    if (step === 1) {
      if (!foodName || quantity <= 0) {
        setError("Please supply a valid food name and positive quantity.");
        return;
      }
    }
    // Validate Step 2
    if (step === 2) {
      if (new Date(expiresAt) <= new Date(preparedAt)) {
        setError("Food expiry timestamp must occur after the preparation timestamp.");
        return;
      }
      if (new Date(expiresAt) <= new Date()) {
        setError("Expiry timestamp cannot occur in the past.");
        return;
      }
    }
    // Validate Step 3
    if (step === 3) {
      if (new Date(pickupEnd) <= new Date(pickupStart)) {
        setError("Pickup end timestamp must occur after the pickup start timestamp.");
        return;
      }
      if (!pickupAddress || !area) {
        setError("Please supply a complete pickup address and serving area.");
        return;
      }
    }

    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    setLoading(true);
    setError(null);
    
    try {
      // 1. Check storage and upload image
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage();
      }

      // 2. Add donation document
      const donationPayload = {
        providerId: currentUser.uid,
        providerName: userProfile.name,
        foodName,
        description,
        category,
        foodType,
        imageUrl: finalImageUrl,
        quantity,
        unit,
        allergens,
        preparedAt,
        expiresAt,
        pickupStart,
        pickupEnd,
        pickupAddress,
        city,
        area,
        storageCondition,
        packagingAvailable,
        specialInstructions,
        status: 'AVAILABLE' as DonationStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'donations'), donationPayload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/provider/donations');
      }, 1500);

    } catch (err: any) {
      console.error("Error creating donation listing:", err);
      setError("Failed to create surplus listing. Verify network connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12" id="create-donation-wizard">
      <div className="bg-white border border-stone-100 p-8 rounded-2xl shadow-xs space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Donate Surplus Food</h2>
          <p className="text-xs text-stone-400 font-semibold uppercase">Multi-Section Safety Audit Wizard</p>
        </div>

        {/* Wizard progress circles */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 rounded-xl">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === i 
                    ? 'bg-emerald-600 text-white' 
                    : step > i 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-stone-200 text-stone-500'
                }`}>
                  {i}
                </div>
                <span className="text-[9px] font-extrabold text-stone-400 uppercase">
                  {i === 1 ? 'Food' : i === 2 ? 'Safety' : i === 3 ? 'Pickup' : 'Confirm'}
                </span>
              </div>
              {i < 4 && <div className={`flex-1 h-0.5 mx-2 ${step > i ? 'bg-emerald-500' : 'bg-stone-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex items-start gap-3 text-sm animate-scale-up" id="donation-success-alert">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Surplus Food Listing Active!</span>
              Your donation is now listed on the live available feed. Redirecting to listing logs...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 flex items-start gap-3 text-sm animate-scale-up" id="donation-error-alert">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Wizard Error Checklist</span>
              {error}
            </div>
          </div>
        )}

        {/* Main Form steps */}
        <form onSubmit={handleSubmit} className="space-y-6" id="donation-wizard-form">
          
          {/* STEP 1: FOOD INFORMATION */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in" id="wizard-step-1">
              <h3 className="font-bold text-stone-800 text-sm border-b border-stone-50 pb-1">Section 1: Food Information</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Food / Item Name *</label>
                <input 
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Vegetarian Paneer Curry & Rice Bowls"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                  required
                  id="donation-input-name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Detailed Description</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the packaging, flavor notes, or specific temperature conditions..."
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all resize-none"
                  id="donation-input-desc"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all bg-white"
                  >
                    <option value="RICE">Rice Bowls / Biryani</option>
                    <option value="MEALS">Prepared Meals</option>
                    <option value="BAKERY">Bakery & Breads</option>
                    <option value="FRUITS">Fruits Basket</option>
                    <option value="VEGETABLES">Vegetables</option>
                    <option value="SNACKS">Snacks & Dry Food</option>
                    <option value="PACKAGED_FOOD">Packaged Goods</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Food Classification</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFoodType('VEGETARIAN')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        foodType === 'VEGETARIAN' ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800' : 'border-stone-200 text-stone-500 bg-white'
                      }`}
                    >
                      VEGETARIAN
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodType('NON_VEGETARIAN')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        foodType === 'NON_VEGETARIAN' ? 'border-rose-600 bg-rose-50/50 text-rose-800' : 'border-stone-200 text-stone-500 bg-white'
                      }`}
                    >
                      NON-VEG
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Quantity *</label>
                  <input 
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                    required
                    id="donation-input-quantity"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Unit Measure</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all bg-white"
                  >
                    <option value="MEALS">Meals (Counts)</option>
                    <option value="KG">Kilograms (KG)</option>
                    <option value="LITRES">Litres (L)</option>
                    <option value="PACKETS">Packets</option>
                    <option value="BOXES">Boxes</option>
                    <option value="OTHER">Other Measure</option>
                  </select>
                </div>
              </div>

              {/* Drag and Drop Upload */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Food Image Upload (Optional)</label>
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    dragActive ? 'border-emerald-500 bg-emerald-50/30' : 'border-stone-200 hover:border-emerald-400 bg-stone-50/30'
                  }`}
                  id="dropzone"
                >
                  <input 
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="donation-file-input"
                  />
                  <label htmlFor="donation-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    {imagePreview ? (
                      <div className="relative w-36 h-28 rounded-lg overflow-hidden border shadow-inner">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-1 right-1 bg-stone-900/80 hover:bg-stone-900 text-white p-1 rounded-full text-xs shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-stone-400" />
                        <p className="text-xs text-stone-500">
                          <span className="text-emerald-600 font-bold hover:underline">Click to upload image</span> or drag-and-drop file here.
                        </p>
                        <p className="text-[10px] text-stone-400 font-semibold">PNG, JPG, JPEG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FOOD SAFETY */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in" id="wizard-step-2">
              <h3 className="font-bold text-stone-800 text-sm border-b border-stone-50 pb-1">Section 2: Food Safety Information</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Allergen Declarations</label>
                <input 
                  type="text"
                  value={allergens}
                  onChange={(e) => setAllergens(e.target.value)}
                  placeholder="e.g. Nuts, Dairy, Wheat (or type None)"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                  id="donation-input-allergens"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Prepared Timestamp *</label>
                  <input 
                    type="datetime-local"
                    value={preparedAt}
                    onChange={(e) => setPreparedAt(e.target.value)}
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Best-Before Expiry Timestamp *</label>
                  <input 
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Storage Conditions *</label>
                <input 
                  type="text"
                  value={storageCondition}
                  onChange={(e) => setStorageCondition(e.target.value)}
                  placeholder="e.g. Refrigerated (kept below 4°C)"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-800">Packaging Boxes Included?</span>
                  <p className="text-[10px] text-stone-500 leading-none">Are carryout boxes/containers supplied?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPackagingAvailable(!packagingAvailable)}
                  className={`w-12 h-6 rounded-full transition-colors relative focus:outline-hidden cursor-pointer ${
                    packagingAvailable ? 'bg-emerald-600' : 'bg-stone-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs ${
                    packagingAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PICKUP DETAILS */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in" id="wizard-step-3">
              <h3 className="font-bold text-stone-800 text-sm border-b border-stone-50 pb-1">Section 3: Pickup Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Pickup Start Timestamp *</label>
                  <input 
                    type="datetime-local"
                    value={pickupStart}
                    onChange={(e) => setPickupStart(e.target.value)}
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Pickup End Timestamp *</label>
                  <input 
                    type="datetime-local"
                    value={pickupEnd}
                    onChange={(e) => setPickupEnd(e.target.value)}
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Exact Pickup Address *</label>
                <input 
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. Apt 4B, 12 Baker Street, Chelsea"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Serving City</label>
                  <input 
                    type="text"
                    value={city}
                    className="w-full text-sm border border-stone-200 bg-stone-50 text-stone-400 px-4 py-3 rounded-xl cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Serving Area *</label>
                  <input 
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Chelsea, Midtown..."
                    className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden px-4 py-3 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in" id="wizard-step-4">
              <h3 className="font-bold text-stone-800 text-sm border-b border-stone-50 pb-1">Section 4: Additional Guidelines</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Special Handling Instructions</label>
                <textarea 
                  rows={3}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Ring buzzer 12; door code 9091. Ask for Chef Sarah upon arrival."
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all resize-none"
                />
              </div>

              {/* Review summary box */}
              <div className="bg-stone-50 rounded-xl p-5 border border-stone-200/50 space-y-3">
                <span className="text-[10px] font-extrabold text-stone-400 uppercase block tracking-wider">Listing Summary Checklist</span>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                  <p className="text-stone-500 font-semibold">Food Name:</p>
                  <p className="text-stone-800 font-bold truncate">{foodName}</p>

                  <p className="text-stone-500 font-semibold">Quantity / Unit:</p>
                  <p className="text-stone-800 font-bold">{quantity} {unit}</p>

                  <p className="text-stone-500 font-semibold">Allergens:</p>
                  <p className="text-rose-700 font-bold">{allergens || 'NoneDeclared'}</p>

                  <p className="text-stone-500 font-semibold">Pickup End Window:</p>
                  <p className="text-stone-800 font-bold truncate">
                    {new Date(pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(pickupEnd).toLocaleDateString()})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-50">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-sm font-bold text-stone-500 hover:text-stone-800 px-4 py-2 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                id="wizard-back-btn"
              >
                <ChevronLeft className="w-4 h-4" />
                Back Step
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                id="wizard-next-btn"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold px-6 py-3 rounded-lg transition-colors shadow-xs hover:shadow-emerald-100 disabled:opacity-50 cursor-pointer text-center"
                id="wizard-submit-btn"
              >
                {loading ? 'Publishing listing...' : 'Activate Donation Listing'}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
