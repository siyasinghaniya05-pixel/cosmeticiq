import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">CosmeticIQ</span>
            </div>
            <p className="text-gray-500 text-sm">AI-powered cosmetic safety platform using fuzzy logic and scientific ingredient analysis.</p>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link href="/scan" className="hover:text-gray-900 transition-colors">Product Scanner</Link></li>
              <li><Link href="/analyze" className="hover:text-gray-900 transition-colors">Ingredient Analysis</Link></li>
              <li><Link href="/compare" className="hover:text-gray-900 transition-colors">Product Comparator</Link></li>
              <li><Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Science</h3>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link href="/fuzzy-logic" className="hover:text-gray-900 transition-colors">Fuzzy Logic Engine</Link></li>
              <li><Link href="/claims" className="hover:text-gray-900 transition-colors">Claim Verification</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} CosmeticIQ. Powered by Fuzzy Logic & AI.</p>
        </div>
      </div>
    </footer>
  );
}
