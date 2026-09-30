import React from 'react';
import { motion } from 'motion/react';
import { useAssignmentBuilder } from './assignment-builder/useAssignmentBuilder';
import type { AssignmentBuilderProps } from './assignment-builder/types';
import { BuilderHeader } from './assignment-builder/BuilderHeader';
import { QuestionsTab } from './assignment-builder/QuestionsTab';
import { SettingsTab } from './assignment-builder/SettingsTab';
import { AIGenerateModal } from './assignment-builder/AIGenerateModal';

export const AssignmentBuilder: React.FC<AssignmentBuilderProps> = (props) => {
  const builder = useAssignmentBuilder(props);

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col md:rounded-l-3xl md:left-64 md:w-[calc(100%-16rem)]"
    >
      <BuilderHeader builder={builder} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
        <div className="max-w-3xl mx-auto">
          {builder.activeTab === 'questions' ? <QuestionsTab builder={builder} /> : <SettingsTab builder={builder} />}
        </div>
      </div>

      <AIGenerateModal builder={builder} />
    </motion.div>
  );
};
