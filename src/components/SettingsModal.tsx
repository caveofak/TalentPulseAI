import React, { useState } from 'react';
import {
  Settings,
  X,
  Key,
  Mail,
  Cpu,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Server,
  HelpCircle,
  Send,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { AIConfig, SMTPConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIConfig;
  onSaveAIConfig: (cfg: AIConfig) => void;
  recipientEmail: string;
  onSaveRecipientEmail: (email: string) => void;
  smtpConfig: SMTPConfig;
  onSaveSMTPConfig: (smtp: SMTPConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiConfig,
  onSaveAIConfig,
  recipientEmail,
  onSaveRecipientEmail,
  smtpConfig,
  onSaveSMTPConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'email'>('email');

  // AI Form state
  const [provider, setProvider] = useState<'qwen' | 'gemini' | 'openai-compatible'>(
    aiConfig.provider || 'qwen'
  );
  const [apiKey, setApiKey] = useState(aiConfig.apiKey || '');
  const [endpoint, setEndpoint] = useState(
    aiConfig.endpoint || 'https://openrouter.ai/api/v1/chat/completions'
  );
  const [model, setModel] = useState(aiConfig.model || 'qwen/qwen-2.5-72b-instruct:free');

  // Email form state
  const [targetEmail, setTargetEmail] = useState(recipientEmail || 'ak46652@gmail.com');
  const [emailService, setEmailService] = useState<'gmail' | 'resend' | 'custom' | 'sandbox'>(
    smtpConfig.resendApiKey
      ? 'resend'
      : smtpConfig.user && (smtpConfig.host?.includes('gmail') || smtpConfig.service === 'gmail')
      ? 'gmail'
      : smtpConfig.host
      ? 'custom'
      : 'gmail'
  );

  const [resendApiKey, setResendApiKey] = useState(smtpConfig.resendApiKey || '');
  const [smtpHost, setSmtpHost] = useState(smtpConfig.host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(smtpConfig.port || 587);
  const [smtpUser, setSmtpUser] = useState(smtpConfig.user || targetEmail || 'ak46652@gmail.com');
  const [smtpPass, setSmtpPass] = useState(smtpConfig.pass || '');
  const [smtpSecure, setSmtpSecure] = useState(smtpConfig.secure || false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveAIConfig({
      provider,
      apiKey: apiKey.trim(),
      endpoint: endpoint.trim(),
      model: model.trim(),
    });

    onSaveRecipientEmail(targetEmail.trim());

    if (emailService === 'resend') {
      onSaveSMTPConfig({
        service: 'resend',
        resendApiKey: resendApiKey.trim(),
        host: '',
        port: 587,
        user: '',
        pass: '',
        secure: false,
      });
    } else if (emailService === 'gmail') {
      onSaveSMTPConfig({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        secure: true,
      });
    } else if (emailService === 'custom') {
      onSaveSMTPConfig({
        service: 'custom',
        host: smtpHost.trim(),
        port: Number(smtpPort),
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        secure: smtpSecure,
      });
    } else {
      onSaveSMTPConfig({
        service: undefined,
        host: '',
        port: 587,
        user: '',
        pass: '',
        secure: false,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestEmailDispatch = async () => {
    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const activeSmtpConfig: SMTPConfig = {
        service: emailService === 'resend' ? 'resend' : emailService === 'gmail' ? 'gmail' : 'custom',
        resendApiKey: emailService === 'resend' ? resendApiKey.trim() : undefined,
        host: emailService === 'gmail' ? 'smtp.gmail.com' : smtpHost.trim(),
        port: emailService === 'gmail' ? 465 : Number(smtpPort),
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        secure: emailService === 'gmail' ? true : smtpSecure,
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: targetEmail.trim(),
          jobTitle: 'TalentPulse Email Delivery Verification',
          htmlReport: `<div style="font-family:sans-serif;padding:20px;background:#f8fafc;border-radius:10px;">
            <h2 style="color:#1e1b4b;">🎉 TalentPulse AI Email Verification</h2>
            <p>This test email confirms your real email delivery configuration is working perfectly!</p>
            <p>Target: <strong>${targetEmail.trim()}</strong></p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>`,
          candidateCount: 1,
          smtpConfig: emailService === 'sandbox' ? undefined : activeSmtpConfig,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch test email');
      }

      setTestResult({
        success: true,
        message: data.isRealInboxDelivery
          ? `✓ Real Email Delivered to ${targetEmail} via ${data.mode}!`
          : `✓ Tested via Sandbox (${data.mode}). For direct inbox delivery, configure Gmail App Password or Resend API key.`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Error: ${err.message}`,
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const setQwenPreset = (presetName: 'openrouter' | 'together' | 'groq' | 'gemini') => {
    if (presetName === 'openrouter') {
      setProvider('qwen');
      setEndpoint('https://openrouter.ai/api/v1/chat/completions');
      setModel('qwen/qwen-2.5-72b-instruct:free');
    } else if (presetName === 'together') {
      setProvider('qwen');
      setEndpoint('https://api.together.xyz/v1/chat/completions');
      setModel('Qwen/Qwen2.5-72B-Instruct');
    } else if (presetName === 'groq') {
      setProvider('qwen');
      setEndpoint('https://api.groq.com/openai/v1/chat/completions');
      setModel('qwen-2.5-32b');
    } else if (presetName === 'gemini') {
      setProvider('gemini');
      setEndpoint('');
      setModel('gemini-3.8-flash');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Pipeline Configuration & Credentials</h3>
              <p className="text-xs text-slate-400">Configure Qwen 2.5/3 neural routing and email delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'email'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Email Delivery to Gmail (Step 5)
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            AI Model Engine (Qwen 2.5/3)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'email' ? (
            <div className="space-y-4">
              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Recruiter Email Address
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => {
                    setTargetEmail(e.target.value);
                    if (!smtpUser || smtpUser === 'ak46652@gmail.com') {
                      setSmtpUser(e.target.value);
                    }
                  }}
                  placeholder="ak46652@gmail.com"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              {/* Email Delivery Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Choose Real Inbox Delivery Method:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailService('gmail')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      emailService === 'gmail'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-600">Gmail App Password</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        Direct
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Sends directly to your Gmail inbox via Nodemailer
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailService('resend')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      emailService === 'resend'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-600">Resend API Key</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                        Cloud
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Fast HTTPS transactional delivery (zero SMTP blocks)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailService('custom')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      emailService === 'custom'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-700">Custom SMTP Server</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Outlook, Yahoo, SendGrid, or private mail server
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailService('sandbox')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      emailService === 'sandbox'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-700">Sandbox + 1-Click Send</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Opens Gmail Web / .eml export without any credentials
                    </div>
                  </button>
                </div>
              </div>

              {/* METHOD 1: Gmail App Password Form */}
              {emailService === 'gmail' && (
                <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-rose-900 font-medium">
                    <Inbox className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>How to deliver directly to {targetEmail}:</strong>
                      <p className="text-[11px] text-rose-800/90 mt-0.5 leading-relaxed">
                        Google requires a 16-character <em>App Password</em> instead of your regular password.
                        <br />
                        1. Visit{' '}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-bold text-rose-700"
                        >
                          Google Account &rarr; App Passwords <ExternalLink className="inline w-3 h-3" />
                        </a>
                        <br />
                        2. Name it "TalentPulse" and paste the 16 letters below:
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gmail Address</label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="ak46652@gmail.com"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      16-Character Gmail App Password
                    </label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="abcd efgh ijkl mnop (spaces will be stripped automatically)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* METHOD 2: Resend API Key */}
              {emailService === 'resend' && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-indigo-900 font-medium">
                    <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Resend Cloud Transactional Delivery:</strong>
                      <p className="text-[11px] text-indigo-800/90 mt-0.5 leading-relaxed">
                        Get a free key in 10 seconds from{' '}
                        <a
                          href="https://resend.com/api-keys"
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-bold text-indigo-700"
                        >
                          resend.com/api-keys <ExternalLink className="inline w-3 h-3" />
                        </a>{' '}
                        to deliver directly to {targetEmail} with 100% cloud reliability.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Resend API Key</label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder="re_123456789..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* METHOD 3: Custom SMTP Form */}
              {emailService === 'custom' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block font-medium text-slate-600 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.office365.com"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Port</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">SMTP Username / Email</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="user@domain.com"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Live Test Email Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isTestingEmail}
                  onClick={handleTestEmailDispatch}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isTestingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Test Verification Email
                </button>

                {testResult && (
                  <div
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      testResult.success ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate max-w-[280px]">{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Presets banner */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Provider Preset:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQwenPreset('openrouter')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      endpoint.includes('openrouter')
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">OpenRouter (Free Tier)</div>
                    <div className="text-[11px] text-slate-500">qwen/qwen-2.5-72b-instruct:free</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQwenPreset('together')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      endpoint.includes('together')
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Together AI</div>
                    <div className="text-[11px] text-slate-500">Qwen/Qwen2.5-72B-Instruct</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQwenPreset('groq')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      endpoint.includes('groq')
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Groq Cloud</div>
                    <div className="text-[11px] text-slate-500">qwen-2.5-32b (Ultra-fast)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQwenPreset('gemini')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      provider === 'gemini'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Gemini Flash (Built-in)</div>
                    <div className="text-[11px] text-slate-500">gemini-3.8-flash Active Engine</div>
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    API Key
                  </label>
                  <span className="text-[11px] text-indigo-600 hover:underline">
                    {endpoint.includes('openrouter') && (
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1"
                      >
                        Get Free OpenRouter Key <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </span>
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    provider === 'gemini'
                      ? 'Preconfigured in environment (or paste custom key)'
                      : 'sk-or-v1-... (Paste your free Qwen / OpenRouter API Key)'
                  }
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/60"
                />
              </div>

              {/* Endpoint */}
              {provider !== 'gemini' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    API Base Endpoint
                  </label>
                  <input
                    type="text"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="https://openrouter.ai/api/v1/chat/completions"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/60"
                  />
                </div>
              )}

              {/* Model Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Neural Model Name
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="qwen/qwen-2.5-72b-instruct:free"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/60"
                />
              </div>

              {/* Security Note */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Privacy & Evaluation Security:</span> Candidate resumes
                  are parsed in-memory and processed strictly for matching requirements, identifying
                  missing skills, and highlighting evidence gaps.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
