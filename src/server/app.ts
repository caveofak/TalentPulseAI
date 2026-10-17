import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const nodemailer = require('nodemailer');

export const app = express();

// Enable JSON & URL-encoded parsing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// CORS configuration for Vercel deployments and preview URLs
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Multer memory storage for parsing uploaded PDF/DOCX buffers directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
    files: 10,
  },
});

// Helper to safely extract text from PDF buffers supporting pdf-parse v1 and v2
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfModule = require('pdf-parse');
  try {
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result?.text || '';
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy().catch(() => {});
        }
      }
    } else if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer);
      return data?.text || '';
    } else if (typeof pdfModule.default === 'function') {
      const data = await pdfModule.default(buffer);
      return data?.text || '';
    }
  } catch (err: any) {
    console.warn('PDF primary parser encountered error, attempting stream text recovery:', err.message);
    const raw = buffer.toString('utf-8');
    const matches = raw.match(/\(([^()]+)\) Tj/g);
    if (matches && matches.length > 0) {
      return matches.map((m: string) => m.replace(/^\(/, '').replace(/\) Tj$/, '')).join(' ');
    }
    throw err;
  }
  throw new Error('Unsupported pdf-parse module structure');
}

// Helper to extract candidate name and contact info from parsed resume text
function extractCandidateMetadata(filename: string, text: string) {
  const cleanNameFromFilename = filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b(resume|cv|curriculum vitae|final|v\d+)\b/gi, '')
    .trim();

  // Try extracting email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  // Try extracting phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Detect likely name from top lines if filename is generic
  let detectedName = cleanNameFromFilename;
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 50 && !l.includes('@') && !l.toLowerCase().includes('resume'));

  if (lines.length > 0 && (!detectedName || detectedName.length < 3)) {
    detectedName = lines[0];
  }

  return {
    candidateName: detectedName || 'Candidate',
    email,
    phone,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    characterCount: text.length,
  };
}

