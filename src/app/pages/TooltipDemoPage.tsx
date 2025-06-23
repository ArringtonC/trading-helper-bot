import React, { useState, useEffect } from 'react';
import { Tooltip, Popover } from '../../shared/components/ui/Tooltip'; // Assuming index.ts is in Tooltip dir
import { MarkdownRenderer } from '../../shared/components/ui/MarkdownRenderer'; // Import MarkdownRenderer
import { getTutorialById, getAllTutorialsMetadata } from '../../shared/services/TutorialService'; // Import TutorialService
import { Tutorial, TutorialMetadata } from '../../types/Tutorial'; // Import Tutorial types

const TooltipDemoPage: React.FC = () => {
  const [welcomeTutorial, setWelcomeTutorial] = useState<Tutorial | null>(null);
  const [allTutorialsMeta, setAllTutorialsMeta] = useState<TutorialMetadata[]>([]);

  useEffect(() => {
    getTutorialById('welcome-to-platform').then(tutorial => {
      if (tutorial) {
        setWelcomeTutorial(tutorial);
      }
    });
    getAllTutorialsMetadata().then(setAllTutorialsMeta);
  }, []);

  return (
    <div className="container mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold mb-8">Tooltip, Popover & Markdown Demo</h1>

      {/* Tooltip Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Tooltips</h2>
        <div className="flex space-x-8 items-center">
          <Tooltip content="This is a top tooltip">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Top Tooltip
            </button>
          </Tooltip>

          <Tooltip content="This is a bottom tooltip with more text to see how it wraps."
                   position="bottom">
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Bottom Tooltip
            </button>
          </Tooltip>

          <Tooltip content="Left!" position="left">
            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Left Tooltip
            </button>
          </Tooltip>

          <Tooltip content={<strong>HTML content!</strong>} position="right">
            <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
              Right Tooltip (HTML)
            </button>
          </Tooltip>
        </div>
      </section>

      {/* Popover Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Popovers (Click Trigger)</h2>
        <div className="flex space-x-8 items-start">
          <Popover
            title="Top Popover"
            content="This is a popover with a title and some descriptive content. You can put more interactive elements here."
            position="top"
          >
            <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
              Top Popover
            </button>
          </Popover>

          <Popover
            title="Bottom Popover"
            content={(
              <div>
                <p className="mb-2">This popover demonstrates <strong>rich content</strong>.</p>
                <button 
                    onClick={() => alert('Action from popover!')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm py-1 px-2 rounded"
                >
                    Click me!
                </button>
              </div>
            )}
            position="bottom"
          >
            <button className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded">
              Bottom Popover (Rich)
            </button>
          </Popover>

          <Popover
            title="Left Popover - Click me"
            content="This one is on the left."
            position="left"
            className="w-64" // Custom width
          >
            <button className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded">
              Left Popover
            </button>
          </Popover>
          
          <Popover
            title="Right Popover - Click me"
            content="This one is on the right, and has a slightly different offset."
            position="right"
            offset={16} // Custom offset
          >
            <button className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded">
              Right Popover
            </button>
          </Popover>

        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Popovers (Hover Trigger)</h2>
         <div className="flex space-x-8 items-start">
            <Popover
                title="Hover Popover (Top)"
                content="This popover appears on hover."
                position="top"
                trigger="hover"
            >
                <span className="bg-gray-200 p-2 rounded cursor-default">Hover for Top Popover</span>
            </Popover>
            <Popover
                title="Hover Popover (Bottom)"
                content="This popover also appears on hover, positioned below."
                position="bottom"
                trigger="hover"
            >
                <span className="bg-gray-200 p-2 rounded cursor-default">Hover for Bottom Popover</span>
            </Popover>
         </div>
      </section>

      {/* Example of tooltips/popovers on non-button elements */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">On Other Elements</h2>
        <div className="flex space-x-8 items-center">
            <Tooltip content="Tooltip on a span">
                <span className="text-lg font-medium p-2 bg-gray-100 rounded cursor-default">Hover me (Tooltip)</span>
            </Tooltip>

            <Popover title="Popover on Text" content="This is a popover attached to a simple text span." position="right">
                <span className="text-lg font-medium p-2 bg-gray-100 rounded cursor-pointer">Click me (Popover)</span>
            </Popover>
        </div>
      </section>

      {/* MarkdownRenderer Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Markdown Renderer Demo</h2>
        {welcomeTutorial ? (
          <div>
            <h3 className="text-xl font-medium mb-2">Rendering: {welcomeTutorial.title}</h3>
            <div className="p-4 border rounded-md bg-gray-50">
              <MarkdownRenderer markdownContent={welcomeTutorial.content} />
            </div>
          </div>
        ) : (
          <p>Loading tutorial content...</p>
        )}

        <div className="mt-6">
            <h3 className="text-xl font-medium mb-2">Other Available Tutorials (Metadata):</h3>
            {allTutorialsMeta.length > 0 ? (
                <ul className="list-disc pl-5">
                    {allTutorialsMeta.map(meta => (
                        <li key={meta.id}><strong>{meta.title}</strong> (ID: {meta.id}, Category: {meta.category || 'N/A'})</li>
                    ))}
                </ul>
            ) : (
                <p>Loading tutorial metadata...</p>
            )}
        </div>

        <div className="mt-6">
            <h3 className="text-xl font-medium mb-2">Raw Markdown Code Block Example:</h3>
            <div className="p-4 border rounded-md bg-gray-50">
                <MarkdownRenderer markdownContent={`\`\`\`javascript\nfunction greet(name) {\n  console.log("Hello, " + name + "!");\n}\ngreet("World");\n\`\`\`\nThis is a test of syntax highlighting.`} />
            </div>
        </div>
      </section>

      {/* Boundary/Overflow Test Area - Add elements near edges to test */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold mb-4">Boundary Tests (Scroll to see)</h2>
        <div style={{ height: '150vh'}} className="pt-10">
            <div className="flex justify-between mb-10">
                <Tooltip content="Far left top tooltip" position="top">
                    <button className="bg-cyan-500 text-white p-2 rounded">Edge Top Left</button>
                </Tooltip>
                <Tooltip content="Far right top tooltip" position="top">
                    <button className="bg-cyan-500 text-white p-2 rounded">Edge Top Right</button>
                </Tooltip>
            </div>

            <Popover title="Near Top Left" content="Testing boundary for popover." position="left">
                 <button className="bg-rose-500 text-white p-2 rounded fixed top-20 left-5">Popover Top-Left Screen</button>
            </Popover>
            
            <Popover title="Near Top Right" content="Testing boundary for popover." position="right">
                 <button className="bg-rose-500 text-white p-2 rounded fixed top-20 right-5">Popover Top-Right Screen</button>
            </Popover>

            <div style={{ position: 'fixed', bottom: '20px', left: '20px' }}>
                 <Tooltip content="Fixed Bottom Left" position="top">
                    <button className="bg-lime-500 text-white p-2 rounded">Fixed Bottom Left</button>
                </Tooltip>
            </div>
             <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
                 <Popover title="Fixed Bottom Right Pop" content="This should try to flip or adjust." position="bottom">
                    <button className="bg-amber-500 text-white p-2 rounded">Fixed Bottom Right</button>
                </Popover>
            </div>
        </div>
      </section>

    </div>
  );
};

export default TooltipDemoPage; 