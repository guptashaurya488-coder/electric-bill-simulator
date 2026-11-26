import React from 'react';
import { Play } from 'lucide-react';

interface ProjectTeamTabProps {
  onOpenDemo: () => void;
}

export const ProjectTeamTab: React.FC<ProjectTeamTabProps> = ({ onOpenDemo }) => {
  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Project Title Header */}
      <div className="bg-[#161616] rounded-xl p-6 border border-neutral-800 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
          Project Title
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Implementation of Bill Calculation Using C, HTML &amp; CSS
        </h1>
      </div>

      {/* Mentor & Student Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Project Mentor Card */}
        <div className="bg-[#161616] rounded-xl p-6 border border-neutral-800 flex flex-col items-center text-center space-y-4">
          <div className="w-40 h-44 rounded-xl overflow-hidden border border-neutral-700 bg-white">
            <img
              src="/assets/aistudio/image_b2eb1ef7.png"
              alt="Dr. Rupam Srivastava"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
              Project Mentor
            </span>
            <h2 className="text-lg font-semibold text-white">
              Dr. Rupam Srivastava
            </h2>
          </div>
        </div>

        {/* Student Card */}
        <div className="bg-[#161616] rounded-xl p-6 border border-neutral-800 flex flex-col items-center text-center space-y-4">
          <div className="w-40 h-44 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-100">
            <img
              src="/assets/aistudio/image_86120fca.png"
              alt="Shaurya Gupta"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
              Student
            </span>
            <h2 className="text-lg font-semibold text-white">
              Shaurya Gupta
            </h2>
          </div>
        </div>
      </div>

      {/* Orange Demo Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onOpenDemo}
          className="inline-flex items-center gap-2.5 px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm tracking-wide transition-colors border border-orange-500/40 cursor-pointer shadow-lg shadow-orange-950/40 whitespace-nowrap shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Demo</span>
        </button>
      </div>
    </div>
  );
};
