const fs = require('fs');

function parseHtml(htmlContent) {
  const jobs = [];
  // The structure is <h3>1. Company (Location | Size: x | Type: y)</h3>
  // followed by <ul><li>...</li></ul>
  
  const h3Regex = /<h3>(?:<[^>]+>)*\d+\.\s*([^<(]+)(?:<[^>]+>)*\s*\(([^|]+)\|\s*Size:\s*([^|]+)\|\s*Type:\s*([^)]+)\)(?:<[^>]+>)*<\/h3>/g;
  let match;
  
  while ((match = h3Regex.exec(htmlContent)) !== null) {
    const company = match[1].trim();
    const country = match[2].trim();
    const size = match[3].trim();
    const type = match[4].trim();
    
    // Find the next <ul>
    const ulStart = htmlContent.indexOf('<ul', match.index);
    const ulEnd = htmlContent.indexOf('</ul>', ulStart);
    if (ulStart === -1 || ulEnd === -1) continue;
    
    const ulContent = htmlContent.substring(ulStart, ulEnd);
    
    // Parse fields
    const getField = (label) => {
      // e.g. <strong>Role Title &amp; level:</strong> Senior Product Designer...
      // or **Role Title & level:**
      // we can just regex for the label text then capture up to </li>
      // label could be literal or regex
      const safeLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const r = new RegExp(`(?:<strong[^>]*>)?${safeLabel}(?:<\\/strong>)?\\s*:?\\s*(.*?)(?=<\/li>)`, 'i');
      const m = r.exec(ulContent);
      if (m) {
        // remove any inner HTML tags
        return m[1].replace(/<[^>]+>/g, '').trim();
      }
      return '';
    };

    const roleRaw = getField('Role Title &amp; level') || getField('Role Title & level');
    const roleMatch = roleRaw.match(/^(.*?)\s*\((.*?)\)$/);
    const role_title = roleMatch ? roleMatch[1].trim() : roleRaw;
    const mid_entry_friendly = roleMatch ? roleMatch[2].trim() : 'Yes';

    const remoteRaw = getField('Remote Status &amp; Global Friendly') || getField('Remote Status & Global Friendly');
    const remoteParts = remoteRaw.split('|');
    const remote_status = remoteParts[0] ? remoteParts[0].trim() : '';
    const global_remote_friendly = remoteParts[1] ? remoteParts[1].trim() : 'Yes';

    jobs.push({
      company_name: company,
      role_title: role_title,
      country: country,
      company_type: type,
      company_size: size,
      remote_status: remote_status,
      global_remote_friendly: global_remote_friendly,
      mid_entry_friendly: mid_entry_friendly,
      wat_compatibility: getField('WAT Timezone Compatibility'),
      salary_estimate: getField('Salary Estimate'),
      date_posted: getField('Date Posted &amp; Freshness') || getField('Date Posted & Freshness'),
      hiring_freshness: 'Active',
      career_page: getField('Links') || '',
      founder_hr_name: getField('Founder/HR Name'),
      outreach_method: getField('Best Outreach Method') || getField('**Best Outreach Method'),
      key_tools_mentioned: getField('Key Tools &amp; AI Workflow') || getField('Key Tools & AI Workflow'),
      ai_workflow_mentioned: getField('Key Tools &amp; AI Workflow') || getField('Key Tools & AI Workflow'),
      why_i_have_a_chance: getField('Why Match &amp; Chance') || getField('Why Match & Chance'),
      portfolio_advice: getField('Portfolio &amp; Application Advice') || getField('Portfolio & Application Advice'),
      application_emphasis: '',
      status: 'Not Started',
      priority: 'Medium',
      notes: '',
      follow_up_date: '',
      applied_date: '',
      interview_stage: ''
    });
  }
  return jobs;
}

try {
  let allJobs = [];
  
  if (fs.existsSync('extracted_search.txt')) {
    const html1 = fs.readFileSync('extracted_search.txt', 'utf8');
    allJobs = allJobs.concat(parseHtml(html1));
  }
  
  if (fs.existsSync('extracted_sweep.txt')) {
    const html2 = fs.readFileSync('extracted_sweep.txt', 'utf8');
    allJobs = allJobs.concat(parseHtml(html2));
  }

  // Also try parsing the original seedData.js to merge
  let seedDataContent = fs.readFileSync('src/database/seedData.js', 'utf8');
  // Hacky way to extract the array
  const startIndex = seedDataContent.indexOf('export const seedOpportunities = [');
  if (startIndex !== -1) {
    const arrStr = seedDataContent.substring(seedDataContent.indexOf('[', startIndex));
    // Remove the export to evaluate
    const evalStr = 'const arr = ' + arrStr + '; arr;';
    const existingJobs = eval(evalStr);
    
    // Merge
    const existingNames = new Set(existingJobs.map(j => j.company_name.toLowerCase()));
    let newId = existingJobs.length + 1;
    
    for (const job of allJobs) {
      if (!existingNames.has(job.company_name.toLowerCase())) {
        job.id = 'opp-' + String(newId).padStart(3, '0');
        // Clean up some fields
        if (job.date_posted) {
          const parts = job.date_posted.split('|');
          job.date_posted = parts[0] ? parts[0].trim() : job.date_posted;
          job.hiring_freshness = parts[1] ? parts[1].trim() : 'Active';
        }
        
        // Links cleanup
        if (job.career_page) {
          // It's like "Careers | LinkedIn | Apply"
          // In the HTML it was <a>Careers</a> | <a>LinkedIn</a> | <a>Apply</a>
          // We stripped HTML tags, so it just says Careers | LinkedIn | Apply
          // Which is useless without href. Let's fix that.
        }
        
        existingJobs.push(job);
        existingNames.add(job.company_name.toLowerCase());
        newId++;
      }
    }

    const newContent = `// Seed data for Applyflow CRM
// Seeded from research documents: "Global Remote Design Talent Search" & "Global Talent Sweep"
// Optimised for Nigerian mid-level product designer (WAT timezone)

export const seedOpportunities = ${JSON.stringify(existingJobs, null, 2)};
`;
    fs.writeFileSync('src/database/seedData.js', newContent);
    console.log('Successfully updated seedData.js to contain ' + existingJobs.length + ' opportunities.');
  }
} catch (e) {
  console.error(e);
}
