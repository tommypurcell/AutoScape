import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white p-10 shadow-sm rounded-xl">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </button>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-gray-500 mb-8">Last Updated: December 11, 2024</p>

                <div className="prose prose-slate max-w-none text-gray-600">
                    <p className="mb-6">
                        AutoScape ("we," "us," or "our") respects your privacy and is committed to protecting your personal data.
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access our website and use our AI landscape design services.
                    </p>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Personal Identifiers:</strong> Name, email address, phone number, and account credentials.</li>
                            <li><strong>User Content:</strong> Photos of your property, landscape preferences, and design inputs.</li>
                            <li><strong>Usage Data:</strong> Information about how you use our website, including IP address, browser type, and device information.</li>
                            <li><strong>Commercial Information:</strong> Records of designs generated and services requested.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                        <p className="mb-4">We use your information to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Provide and improve our AI landscape design services.</li>
                            <li>Process your account registration and manage your user profile.</li>
                            <li>Communicate with you about your designs, updates, and promotional offers.</li>
                            <li>Analyze usage trends to enhance user experience and system performance.</li>
                            <li>Comply with legal obligations and enforce our Terms of Service.</li>
                        </ul>
                    </section>

                    <section className="mb-8 text-emerald-900 bg-emerald-50 p-6 rounded-lg border border-emerald-100">
                        <h2 className="text-xl font-semibold text-emerald-800 mb-4">3. California Privacy Rights (CCPA & CPRA)</h2>
                        <p className="mb-4">
                            If you are a California resident, the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA) provide you with specific rights regarding your personal information:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Right to Know:</strong> You may request details about the categories of personal information we have collected, the sources, the business purpose, and the specific pieces of data.</li>
                            <li><strong>Right to Delete:</strong> You may request the deletion of your personal information that we have collected, subject to certain exceptions.</li>
                            <li><strong>Right to Correction:</strong> You may request that we correct inaccurate personal information we hold about you.</li>
                            <li><strong>Right to Opt-Out of Sale/Sharing:</strong> We do not sell your personal information. You have the right to direct us not to share your personal information for cross-context behavioral advertising.</li>
                            <li><strong>Right to Limit Use of Sensitive Personal Information:</strong> You have the right to limit our use of your sensitive personal information to that which is necessary to perform our services.</li>
                            <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
                        </ul>
                        <p className="mt-4 font-medium">
                            To exercise any of these rights, please contact us at privacy@autoscape.ai using the subject line "California Privacy Request".
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Sharing of Information</h2>
                        <p className="mb-4">
                            We do not sell your personal information. We may share your information with:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Service Providers:</strong> Third-party vendors who assist with cloud hosting (e.g., Firebase, Google Cloud), AI processing, and analytics.</li>
                            <li><strong>Professional Designers:</strong> If you explicitly choose to connect with a professional designer on our platform.</li>
                            <li><strong>Legal Authorities:</strong> When required by law or to protect our rights and safety.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
                        <p className="mb-4">
                            We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Security</h2>
                        <p className="mb-4">
                            We implement reasonable security measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet is 100% secure.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
                        <p className="mb-4">
                            If you have questions or concerns about this Privacy Policy, please contact us at:
                        </p>
                        <p>
                            <strong>Email:</strong> privacy@autoscape.ai<br />
                            <strong>Address:</strong> 123 Landscape Lane, San Francisco, CA 94105
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
