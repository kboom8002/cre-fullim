const fs = require('fs');
const content = fs.readFileSync('docs/11-database-schema.md', 'utf-8');
const blocks = [];
const regex = /```sql\n([\s\S]*?)```/g;
let match;
while ((match = regex.exec(content)) !== null) {
  blocks.push(match[1]);
}
fs.writeFileSync('supabase/migrations/0000_initial_schema.sql', blocks.join('\n'));
console.log('SQL extracted successfully');
