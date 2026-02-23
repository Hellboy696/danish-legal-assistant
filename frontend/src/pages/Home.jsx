import { useNavigate } from 'react-router-dom';
import { Zap, BookOpen, Shield, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import HeroSection from '../components/home/HeroSection';
import FeatureCard from '../components/home/FeatureCard';
import useChatStore from '../store/useChatStore';
import { EXAMPLE_QUERIES } from '../data/mockData';

const FEATURES = [
  {
    icon: Zap,
    title: 'Claude AI Answers',
    description: 'Powered by Claude Sonnet — get precise, cited answers in seconds using real Danish law.',
  },
  {
    icon: BookOpen,
    title: '41 Real Danish Laws',
    description: 'Covering immigration, tax, labor, and business — the most common topics for workers and expats.',
  },
  {
    icon: Shield,
    title: 'Cited Sources',
    description: 'Every answer references the official Danish law (lovhenvisning) so you can verify directly.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Type your question', desc: 'Ask anything in plain English about Danish law.' },
  { step: '02', title: 'AI finds relevant laws', desc: 'Semantic search matches your question to the most relevant regulations.' },
  { step: '03', title: 'Review the law', desc: 'Each answer includes the full law reference and expandable text.' },
];

function containerVariants(delay = 0) {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
  };
}

export default function Home() {
  const navigate = useNavigate();
  const { sendMessage } = useChatStore();

  const handleExampleClick = (text) => {
    navigate('/chat');
    setTimeout(() => sendMessage(text), 100);
  };

  return (
    <div>
      <HeroSection />

      {/* Features section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          variants={containerVariants(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-navy-500 dark:text-white mb-3">
            Why Danish Legal Assistant?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Built for workers and immigrants navigating Danish bureaucracy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={containerVariants(0.1 + i * 0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white dark:bg-navy-800 border-y border-gray-100 dark:border-navy-700 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={containerVariants(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-navy-500 dark:text-white mb-3">
              How It Works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-0.5 bg-gray-200 dark:bg-navy-600" />

            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                variants={containerVariants(0.1 + i * 0.15)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full border-2 border-nordic-200 dark:border-nordic-800
                                bg-nordic-50 dark:bg-nordic-900/30 flex items-center justify-center mb-4
                                relative z-10">
                  <span className="text-xl font-bold text-nordic-600 dark:text-nordic-400">{step}</span>
                </div>
                <h3 className="font-semibold text-navy-500 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Example questions */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          variants={containerVariants(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-navy-500 dark:text-white mb-3">
            Common Questions
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Click any question to get an instant answer.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants(0.2)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {EXAMPLE_QUERIES.map(({ text }) => (
            <button
              key={text}
              onClick={() => handleExampleClick(text)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl
                         bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700
                         text-sm text-gray-700 dark:text-gray-300
                         hover:border-nordic-300 dark:hover:border-nordic-600
                         hover:bg-nordic-50 dark:hover:bg-nordic-900/20
                         transition-all duration-200 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 text-nordic-500 flex-shrink-0" />
              {text}
            </button>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
