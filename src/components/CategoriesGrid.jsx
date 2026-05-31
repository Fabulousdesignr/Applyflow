import React from 'react';
import { 
  Zap, 
  Layers, 
  DollarSign, 
  Workflow, 
  Code, 
  Clock, 
  Sparkles, 
  Cpu, 
  Users, 
  UserCheck 
} from 'lucide-react';
import { filterActiveOpportunities } from '../utils/opportunityArchive';

const CATEGORIES = [
  {
    id: 'ai_startups',
    label: 'AI Startups',
    description: 'Companies building dynamic machine intelligence systems and conversational interfaces.',
    icon: Cpu,
    matchFn: (opp) => opp.company_type === 'AI Startup'
  },
  {
    id: 'saas',
    label: 'SaaS Platforms',
    description: 'B2B infrastructure, developer consoles, and web dashboard systems.',
    icon: Layers,
    matchFn: (opp) => opp.company_type === 'SaaS'
  },
  {
    id: 'fintech',
    label: 'Fintech Hubs',
    description: 'Global payment ledgers, checkout SDKs, stablecoin transactions, and banks.',
    icon: DollarSign,
    matchFn: (opp) => opp.company_type === 'Fintech'
  },
  {
    id: 'product_studios',
    label: 'Product Studios',
    description: 'Design agencies and builder teams launching high-fidelity startup MVPs.',
    icon: Workflow,
    matchFn: (opp) => opp.company_type === 'Agency'
  },
  {
    id: 'nocode',
    label: 'Webflow / No-Code',
    description: 'Agencies and studios operating rapid build-to-publish client layout grids.',
    icon: Code,
    matchFn: (opp) => opp.company_type === 'No-Code Studio'
  },
  {
    id: 'async_first',
    label: 'Async-First Workspace',
    description: 'Highly documented, asynchronous cultures with minimal weekly synchronous meetings.',
    icon: Clock,
    matchFn: (opp) => {
      const why = String(opp.why_i_have_a_chance || '').toLowerCase();
      const notes = String(opp.notes || '').toLowerCase();
      return why.includes('async') || notes.includes('async');
    }
  },
  {
    id: 'ai_native',
    label: 'AI-Native Workflow',
    description: 'Requires designers who leverage Cursor, v0, Lovable, or Claude Code daily to code layouts.',
    icon: Sparkles,
    matchFn: (opp) => {
      const ai = String(opp.ai_workflow_mentioned || '').toLowerCase();
      return ai.includes('cursor') || ai.includes('v0') || ai.includes('claude') || ai.includes('lovable');
    }
  },
  {
    id: 'design_systems',
    label: 'Design Systems Core',
    description: 'Emphasis on atomic component libraries, variables, typography spacing, and handoff tokens.',
    icon: Layers,
    matchFn: (opp) => {
      const tools = String(opp.key_tools_mentioned || '').toLowerCase();
      const why = String(opp.why_i_have_a_chance || '').toLowerCase();
      return tools.includes('system') || tools.includes('tokens') || tools.includes('auto-layout') || why.includes('component');
    }
  },
  {
    id: 'founder_led',
    label: 'Founder-Led / Flat Teams',
    description: 'Provides direct accessibility to decision makers (CEO/CTO) via email or Reddit.',
    icon: Users,
    matchFn: (opp) => {
      const outreach = String(opp.outreach_method || '').toLowerCase();
      const name = String(opp.founder_hr_name || '').toLowerCase();
      return outreach.includes('reddit') || outreach.includes('email') || (name.length > 2 && !name.includes('n/a'));
    }
  },
  {
    id: 'mid_level',
    label: 'Mid-Level Friendly',
    description: 'Opportunities explicitly optimized to hire mid-level designers based on speed and execution quality.',
    icon: UserCheck,
    matchFn: (opp) => {
      const mid = String(opp.mid_entry_friendly || '').toLowerCase();
      const role = String(opp.role_title || '').toLowerCase();
      return mid.includes('yes') || role.includes('middle') || role.includes('generalist') || role.includes('mid-level');
    }
  }
];

export default function CategoriesGrid({ opportunities, onSelectCategoryPreset }) {
  const activeOpportunities = filterActiveOpportunities(opportunities);

  return (
    <div className="categories-view">
      <div className="categories-grid">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = activeOpportunities.filter(cat.matchFn).length;

          return (
            <div
              key={cat.id}
              className="category-card"
              onClick={() => onSelectCategoryPreset(cat.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="category-card-title">{cat.label}</span>
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    flexShrink: 0
                  }}
                >
                  <Icon size={14} />
                </div>
              </div>

              <p className="category-card-desc">{cat.description}</p>

              <div className="category-card-meta">
                <Zap size={11} />
                <span>{count} opportunities listed</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