// Helper to create a properly configured Gemini client with required telemetry
function getGeminiClient(customApiKey?: string) {
  return new GoogleGenAI({
    apiKey: customApiKey || process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Built-in sample resumes for instant zero-friction testing
const SAMPLE_CANDIDATES = [
  {
    fileName: 'Alex_Rivera_Staff_Engineer_Resume.pdf',
    candidateName: 'Alex Rivera',
    email: 'alex.rivera.dev@gmail.com',
    phone: '+1 (415) 890-2341',
    extractedText: `Alex Rivera
San Francisco, CA | alex.rivera.dev@gmail.com | +1 (415) 890-2341 | linkedin.com/in/alexrivera-tech

SUMMARY
Principal / Staff Full-Stack Software Engineer with 9+ years architecting high-throughput distributed web systems, real-time collaboration engines, and production AI pipelines. Expert in TypeScript, React 19, Node.js, Golang, PostgreSQL, Docker, and Kubernetes. Led cross-functional squads delivering 99.99% SLA microservices handling 250M daily API requests.

EXPERIENCE
Staff Software Engineer | Veloce Systems | 2021 - Present
- Architected enterprise cloud recruitment platform processing 4.2M candidate profiles annually with zero data corruption.
- Led migration from legacy monolithic Ruby backend to modular Node.js/TypeScript and Go microservices deployed on AWS EKS Kubernetes clusters, lowering p99 API latencies by 64% and cloud hosting costs by $180k/yr.
- Built real-time candidate search engine powered by vector embeddings and Postgres pgvector, delivering sub-40ms semantic candidate queries.
- Spearheaded company-wide engineering mentorship initiative, onboarding 14 senior engineers and defining RFC code review standards.

Senior Full-Stack Engineer | NexusCloud Labs | 2018 - 2021
- Built reactive applicant tracking dashboards using React, Redux Toolkit, Tailwind CSS, and WebSockets for 12,000 active recruiters.
- Implemented automated CI/CD pipelines with GitHub Actions, Jest, and Playwright, achieving 88% test coverage across core microservices.
- Integrated enterprise OAuth2 / SAML SSO and Stripe billing workflows.

EDUCATION & SKILLS
B.S. in Computer Science, UC Berkeley (2018)
Core: TypeScript, JavaScript, Python, Go, React, Next.js, Node.js, Express, PostgreSQL, Redis, Kafka, Docker, Kubernetes, AWS, GraphQL, CI/CD, System Architecture.`,
  },
  {
    fileName: 'Maya_Lin_Product_Engineer_Resume.docx',
    candidateName: 'Maya Lin',
    email: 'maya.lin.tech@outlook.com',
    phone: '+1 (206) 441-9872',
    extractedText: `Maya Lin
Seattle, WA | maya.lin.tech@outlook.com | +1 (206) 441-9872

PROFESSIONAL OBJECTIVE
Enthusiastic Mid-Level Software Engineer with 3 years experience building consumer web applications. Skilled in React, modern JavaScript/TypeScript, CSS, and basic Node.js. Seeking an opportunity to expand into high-scale distributed backend systems.

WORK HISTORY
Frontend Software Engineer | HyperDash Apps | 2022 - Present
- Developed customer-facing analytics dashboards using React, Tailwind CSS, and Chart.js.
- Refactored legacy jQuery modules to modern React hooks, improving client page load by 35%.
- Collaborated with UI/UX designers to implement design system components in Figma and Storybook.
- Participated in sprint planning, agile grooming, and daily standups.

Junior Web Developer | Creativo Digital | 2021 - 2022
- Maintained marketing websites and built REST API integrations in Express.js.
- Designed landing pages with HTML5, CSS3, and responsive flexbox/grid.
- Tested endpoints using Postman and simple Mocha unit tests.

EDUCATION
B.A. in Interactive Media, University of Washington (2021)
Skills: React, JavaScript, TypeScript, HTML/CSS, Tailwind CSS, Git, Express.js, Basic SQL, Agile/Scrum.
Note: Currently completing self-paced Docker and Kubernetes certification.`,
  },
  {
    fileName: 'David_Kowalski_DevOps_Specialist.pdf',
    candidateName: 'David Kowalski',
    email: 'd.kowalski@protonmail.com',
    phone: '+1 (312) 555-0182',
    extractedText: `David Kowalski
Chicago, IL | d.kowalski@protonmail.com | +1 (312) 555-0182

PROFILE
Senior DevOps & Infrastructure Engineer with 7 years specializing in cloud automation, Linux sysadmin, Terraform, AWS, and Kubernetes orchestration. Limited frontend experience; dedicated infrastructure and reliability champion.

EXPERIENCE
Lead Site Reliability Engineer | Ironclad Cloud Corp | 2020 - Present
- Managed multi-region AWS and GCP cloud infrastructure utilizing Terraform, Ansible, and Helm charts.
- Configured automated Kubernetes clusters (EKS/GKE) supporting 40+ containerized microservices.
- Built Datadog and Prometheus/Grafana monitoring, alerting on SLO/SLA violations with automated pager escalation.
- Reduced mean-time-to-recovery (MTTR) by 45% through automated rollback canary deployments in ArgoCD.

Cloud Systems Engineer | Beacon Financial Services | 2017 - 2020
- Automated compliance auditing and VPC network peering with Python and BASH automation scripts.
- Maintained disaster recovery strategies, Postgres database replication, and zero-loss backup protocols.

EDUCATION & CERTS
B.S. in Information Systems, Purdue University (2017)
AWS Certified Solutions Architect - Professional | Certified Kubernetes Administrator (CKA)
Technologies: Kubernetes, Docker, Terraform, AWS, GCP, Linux/Bash, Python, CI/CD, Prometheus, Grafana, PostgreSQL admin.`,
  },
];

// Router that can be accessed via /api/* or /* (Vercel-proof)
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. API: Parse binary resumes (PDF / DOCX / TXT)
apiRouter.post('/parse-resumes', upload.array('resumes', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No resume files received for parsing.' });
    }

    const parsedResults = [];

    for (const file of files) {
      let rawText = '';
      const ext = path.extname(file.originalname).toLowerCase();
      let parseMethod = 'plain-text';

      try {
        if (ext === '.pdf') {
          parseMethod = 'pdf-parse';
          rawText = await extractTextFromPDF(file.buffer);
        } else if (ext === '.docx' || ext === '.doc') {
          parseMethod = 'mammoth-docx';
          const mammothResult = await mammoth.extractRawText({ buffer: file.buffer });
          rawText = mammothResult.value || '';
        } else {
          // Fallback to utf-8 text
          rawText = file.buffer.toString('utf-8');
        }

        // Clean up excessive whitespace while preserving structure
        const sanitizedText = rawText
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        const metadata = extractCandidateMetadata(file.originalname, sanitizedText);

        parsedResults.push({
          id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: ext || file.mimetype,
          parseMethod,
          extractedText: sanitizedText,
          status: 'parsed',
          ...metadata,
        });
      } catch (err: any) {
        console.error(`Error parsing file ${file.originalname}:`, err);
        parsedResults.push({
          id: `cand-err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: ext,
          parseMethod: 'error',
          extractedText: '',
          error: `Failed to extract text: ${err.message}`,
          status: 'failed',
          candidateName: file.originalname.replace(/\.[^/.]+$/, ''),
          email: '',
          phone: '',
          wordCount: 0,
          characterCount: 0,
        });
      }
    }

    return res.json({ success: true, candidates: parsedResults });
  } catch (error: any) {
    console.error('Resume parsing controller failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to process resume files' });
  }
});

// Built-in sample resumes
apiRouter.get('/sample-resumes', (_req: Request, res: Response) => {
  const samples = SAMPLE_CANDIDATES.map((sample, idx) => ({
    id: `sample-cand-${idx + 1}-${Date.now()}`,
    fileName: sample.fileName,
    fileSize: 45000 + idx * 12000,
    fileType: sample.fileName.endsWith('.pdf') ? '.pdf' : '.docx',
    parseMethod: sample.fileName.endsWith('.pdf') ? 'pdf-parse' : 'mammoth-docx',
    extractedText: sample.extractedText,
    status: 'parsed',
    candidateName: sample.candidateName,
    email: sample.email,
    phone: sample.phone,
    wordCount: sample.extractedText.split(/\s+/).filter(Boolean).length,
    characterCount: sample.extractedText.length,
  }));

  return res.json({ success: true, candidates: samples });
});

// 2. AI Processing: Route candidate evaluation to Qwen 2.5/3 or Gemini
apiRouter.post('/analyze-candidate', async (req: Request, res: Response) => {
  const {
    jobDescription,
    candidate,
    aiConfig,
  }: {
    jobDescription: string;
    candidate: { candidateName: string; extractedText: string; fileName: string };
    aiConfig?: {
      provider?: 'qwen' | 'gemini' | 'openai-compatible';
      apiKey?: string;
      endpoint?: string;
      model?: string;
    };
  } = req.body;

  if (!jobDescription || !candidate || !candidate.extractedText) {
    return res.status(400).json({ error: 'Missing jobDescription or candidate extractedText' });
  }

  const prompt = `You are an elite Executive Talent Acquisition AI Agent and Lead Technical Recruiter.
Analyze the following candidate resume thoroughly against the provided Job Description.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
Name/File: ${candidate.candidateName} (${candidate.fileName})
Text:
${candidate.extractedText}

TASK:
Perform a rigorous, objective assessment:
1. Map essential requirements against candidate background.
2. Identify strictly missing skills or technologies required by the role.
3. Identify evidence gaps (e.g. claims without production metrics, vague tenure, lack of scale).
4. Highlight critical verification points / probe questions the recruiter must ask in a 20-minute phone screen.
5. Provide a realistic Fit Score (0-100) and an honest Hire/Interview recommendation.

Return ONLY a valid, raw JSON object (without markdown code blocks, or inside \`\`\`json block) matching this exact schema:
{
  "candidateName": "${candidate.candidateName}",
  "fitScore": 85,
  "matchTier": "Strong Match" | "Potential Match" | "Moderate Fit" | "Low Fit",
  "summary": "2-3 concise sentences summarizing candidate background and fit for this role",
  "matchedSkills": [
    { "skill": "TypeScript / React", "evidence": "Direct quote or proof from resume showing production experience", "proficiency": "High" }
  ],
  "missingSkills": [
    { "skill": "Required skill", "severity": "Critical" | "Moderate" | "Bonus", "notes": "Why this is missing or insufficient" }
  ],
  "evidenceGaps": [
    { "area": "Scale / Volume", "gapDescription": "Resume mentions microservices but gives no request volume or concurrency numbers", "riskLevel": "Medium" }
  ],
  "recruiterVerificationProbes": [
    { "question": "Targeted technical question recruiter should ask during screen", "expectedSignal": "What a genuine candidate answer would sound like", "warningFlag": "Red flag response to watch out for" }
  ],
  "keyStrengths": ["Strength 1 with context", "Strength 2"],
  "seniorityAssessment": "Junior" | "Mid-Level" | "Senior" | "Staff/Lead" | "Overqualified",
  "recommendation": "Advance to Technical Screen" | "Proceed with Phone Screen" | "Request Additional Work/Portfolio" | "Hold / Reject",
  "recommendationRationale": "Detailed explanation of why this recommendation was reached"
}`;

  // Check which provider to use:
  const provider = aiConfig?.provider || 'qwen';
  const apiKey = aiConfig?.apiKey?.trim();
  const endpoint = aiConfig?.endpoint?.trim();
  const modelName = aiConfig?.model?.trim();

  try {
    let rawResponseText = '';

    // If Qwen or custom OpenAI-compatible endpoint with an API key provided
    if (provider === 'qwen' || provider === 'openai-compatible') {
      const targetEndpoint = endpoint || 'https://openrouter.ai/api/v1/chat/completions';
      const targetModel = modelName || 'qwen/qwen-2.5-72b-instruct:free';

      if (apiKey) {
        // Call hosted Qwen API (OpenRouter, Together AI, Groq, etc.)
        const response = await fetch(targetEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'https://aistudio.google.com',
            'X-Title': 'TalentPulse AI Recruitment Agent',
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert AI Recruitment Agent. Return all responses strictly as valid JSON with no conversational text.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Qwen endpoint responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        rawResponseText = data.choices?.[0]?.message?.content || '';
      } else {
        // No custom key supplied for Qwen -> Fall back to built-in Gemini engine seamlessly
        console.log('No external Qwen API key provided. Using built-in Gemini API engine...');
        const ai = getGeminiClient();
        const result = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        rawResponseText = result.text || '';
      }
    } else {
      // Direct Gemini route
      const ai = getGeminiClient(apiKey);
      const result = await ai.models.generateContent({
        model: modelName || 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      rawResponseText = result.text || '';
    }

    // Clean JSON response (remove markdown code blocks if any)
    let cleaned = rawResponseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const evaluation = JSON.parse(cleaned);
    return res.json({
      success: true,
      evaluation,
      modelUsed: apiKey && provider === 'qwen' ? (modelName || 'qwen/qwen-2.5-72b-instruct:free') : 'gemini-3.8-flash (Built-in Active Engine)',
    });
  } catch (error: any) {
    console.error('AI Candidate Analysis failed:', error);
    // If external Qwen call failed, try Gemini as safety net
    try {
      console.log('Retrying with Gemini fallback engine...');
      const ai = getGeminiClient();
      const result = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      const fallbackClean = (result.text || '').replace(/^```json/, '').replace(/```$/, '').trim();
      const evaluation = JSON.parse(fallbackClean);
      return res.json({
        success: true,
        evaluation,
        modelUsed: 'gemini-3.8-flash (Safety Fallback)',
        warning: `Primary endpoint error: ${error.message}. Successfully processed via Gemini fallback.`,
      });
    } catch (fallbackError: any) {
      return res.status(500).json({
        error: error.message || 'AI Candidate Evaluation failed',
        details: fallbackError.message,
      });
    }
  }
});

// 3. API: Email Delivery using Nodemailer / Resend
apiRouter.post('/send-email', async (req: Request, res: Response) => {
  const {
    recipientEmail,
    jobTitle,
    htmlReport,
    candidateCount,
    smtpConfig,
  }: {
    recipientEmail: string;
    jobTitle: string;
    htmlReport: string;
    candidateCount: number;
    smtpConfig?: {
      service?: string;
      host?: string;
      port?: number;
      user?: string;
      pass?: string;
      secure?: boolean;
      resendApiKey?: string;
    };
  } = req.body;

  const targetRecipient = recipientEmail || 'ak46652@gmail.com';

  try {
    // 1. Check if Transactional Resend API key is provided
    if (smtpConfig && smtpConfig.resendApiKey && smtpConfig.resendApiKey.trim()) {
      const resendKey = smtpConfig.resendApiKey.trim();
      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'TalentPulse AI <onboarding@resend.dev>',
          to: [targetRecipient],
          subject: `🎯 Recruiter Dossier: ${candidateCount} Candidate Evaluation(s) for ${jobTitle || 'Open Position'}`,
          html: htmlReport,
        }),
      });

      if (!resendResp.ok) {
        const resendErr = await resendResp.text();
        throw new Error(`Resend API delivery error (${resendResp.status}): ${resendErr}`);
      }

      const resendData = await resendResp.json();
      return res.json({
        success: true,
        messageId: resendData.id || `resend-${Date.now()}`,
        recipient: targetRecipient,
        mode: 'Resend Transactional HTTPS API',
        deliveryMethod: 'real_resend',
        isRealInboxDelivery: true,
        sentAt: new Date().toISOString(),
        note: `Transmitted directly to ${targetRecipient} inbox via Resend API.`,
      });
    }

    let transporter;
    let isTestAccount = false;
    let isRealInboxDelivery = false;
    let previewUrl: string | false = false;
    let mode = 'Direct SMTP';

    // 2. Check if Gmail or custom SMTP is provided
    if (smtpConfig && smtpConfig.user && smtpConfig.pass) {
      isRealInboxDelivery = true;
      const cleanPass = smtpConfig.pass.replace(/\s+/g, '');

      if (smtpConfig.service === 'gmail' || smtpConfig.host?.includes('gmail')) {
        mode = 'Gmail App Password (Nodemailer)';
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpConfig.user.trim(),
            pass: cleanPass,
          },
        });
      } else {
        mode = `Custom SMTP (${smtpConfig.host || 'smtp'})`;
        transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port || 587,
          secure: smtpConfig.secure ?? false,
          auth: {
            user: smtpConfig.user.trim(),
            pass: cleanPass,
          },
        });
      }
    } else {
      // 3. Fallback: Ethereal test account or stream transport
      try {
        const testAccount = await Promise.race([
          nodemailer.createTestAccount(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Ethereal setup timeout')), 3000)),
        ]);
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        isTestAccount = true;
        mode = 'Ethereal Test Sandbox';
      } catch (e) {
        transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'windows',
        });
        mode = 'Stream In-Memory Transport';
      }
    }

    const mailOptions = {
      from: '"TalentPulse AI Recruitment Agent" <recruiter-agent@talentpulse.ai>',
      to: targetRecipient,
      subject: `🎯 Recruiter Dossier: ${candidateCount} Candidate Evaluation(s) for ${jobTitle || 'Open Position'}`,
      html: htmlReport,
      text: `TalentPulse AI Recruitment Report for ${jobTitle}. Evaluated ${candidateCount} candidates. Please view the HTML version for the complete recruiter-ready dashboard.`,
    };

    const info = await transporter.sendMail(mailOptions);

    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return res.json({
      success: true,
      messageId: info.messageId || `msg-${Date.now()}`,
      recipient: targetRecipient,
      previewUrl: previewUrl || null,
      mode,
      deliveryMethod: isRealInboxDelivery ? 'real_smtp' : 'sandbox_ethereal',
      isRealInboxDelivery,
      sentAt: new Date().toISOString(),
      note: isRealInboxDelivery
        ? `Delivered directly to ${targetRecipient} inbox via ${mode}.`
        : `Simulated via Nodemailer test sandbox. To receive directly in your Gmail inbox (${targetRecipient}), use 1-Click Gmail or provide a Gmail App Password / Resend Key in Settings.`,
    });
  } catch (error: any) {
    console.error('Email dispatch failed:', error);
    return res.status(500).json({
      error: error.message || 'Failed to dispatch email via Nodemailer',
    });
  }
});

// Mount the apiRouter at both /api and root to guarantee compatibility with all Vercel rewrite patterns
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
