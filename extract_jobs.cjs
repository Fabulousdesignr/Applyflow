const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Fabulous\\.gemini\\antigravity-ide\\brain\\b093ea7d-1d34-4f71-9bcd-e3226f4096f7\\.system_generated\\logs\\transcript.jsonl';

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 31) {
      fs.writeFileSync('extracted_search.txt', obj.content || (obj.tool_calls ? JSON.stringify(obj.tool_calls) : '') + '\n' + (obj.content || ''));
      console.log('Saved step 31 to extracted_search.txt');
    }
    if (obj.step_index === 33) {
      fs.writeFileSync('extracted_sweep.txt', obj.content || (obj.tool_calls ? JSON.stringify(obj.tool_calls) : '') + '\n' + (obj.content || ''));
      console.log('Saved step 33 to extracted_sweep.txt');
    }
    // Also check other steps that might contain the outputs
    if (obj.type === 'VIEW_FILE') {
      if (obj.content && obj.content.includes('Global Talent Sweep')) {
        fs.writeFileSync('view_file_sweep.txt', obj.content);
        console.log('Saved VIEW_FILE sweep to view_file_sweep.txt');
      }
      if (obj.content && obj.content.includes('Global Remote Design Talent Search')) {
        fs.writeFileSync('view_file_search.txt', obj.content);
        console.log('Saved VIEW_FILE search to view_file_search.txt');
      }
    }
  } catch (e) {
    console.error('Error parsing line:', e);
  }
}
