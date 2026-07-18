'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User, Save, Loader2, CheckCircle2,
  Droplets, Sun, Wind, Thermometer
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

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const toggleConcern = (concern: string) => {
    setProfile(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter(c => c !== concern)
        : [...prev.concerns, concern]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/profile`, {
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
          is_pregnant: profile.isPregnant,
          is_vegan: profile.isVegan,
          is_cruelty_free: profile.isCrueltyFree,
        }),
      });
      setSaved(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error) {
      console.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

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

      {saved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-4 border-green-500/50 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-green-300">Profile saved successfully!</span>
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
              onClick={() => setProfile({ ...profile, skinType: type.id })}
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
            min="15"
            max="80"
            value={profile.age}
            onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-gray-500 text-sm mt-2">
            <span>15</span>
            <span className="text-gray-900 text-lg font-bold">{profile.age}</span>
            <span>80</span>
          </div>
        </div>

        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Climate</h3>
          <div className="grid grid-cols-2 gap-2">
            {climates.map((climate) => (
              <button
                key={climate.id}
                onClick={() => setProfile({ ...profile, climate: climate.id })}
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
        </div>
      </div>

      {/* City */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">City</h3>
        <input
          type="text"
          value={profile.city}
          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
          placeholder="Enter your city for weather-based recommendations"
          className="input-glass"
        />
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
              onChange={(e) => setProfile({ ...profile, budgetMin: parseInt(e.target.value) })}
              className="input-glass"
              min="0"
            />
          </div>
          <span className="text-gray-500">to</span>
          <div className="flex-1">
            <label className="text-gray-500 text-sm">Max</label>
            <input
              type="number"
              value={profile.budgetMax}
              onChange={(e) => setProfile({ ...profile, budgetMax: parseInt(e.target.value) })}
              className="input-glass"
              min="0"
            />
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
              onChange={(e) => setProfile({ ...profile, isPregnant: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-50 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-gray-600">I am pregnant or planning pregnancy</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isVegan}
              onChange={(e) => setProfile({ ...profile, isVegan: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-50 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-gray-600">I prefer vegan products</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.isCrueltyFree}
              onChange={(e) => setProfile({ ...profile, isCrueltyFree: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-50 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-gray-600">I prefer cruelty-free products</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
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
