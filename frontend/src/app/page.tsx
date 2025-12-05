"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import { 
  Link as LinkIcon, 
  Menu, 
  X, 
  ArrowRight,
} from 'lucide-react';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className={`min-h-screen bg-black ${inter.className}`}>
      
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="bg-white p-2 rounded-lg">
                <LinkIcon className="h-6 w-6 text-black" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Linkerly</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <button 
                onClick={() => router.push('/login')}
                className="text-white hover:text-gray-300 transition-colors font-medium"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/signup')}
                className="bg-white hover:bg-gray-100 text-black px-6 py-2.5 rounded-full font-bold transition-all transform hover:scale-105"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/95 border-b border-white/10 backdrop-blur-md">
            <div className="px-4 pt-2 pb-6 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-white">Features</a>
              <a href="#pricing" className="block text-gray-300 hover:text-white">Pricing</a>
              <button 
                onClick={() => router.push('/login')}
                className="block w-full text-left text-white hover:text-gray-300"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/signup')}
                className="w-full bg-white text-black px-6 py-3 rounded-lg font-bold mt-2"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ---------------- HERO SECTION WITH SHADER GRADIENT ---------------- */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* ShaderGradient Background */}
        <div className="absolute inset-0 z-0">
          <ShaderGradientCanvas
            style={{
              width: '100%',
              height: '100%',
            }}
            lazyLoad={undefined}
            fov={undefined}
            pixelDensity={1}
            pointerEvents='none'
          >
            <ShaderGradient
              animate='on'
              type='sphere'
              wireframe={false}
              shader='defaults'
              uTime={0}
              uSpeed={0.3}
              uStrength={0.3}
              uDensity={0.8}
              uFrequency={5.5}
              uAmplitude={3.2}
              positionX={-0.1}
              positionY={0}
              positionZ={0}
              rotationX={0}
              rotationY={130}
              rotationZ={70}
              color1='#73bfc4'
              color2='#ff810a'
              color3='#8da0ce'
              reflection={0.4}
              cAzimuthAngle={270}
              cPolarAngle={180}
              cDistance={0.5}
              cameraZoom={15.1}
              lightType='env'
              brightness={0.8}
              envPreset='city'
              grain='on'
              toggleAxis={false}
              zoomOut={false}
              hoverState=''
              enableTransition={false}
            />
          </ShaderGradientCanvas>
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Now Available
              </div>
              
              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-tight">
                Never lose a Great Link
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
                  Again! 
                </span>
              </h1>
              
              {/* Subheading */}
              <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Save, organize, and share your favorite links beautifully. Like Spotify playlists, but for the web.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <button 
                  onClick={() => router.push('/signup')}
                  className="bg-white hover:bg-gray-100 text-black text-lg px-5 py-5 rounded-full font-bold transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 group"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => router.push('/login')}
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white/30 text-lg px-10 py-5 rounded-full font-semibold transition-all backdrop-blur-sm"
                >
                  Sign In
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Setup in 30 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES SECTION (Optional - Add more sections as needed) ---------------- */}
      <section id="features" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything you need
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features to manage, track, and optimize your links
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer id="pricing" className="py-12 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">© 2025 Linkerly. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
