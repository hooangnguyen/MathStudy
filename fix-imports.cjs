const fs = require('fs');
const path = require('path');

const srcPathsToNewSrcPaths = {
  "components/Auth": "pages/Auth",
  "components/Dashboard": "pages/Dashboard",
  "components/TeacherHome": "pages/TeacherHome",
  "components/TeacherDashboard": "pages/TeacherDashboard",
  "components/Classroom": "pages/Classroom",
  "components/MathDuel": "pages/MathDuel",
  "components/Messages": "pages/Messages",
  "components/Leaderboard": "pages/Leaderboard",
  "components/Profile": "pages/Profile",
  "components/Settings": "pages/Settings",
  "components/EditProfile": "pages/EditProfile",
  "components/MobileContainer": "components/common/MobileContainer",
  "components/Navigation": "components/common/Navigation",
  "components/MathSymbolPicker": "components/common/MathSymbolPicker",
  "components/ErrorBoundary": "components/common/ErrorBoundary",
  "components/Notifications": "components/common/Notifications",
  "components/LessonView": "components/common/LessonView",
  "components/UserProfileModal": "components/common/UserProfileModal",
  "components/AssignmentBuilder": "features/classroom/AssignmentBuilder",
  "components/AssignmentGrader": "features/classroom/AssignmentGrader",
  "components/MultiplayerLeaderboard": "features/duel/MultiplayerLeaderboard",
  "components/Chat": "features/chat/Chat",
  "components/FirebaseProvider": "context/FirebaseProvider",
  "firebase": "config/firebase",
  "types": "types",
  "components/types": "types",
  "lib/utils": "utils/utils"
};

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  const currentFileSrcRel = path.relative(srcDir, file).replace(/\\/g, '/');
  
  content = content.replace(/from\s+['"]([^'"]+)['"]/g, matchAndReplace);
  content = content.replace(/import\s+['"]([^'"]+)['"]/g, matchAndReplace);
  
  function matchAndReplace(match, importPath) {
    if (!importPath.startsWith('.')) return match; // skip un-relative imports
    
    const fileDir = path.dirname(file);
    const absImportPath = path.resolve(fileDir, importPath);
    let srcRelImportPath = path.relative(srcDir, absImportPath).replace(/\\/g, '/');
    
    // strip extension if present
    if (srcRelImportPath.endsWith('.tsx')) srcRelImportPath = srcRelImportPath.slice(0, -4);
    if (srcRelImportPath.endsWith('.ts')) srcRelImportPath = srcRelImportPath.slice(0, -3);

    let newSrcRel = srcRelImportPath;
    if (srcPathsToNewSrcPaths[srcRelImportPath]) {
      newSrcRel = srcPathsToNewSrcPaths[srcRelImportPath];
    }

    let newImportPath = path.relative(path.dirname(file), path.join(srcDir, newSrcRel)).replace(/\\/g, '/');
    
    if (!newImportPath.startsWith('.')) {
      newImportPath = './' + newImportPath;
    }
    
    if (match.startsWith('from')) {
      return `from '${newImportPath}'`;
    } else {
      return `import '${newImportPath}'`;
    }
  }
  
  fs.writeFileSync(file, content, 'utf-8');
}
console.log('Done mapping imports!');
