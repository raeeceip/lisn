// file.js
document.addEventListener('DOMContentLoaded', function() {
    var fileNameInput = document.getElementById('fileName');
    var recordButton = document.getElementById('recordButton');
    var fileList = document.getElementById('fileList');
    var recordingStatus = document.getElementById('recordingStatus');
    var transcriptionStatus = document.getElementById('transcriptionStatus');

    var files = JSON.parse(localStorage.getItem('files')) || [
        { id: 1, name: "Meeting_Notes.md", content: "Initial meeting notes" },
        { id: 2, name: "Project_Ideas.md", content: "Initial project ideas" },
    ];

    var isRecording = false;
    var mediaRecorder;
    var audioChunks = [];

    function renderFiles() {
        fileList.innerHTML = files.map(function(file) {
            return '<li class="flex items-center justify-between p-2 bg-secondary rounded">' +
                '<div class="flex items-center">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">' +
                        '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />' +
                        '<polyline points="14 2 14 8 20 8" />' +
                        '<line x1="16" x2="8" y1="13" y2="13" />' +
                        '<line x1="16" x2="8" y1="17" y2="17" />' +
                        '<line x1="10" x2="8" y1="9" y2="9" />' +
                    '</svg>' +
                    '<a href="#" class="file-link" data-file-id="' + file.id + '">' + file.name + '</a>' +
                '</div>' +
                '<button class="text-destructive delete-button" data-file-id="' + file.id + '">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M3 6h18" />' +
                        '<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />' +
                        '<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />' +
                        '<line x1="10" x2="10" y1="11" y2="17" />' +
                        '<line x1="14" x2="14" y1="11" y2="17" />' +
                    '</svg>' +
                '</button>' +
            '</li>';
        }).join('');

        attachListeners();
    }

    function attachListeners() {
        var deleteButtons = document.querySelectorAll('.delete-button');
        for (var i = 0; i < deleteButtons.length; i++) {
            deleteButtons[i].addEventListener('click', function() {
                var fileId = parseInt(this.getAttribute('data-file-id'));
                if (confirm('Are you sure you want to delete this file?')) {
                    deleteFile(fileId);
                }
            });
        }

        var fileLinks = document.querySelectorAll('.file-link');
        for (var i = 0; i < fileLinks.length; i++) {
            fileLinks[i].addEventListener('click', function(e) {
                e.preventDefault();
                var fileId = parseInt(this.getAttribute('data-file-id'));
                openFile(fileId);
            });
        }
    }

    function addFile(name, content) {
        var newId = files.length > 0 ? Math.max.apply(null, files.map(function(f) { return f.id; })) + 1 : 1;
        files.push({ id: newId, name: name, content: content });
        saveFiles();
        renderFiles();
    }

    function deleteFile(id) {
        files = files.filter(function(file) { return file.id !== id; });
        saveFiles();
        renderFiles();
    }

    function openFile(id) {
        var file = files.find(function(file) { return file.id === id; });
        if (file) {
            alert('File content: ' + file.content);
            // Here you would typically open the file in an editor or viewer
        }
    }

    function saveFiles() {
        localStorage.setItem('files', JSON.stringify(files));
    }

    recordButton.addEventListener('click', function() {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });

    function startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                audioChunks = [];
                mediaRecorder.addEventListener("dataavailable", function(event) {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", function() {
                    transcribeAudio();
                });

                isRecording = true;
                recordButton.textContent = 'Stop Recording';
                recordingStatus.classList.remove('hidden');
                console.log('Recording started');
            });
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            isRecording = false;
            recordButton.textContent = 'Start Recording';
            recordingStatus.classList.add('hidden');
            transcriptionStatus.classList.remove('hidden');
            console.log('Recording stopped');
        }
    }

    function transcribeAudio() {
        var audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        var formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Transcription:', data.text);
            addFile('Recording_' + new Date().toISOString() + '.md', data.text);
            transcriptionStatus.classList.add('hidden');
        })
        .catch(error => {
            console.error('Error:', error);
            transcriptionStatus.classList.add('hidden');
        });
    }

    // Initial render
    renderFiles();
});