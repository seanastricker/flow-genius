import React from 'react';

/**
 * Main application component
 */
function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            BrainLift Generator
          </h1>
          <p className="text-slate-600">
            AI-powered desktop application for creating BrainLift documents
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">
              Welcome to BrainLift Generator
            </h2>
            <p className="text-slate-600 mb-4">
              This application will help you create structured BrainLift documents 
              that guide Large Language Models beyond consensus thinking.
            </p>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                Create New BrainLift
              </button>
              <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors">
                View History
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App; 