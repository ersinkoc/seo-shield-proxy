// Script to replace alert() calls with notifications
const fs = require('fs');
const path = require('path');

const componentsDir = __dirname + '/../components';

// Get all TSX files
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add imports if not present
  if (!content.includes('useNotifications')) {
    content = content.replace(
      /(import.*from.*\n)/,
      '$1import { useNotifications } from \'../contexts/NotificationContext\';\n'
    );
  }

  // Replace alert calls with notifications
  content = content.replace(/alert\('([^']+)'\)/g, 'addNotification(\'$1\', \'error\')');
  content = content.replace(/alert\(`([^`]+)`\)/g, 'addNotification(\'$1\', \'error\')');
  content = content.replace(/alert\(([^)]+)\)/g, 'addNotification($1, \'error\')');

  // Add hook usage if not present
  if (content.includes('addNotification') && !content.includes('const { addNotification } = useNotifications();')) {
    content = content.replace(
      /(export default function \w+\(\) \{[\s\S]*?const \[)/,
      '$1const { addNotification } = useNotifications();\n  const ['
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});

console.log('Done replacing alerts!');