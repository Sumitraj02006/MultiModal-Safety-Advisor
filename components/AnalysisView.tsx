import React, { useState, useRef } from 'react';
import { Camera, MapPin, Upload, Loader2, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import RiskGauge from './RiskGauge';
import { analyzeSafety, fileToGenerativePart } from '../services/geminiService';
import { AnalysisResult, LocationData } from '../types';

const AnalysisView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'found' | 'error'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    setLocationStatus('locating');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationStatus('found');
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('error');
    }
  };

  const handleAnalyze = async () => {
    if (!inputText && !selectedImage && !location) return;

    setLoading(true);
    setResult(null);

    try {
      let imageBase64 = undefined;
      if (selectedImage) {
        imageBase64 = await fileToGenerativePart(selectedImage);
      }

      const locData = location ? { lat: location.latitude, lng: location.longitude } : undefined;
      const analysis = await analyzeSafety(inputText, imageBase64, locData);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Safety Analysis
        </h2>
        
        <div className="space-y-4">
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Describe location or ask a question
            </label>
            <textarea
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-black placeholder:text-slate-400"
              rows={3}
              placeholder="e.g., Is Central Park safe to walk in right now? What are the crime rates here?"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
              {selectedImage ? 'Change Photo' : 'Add Photo'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />

            <button
              onClick={getLocation}
              className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                locationStatus === 'found' 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {locationStatus === 'locating' ? 'Locating...' : locationStatus === 'found' ? 'Location Set' : 'Use My Location'}
            </button>
            
            <div className="flex-grow"></div>

            <button
              onClick={handleAnalyze}
              disabled={loading || (!inputText && !selectedImage && !location)}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze Safety'}
            </button>
          </div>

          {/* Previews */}
          {(imagePreview || location) && (
            <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              {imagePreview && (
                <div className="relative group">
                  <img src={imagePreview} alt="Context" className="h-20 w-20 object-cover rounded-md border border-slate-200" />
                  <button 
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-3 h-3 flex items-center justify-center font-bold text-xs">×</div>
                  </button>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">Coordinates</div>
                    <div>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center">
              <RiskGauge score={result.safetyScore} />
              <div className="mt-4 text-center">
                <p className="text-slate-600 text-sm">
                  {result.safetyScore > 80 ? 'Conditions appear safe.' : 
                   result.safetyScore > 50 ? 'Exercise normal caution.' : 'High caution advised.'}
                </p>
              </div>
            </div>

            {/* Analysis Text */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Report Summary</h3>
              <div className="prose prose-sm prose-blue max-w-none text-slate-600">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Sources & References</h4>
              <ul className="space-y-1">
                {result.sources.map((source, idx) => (
                  <li key={idx} className="text-sm truncate">
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      {source.title || source.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisView;