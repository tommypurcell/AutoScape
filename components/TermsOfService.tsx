import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-gray-500 mb-8">Last Updated: December 11, 2024</p>

                <div className="prose prose-slate max-w-none text-gray-600">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="mb-4">
                            By accessing and using AutoScape ("the Service"), you agree to comply with and be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our Service. These terms constitute a legally binding agreement between you and AutoScape.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                        <p className="mb-4">
                            AutoScape provides an AI-powered landscape design platform that allows users to upload photos of their outdoor spaces and generate design concepts,
                            material estimates, and planting plans. The Service also connects users with professional designers and landscaping products.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
                        <p className="mb-4">
                            You may be required to register for an account to access certain features. You agree to provide accurate, current, and complete information during the registration process
                            and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Content</h2>
                        <p className="mb-4">
                            By uploading photos, text, or other content ("User Content") to the Service, you grant AutoScape a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license
                            to use, reproduce, modify, adapt, publish, and display such User Content in connection with providing and improving the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. California Consumer Privacy Rights</h2>
                        <p className="mb-4">
                            Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), California residents have specific rights regarding their personal information:
                        </p>
                        <ul className="list-disc pl-5 mb-4 space-y-2">
                            <li><strong>Right to Know:</strong> You have the right to request information about the personal data we collect, use, disclose, and sell.</li>
                            <li><strong>Right to Delete:</strong> You have the right to request the deletion of your personal information, subject to certain exceptions.</li>
                            <li><strong>Right to Opt-Out:</strong> If we sell your personal information, you have the right to opt-out of such sale. Currently, AutoScape does not sell personal user data.</li>
                            <li><strong>Right to Non-Discrimination:</strong> You have the right not to receive discriminatory treatment for exercising your privacy rights.</li>
                        </ul>
                        <p className="mb-4">
                            To exercise these rights, please contact us at privacy@autoscape.ai.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Prohibited Conduct</h2>
                        <p className="mb-4">
                            You agree not to use the Service for any unlawful purpose or in any way that violates these Terms. Specifically, you agree not to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Upload content that is illegal, harmful, threatening, or abusive.</li>
                            <li>Reverse engineer, decompile, or attempt to extract the source code of the Service.</li>
                            <li>Interfere with or disrupt the operation of the Service.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
                        <p className="mb-4 uppercase text-sm font-semibold tracking-wide">
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
                            IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
                        <p className="mb-4">
                            To the maximum extent permitted by law, AutoScape shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
                            whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the Service;
                            (b) any conduct or content of any third party on the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Governing Law</h2>
                        <p className="mb-4">
                            These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
                            Any legal action or proceeding arising under these Terms will be brought exclusively in the federal or state courts located in San Francisco, California,
                            and the parties hereby irrevocably consent to the personal jurisdiction and venue therein.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
                        <p className="mb-4">
                            If you have any questions about these Terms, please contact us at legal@autoscape.ai.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
