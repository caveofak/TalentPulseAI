import { ParsedCandidate } from '../types';

export function generateRecruiterHTMLReport(
  jobTitle: string,
  jobDescription: string,
  candidates: ParsedCandidate[],
  timestamp: string = new Date().toLocaleString()
): string {
  const evaluatedCandidates = candidates.filter((c) => c.evaluation);
  const sortedCandidates = [...evaluatedCandidates].sort(
    (a, b) => (b.evaluation?.fitScore || 0) - (a.evaluation?.fitScore || 0)
  );

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Strong Match':
        return '#059669';
      case 'Potential Match':
        return '#2563eb';
      case 'Moderate Fit':
        return '#d97706';
      default:
        return '#dc2626';
    }
  };

  const candidateCardsHTML = sortedCandidates
    .map((candidate, idx) => {
      const evalData = candidate.evaluation!;
      const tierColor = getTierColor(evalData.matchTier);

      const matchedSkillsList = evalData.matchedSkills
        ?.map(
          (m) => `
        <li style="margin-bottom: 8px; line-height: 1.4;">
          <strong style="color: #065f46;">${m.skill}</strong>
          <div style="font-size: 13px; color: #4b5563; margin-top: 2px; font-style: italic;">"${m.evidence}"</div>
        </li>`
        )
        .join('') || '<li style="color:#6b7280;">No explicit matches tagged.</li>';

      const missingSkillsList = evalData.missingSkills
        ?.map(
          (m) => `
        <li style="margin-bottom: 8px; line-height: 1.4;">
          <strong style="color: #991b1b;">${m.skill}</strong> 
          <span style="display: inline-block; font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-weight: 600; margin-left: 4px;">${m.severity}</span>
          <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${m.notes}</div>
        </li>`
        )
        .join('') || '<li style="color:#6b7280;">No severe gaps detected.</li>';

      const evidenceGapsList = evalData.evidenceGaps
        ?.map(
          (g) => `
        <li style="margin-bottom: 8px; line-height: 1.4;">
          <strong style="color: #b45309;">${g.area}</strong> 
          <span style="font-size: 11px; padding: 1px 6px; border-radius: 4px; background: #fef3c7; color: #92400e;">${g.riskLevel} Risk</span>
          <div style="font-size: 13px; color: #4b5563; margin-top: 2px;">${g.gapDescription}</div>
        </li>`
        )
        .join('') || '<li style="color:#6b7280;">Evidence adequately substantiated.</li>';

      const verificationQuestionsList = evalData.recruiterVerificationProbes
        ?.map(
          (p, qIdx) => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
          <div style="font-weight: 600; color: #1e293b; font-size: 14px;">Q${qIdx + 1}: ${p.question}</div>
          <div style="margin-top: 6px; font-size: 13px; color: #047857;">
            <strong>✓ Expected Signal:</strong> ${p.expectedSignal}
          </div>
          <div style="margin-top: 4px; font-size: 13px; color: #b91c1c;">
            <strong>⚠ Warning Flag:</strong> ${p.warningFlag}
          </div>
        </div>`
        )
        .join('') || '<p style="color:#6b7280;">No specific probes generated.</p>';

      const strengthsList = evalData.keyStrengths
        ?.map((s) => `<li style="margin-bottom: 4px; color: #1f2937;">${s}</li>`)
        .join('') || '';

      return `
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Candidate Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #111827; color: #ffffff; font-size: 12px; font-weight: 700; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;">#${idx + 1}</span>
              <h3 style="margin: 0; font-size: 20px; color: #111827; font-weight: 700;">${candidate.candidateName}</h3>
            </div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
              ${candidate.email ? `<span>✉ ${candidate.email}</span> &nbsp;|&nbsp; ` : ''}
              ${candidate.phone ? `<span>☎ ${candidate.phone}</span> &nbsp;|&nbsp; ` : ''}
              <span>Source: ${candidate.fileName} (${candidate.parseMethod})</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background: ${tierColor}15; color: ${tierColor}; font-weight: 700; font-size: 14px; border: 1px solid ${tierColor}30;">
              ${evalData.fitScore}% • ${evalData.matchTier}
            </div>
            <div style="font-size: 12px; color: #4b5563; margin-top: 4px; font-weight: 600;">
              Assessment: ${evalData.seniorityAssessment} Level
            </div>
          </div>
        </div>

        <!-- Executive Summary & Recommendation -->
        <div style="background: #f9fafb; border-radius: 8px; padding: 14px; margin-bottom: 16px; border-left: 4px solid ${tierColor};">
          <div style="font-size: 14px; color: #374151; line-height: 1.5; margin-bottom: 8px;">
            <strong>Executive Profile:</strong> ${evalData.summary}
          </div>
          <div style="font-size: 13px; color: #1f2937;">
            <strong>Recommendation:</strong> <span style="font-weight: 700; color: ${tierColor};">${evalData.recommendation}</span> — ${evalData.recommendationRationale}
          </div>
        </div>

        <!-- Two Column Breakdown -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
              <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #047857; display: flex; align-items: center; gap: 6px;">
                ✓ Verified Matched Skills (${evalData.matchedSkills?.length || 0})
              </h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                ${matchedSkillsList}
              </ul>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
              <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #b91c1c; display: flex; align-items: center; gap: 6px;">
                ✗ Missing / Under-Evidenced Skills (${evalData.missingSkills?.length || 0})
              </h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                ${missingSkillsList}
              </ul>
            </td>
          </tr>
        </table>

        <!-- Evidence Gaps & Key Strengths -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309;">
                ⚠ Evidence Gaps & Ambiguities
              </h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                ${evidenceGapsList}
              </ul>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #1e40af;">
                ★ Key Differentiators & Strengths
              </h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                ${strengthsList}
              </ul>
            </td>
          </tr>
        </table>

        <!-- Recruiter Phone-Screen Verification Guide -->
        <div style="margin-top: 16px; border-top: 1px dashed #e5e7eb; padding-top: 16px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em;">
            📋 Mandatory Recruiter Phone-Screen Verification Probes
          </h4>
          ${verificationQuestionsList}
        </div>
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TalentPulse AI Recruitment Dossier - ${jobTitle || 'Role'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3f4f6;
      color: #111827;
      margin: 0;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .header-banner {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 32px 28px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(30, 27, 75, 0.25);
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .matrix-table th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
    .matrix-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header-banner">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 6px;">
          TALENTPULSE AI RECRUITMENT DOSSIER
        </span>
        <span style="font-size: 12px; opacity: 0.85;">${timestamp}</span>
      </div>
      <h1 style="margin: 8px 0 6px 0; font-size: 26px; font-weight: 800; color: #ffffff;">${jobTitle || 'Executive Candidate Evaluation Report'}</h1>
      <p style="margin: 0; font-size: 14px; opacity: 0.9; max-width: 680px;">
        Pipeline synthesized ${evaluatedCandidates.length} candidate resume(s) through deep requirement mapping, evidence gap detection, and phone-screen verification probes.
      </p>
    </div>

    <!-- Executive Summary Ranking Matrix -->
    <div style="margin-bottom: 12px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0;">
        📊 Executive Candidate Ranking Matrix
      </h2>
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Candidate</th>
            <th>Fit Score</th>
            <th>Tier</th>
            <th>Recommendation</th>
            <th>Key Red Flag / Gap</th>
          </tr>
        </thead>
        <tbody>
          ${sortedCandidates
            .map((c, i) => {
              const evalData = c.evaluation!;
              const tierColor = getTierColor(evalData.matchTier);
              const topGap = evalData.missingSkills?.[0]?.skill || evalData.evidenceGaps?.[0]?.area || 'None detected';
              return `
              <tr>
                <td style="font-weight: 700; color: #475569;">#${i + 1}</td>
                <td>
                  <strong>${c.candidateName}</strong>
                  <div style="font-size: 12px; color: #64748b;">${c.email || c.fileName}</div>
                </td>
                <td>
                  <span style="font-weight: 800; font-size: 16px; color: ${tierColor};">${evalData.fitScore}%</span>
                </td>
                <td>
                  <span style="display: inline-block; font-size: 12px; padding: 2px 8px; border-radius: 9999px; background: ${tierColor}15; color: ${tierColor}; font-weight: 600;">
                    ${evalData.matchTier}
                  </span>
                </td>
                <td>
                  <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${evalData.recommendation}</span>
                </td>
                <td style="font-size: 13px; color: #b91c1c;">${topGap}</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>

    <!-- Candidate Detailed Dossiers -->
    <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 28px 0 16px 0;">
      📑 Candidate Deep-Dive Dossiers & Phone-Screen Guides
    </h2>
    ${candidateCardsHTML}

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 12px;">
      Generated automatically by <strong>TalentPulse AI Recruitment Agent</strong> • Powered by Hosted Qwen 2.5/3 & Gemini Neural Models
    </div>
  </div>
</body>
</html>`;
}
