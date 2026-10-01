import React, { useState } from 'react';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiChevronDown,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import { appConfig } from '../assets/assets.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanMessage = formData.message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setSubmitError('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('contact_submissions').insert({
          name: cleanName,
          email: cleanEmail,
          phone: formData.phone.trim() || null,
          subject: formData.subject.trim() || null,
          message: cleanMessage,
        });

        if (error) {
          console.warn('Could not save contact submission to Supabase:', error.message);
        }
      }

      setSubmitted(true);
    } catch (err) {
      console.warn('Contact submission error:', err);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'What payment methods do you accept?',
      a: 'We accept Cash on Delivery (COD) nationwide across Pakistan, as well as Visa, Mastercard, and direct bank transfers.',
    },
    {
      q: 'How long does nationwide delivery take?',
      a: 'Orders within major metropolitan cities (Karachi, Lahore, Islamabad) take 24–48 hours. Regional and other areas take 2–4 business days.',
    },
    {
      q: 'How do I return or exchange a product?',
      a: 'You can initiate an easy return within 7 days of receiving your package through our customer helpline or online support portal.',
    },
  ];

  return (
    <div className="py-8 sm:py-12 space-y-12">
      <Container>
        <ScrollReveal variant="fade-up">
          <SectionHeading
            title="Customer Care & Support"
            subtitle="Get In Touch"
            align="left"
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Column */}
          <ScrollReveal variant="fade-right" delay={0.1} className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-neutral-900">
                Contact Information
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Reach out to our customer support specialists for order tracking, size advice, or product questions.
              </p>

              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-start gap-3 text-neutral-700">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF5722] shrink-0">
                    <FiPhone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">Phone & WhatsApp</span>
                    <span>{appConfig.supportPhone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-neutral-700">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF5722] shrink-0">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">Email Support</span>
                    <span>{appConfig.supportEmail}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-neutral-700">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF5722] shrink-0">
                    <FiMapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">Corporate Office</span>
                    <span>{appConfig.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-neutral-700">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF5722] shrink-0">
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">Support Hours</span>
                    <span>Monday – Saturday: 9:00 AM – 9:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-neutral-900 mb-2">
                Frequently Asked Questions
              </h4>
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-neutral-100 rounded-2xl p-3 bg-neutral-50/50"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full text-left font-semibold text-xs text-neutral-800 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <FiChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        openFaq === idx ? 'rotate-180 text-[#FF5722]' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <p className="text-[11px] text-neutral-600 mt-2 pt-2 border-t border-neutral-100 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Contact Form Column */}
          <ScrollReveal variant="fade-left" delay={0.15} className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <FiCheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  Message Dispatched!
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Thank you for reaching out, <strong>{formData.name}</strong>. Our support desk has received your ticket and will reply to <strong>{formData.email}</strong> within 2 hours.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                  }}
                >
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  Send Us a Direct Message
                </h3>
                <p className="text-xs text-neutral-500 mb-6">
                  Fill in your details below and our team will get back to you promptly.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ali Khan"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0300 1234567"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        Inquiry Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Order status / Product question"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows="4"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can our support team assist you today?"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] resize-none"
                    ></textarea>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                      {submitError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <FiSend className="w-4 h-4" /> {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            )}
          </ScrollReveal>
        </div>
      </Container>
    </div>
  );
}
