let mediaRecorder;
let audioChunks = [];

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    await sendAudioToServer(audioBlob);
    audioChunks = [];
  };

  mediaRecorder.start();
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
};

const sendAudioToServer = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  try {
    const response = await fetch('/api/convert-voice', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Server error');
    }

    const data = await response.json();
    document.getElementById('markdownContent').value = data.markdown;
  } catch (error) {
    console.error('Error sending audio to server:', error);
    alert('An error occurred while processing your audio. Please try again.');
  }
};

document.getElementById('recordButton').addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  } else {
    startRecording();
  }
});