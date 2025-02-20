import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const FaceDetection = () => {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [studentName, setStudentName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [faceMatcher, setFaceMatcher] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false); // Track if models are loaded

    // Load models and initialize video stream
    useEffect(() => {
        const loadModels = async () => {
            try {
                console.log('Loading models...');
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
                await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
                setModelsLoaded(true); // Set modelsLoaded to true after loading the models
                console.log('Models loaded successfully');
            } catch (error) {
                console.error('Error loading face-api models:', error);
                alert('Failed to load face detection models. Please try again.');
            }
        };

        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                };
            } catch (error) {
                console.error('Error accessing camera:', error);
                alert('Error accessing camera. Please allow camera access.');
            }
        };

        loadModels().then(startVideo);

        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Fetch students and initialize face matcher
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/students');
                const data = await response.json();
                setStudents(data);

                const labeledDescriptors = data.map(student =>
                    new faceapi.LabeledFaceDescriptors(student.name, [new Float32Array(student.encoding)])
                );

                setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors));
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents();
    }, []);

    // Handle face detection and attendance marking
    const detectFaces = useCallback(async () => {
        if (!modelsLoaded || !faceMatcher) return; // Ensure models are loaded and faceMatcher is available

        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (detections.length === 0) return;

        detections.forEach(async (detection) => {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

            if (bestMatch.label !== 'unknown') {
                const student = students.find(s => s.name === bestMatch.label);
                if (student) {
                    await markAttendance(student._id);
                }
            }
        });

        const canvas = canvasRef.current;
        faceapi.matchDimensions(canvas, videoRef.current);
        const resizedDetections = faceapi.resizeResults(detections, videoRef.current);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    }, [faceMatcher, students, modelsLoaded]);

    useEffect(() => {
        const interval = setInterval(detectFaces, 1000);
        return () => clearInterval(interval);
    }, [detectFaces]);

    // Register student face encoding
    const handleRegister = async () => {
        if (!studentName) {
            alert('Please enter a student name');
            return;
        }
        if (isLoading) return;

        setIsLoading(true);

        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (detections.length === 0) {
            alert('No face detected');
            setIsLoading(false);
            return;
        }

        const encoding = Array.from(detections[0].descriptor);

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: studentName, encoding }),
            });

            if (!response.ok) {
                throw new Error('Failed to register student');
            }

            const data = await response.json();
            alert('Student registered successfully');
            setStudents([...students, data.student]);

            // Update face matcher with new student
            setFaceMatcher(new faceapi.FaceMatcher([
                ...faceMatcher.labeledDescriptors,
                new faceapi.LabeledFaceDescriptors(data.student.name, [new Float32Array(data.student.encoding)])
            ]));

        } catch (error) {
            console.error('Error registering student:', error);
            alert('Error registering student');
        } finally {
            setIsLoading(false);
            setStudentName('');
        }
    };

    // Mark attendance for student
    const markAttendance = async (studentId) => {
        try {
            const response = await fetch('http://localhost:5000/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            });

            const result = await response.json();
            console.log('Attendance marked:', result);
        } catch (error) {
            console.error('Error marking attendance:', error);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <video ref={videoRef} autoPlay muted width="720" height="560" />
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
            <div>
                <input
                    type="text"
                    placeholder="Enter student name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                />
                <button onClick={handleRegister} disabled={isLoading}>
                    {isLoading ? 'Registering...' : 'Register Student'}
                </button>
            </div>
        </div>
    );
};

export default FaceDetection;
