import React, { useState } from 'react';
import { Sun, Moon, ArrowRight, Mail, Lock, User as UserIcon, UserPlus, LogIn } from 'lucide-react';
import {
  AuthViewMode,
  RegisteredWorkspaceAccount,
  WorkspaceUserProfile,
  validateEmailLoginInput,
  validateEmailSignUpInput,
  createGoogleDemoUserProfile,
} from '../utils/notesLogic';

interface LoginViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
  registeredAccounts?: RegisteredWorkspaceAccount[];
  onRegisterAccount?: (updatedAccounts: RegisteredWorkspaceAccount[]) => void;
  onLoginSuccess: (profile: WorkspaceUserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  isDark,
  onToggleTheme,
  registeredAccounts = [],
  onRegisterAccount,
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<AuthViewMode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const switchMode = (nextMode: AuthViewMode) => {
    setAuthMode(nextMode);
    setErrorMessage(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === 'signup') {
      const signUpResult = validateEmailSignUpInput(
        displayName,
        email,
        password,
        confirmPassword,
        registeredAccounts
      );
      if (!signUpResult.ok || !signUpResult.profile) {
        setErrorMessage(signUpResult.error || 'Unable to create your account.');
        return;
      }
      if (onRegisterAccount) {
        onRegisterAccount(signUpResult.updatedAccounts);
      }
      setErrorMessage(null);
      onLoginSuccess(signUpResult.profile);
      return;
    }

    const signInResult = validateEmailLoginInput(
      email,
      password,
      displayName,
      registeredAccounts
    );
    if (!signInResult.ok || !signInResult.profile) {
      setErrorMessage(signInResult.error || 'Invalid login credentials.');
      return;
    }
    setErrorMessage(null);
    onLoginSuccess(signInResult.profile);
  };

  const handleGoogleAuth = () => {
    setErrorMessage(null);
    const profile = createGoogleDemoUserProfile(
      email.includes('@') ? email : undefined,
      displayName || undefined
    );
    onLoginSuccess({
      ...profile,
      isNewUser: authMode === 'signup',
    });
  };

  const handleGuestLogin = () => {
    setErrorMessage(null);
    onLoginSuccess({
      name: 'Guest Writer',
      email: 'guest@vibenotes.local',
      provider: 'guest',
      signedInAt: new Date().toISOString(),
    });
  };

  const isSignUp = authMode === 'signup';

  return (
    <div className="min-h-[100dvh] w-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between overflow-y-auto smooth-touch-scroll">
      {/* Top Bar Contract (3 zones) */}
      <header className="flex items-center justify-between gap-8 px-6 sm:px-10 py-4 border-b-[1.5px] border-[var(--ink)] bg-[var(--bg)] shrink-0">
        <a
          href="#login"
          onClick={(e) => e.preventDefault()}
          className="brand text-2xl text-[var(--ink)] whitespace-nowrap shrink-0"
        >
          VibeNotes
        </a>

        <nav
          aria-label="Login navigation"
          className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-[0.05em] text-[var(--ink-medium)]"
        >
          <span className="whitespace-nowrap shrink-0">Local-First Markdown</span>
          <span className="whitespace-nowrap shrink-0">Split Scroll Sync</span>
          <span className="whitespace-nowrap shrink-0">Version History</span>
          <span className="whitespace-nowrap shrink-0">PDF &amp; Keep Export</span>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--ink)] text-xs font-mono uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Editorial Authentication Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 border-[1.5px] border-[var(--ink)] bg-[var(--surface)] shadow-sm">
          {/* Left Column: Editorial Manifesto & Workspace Highlights */}
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 border-b-[1.5px] lg:border-b-0 lg:border-r-[1.5px] border-[var(--ink)] flex flex-col justify-between bg-[var(--bg)]">
            <div className="space-y-6">
              <div className="editorial-label">
                Personal Markdown &amp; Bookmark Studio
              </div>
              <h1 className="text-3xl sm:text-5xl font-semibold text-[var(--ink)] font-display leading-[1.12] tracking-tight">
                {isSignUp
                  ? 'Start Your Personal Knowledge Base.'
                  : 'Think It. Write It. Organize Locally.'}
              </h1>
              <p className="text-sm sm:text-base text-[var(--ink-medium)] leading-relaxed max-w-md">
                {isSignUp
                  ? 'Create a new VibeNotes workspace profile in seconds. Your notes, custom filters, and version snapshots are stored directly in your browser with zero latency.'
                  : 'Sign in with your Email or Google Account to access your personal workspace. All notes, custom tags, and version snapshots are persisted instantaneously.'}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--ink-faint)] space-y-3">
              <div className="editorial-label">Workspace Capabilities</div>
              <div className="grid grid-cols-2 gap-3 text-xs text-[var(--ink)] font-mono">
                <div>01. Zero-Latency Local Save</div>
                <div>02. Split-View Scroll Sync</div>
                <div>03. 10-Step Version History</div>
                <div>04. A4 PDF &amp; Keep Export</div>
              </div>
            </div>
          </div>

          {/* Right Column: Notion-Style Sign In / Sign Up Panel */}
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-[var(--surface)]">
            {/* Notion-Inspired Segmented Mode Switcher (Sign In vs. Sign Up) */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="grid grid-cols-2 p-1 mb-6 bg-[var(--bg)] border border-[var(--ink)]"
            >
              <button
                type="button"
                role="tab"
                data-testid="auth-tab-signin"
                aria-selected={!isSignUp}
                onClick={() => switchMode('signin')}
                className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-mono uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                  !isSignUp
                    ? 'bg-[var(--ink)] text-[var(--bg)] font-bold shadow-xs'
                    : 'bg-transparent text-[var(--ink-medium)] hover:text-[var(--ink)]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                role="tab"
                data-testid="auth-tab-signup"
                aria-selected={isSignUp}
                onClick={() => switchMode('signup')}
                className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-mono uppercase tracking-wider cursor-pointer whitespace-nowrap ${
                  isSignUp
                    ? 'bg-[var(--ink)] text-[var(--bg)] font-bold shadow-xs'
                    : 'bg-transparent text-[var(--ink-medium)] hover:text-[var(--ink)]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up (New User)</span>
              </button>
            </div>

            <div className="mb-5">
              <div className="editorial-label mb-1">
                {isSignUp ? 'New User Registration' : 'Existing Workspace Access'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--ink)] font-display">
                {isSignUp ? 'Create your VibeNotes account' : 'Sign in to VibeNotes'}
              </h2>
            </div>

            {/* Google Account Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              aria-label={
                isSignUp ? 'Sign up with Google Account' : 'Continue with Google Account'
              }
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-[1.5px] border-[var(--ink)] bg-[var(--bg)] hover:bg-[var(--ink)] hover:text-[var(--bg)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.81-1.5 3.34-3.2 4.37v3.62h5.18c3.03-2.79 4.78-6.9 4.78-11.72 0-.8-.08-1.57-.23-2.3z"
                />
                <path
                  fill="currentColor"
                  d="M12.18 22c4.32 0 7.95-1.43 10.6-3.88l-5.18-3.62c-1.43.96-3.26 1.53-5.42 1.53-4.17 0-7.7-2.81-8.96-6.59H-.13v3.73C2.51 18.42 7 22 12.18 22z"
                />
                <path
                  fill="currentColor"
                  d="M3.22 13.44a9.62 9.62 0 0 1 0-6.08V3.63H-.13a11.98 11.98 0 0 0 0 10.74l3.35-2.93z"
                />
                <path
                  fill="currentColor"
                  d="M12.18 4.77c2.35 0 4.46.81 6.12 2.4l4.59-4.59C20.12.98 16.5 0 12.18 0 7 0 2.51 3.58-.13 8.83l3.35 2.93c1.26-3.78 4.79-6.99 8.96-6.99z"
                />
              </svg>
              <span>
                {isSignUp ? 'Sign Up with Google Account' : 'Continue with Google Account'}
              </span>
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--ink-faint)]" />
              <span className="editorial-label !text-[0.58rem]">
                {isSignUp ? 'Or Sign Up with Email' : 'Or Sign In with Email'}
              </span>
              <div className="h-px flex-1 bg-[var(--ink-faint)]" />
            </div>

            {/* Email Sign-In / Sign-Up Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3.5" noValidate>
              <div>
                <label
                  htmlFor="login-display-name"
                  className="block editorial-label !text-[0.6rem] mb-1.5"
                >
                  {isSignUp ? 'Full Name *' : 'Display Name (Optional)'}
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-[var(--ink-medium)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={isSignUp ? 'Enter your full name (e.g. Alex Rivera)' : 'e.g. Hoang Nguyen'}
                    required={isSignUp}
                    className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg)] border border-[var(--ink)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-medium)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-email"
                  className="block editorial-label !text-[0.6rem] mb-1.5"
                >
                  {isSignUp ? 'Work or Personal Email *' : 'Email Address *'}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[var(--ink-medium)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg)] border border-[var(--ink)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-medium)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block editorial-label !text-[0.6rem] mb-1.5"
                >
                  {isSignUp ? 'Create Password *' : 'Password *'}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[var(--ink-medium)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="At least 4 characters"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg)] border border-[var(--ink)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-medium)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                  />
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label
                    htmlFor="login-confirm-password"
                    className="block editorial-label !text-[0.6rem] mb-1.5"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[var(--ink-medium)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Re-enter your password"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg)] border border-[var(--ink)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-medium)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <p
                  role="alert"
                  className="text-xs font-mono text-[#ff4444] border border-[#ff4444] bg-[#ff4444]/5 px-3 py-2"
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                data-testid="auth-submit-button"
                aria-label={isSignUp ? 'Create VibeNotes Account' : 'Sign In with Email'}
                className="btn-editorial-primary w-full flex items-center justify-center gap-2 !py-3 cursor-pointer"
              >
                <span>
                  {isSignUp ? 'Create VibeNotes Account' : 'Sign In with Email'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Notion-Style Bottom Mode Toggle + Guest Access */}
            <div className="mt-5 pt-4 border-t border-[var(--ink-faint)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-medium)]">
                  {isSignUp
                    ? 'Already have a VibeNotes account?'
                    : 'New to VibeNotes?'}
                </span>
                <button
                  type="button"
                  data-testid={
                    isSignUp ? 'auth-switch-to-signin' : 'auth-switch-to-signup'
                  }
                  onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                  className="font-mono text-xs uppercase tracking-wider font-bold text-[var(--ink)] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                >
                  {isSignUp ? 'Sign In Instead' : 'Sign Up — New User'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[var(--ink-medium)]">
                  Want to explore without an account?
                </span>
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  aria-label="Continue as Guest"
                  className="font-mono text-xs uppercase tracking-wider text-[var(--ink)] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="px-6 sm:px-10 py-3 border-t-[1.5px] border-[var(--ink)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="editorial-label !text-[0.6rem]">
          VibeNotes Studio · LocalStorage Persistence
        </div>
        <div className="editorial-label !text-[0.6rem]">
          {registeredAccounts.length > 0
            ? `${registeredAccounts.length} Local Account(s) Registered · View-Level Auth`
            : 'View-Level Authentication Preview'}
        </div>
      </footer>
    </div>
  );
};

