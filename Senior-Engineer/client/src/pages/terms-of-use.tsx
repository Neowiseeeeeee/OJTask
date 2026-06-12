import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";

const LAST_UPDATED = "June 12, 2025";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{title}</h2>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0f1a] text-slate-900 dark:text-white">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0d0f1a]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <img src="/ojtask-logo.png" className="h-10 w-auto object-contain mt-1" alt="OJTask" />
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          </Link>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-violet-50 via-white to-violet-50 dark:from-violet-950/30 dark:via-[#0d0f1a] dark:to-violet-950/20 border-b border-violet-100 dark:border-violet-900/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-widest">Legal</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">Terms of Use</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-5 mb-10 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          These Terms of Use govern your access to and use of OJTask. By creating an account, you agree to be bound by these terms. If you do not agree, do not use the platform.
        </div>

        <div className="space-y-10 divide-y divide-slate-100 dark:divide-slate-800">

          <Section title="1. The Platform">
            <p>OJTask is an internship management platform that provides tools for logging OJT hours, submitting daily scrum reports, tracking tasks, recording attendance, and managing internship documents. It is intended for use by students completing their on-the-job training requirements, along with their supervisors and school coordinators.</p>
          </Section>

          <div className="pt-10">
            <Section title="2. Eligibility and Account Creation">
              <p>You may use OJTask if you are:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>A student enrolled in an academic program with an OJT requirement;</li>
                <li>A supervisor employed by or affiliated with a company hosting interns;</li>
                <li>A school coordinator or faculty member responsible for OJT oversight; or</li>
                <li>A system administrator managing the platform on behalf of an organization.</li>
              </ul>
              <p>You are responsible for providing accurate information during registration. Using false information or impersonating another person is a violation of these terms and may result in immediate account suspension.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="3. User Roles and Responsibilities">
              <p><strong className="text-slate-800 dark:text-slate-100">Students</strong> are responsible for submitting accurate and honest time logs, scrum reports, attendance records, and documents. Submitting falsified records (e.g., logging hours you did not work) is a serious violation and may be reported to your school or company.</p>
              <p><strong className="text-slate-800 dark:text-slate-100">Supervisors</strong> are responsible for reviewing and approving intern records in a timely and accurate manner. Approving records you have not verified undermines the integrity of the OJT process.</p>
              <p><strong className="text-slate-800 dark:text-slate-100">School Coordinators</strong> are responsible for monitoring enrolled students' compliance and reviewing document submissions as required by their academic program.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="4. Acceptable Use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Submit false, fabricated, or misleading OJT records.</li>
                <li>Share your account credentials with others or allow unauthorized access to your account.</li>
                <li>Use the platform to harass, threaten, or communicate inappropriately with other users.</li>
                <li>Upload files containing malware, viruses, or any content intended to harm the platform or its users.</li>
                <li>Attempt to reverse engineer, scrape, or interfere with the platform's systems or database.</li>
                <li>Upload content that violates applicable laws, including content that infringes intellectual property rights or contains personal data of individuals without their consent.</li>
              </ul>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="5. Spaces and Data Access">
              <p>OJTask organizes users into Spaces. When you join a Space, other authorized members of that space — including your supervisor or school coordinator — can view your OJT records, documents, and messages within that Space. This is an intended function of the platform and is necessary for it to serve its purpose.</p>
              <p>Space administrators (supervisors and school coordinators) may remove members, manage access, and export records as permitted by the platform. You understand and accept that your records within a Space are shared with other authorized members.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="6. Content Ownership">
              <p>You retain ownership of the content you upload and submit to OJTask (documents, scrum reports, time log descriptions, etc.). By submitting content to the platform, you grant OJTask a limited, non-exclusive license to store, display, and transmit that content as necessary to provide the service — for example, making your time logs visible to your supervisor.</p>
              <p>We do not claim ownership of your OJT records or documents and will not use them for any purpose outside of operating the platform.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="7. Platform Availability">
              <p>We aim to keep OJTask available and functional, but we do not guarantee uninterrupted or error-free access. The platform may be temporarily unavailable due to maintenance, server issues, or circumstances beyond our control.</p>
              <p>We are not liable for any loss of data or disruption to your internship activities resulting from platform downtime. We recommend keeping local copies of important documents and records.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="8. Termination">
              <p>We reserve the right to suspend or terminate accounts that violate these terms, including accounts found to be submitting falsified records, engaging in harassment, or attempting to compromise the platform's security.</p>
              <p>You may delete your own account at any time by contacting us at <a href="mailto:ojtask.connect@gmail.com" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">ojtask.connect@gmail.com</a>. Upon deletion, your personal data will be removed in accordance with our Privacy Policy.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="9. Limitation of Liability">
              <p>OJTask is provided on an "as is" basis. To the maximum extent permitted by applicable law, we disclaim all warranties, express or implied, including fitness for a particular purpose.</p>
              <p>We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform — including, but not limited to, any impact on your OJT completion, academic standing, or employment arising from platform issues.</p>
              <p>Our total liability to you for any claim arising from your use of OJTask shall not exceed the amount, if any, you have paid to us in the twelve months preceding the claim.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="10. Governing Law">
              <p>These Terms of Use are governed by the laws of the Republic of the Philippines. Any disputes arising from or related to your use of OJTask shall be subject to the exclusive jurisdiction of the courts of the Philippines.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="11. Changes to These Terms">
              <p>We may update these Terms of Use from time to time. We will update the "Last updated" date at the top of this page when we do. Continued use of OJTask after updated terms are posted constitutes your acceptance of the changes.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="12. Contact">
              <p>Questions about these Terms of Use may be directed to:</p>
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm">
                <p className="font-bold text-slate-800 dark:text-slate-100">OJTask</p>
                <p className="text-slate-600 dark:text-slate-300">Email: <a href="mailto:ojtask.connect@gmail.com" className="text-violet-600 dark:text-violet-400 hover:underline">ojtask.connect@gmail.com</a></p>
              </div>
            </Section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} OJTask. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/privacy-policy" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
            <Link href="/help-center" className="hover:text-violet-600 transition-colors">Help Center</Link>
            <Link href="/contact" className="hover:text-violet-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
