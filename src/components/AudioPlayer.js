import React, { useState } from 'react';
import axios from 'axios';

function AudioPlayer({ text, title }) {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleListen = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/tts/speak', 
        { text: text.substring(0, 5000) },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
    } catch (error) {
      console.error('TTS failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="audio-player">
      <button onClick={handleListen} disabled={loading}>
        {loading ? 'Generating...' : '🔊 Listen to Article'}
      </button>
      {audioUrl && (
        <audio controls src={audioUrl} className="mt-2 w-100">
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}

export default AudioPlayer;