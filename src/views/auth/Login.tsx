import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  ChartNoAxesColumnIncreasing,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { loginUser } from "../../store/auth/AuthSlice";
import AuthViewModel from "../../viewmodels/auth/AuthViewModel";

const features = [
  { title: "Service Management", text: "Track requests, bookings and work orders", icon: Wrench, tone: "emerald" },
  { title: "Team & Workforce", text: "Manage technicians, attendance and overtime", icon: UsersRound, tone: "blue" },
  { title: "Client Management", text: "Keep your clients and sites organized", icon: Building2, tone: "violet" },
  { title: "Reports & Insights", text: "Get real-time reports and make smarter decisions", icon: ChartNoAxesColumnIncreasing, tone: "orange" },
];

function SpecteraLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`spectera-logo-wrap${inverse ? " spectera-logo-inverse" : ""}`}>
      <img src="/specterra.png" alt="Specterra — an ISO certified company" className="spectera-logo-image" />
    </div>
  );
}

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) navigate(AuthViewModel.getDashboardPath(user.role), { replace: true });
  }, [isAuthenticated, navigate, user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await dispatch(loginUser({ email: email.trim(), password }));
    if (loginUser.fulfilled.match(result)) {
      navigate(AuthViewModel.getDashboardPath(result.payload.user.role), { replace: true });
    }
  };

  return (
    <main className="login-reference-page min-h-screen lg:grid lg:grid-cols-[47%_53%]">
      <section className="login-showcase relative isolate overflow-hidden px-7 py-8 text-white sm:px-12 lg:min-h-0 lg:px-[9%] lg:py-8">
        <div className="showcase-orb showcase-orb-one" />
        <div className="showcase-orb showcase-orb-two" />
        <div className="relative z-10 mx-auto max-w-[600px]">
          <div className="flex items-center gap-4">
            <SpecteraLogo inverse />
          </div>

          <div className="mt-12 sm:mt-16 lg:mt-[clamp(1.5rem,6vh,4rem)]">
            <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-emerald-100/80">MANAGE&nbsp; · &nbsp;ORGANIZE&nbsp; · &nbsp;GROW</p>
            <h1 className="max-w-[520px] text-[2.65rem] font-bold leading-[1.07] tracking-tight sm:text-5xl">Complete Service Operations in <span className="text-emerald-300">One Place</span></h1>
            <p className="mt-5 max-w-[470px] text-[15px] leading-6 text-emerald-50/85 sm:text-base">Streamline your service requests, work orders, technicians, clients and field operations with Spectera CRM.</p>
          </div>

          <div className="mt-7 grid max-w-[490px] grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
            {features.map(({ title, text, icon: Icon, tone }) => (
              <article key={title} className="feature-tile rounded-2xl p-3.5 sm:p-4">
                <div className={`feature-icon feature-icon-${tone}`}><Icon size={23} strokeWidth={2.4} /></div>
                <h2 className="mt-3 text-sm font-semibold sm:text-[15px]">{title}</h2>
                <p className="mt-1 text-xs leading-[1.45] text-emerald-50/75 sm:text-[13px]">{text}</p>
              </article>
            ))}
          </div>

          <div className="dashboard-preview mt-7 hidden max-w-[590px] sm:block" aria-hidden="true">
            <div className="preview-sidebar"><div className="flex items-center gap-2 font-semibold"><SpecteraLogo /></div><div className="preview-nav active">▦ &nbsp; Dashboard</div><div className="preview-nav">▤ &nbsp; Service Requests</div><div className="preview-nav">▣ &nbsp; Work Orders</div><div className="preview-nav">♧ &nbsp; Technicians</div><div className="preview-nav">◎ &nbsp; Clients</div></div>
            <div className="preview-content"><h3>Dashboard</h3><p>Welcome back! Here's what's happening today.</p><div className="preview-stats"><span>24<small>Service Requests</small></span><span>18<small>Work Orders</small></span><span>12<small>Technicians Online</small></span></div><div className="preview-activity"><b>Recent Activities</b><p>✓ &nbsp; New service request #SR-1601</p><p>▣ &nbsp; Work order assigned</p><p>◉ &nbsp; Field photo verified</p></div></div>
          </div>
        </div>
      </section>

      <section className="login-form-side relative flex min-h-0 items-center justify-center overflow-hidden px-5 py-10 sm:px-10 lg:px-[clamp(1.25rem,4vw,3rem)] lg:py-6">
        <div className="login-blob login-blob-top" /><div className="login-blob login-blob-bottom" />
        <div className="relative z-10 w-full max-w-[526px]">
          <div className="login-card rounded-[26px] bg-white px-7 py-7 shadow-[0_20px_70px_rgba(15,23,42,0.09)] sm:px-10 sm:py-8">
            <div className="mb-5 flex justify-center">
              <SpecteraLogo />
            </div>
            <h2 className="text-center text-[30px] font-semibold leading-tight tracking-tight text-slate-900">Log in to your account</h2>
            <p className="mt-2 text-center text-[15px] text-slate-500">Enter your credentials to access your workspace</p>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <label className="block text-sm font-medium text-slate-800">Email Address
                <span className="login-input-wrap mt-2.5"><Mail size={21} /><input type="email" autoComplete="username" required placeholder="your@email.com" value={email} onChange={(event) => setEmail(event.target.value)} /></span>
              </label>
              <label className="block text-sm font-medium text-slate-800">Password
                <span className="mt-2.5 flex items-center justify-between text-sm"><span /><span className="font-medium text-emerald-700">Forgot password?</span></span>
                <span className="login-input-wrap mt-2.5"><LockKeyhole size={21} /><input type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={21} /> : <Eye size={21} />}</button></span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-500"><input className="h-5 w-5 accent-emerald-600" type="checkbox" checked={keepSignedIn} onChange={(event) => setKeepSignedIn(event.target.checked)} />Keep me signed in</label>
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <button type="submit" disabled={loading} className="login-submit flex min-h-[62px] w-full items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-6 text-base font-semibold text-white disabled:cursor-wait disabled:opacity-70">{loading ? "Signing in…" : <>Sign In <ArrowRight size={21} /></>}</button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500 sm:text-sm"><ShieldCheck size={19} className="text-slate-500" />Your data is secure and protected</div>
            <div className="mt-4 text-center"><Link to="/privacy" className="text-xs font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950">Privacy Policy</Link></div>
          </div>
          <div className="nextradev-credit mt-3 flex items-center justify-center gap-2 text-xs text-slate-500"><span>Designed &amp; Developed by</span><span className="nextradev-logo-highlight"><img src="/nextradev-logo.svg" alt="Nextradev Technologies" /></span></div>
        </div>
      </section>
    </main>
  );
}
