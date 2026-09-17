import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Mail, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError("Please complete all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'NEW'
      });
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error("Error saving contact message:", err);
      setError("Failed to submit inquiry. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12" id="contact-container">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">Contact Us</h1>
        <p className="text-lg text-stone-500 max-w-xl mx-auto">
          Have questions about onboarding, verification approvals, or safety procedures? Get in touch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        {/* Contact Info (4 cols) */}
        <div className="md:col-span-5 space-y-8 bg-white border border-stone-100 p-8 rounded-2xl shadow-xs">
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-stone-900">Get in Touch</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Our operations team responds to non profit credential verifications and general partner inquiries within 24 hours.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-400 font-bold uppercase">Email Support</p>
                <p className="text-sm font-semibold text-stone-800">help@foodrescue.org</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-400 font-bold uppercase">Phone Helpline</p>
                <p className="text-sm font-semibold text-stone-800">+1 (555) 019-2834</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-400 font-bold uppercase">Headquarters</p>
                <p className="text-sm font-semibold text-stone-800">789 Gourmet Row, West Village<br />New York, NY 10014</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="md:col-span-7 bg-white border border-stone-100 p-8 rounded-2xl shadow-xs space-y-6">
          <h3 className="font-bold text-lg text-stone-900">Send an Inquiry</h3>

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 text-emerald-800 text-sm animate-scale-up" id="contact-success-toast">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Inquiry Submitted Successfully!</span>
                Your message has been logged. Our operations admin will review this and respond to you via email shortly.
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-sm animate-scale-up" id="contact-error-toast">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Submission Error</span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="contact-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Your Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all"
                  required
                  id="contact-input-name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sarah@example.com"
                  className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all"
                  required
                  id="contact-input-email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Subject</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. NGO Credential Approval Inquiry"
                className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all"
                required
                id="contact-input-subject"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">Your Message</label>
              <textarea 
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your message here in detail..."
                className="w-full text-sm border border-stone-200 focus:border-emerald-500 focus:outline-hidden p-3 rounded-xl transition-all resize-none"
                required
                id="contact-input-message"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-emerald-600 text-white font-extrabold px-6 py-3 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs hover:shadow-emerald-100 disabled:opacity-50 cursor-pointer text-center"
              id="contact-submit-btn"
            >
              {loading ? 'Submitting message...' : 'Send Inquiry Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
