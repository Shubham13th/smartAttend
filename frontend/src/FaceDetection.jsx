import  { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from 'axios';

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [faceMatcher, setFaceMatcher] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // User input for registration
  const [name, setName] = useState("");

  // Fetched from backend: each student has { _id, name, encoding }
  const [registeredStudents, setRegisteredStudents] = useState([]);

  // For displaying recognized name in UI
  const [recognizedStudent, setRecognizedStudent] = useState("Unknown");

  // 1. Load face-api.js models, start webcam, and fetch students
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Loading models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        console.log("Models loaded successfully");

        setIsModelLoaded(true);
        startVideo();
        fetchRegisteredStudents();
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    loadModels();
  }, []);

  // 2. Start webcam
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Error accessing webcam:", err));
  };

  // 3. Fetch students from backend
  const fetchRegisteredStudents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/students");
      setRegisteredStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // 4. Register new student (capture face descriptor and send to backend)
  const handleRegister = async () => {
    if (!name.trim()) {
      alert("Please enter a name.");
      return;
    }

    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections || !detections.descriptor) {
      alert("No face detected. Please try again.");
      return;
    }

    console.log("Descriptor length:", detections.descriptor.length);

    // The backend expects "encoding" as an array of 128 floats
    const studentData = {
      name,
      encoding: Array.from(detections.descriptor),
    };

    try {
      await axios.post("http://localhost:5000/api/register", studentData);
      alert(`${name} registered successfully!`);
      fetchRegisteredStudents(); // Refresh the list
      setName("");
    } catch (error) {
      console.error("Error registering student:", error.response?.data || error);
      alert("Failed to register student.");
    }
  };

  // 5. Build FaceMatcher from registered students
  const initializeFaceMatcher = () => {
    if (!isModelLoaded || registeredStudents.length === 0) {
      console.warn("FaceMatcher not initialized: Models not loaded or no registered students.");
      setFaceMatcher(null);
      return;
    }

    try {
      // Filter out invalid encodings (not 128-length)
      const labeledDescriptors = registeredStudents
        .map((student) => {
          if (!student.encoding || student.encoding.length !== 128) {
            console.warn(`Skipping invalid descriptor for ${student.name}`);
            return null;
          }
          return new faceapi.LabeledFaceDescriptors(
            student.name,
            [new Float32Array(student.encoding)]
          );
        })
        .filter(Boolean);

      if (labeledDescriptors.length === 0) {
        console.error("Error: No valid labeled face descriptors found.");
        setFaceMatcher(null);
        return;
      }

      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      setFaceMatcher(matcher);
    } catch (error) {
      console.error("Error initializing FaceMatcher:", error);
    }
  };

  // Whenever we get new students or load models, re-initialize the matcher
  useEffect(() => {
    initializeFaceMatcher();
  }, [registeredStudents, isModelLoaded]);

  // 6. Handle video playing: set up detection loop
  const handleVideoOnPlay = async () => {
    if (!isModelLoaded || !faceMatcher) return;

    // Run detection every 2 seconds
    setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      // Use actual video dimensions to align bounding boxes correctly
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Detect faces
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Resize to match video’s size
      const displaySize = { width: videoWidth, height: videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Clear previous drawings
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw bounding boxes & landmarks
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

      let detectedName = "Unknown";

      if (faceMatcher) {
        resizedDetections.forEach((detection) => {
          // Check if descriptor is valid
          if (!detection.descriptor || detection.descriptor.length !== 128) {
            console.warn("Invalid face descriptor detected, skipping...");
            return;
          }

          // Find best match
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          detectedName = bestMatch.label;

          // Draw a labeled box
          const { box } = detection.detection;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: bestMatch.toString(),
          });
          drawBox.draw(canvasRef.current);
        });
      }

      // Update recognized name in UI
      setRecognizedStudent(detectedName);

      // If recognized, mark attendance
      if (detectedName !== "Unknown") {
        markAttendance(detectedName);
      }
    }, 2000);
  };

  // 7. Mark attendance for recognized student
  const markAttendance = async (studentName) => {
    try {
      const student = registeredStudents.find((s) => s.name === studentName);
      if (!student) return; // No match in our DB

      await axios.post("http://localhost:5000/api/attendance", {
        studentId: student._id,
      });
      console.log(`${studentName}'s attendance recorded.`);
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 p-6">
    <h1 className="text-3xl font-extrabold text-white mb-6 drop-shadow-lg">
      Face Recognition System
    </h1>
  
    {/* Registration Form */}
    <div className="bg-white shadow-lg rounded-2xl p-6 mb-6 w-full max-w-md flex flex-col items-center">
      <input
        className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button 
        onClick={handleRegister}
        className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
      >
        Capture Face
      </button>
    </div>
  
    {/* Video & Canvas */}
    <div className="relative border-4 border-white rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        onPlay={handleVideoOnPlay}
        className="rounded-lg"
      />
      <canvas
        ref={canvasRef}
        className="absolute left-0 top-0"
      />
    </div>
  
    {/* Detected Name */}
    <h2 className="mt-6 text-xl font-semibold text-white bg-white bg-opacity-20 px-4 py-2 rounded-lg shadow-md">
      Detected Student: <span className="text-yellow-300">{recognizedStudent}</span>
    </h2>
  </div>
  
  );
};

export default FaceDetection;
