import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

const LAST_UPDATED = "June 12, 2025";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{title}</h2>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
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
              <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-widest">Legal</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-5 mb-10 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          This Privacy Policy describes how OJTask collects, uses, stores, and protects information when you use our platform. By creating an account and using OJTask, you agree to the practices described below. This policy is written in plain language to be as clear as possible.
        </div>

        <div className="space-y-10 divide-y divide-slate-100 dark:divide-slate-800">

          <Section title="1. Who We Are">
            <p>OJTask is an on-the-job training (OJT) management platform designed for students, supervisors, and school coordinators in the Philippines. The platform provides tools for tracking internship hours, daily scrum reports, task assignments, attendance, and document submissions.</p>
            <p>You can reach us at <a href="mailto:ojtask.connect@gmail.com" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">ojtask.connect@gmail.com</a> for any privacy-related concerns.</p>
          </Section>

          <div className="pt-10">
            <Section title="2. Information We Collect">
              <p><strong className="text-slate-800 dark:text-slate-100">Account information:</strong> When you register, we collect your full name, email address, username, and password (stored as-is; we recommend using a unique password for this platform).</p>
              <p><strong className="text-slate-800 dark:text-slate-100">Role and space data:</strong> Your selected role (student, supervisor, school coordinator), the spaces you belong to, and your membership status within those spaces.</p>
              <p><strong className="text-slate-800 dark:text-slate-100">OJT activity records:</strong> Time logs you submit (dates, hours, work descriptions), daily scrum entries, task updates, attendance records, and evaluation forms — all entered voluntarily by you during normal platform use.</p>
              <p><strong className="text-slate-800 dark:text-slate-100">Uploaded documents:</strong> Files you upload to the platform, such as memoranda of agreement (MOAs), endorsement letters, and internship reports. These are stored on our server and linked to your account.</p>
              <p><strong className="text-slate-800 dark:text-slate-100">Communications:</strong> Messages you send within the platform's messaging feature are stored and visible to members of the same space.</p>
              <p><strong className="text-slate-800 dark:text-slate-100">Technical data:</strong> Basic session information (login/logout timestamps) used for security and audit logging. We do not use third-party analytics trackers.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="3. How We Use Your Information">
              <p>We use the information you provide to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Operate and maintain your account and the features you use.</li>
                <li>Enable supervisors and school coordinators to review and approve your OJT records.</li>
                <li>Send transactional emails, such as password reset codes (OTP), through your registered email address.</li>
                <li>Maintain audit logs for administrative and security purposes within your space.</li>
                <li>Respond to support and contact inquiries.</li>
              </ul>
              <p>We do not use your data for advertising, and we do not sell or share your personal information with third parties for their own marketing purposes.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="4. Data Storage and Security">
              <p>All data is stored in a MongoDB Atlas cloud database hosted on infrastructure provided by MongoDB, Inc. Data is transmitted over encrypted connections (HTTPS/TLS). Session authentication uses server-side session tokens stored in memory.</p>
              <p>Uploaded files are stored on the application server. While we apply reasonable security measures, no system is completely immune to security risks. We encourage you not to upload documents that contain sensitive personal information beyond what is required for your internship program.</p>
              <p>We do not currently provide end-to-end encryption for messages or documents.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="5. Data Sharing">
              <p>Your OJT records (time logs, scrums, tasks, attendance, documents) are visible to other authorized members of your space — specifically, your supervisor and school coordinator. This is the core function of the platform.</p>
              <p>We do not share your personal information with unaffiliated third parties, except where required by applicable Philippine law or a valid legal order.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="6. Your Rights Under the Data Privacy Act of 2012">
              <p>Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-slate-800 dark:text-slate-100">Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong className="text-slate-800 dark:text-slate-100">Correction:</strong> Request correction of inaccurate information in your profile.</li>
                <li><strong className="text-slate-800 dark:text-slate-100">Deletion:</strong> Request deletion of your account and associated personal data, subject to our retention obligations.</li>
                <li><strong className="text-slate-800 dark:text-slate-100">Objection:</strong> Object to the processing of your data in certain circumstances.</li>
              </ul>
              <p>To exercise these rights, contact us at <a href="mailto:ojtask.connect@gmail.com" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">ojtask.connect@gmail.com</a>.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="7. Data Retention">
              <p>We retain account data and OJT records for as long as your account is active. If you request account deletion, we will remove your personal data from our systems within a reasonable period, except where we are required to retain certain records by law.</p>
              <p>Space records (time logs, documents, etc.) that involve multiple users may be retained by the space administrator after your departure from the space, as they form part of a shared record.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="8. Cookies and Sessions">
              <p>OJTask uses server-side sessions to keep you logged in. A session cookie is stored in your browser to identify your session. This cookie contains no personal information — only a session identifier. It expires when you log out or after 24 hours of inactivity.</p>
              <p>We do not use advertising cookies, cross-site tracking cookies, or third-party analytics cookies.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="9. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we do, we will update the "Last updated" date at the top of this page. Continued use of OJTask after changes are posted constitutes acceptance of the updated policy.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="10. Contact">
              <p>For privacy-related questions, data access requests, or concerns, please contact us at:</p>
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm">
                <p className="font-bold text-slate-800 dark:text-slate-100">OJTask</p>
                <p className="text-slate-600 dark:text-slate-300">Email: <a href="mailto:ojtask.connect@gmail.com" className="text-violet-600 dark:text-violet-400 hover:underline">ojtask.connect@gmail.com</a></p>
                <p className="text-slate-600 dark:text-slate-300">Response time: Within 3 business days</p>
              </div>
            </Section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} OJTask. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/terms-of-use" className="hover:text-violet-600 transition-colors">Terms of Use</Link>
            <Link href="/help-center" className="hover:text-violet-600 transition-colors">Help Center</Link>
            <Link href="/contact" className="hover:text-violet-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
