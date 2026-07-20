'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Save, Loader2, CheckCircle2,
  Droplets, Sun, Wind, Thermometer, AlertCircle, X
} from 'lucide-react';

const skinTypes = [
  { id: 'dry', label: 'Dry', icon: '🏜️', description: 'Feels tight, may flake' },
  { id: 'oily', label: 'Oily', icon: '💧', description: 'Shiny, enlarged pores' },
  { id: 'combination', label: 'Combination', icon: '🎭', description: 'Oily T-zone, dry cheeks' },
  { id: 'sensitive', label: 'Sensitive', icon: '🌸', description: 'Easily irritated, reactive' },
  { id: 'acne_prone', label: 'Acne-Prone', icon: '⚡', description: 'Frequent breakouts' },
  { id: 'normal', label: 'Normal', icon: '✨', description: 'Balanced, few issues' },
];

const concerns = [
  'Acne', 'Aging', 'Dark Spots', 'Dryness', 'Oiliness',
  'Redness', 'Wrinkles', 'Fine Lines', 'Pores', 'Uneven Tone',
  'Hyperpigmentation', 'Dehydration', 'Sensitivity', 'Dullness'
];

const climates = [
  { id: 'humid', label: 'Humid', icon: Droplets },
  { id: 'dry', label: 'Dry', icon: Sun },
  { id: 'cold', label: 'Cold', icon: Wind },
  { id: 'temperate', label: 'Temperate', icon: Thermometer },
  { id: 'tropical', label: 'Tropical', icon: Sun },
  { id: 'moderate', label: 'Moderate', icon: Thermometer },
];

const validClimates = ['humid', 'dry', 'cold', 'temperate', 'tropical', 'moderate'];

type ProfileField = 'age' | 'climate' | 'budgetMin' | 'budgetMax' | 'city';

type ValidationErrors = Partial<Record<ProfileField, string>>;

