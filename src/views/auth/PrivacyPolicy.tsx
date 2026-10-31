import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "Information handled by the CRM",
    body: "Depending on how your organization uses the CRM, it may contain account details such as names, work email addresses, phone numbers, and roles; customer and service details such as contact information, company names, service locations, enquiries, bookings, and work schedules; and workforce records such as employee profiles, attendance, overtime, expense claims, and review notes. Work orders may also include service reports and photos uploaded by users.",
  },
  {
    title: "How information is used",
    body: "The CRM uses this information to authenticate users, manage customer enquiries and service bookings, schedule and assign work, support field operations, review reports, and administer workforce and expense workflows. Account and request information is also used to keep records consistent and to investigate service or account issues.",
  },
  {
    title: "Who can access information",
    body: "Access is provided through role-specific CRM workspaces. Depending on their role and assigned work, administrators, managers, and employees may see information needed for their tasks. Users should only enter information they are authorized to share with their organization through the CRM.",
  },
  {
    title: "Storage and session information",
    body: "CRM records are sent to the backend service configured for this application. To keep users signed in, the application stores access and refresh session tokens in the browser’s local storage. Sign out clears the local session. Avoid using the CRM on a shared device unless you sign out when finished.",
  },
  {
    title: "Retention and deletion",
    body: "The application does not define a single retention period for every record. Your organization should set and follow retention periods for customer, workforce, financial, and operational records, taking account of its business needs and obligations. When information is no longer needed, it should be deleted or de-identified through the applicable organizational process and supported product controls.",
  },
  {
    title: "Your choices and requests",
    body: "If you need to review, correct, or request deletion of information held in the CRM, contact the organization that manages your account or entered the information. An administrator may need to handle the request because some records are shared operational or employment records. You can sign out to end the current browser session.",
  },
  {
    title: "Security",
    body: "The CRM uses authenticated sessions and role-based access in its interface. No online system can guarantee absolute security. Use a unique password, protect your device, and report suspected unauthorized access to your organization’s administrator promptly.",
  },
  {
    title: "Policy owner and contact",
    body: "This policy needs to identify the legal organization responsible for this CRM deployment and provide a working privacy contact. Those details have not been supplied yet: [Add legal organization name, postal address, and privacy contact email before publishing this policy].",
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950">
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        <article className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-9 text-white sm:px-10 sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck size={25}/></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Spectera CRM</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
            <p className="mt-3 text-sm text-emerald-50/85">Last updated: October 31, 2026</p>
          </header>

          <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              This policy describes information the CRM is designed to handle. The organization operating this deployment must fill in its legal identity and privacy contact before publishing the policy as final.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              This notice explains how information may be handled when you use Spectera CRM. The organization that provides your account is responsible for explaining its specific business practices and responding to requests about records it manages.
            </p>
            {sections.map((section, index) => (
              <section key={section.title} className="border-t border-slate-100 pt-6">
                <h2 className="text-lg font-bold text-slate-900">{index + 1}. {section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
              </section>
            ))}
          </div>
        </article>

        <p className="mt-5 text-center text-xs text-slate-500">For account access, return to <Link to="/login" className="font-semibold text-emerald-800 underline underline-offset-2">sign in</Link>.</p>
      </div>
    </main>
  );
}
