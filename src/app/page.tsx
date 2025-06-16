'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { heroText, buttonVariants, staggerContainer, staggerItem, fadeIn } from '@/lib/animations/variants';

export default function Home() {
  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background to-card-bg"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      <main className="max-w-4xl w-full space-y-8 text-center">
        <motion.div className="mb-6" variants={heroText}>
          <motion.h1 
            className="text-5xl font-bold mb-4 bg-gradient-to-r from-accent to-secondary text-transparent bg-clip-text"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{ backgroundSize: '200% 100%' }}
          >
            GitHub Issue Generator
          </motion.h1>
          <motion.div 
            className="h-1 w-32 mx-auto bg-gradient-to-r from-accent to-secondary rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          />
        </motion.div>
        
        <motion.p 
          className="text-xl text-muted mb-8 font-light"
          variants={fadeIn}
          transition={{ delay: 0.2 }}
        >
          Create comprehensive, AI-optimized GitHub issues for Claude Code
        </motion.p>
        
        <motion.div 
          className="space-y-4"
          variants={fadeIn}
          transition={{ delay: 0.3 }}
        >
          <p className="text-muted leading-relaxed">
            Transform your product requirements into detailed, technically-sound GitHub issues
            that help AI coding assistants understand exactly what needs to be built.
          </p>
        </motion.div>

        <motion.div 
          className="pt-8"
          variants={fadeIn}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-accent text-foreground hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 focus-visible:ring-accent px-8 py-4 text-lg shadow-md"
            >
              Create New Issue
            </Link>
          </motion.div>
        </motion.div>

        <motion.div 
          className="pt-16 text-sm text-muted/70 space-y-2"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.p 
            className="flex items-center justify-center gap-2"
            variants={staggerItem}
          >
            <motion.span 
              className="w-2 h-2 bg-success rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Built with Next.js, React Hook Form, and Zod validation
          </motion.p>
          <motion.p 
            className="flex items-center justify-center gap-2"
            variants={staggerItem}
          >
            <motion.span 
              className="w-2 h-2 bg-info rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            Optimized for TDD with comprehensive test coverage
          </motion.p>
        </motion.div>
      </main>
    </motion.div>
  );
}