function validateField(field: ProfileField, profile: {
  age: number;
  climate: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
}): string {
  switch (field) {
    case 'age':
      if (!profile.age && profile.age !== 0) return 'Age is required';
      if (profile.age < 10 || profile.age > 120) return 'Age must be between 10 and 120';
      return '';
    case 'climate':
      if (!profile.climate) return 'Climate is required';
      if (!validClimates.includes(profile.climate)) return 'Please select a valid climate';
      return '';
    case 'budgetMin':
      if (profile.budgetMin < 0) return 'Minimum budget must be at least 0';
      return '';
    case 'budgetMax':
      if (profile.budgetMax < 0) return 'Maximum budget must be at least 0';
      if (profile.budgetMax < profile.budgetMin) return 'Maximum budget must be greater than or equal to minimum';
      return '';
    case 'city':
      if (profile.city && profile.city.length > 100) return 'City must be 100 characters or less';
      return '';
    default:
      return '';
  }
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [touched, setTouched] = useState<Set<ProfileField>>(new Set());
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const initialProfileRef = useRef<string>('');

  const [profile, setProfile] = useState({
    skinType: '',
    age: 30,
    climate: '',
    city: '',
    budgetMin: 20,
    budgetMax: 200,
    allergies: [] as string[],
    concerns: [] as string[],
    isPregnant: false,
    isVegan: false,
    isCrueltyFree: false,
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveError, setSaveError] = useState('');

  const updateProfile = useCallback((updates: Partial<typeof profile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
    setSaveError('');
  }, []);

  useEffect(() => {
    const tk = localStorage.getItem('token');
    if (!tk) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const loadProfile = async () => {
      const tk = localStorage.getItem('token');
      if (!tk) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/profile`, {
          headers: { Authorization: `Bearer ${tk}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data && data.skin_type) {
            setProfile({
              skinType: data.skin_type || '',
              age: data.age || 30,
              climate: data.climate || '',
              city: data.city || '',
              budgetMin: data.budget_min ?? 20,
              budgetMax: data.budget_max ?? 200,
              allergies: data.allergies || [],
              concerns: data.concerns || [],
              isPregnant: data.is_pregnant || false,
              isVegan: data.is_vegan || false,
              isCrueltyFree: data.is_cruelty_free || false,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [router]);

  useEffect(() => {
    initialProfileRef.current = JSON.stringify(profile);
  }, [loadingProfile]);

  useEffect(() => {
    const currentStr = JSON.stringify(profile);
    setHasUnsavedChanges(currentStr !== initialProfileRef.current);
  }, [profile]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);

    router.push = (href: string, options?: { scroll?: boolean }) => {
      setShowUnsavedWarning(true);
      setPendingNavigation(() => () => originalPush(href, options));
    };
    router.replace = (href: string, options?: { scroll?: boolean }) => {
      setShowUnsavedWarning(true);
      setPendingNavigation(() => () => originalReplace(href, options));
    };

    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [hasUnsavedChanges, router]);

  const handleBlur = useCallback((field: ProfileField) => {
    setTouched(prev => new Set(prev).add(field));
    const error = validateField(field, profile);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [profile]);

  const validateAll = useCallback((): boolean => {
    const fields: ProfileField[] = ['age', 'climate', 'budgetMin', 'budgetMax', 'city'];
    const newErrors: ValidationErrors = {};
    let isValid = true;
    for (const field of fields) {
      const error = validateField(field, profile);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }
    setErrors(newErrors);
    setTouched(new Set(fields));
    return isValid;
  }, [profile]);

  const toggleConcern = (concern: string) => {
    updateProfile({
      concerns: profile.concerns.includes(concern)
        ? profile.concerns.filter(c => c !== concern)
        : [...profile.concerns, concern]
    });
  };

  const handleSave = async () => {
    if (!validateAll()) return;

    setIsSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          skin_type: profile.skinType,
          age: profile.age,
          climate: profile.climate,
          city: profile.city,
          budget_min: profile.budgetMin,
          budget_max: profile.budgetMax,
          concerns: profile.concerns,
          allergies: profile.allergies,
          is_pregnant: profile.isPregnant,
          is_vegan: profile.isVegan,
          is_cruelty_free: profile.isCrueltyFree,
        }),
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to save profile' }));
        setSaveError(err.detail || 'Failed to save profile');
        return;
      }
      setSaved(true);
      setShowToast(true);
      setHasUnsavedChanges(false);
      initialProfileRef.current = JSON.stringify(profile);
      setTimeout(() => setShowToast(false), 4000);
      setTimeout(() => router.push('/dashboard'), 2500);
    } catch (error) {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedWarning(false);
    setPendingNavigation(null);
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {isSetup ? 'Complete Your Profile' : 'Edit Profile'}
        </h1>
        <p className="text-gray-500">
          {isSetup
            ? 'Tell us about your skin so we can provide personalized recommendations'
            : 'Update your skin profile for better recommendations'}
        </p>
      </motion.div>

      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-6 z-50 bg-green-50 border border-green-200 rounded-xl shadow-lg p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <span className="text-green-700 font-medium">Profile saved successfully!</span>
          <button onClick={() => setShowToast(false)} className="ml-2 text-green-400 hover:text-green-600">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {showUnsavedWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelNavigation}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Discard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Skin Type */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-pink-400" />
          What's your skin type?
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {skinTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => updateProfile({ skinType: type.id })}
              className={`p-4 rounded-xl text-left transition-all ${
                profile.skinType === type.id
                  ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-2 border-pink-500'
                  : 'glass-card'
              }`}
            >
              <span className="text-2xl">{type.icon}</span>
              <p className="text-gray-900 font-medium mt-2">{type.label}</p>
              <p className="text-gray-500 text-sm">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Age & Climate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age</h3>
          <input
            type="range"
            min="10"
            max="120"
            value={profile.age}
            onChange={(e) => updateProfile({ age: parseInt(e.target.value) })}
            onBlur={() => handleBlur('age')}
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-gray-500 text-sm mt-2">
            <span>10</span>
            <span className="text-gray-900 text-lg font-bold">{profile.age}</span>
            <span>120</span>
          </div>
          {touched.has('age') && errors.age && (
            <p className="text-red-500 text-sm mt-2">{errors.age}</p>
          )}
        </div>

        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Climate</h3>
          <div className="grid grid-cols-2 gap-2">
            {climates.map((climate) => (
              <button
                key={climate.id}
                onClick={() => {
                  updateProfile({ climate: climate.id });
                  setTouched(prev => new Set(prev).add('climate'));
                  setErrors(prev => ({ ...prev, climate: validateField('climate', { ...profile, climate: climate.id }) }));
                }}
                className={`p-3 rounded-xl flex items-center gap-2 text-sm transition-all ${
                  profile.climate === climate.id
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-pink-500 text-white'
                    : 'glass text-gray-600 hover:text-gray-900'
                }`}
              >
                <climate.icon className="w-4 h-4" />
                {climate.label}
              </button>
            ))}
          </div>
          {touched.has('climate') && errors.climate && (
            <p className="text-red-500 text-sm mt-2">{errors.climate}</p>
          )}
        </div>
      </div>

      {/* City */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">City</h3>
        <input
          type="text"
          value={profile.city}
          onChange={(e) => updateProfile({ city: e.target.value })}
          onBlur={() => handleBlur('city')}
          placeholder="Enter your city for weather-based recommendations"
          className="input-glass"
        />
        {touched.has('city') && errors.city && (
          <p className="text-red-500 text-sm mt-2">{errors.city}</p>
        )}
      </div>

      {/* Budget */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Skincare Budget</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-gray-500 text-sm">Min</label>
            <input
              type="number"
              value={profile.budgetMin}
              onChange={(e) => updateProfile({ budgetMin: parseInt(e.target.value) || 0 })}
              onBlur={() => {
                handleBlur('budgetMin');
                if (touched.has('budgetMax')) handleBlur('budgetMax');
              }}
              className="input-glass"
              min="0"
            />
            {touched.has('budgetMin') && errors.budgetMin && (
              <p className="text-red-500 text-sm mt-2">{errors.budgetMin}</p>
            )}
          </div>
          <span className="text-gray-500">to</span>
          <div className="flex-1">
            <label className="text-gray-500 text-sm">Max</label>
            <input
              type="number"
              value={profile.budgetMax}
              onChange={(e) => updateProfile({ budgetMax: parseInt(e.target.value) || 0 })}
              onBlur={() => {
                handleBlur('budgetMax');
                if (touched.has('budgetMin')) handleBlur('budgetMin');
              }}
              className="input-glass"
              min="0"
            />
            {touched.has('budgetMax') && errors.budgetMax && (
              <p className="text-red-500 text-sm mt-2">{errors.budgetMax}</p>
            )}
          </div>
        </div>
      </div>

      {/* Skin Concerns */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skin Concerns</h3>
        <div className="flex flex-wrap gap-2">
          {concerns.map((concern) => (
            <button
              key={concern}
              onClick={() => toggleConcern(concern)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                profile.concerns.includes(concern)
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                  : 'glass text-gray-600 hover:text-gray-900'
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isPregnant}
              onChange={(e) => updateProfile({ isPregnant: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-50 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-gray-600">I am pregnant or planning pregnancy</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isVegan}
              onChange={(e) => updateProfile({ isVegan: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-50 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-gray-600">I prefer vegan products</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isCrueltyFree}
              onChange={(e) => updateProfile({ isCrueltyFree: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-50 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-gray-600">I prefer cruelty-free products</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {saveError}
        </div>
      )}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={isSaving || !profile.skinType}
        className="glass-button w-full flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Profile
          </>
        )}
      </motion.button>
    </div>
  );
}
