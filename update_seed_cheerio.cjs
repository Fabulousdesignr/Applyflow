const fs = require('fs');
const cheerio = require('cheerio');

function parseHtml(htmlContent) {
  const jobs = [];
  const $ = cheerio.load(htmlContent);

  $('h3').each((i, el) => {
    const text = $(el).text();
    // Example: 1. Visme (United States | Size: 51-200 | Type: Creative AI & SaaS)
    const match = text.match(/^\d+\.\s*(.+?)\s*\((.*?)\)$/);
    if (!match) return;

    const company = match[1].trim();
    const details = match[2].split('|').map(s => s.trim());
    const country = details[0] || '';
    let size = '';
    let type = '';
    
    details.forEach(d => {
      if (d.startsWith('Size:')) size = d.replace('Size:', '').trim();
      if (d.startsWith('Type:')) type = d.replace('Type:', '').trim();
    });

    const ul = $(el).next('ul');
    if (!ul.length) return;

    const getField = (label) => {
      let result = '';
      ul.find('li').each((_, li) => {
        const text = $(li).text();
        const lowerText = text.toLowerCase();
        const lowerLabel = label.toLowerCase();
        // find text before colon
        const colonIndex = text.indexOf(':');
        if (colonIndex !== -1) {
          const keyText = text.substring(0, colonIndex).toLowerCase();
          if (keyText.includes(lowerLabel)) {
            result = text.substring(colonIndex + 1).trim();
          }
        } else if (lowerText.includes(lowerLabel)) {
          // just in case
          result = text.substring(text.toLowerCase().indexOf(lowerLabel) + label.length).trim();
          if (result.startsWith(':')) result = result.substring(1).trim();
        }
      });
      return result;
    };

    const roleRaw = getField('Role Title & level');
    const roleMatch = roleRaw.match(/^(.*?)\s*\((.*?)\)$/);
    const role_title = roleMatch ? roleMatch[1].trim() : roleRaw;
    const mid_entry_friendly = roleMatch ? roleMatch[2].trim() : 'Yes';

    const remoteRaw = getField('Remote Status & Global Friendly');
    const remoteParts = remoteRaw.split('|');
    const remote_status = remoteParts[0] ? remoteParts[0].trim() : '';
    const global_remote_friendly = remoteParts[1] ? remoteParts[1].trim() : 'Yes';

    const rawLinks = getField('Links'); // usually empty if they have tags, but cheerio .text() extracts text. Wait, we want the actual hrefs.
    // Let's get links from the LI containing 'Links:'
    let career_page = '';
    let application_link = '';
    let linkedin_page = '';
    ul.find('li').each((_, li) => {
      if ($(li).text().includes('Links:')) {
        $(li).find('a').each((_, a) => {
          const linkText = $(a).text().toLowerCase();
          const href = $(a).attr('href') || '';
          if (linkText.includes('career')) career_page = href;
          if (linkText.includes('linkedin')) linkedin_page = href;
          if (linkText.includes('apply')) application_link = href;
        });
      }
    });

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
      date_posted: getField('Date Posted & Freshness'),
      hiring_freshness: 'Active',
      career_page: career_page,
      application_link: application_link,
      linkedin_page: linkedin_page,
      founder_hr_name: getField('Founder/HR Name'),
      outreach_method: getField('Best Outreach Method'),
      key_tools_mentioned: getField('Key Tools & AI Workflow'),
      ai_workflow_mentioned: getField('Key Tools & AI Workflow'),
      why_i_have_a_chance: getField('Why Match & Chance'),
      portfolio_advice: getField('Portfolio & Application Advice'),
      application_emphasis: '',
      status: 'Not Started',
      priority: 'Medium',
      notes: '',
      follow_up_date: '',
      applied_date: '',
      interview_stage: ''
    });
  });
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

  console.log("Total extracted from txt:", allJobs.length);

  let seedDataContent = fs.readFileSync('src/database/seedData.js', 'utf8');
  const startIndex = seedDataContent.indexOf('export const seedOpportunities = [');
  if (startIndex !== -1) {
    const arrStr = seedDataContent.substring(seedDataContent.indexOf('[', startIndex));
    const evalStr = 'const arr = ' + arrStr + '; arr;';
    const existingJobs = eval(evalStr);
    
    const existingNames = new Set(existingJobs.map(j => j.company_name.toLowerCase()));
    let newId = existingJobs.length + 1;
    
    for (const job of allJobs) {
      if (!existingNames.has(job.company_name.toLowerCase())) {
        job.id = 'opp-' + String(newId).padStart(3, '0');
        
        if (job.date_posted) {
          const parts = job.date_posted.split('|');
          job.date_posted = parts[0] ? parts[0].trim() : job.date_posted;
          job.hiring_freshness = parts[1] ? parts[1].trim() : 'Active';
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
