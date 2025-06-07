import React, { useEffect, useState } from 'react';
import { TutorialMetadata } from '../../types/Tutorial';
import { getAllTutorialsMetadata } from '../../services/TutorialService';
import { useTutorial } from '../../context/TutorialContext';

interface TutorialListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialListModal: React.FC<TutorialListModalProps> = ({ isOpen, onClose }) => {
  const [tutorials, setTutorials] = useState<TutorialMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { startTutorial, isTutorialCompleted } = useTutorial();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getAllTutorialsMetadata()
        .then(data => {
          // Sort tutorials, e.g., by sequence or title
          data.sort((a, b) => (a.sequence ?? Infinity) - (b.sequence ?? Infinity) || a.title.localeCompare(b.title));
          setTutorials(data);
          setError(null);
        })
        .catch(err => {
          console.error("Error fetching tutorials metadata:", err);
          setError("Failed to load tutorials.");
          setTutorials([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  const handleStartTutorial = (tutorialId: string) => {
    const alreadyCompleted = isTutorialCompleted(tutorialId);
    startTutorial(tutorialId, alreadyCompleted); // Pass true for forceRestart if already completed
    onClose(); // Close modal after starting a tutorial
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Available Tutorials</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close tutorials list"
          >
            &times;
          </button>
        </div>

        {isLoading && <p>Loading tutorials...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!isLoading && !error && tutorials.length === 0 && (
          <p>No tutorials available at the moment.</p>
        )}

        {!isLoading && !error && tutorials.length > 0 && (
          <ul className="space-y-3">
            {tutorials.map(tutorial => {
              const completed = isTutorialCompleted(tutorial.id);
              return (
                <li key={tutorial.id} className="p-3 border rounded-md hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{tutorial.title}</h3>
                    {tutorial.category && (
                        <p className='text-xs text-gray-500'>Category: {tutorial.category}</p>
                    )}
                  </div>
                  <div className='flex items-center'>
                    {completed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mr-3">Completed</span>
                    )}
                    <button
                      onClick={() => handleStartTutorial(tutorial.id)}
                      className={`px-3 py-1 text-sm rounded ${completed ? 'bg-yellow-400 hover:bg-yellow-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                      {completed ? 'Restart' : 'Start'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}; 