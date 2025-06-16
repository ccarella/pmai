'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { IssueType } from '@/lib/types/issue';
import { getFormSteps } from '@/lib/config/form-steps';
import { pageVariants, staggerContainer, staggerItem, scaleFade } from '@/lib/animations/variants';
import { useMousePosition } from '@/lib/animations/hooks';
import { calculate3DRotation } from '@/lib/animations/utils';

interface IssueTypeCardProps {
  type: IssueType;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const IssueTypeCard: React.FC<IssueTypeCardProps> = ({ 
  type, 
  title, 
  description, 
  isSelected, 
  onClick 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition(cardRef);
  const rotation = calculate3DRotation(mousePosition.x, mousePosition.y, 5);

  return (
    <motion.div
      ref={cardRef}
      variants={staggerItem}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ perspective: 1000 }}
    >
      <motion.button
        onClick={onClick}
        data-testid={`issue-type-${type}`}
        className={`relative p-4 border rounded-lg text-left transition-all duration-200 w-full ${
          isSelected
            ? 'border-accent bg-accent/10 shadow-md'
            : 'border-border hover:border-accent/50 hover:shadow-sm bg-card-bg'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg)`
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <h3 className="font-semibold mb-1 text-foreground">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
        {isSelected && (
          <motion.div
            className="absolute inset-0 border-2 border-accent rounded-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.button>
    </motion.div>
  );
};

export default function CreateIssuePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<IssueType | null>(null);

  const issueTypes: { type: IssueType; title: string; description: string }[] = [
    {
      type: 'feature',
      title: 'Feature',
      description: 'New functionality or enhancement to existing features',
    },
    {
      type: 'bug',
      title: 'Bug',
      description: 'Something that isn\'t working as expected',
    },
    {
      type: 'epic',
      title: 'Epic',
      description: 'Large feature that needs to be broken down into smaller tasks',
    },
    {
      type: 'technical-debt',
      title: 'Technical Debt',
      description: 'Code improvements, refactoring, or performance optimization',
    },
  ];

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 max-w-4xl min-h-screen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <motion.h1 
        className="text-3xl font-bold mb-2 text-foreground"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        Create New Issue
      </motion.h1>
      <motion.p 
        className="text-muted mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Generate comprehensive GitHub issues optimized for AI-assisted development
      </motion.p>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-foreground">Select Issue Type</h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {issueTypes.map((item) => (
              <IssueTypeCard
                key={item.type}
                {...item}
                isSelected={selectedType === item.type}
                onClick={() => setSelectedType(item.type)}
              />
            ))}
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {selectedType && (
            <motion.div 
              className="mt-8 p-6 bg-card-bg border border-border rounded-lg shadow-sm"
              variants={scaleFade}
              initial="initial"
              animate="animate"
              exit="initial"
            >
              <p className="text-center text-muted mb-4">
                You selected: <strong className="text-accent">{selectedType}</strong>
              </p>
              <div className="flex justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="secondary" onClick={() => setSelectedType(null)}>
                    Back
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => {
                      const steps = getFormSteps(selectedType);
                      router.push(`/create/${selectedType}/${steps[0].id}`);
                    }}
                  >
                    Continue
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}