const fs = require('fs');
const path = require('path');

const replacements = [
    { file: 'src/components/common/LessonView.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },
    { file: 'src/components/common/MobileContainer.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },
    { file: 'src/components/common/Navigation.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },
    { file: 'src/components/common/Notifications.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },
    { file: 'src/components/common/UserProfileModal.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },

    { file: 'src/config/firebase.ts', search: /from\s+['"\.`]\.\.\/firebase-applet-config\.json['"`]/g, replace: "from '../../firebase-applet-config.json'" },

    { file: 'src/features/chat/Chat.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },
    { file: 'src/features/classroom/AssignmentBuilder.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },
    { file: 'src/features/classroom/AssignmentBuilder.tsx', search: /from\s+['"\.`]\.\/MathSymbolPicker['"`]/g, replace: "from '../../components/common/MathSymbolPicker'" },
    { file: 'src/features/classroom/AssignmentGrader.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },

    { file: 'src/features/duel/MultiplayerLeaderboard.tsx', search: /from\s+['"\.`]\.\.\/lib\/utils['"`]/g, replace: "from '../../utils/utils'" },

    { file: 'src/pages/Dashboard.tsx', search: /from\s+['"\.`]\.\/Chat['"`]/g, replace: "from '../features/chat/Chat'" },

    { file: 'src/pages/Leaderboard.tsx', search: /from\s+['"\.`]\.\/MultiplayerLeaderboard['"`]/g, replace: "from '../features/duel/MultiplayerLeaderboard'" },

    { file: 'src/pages/MathDuel.tsx', search: /from\s+['"\.`]\.\/MultiplayerLeaderboard['"`]/g, replace: "from '../features/duel/MultiplayerLeaderboard'" },

    { file: 'src/pages/Messages.tsx', search: /from\s+['"\.`]\.\/Chat['"`]/g, replace: "from '../features/chat/Chat'" },
    { file: 'src/pages/Messages.tsx', search: /from\s+['"\.`]\.\/UserProfileModal['"`]/g, replace: "from '../components/common/UserProfileModal'" },

    { file: 'src/pages/TeacherDashboard.tsx', search: /from\s+['"\.`]\.\/AssignmentBuilder['"`]/g, replace: "from '../features/classroom/AssignmentBuilder'" },
    { file: 'src/pages/TeacherDashboard.tsx', search: /from\s+['"\.`]\.\/Chat['"`]/g, replace: "from '../features/chat/Chat'" },
    { file: 'src/pages/TeacherDashboard.tsx', search: /from\s+['"\.`]\.\/AssignmentGrader['"`]/g, replace: "from '../features/classroom/AssignmentGrader'" },

    { file: 'src/pages/TeacherHome.tsx', search: /from\s+['"\.`]\.\/AssignmentBuilder['"`]/g, replace: "from '../features/classroom/AssignmentBuilder'" },
    { file: 'src/pages/TeacherHome.tsx', search: /from\s+['"\.`]\.\/AssignmentGrader['"`]/g, replace: "from '../features/classroom/AssignmentGrader'" },
];

for (const { file, search, replace } of replacements) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(search, replace);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Replaced in ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
}
