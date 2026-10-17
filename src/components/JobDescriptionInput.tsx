import React, { useState } from 'react';
import { Briefcase, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';

interface JobDescriptionInputProps {
  value: string;
  onChange: (val: string) => void;
  jobTitle: string;
  onJobTitleChange: (title: string) => void;
  disabled?: boolean;
}

const PRESET_JDS = [
  {
    title: 'Staff Full-Stack Engineer',
    preview: 'Distributed Systems, TypeScript, React 19, Go/Node.js, Kubernetes',
    content: `Title: Staff Full-Stack Software Engineer
Department: Core Infrastructure & Applications
Location: San Francisco, CA / Remote (US)

Role Summary:
We are looking for a Staff Full-Stack Engineer to lead the architectural evolution of our mission-critical distributed platform. In this role, you will design, scale, and build resilient microservices handling millions of daily requests while elevating our client application experience.

Core Responsibilities:
- Architect, build, and maintain high-throughput distributed microservices in TypeScript/Node.js and Go.
- Lead the architecture of modern web frontends using React 19, TypeScript, and responsive modern CSS.
- Own production cloud infrastructure on Kubernetes (EKS/GKE), ensuring 99.99% availability, automated failovers, and robust observability.
- Partner with product managers and engineering leaders to translate ambiguous business goals into clear technical roadmaps.
- Drive engineering excellence, system design reviews, and mentor senior and mid-level engineers.

Required Qualifications & Skills:
- 7+ years of professional full-stack software engineering experience.
- Deep hands-on proficiency with TypeScript, modern React, and backend runtimes (Node.js, Express, or Go).
- Proven track record running containerized microservices in production on Kubernetes and Docker.
- Strong relational database modeling with PostgreSQL and caching layers with Redis.
- Demonstrated experience designing asynchronous event pipelines (Kafka, RabbitMQ, or SQS).
- Excellent communication skills and proven ability to write comprehensive RFCs and technical documentation.`,
  },
  {
    title: 'Lead AI/ML Systems Engineer',
    preview: 'LLMs, PyTorch, Agent Pipelines, Vector DBs, FastAPI, GPU Infra',
    content: `Title: Lead AI/ML Systems Engineer
Department: Autonomous AI Systems
Location: New York, NY / Hybrid

Role Summary:
Join our AI team to build and scale production neural agent pipelines, LLM fine-tuning pipelines, and low-latency inference services.

Required Qualifications & Skills:
- 5+ years of software engineering experience with at least 3 years focused on production ML/AI systems.
- Deep expertise in Python, PyTorch, LangChain/LlamaIndex, and modern AI SDKs (Google GenAI, OpenAI, HuggingFace).
- Experience deploying and orchestrating open-weights models (Qwen 2.5/3, Llama 3) via vLLM, TensorRT-LLM, or Triton Inference Server.
- Hands-on expertise with vector search databases (Pinecone, Qdrant, Milvus, or pgvector).
- Production experience with Docker, Kubernetes, and GPU orchestration on AWS or GCP.
- Understanding of LLM evaluation benchmarks, RAG retrieval optimization, and hallucination guardrails.`,
  },
  {
    title: 'Senior DevOps & SRE Specialist',
    preview: 'Kubernetes, Terraform, AWS, Prometheus, CI/CD, Disaster Recovery',
    content: `Title: Senior Site Reliability Engineer (SRE)
Department: Cloud Platform & Reliability
Location: Austin, TX / Remote

Required Qualifications & Skills:
- 5+ years supporting mission-critical 24/7 cloud infrastructure in AWS or GCP.
- Production mastery of Kubernetes cluster administration (EKS, GKE), Helm, and service meshes (Istio/Linkerd).
- Advanced Infrastructure as Code (IaC) with Terraform and Ansible.
- Experience building comprehensive observability stacks using Prometheus, Grafana, Datadog, and OpenTelemetry.
- Deep understanding of Linux kernel tuning, networking (BGP, DNS, VPC peering), and zero-trust security.
- Track record establishing SLOs/SLIs, incident post-mortems, and automated canary deployments.`,
  },
];

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  value,
  onChange,
  jobTitle,
  onJobTitleChange,
  disabled = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleSelectPreset = (preset: typeof PRESET_JDS[0]) => {
    setSelectedPreset(preset.title);
    onJobTitleChange(preset.title);
    onChange(preset.content);
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      {/* Title & Presets Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Job Description (Target Role)</h2>
            <p className="text-xs text-slate-500">Provide the requirements the AI agent will benchmark against</p>
          </div>
        </div>

        {value && !disabled && (
          <button
            onClick={() => {
              onChange('');
              setSelectedPreset(null);
            }}
            className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Preset Pill Buttons */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Quick Benchmark Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_JDS.map((preset) => (
            <button
              key={preset.title}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(preset)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedPreset === preset.title
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200'
              }`}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Job Title Input */}
      <div className="mb-2">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Position Title
        </label>
        <input
          type="text"
          value={jobTitle}
          disabled={disabled}
          onChange={(e) => onJobTitleChange(e.target.value)}
          placeholder="e.g. Staff Full-Stack Software Engineer"
          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 font-medium text-slate-800"
        />
      </div>

      {/* Text Area */}
      <div className="relative flex-1 flex flex-col min-h-[220px]">
        <textarea
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedPreset(null);
          }}
          placeholder="Paste candidate requirements, required technologies, experience levels, and role deliverables here..."
          className="w-full flex-1 p-3 text-xs leading-relaxed border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-slate-700 bg-white"
        />
        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
          <span>{wordCount} words • {value.length} characters</span>
          {value.length > 50 && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for AI Mapping
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
