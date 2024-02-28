import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown'

function ReadmeLoader() {
  const [readmeContent, setReadmeContent] = useState('');

  useEffect(() => {
    async function fetchReadme() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/webxr-indoor-navigation/Editor/main/README.md');
        const text = await response.text();
        setReadmeContent(text);
      } catch (error) {
        console.error('Error fetching README:', error);
      }
    }

    fetchReadme();
  }, []);

  return (
    <div>
      <Markdown className="readme">{readmeContent}</Markdown>
    </div>
  );
}

export default ReadmeLoader;
