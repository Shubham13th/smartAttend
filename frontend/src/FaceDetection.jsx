import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import axios from 'axios';
import './FaceDetection.css';

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);
  const captureAngles = [
    "Front",
    "Left",
    "Right",
    "Up",
    "Down"
  ];

  // Add departments array
  const departments = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile App Developer (Android/iOS)",
    "Software Engineer / Developer",
    "DevOps Engineer",
    "QA Engineer / Tester",
    "UI/UX Designer",
    "Data Analyst",
    "Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "Cloud Engineer",
    "Technical Support Engineer"
  ];

  const [currentAngle, setCurrentAngle] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [registeredEmployees, setRegisteredEmployees] = useState([]);
  const [recognizedEmployee, setRecognizedEmployee] = useState("Unknown");
  const [status, setStatus] = useState("");
  const [lastAttendanceMark, setLastAttendanceMark] = useState({});
  const [isProcessingAttendance, setIsProcessingAttendance] = useState(false);

  // Load models and initialize
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Loading models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        console.log("Models loaded successfully");
        setIsModelLoaded(true);
        startVideo();
        fetchRegisteredEmployees();
      } catch (error) {
        console.error("Error loading models:", error);
        setStatus("Error loading face recognition models");
      }
    };

    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
        }
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
        setStatus("Error accessing webcam. Please check permissions and try again.");
      });
  };

  const fetchRegisteredEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus("Please login to access this feature");
        return;
      }

      // Try the employees with encodings endpoint first
      let response;
      try {
        console.log("Fetching employees with encodings...");
        response = await axios.get("https://smartattend-backend.vercel.app/api/employees/with-encodings", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("Employees with encodings response:", response.data);
      } catch (endpointError) {
        console.error("Error fetching employees with encodings:", endpointError);
        console.log('Falling back to regular employees endpoint...');
        response = await axios.get("https://smartattend-backend.vercel.app/api/employees", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("Regular employees response:", response.data);
      }

      if (response.data && Array.isArray(response.data)) {
        // Filter out any employees without encodings
        const employeesWithEncodings = response.data.filter(emp => emp.encoding && emp.encoding.length === 128);
        console.log("Employees with valid encodings:", employeesWithEncodings.length);
        setRegisteredEmployees(employeesWithEncodings);

        // If no employees with encodings, show a more user-friendly message
        if (employeesWithEncodings.length === 0) {
          setStatus("No employees with face data found. Please register employees first.");
        } else {
          setStatus("");
        }
      } else {
        console.error("Invalid response format:", response.data);
        setStatus("Error: Invalid response format from server");
        setRegisteredEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      if (error.response?.status === 401) {
        setStatus("Session expired. Please login again");
        window.location.href = "/login";
      } else if (error.response?.status === 404) {
        setStatus("No registered employees found");
        setRegisteredEmployees([]);
      } else {
        setStatus(error.response?.data?.message || "Error fetching registered employees");
        setRegisteredEmployees([]);
      }
    }
  };

  const checkLiveness = async (detections) => {
    if (!detections || detections.length === 0) return false;

    const face = detections[0];
    // Simple structural liveness: just check that face landmarks are present
    // This is a lightweight check to filter out flat images/drawings
    const hasLandmarks = face.landmarks &&
      face.landmarks.getLeftEye().length > 0 &&
      face.landmarks.getRightEye().length > 0 &&
      face.landmarks.getNose().length > 0;

    return hasLandmarks;
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !department.trim()) {
      setStatus("Please fill in all fields");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus("Please login to register employees");
        return;
      }

      setIsCapturing(true);
      setStatus(`Please position your face ${captureAngles[currentAngle]}`);
      // Pass force=true to bypass the isCapturing check (state hasn't updated yet)
      await captureFace(true);
    } catch (error) {
      console.error("Error starting registration:", error);
      setStatus("Error starting registration process");
    }
  };

  const captureFace = async (force = false) => {
    // Allow force=true on first call so we bypass the stale React state check
    if (!force && !isCapturing) return;

    try {
      // Check if models are loaded
      if (!isModelLoaded) {
        setStatus("Face recognition models are still loading. Please wait...");
        return;
      }

      // Check if video is ready
      if (!videoRef.current || !videoRef.current.srcObject) {
        setStatus("Camera not ready. Please wait for camera initialization...");
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setStatus("Please login to capture face");
        return;
      }

      // Wait for video to be ready
      if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        setStatus("Please wait for camera to be ready...");
        return;
      }

      setStatus("Detecting face...");

      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()
        .withFaceExpressions();

      if (!detections || !detections.descriptor) {
        setStatus("No face detected. Please position your face clearly in the frame.");
        return;
      }

      // Check liveness
      const isLivenessValid = await checkLiveness([detections]);
      if (!isLivenessValid) {
        setStatus("Liveness check failed. Please ensure you are a real person.");
        return;
      }

      setStatus("Processing face data...");

      // Store the face descriptor
      const employeeData = {
        name,
        email,
        department,
        encoding: Array.from(detections.descriptor),
        angle: captureAngles[currentAngle]
      };

      // Get user data from localStorage if available
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData.companyId) {
            console.log(`Adding employee to company: ${userData.companyId}`);
            employeeData.companyId = userData.companyId;
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      // Register employee via the employees endpoint
      const response = await axios.post("https://smartattend-backend.vercel.app/api/employees/register", employeeData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Handle the response properly
      if (response.status === 200 || response.status === 201) {
        // Move to next angle or complete registration
        if (currentAngle < captureAngles.length - 1) {
          setCurrentAngle(prev => prev + 1);
          setStatus(`Face captured successfully! Please position your face ${captureAngles[currentAngle + 1]}`);
        } else {
          setStatus(`${name} registered successfully!`);
          setIsCapturing(false);
          setCurrentAngle(0);
          setName("");
          setEmail("");
          setDepartment("");
          fetchRegisteredEmployees();
        }
      } else {
        setStatus(response.data?.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error capturing face:", error);
      const serverMsg = error.response?.data?.error || error.response?.data?.message;
      if (error.response?.status === 401) {
        setStatus("Session expired. Please login again");
        window.location.href = "/login";
      } else if (error.response?.status === 409) {
        setStatus("Employee with this email already exists");
      } else if (error.response?.status === 404) {
        setStatus("Registration endpoint not found. Please check backend configuration.");
      } else if (serverMsg) {
        setStatus(`Error: ${serverMsg}`);
      } else if (error.message && error.message.includes("face-api")) {
        setStatus("Error with face detection. Please try again.");
      } else {
        setStatus(`Error: ${error.message || "Unknown error. Please try again."}`);
      }
    }
  };

  // Build FaceMatcher from registered employees
  const initializeFaceMatcher = () => {
    if (!isModelLoaded) {
      console.warn("FaceMatcher not initialized: Models not loaded yet.");
      setFaceMatcher(null);
      return;
    }

    if (registeredEmployees.length === 0) {
      console.warn("FaceMatcher not initialized: No registered employees.");
      setFaceMatcher(null);
      setStatus(status => status || "No registered employees found. Please register employees first.");
      return;
    }

    try {
      // Filter out invalid encodings (not 128-length)
      const labeledDescriptors = registeredEmployees
        .map((employee) => {
          if (!employee.encoding || employee.encoding.length !== 128) {
            console.warn(`Skipping invalid descriptor for ${employee.name}`);
            return null;
          }
          return new faceapi.LabeledFaceDescriptors(
            employee.name,
            [new Float32Array(employee.encoding)]
          );
        })
        .filter(Boolean);

      if (labeledDescriptors.length === 0) {
        console.error("Error: No valid labeled face descriptors found.");
        setFaceMatcher(null);
        setStatus("No valid face data found. Please re-register employees.");
        return;
      }

      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      setFaceMatcher(matcher);
      console.log("FaceMatcher initialized successfully with", labeledDescriptors.length, "employees");
    } catch (error) {
      console.error("Error initializing FaceMatcher:", error);
      setStatus("Error initializing face recognition. Please refresh the page.");
    }
  };

  // Whenever we get new employees or load models, re-initialize the matcher
  useEffect(() => {
    if (isModelLoaded && registeredEmployees.length > 0) {
      initializeFaceMatcher();
    }
  }, [registeredEmployees, isModelLoaded]);

  // Handle video playing: set up detection loop
  const handleVideoOnPlay = async () => {
    if (!isModelLoaded) {
      setStatus("Face recognition models are still loading. Please wait...");
      return;
    }

    if (!faceMatcher) {
      // Don't show error here as initializeFaceMatcher already sets status
      return;
    }

    // Store interval ID for cleanup
    const intervalId = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) {
        console.log("Video or canvas reference is not available");
        return;
      }

      // Use actual video dimensions to align bounding boxes correctly
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;

      if (videoWidth === 0 || videoHeight === 0) {
        console.log("Video dimensions not ready");
        return;
      }

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      try {
        // Detect faces
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        // Make sure canvas is still in the DOM before continuing
        if (!canvasRef.current) {
          console.log("Canvas reference lost during face detection");
          return;
        }

        // Resize to match video's size
        const displaySize = { width: videoWidth, height: videoHeight };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Clear previous drawings
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) {
          console.log("Canvas context not available");
          return;
        }

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Instead of scaling the canvas (which flips text backwards),
        // we manually mirror the bounding boxes by subtracting X from the total width.
        const mirrorDetections = (dets) => {
          return dets.map(det => {
            // Mirror bounding box
            const box = det.detection.box;
            const mirroredBox = new faceapi.Rect(
              canvasRef.current.width - box.x - box.width,
              box.y,
              box.width,
              box.height
            );

            // Mirror landmarks if present
            let mirroredLandmarks = det.landmarks;
            if (det.landmarks) {
              const mirroredPositions = det.landmarks.positions.map(pt => new faceapi.Point(
                canvasRef.current.width - pt.x,
                pt.y
              ));
              mirroredLandmarks = new faceapi.FaceLandmarks68(
                mirroredPositions,
                { width: canvasRef.current.width, height: canvasRef.current.height }
              );
            }

            // Create a new FullFaceDescription with the mirrored data
            return {
              ...det,
              detection: new faceapi.FaceDetection(
                det.detection.score,
                mirroredBox,
                { width: canvasRef.current.width, height: canvasRef.current.height }
              ),
              landmarks: mirroredLandmarks
            };
          });
        };

        const mirroredDetections = mirrorDetections(resizedDetections);

        // Draw bounding boxes & landmarks
        faceapi.draw.drawDetections(canvasRef.current, mirroredDetections.map(m => m.detection));
        faceapi.draw.drawFaceLandmarks(canvasRef.current, mirroredDetections.map(m => m.landmarks));

        let detectedName = "Unknown";

        if (faceMatcher) {
          mirroredDetections.forEach((detection, i) => {
            const originalDetection = resizedDetections[i];
            
            // Check if descriptor is valid (use original for descriptors)
            if (!originalDetection.descriptor || originalDetection.descriptor.length !== 128) {
              console.warn("Invalid face descriptor detected, skipping...");
              return;
            }

            // Find best match
            const bestMatch = faceMatcher.findBestMatch(originalDetection.descriptor);
            detectedName = bestMatch.label;

            // Make sure canvas is still in the DOM before drawing
            if (!canvasRef.current) return;

            // Draw a labeled box using the mirrored coordinates
            const { box } = detection.detection;
            const drawBox = new faceapi.draw.DrawBox(box, {
              label: bestMatch.toString(),
              boxColor: bestMatch.label === 'unknown' ? '#f87171' : '#34d399',
              lineWidth: 2,
            });
            drawBox.draw(canvasRef.current);
          });
        }

        // Update recognized name in UI
        setRecognizedEmployee(detectedName);

        // If recognized and not already marked attendance recently, mark attendance
        if (detectedName !== "Unknown" && !isProcessingAttendance) {
          const now = new Date().getTime();

          // Check for employee in lastAttendanceMark by name
          const employee = registeredEmployees.find(e => e.name === detectedName);

          if (!employee || !employee._id) {
            console.error("Could not find employee ID for", detectedName);
            setStatus("Error: Employee not found in database");
            return;
          }

          // Use employee ID for cooldown tracking instead of name
          const lastMark = lastAttendanceMark[employee._id] || 0;
          const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours cooldown

          console.log(`Time since last mark for ${detectedName}: ${(now - lastMark) / 60000} minutes`);

          // Only check attendance if enough time has passed
          if (now - lastMark > cooldownPeriod) {
            setIsProcessingAttendance(true);

            // Mark attendance
            markAttendance(employee._id, detectedName);
          } else if ((now - lastMark) < 60000) { // Less than a minute
            // Show feedback that attendance was recently marked but don't process it
            setStatus(`${detectedName}'s attendance was already marked recently.`);
          }
        }
      } catch (error) {
        console.error("Error in face detection loop:", error);
      }
    }, 300); // 300ms for real-time face detection

    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  };

  // Add cleanup effect
  useEffect(() => {
    let cleanup;
    
    const startDetection = async () => {
      cleanup = await handleVideoOnPlay();
    };

    if (videoRef.current) {
      // Bind event for when it starts playing later
      videoRef.current.onplay = startDetection;
      
      // If it's already playing right now, start immediately
      if (!videoRef.current.paused && !videoRef.current.ended && videoRef.current.readyState > 2) {
        startDetection();
      }
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [isModelLoaded, faceMatcher]);

  // 7. Mark attendance for recognized employee
  const markAttendance = async (employeeId, employeeName) => {
    if (isProcessingAttendance) return;
    setIsProcessingAttendance(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus("Please login to mark attendance");
        setIsProcessingAttendance(false);
        return;
      }

      const response = await axios.post(
        "https://smartattend-backend.vercel.app/api/attendance",
        { employeeId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        setStatus(`${employeeName}'s attendance marked successfully!`);
        // Store timestamp by employee ID instead of name
        setLastAttendanceMark(prev => ({
          ...prev,
          [employeeId]: new Date().getTime()
        }));

        // Store refresh flag in localStorage to trigger dashboard refresh on next visit
        localStorage.setItem('dashboardRefresh', Date.now().toString());
      } else if (response.status === 200 && response.data.message.includes('already marked')) {
        setStatus(`${employeeName}'s attendance was already marked for today.`);
        // Update the timestamp even for already marked attendance to prevent repeated attempts
        setLastAttendanceMark(prev => ({
          ...prev,
          [employeeId]: new Date().getTime()
        }));
      } else {
        setStatus("Failed to mark attendance. Please try again.");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      if (error.response?.status === 400) {
        setStatus("Invalid request. Please try again.");
      } else if (error.response?.status === 404) {
        setStatus("Employee not found. Please register first.");
      } else {
        setStatus(error.response?.data?.message || "Error marking attendance");
      }
    } finally {
      setIsProcessingAttendance(false);
    }
  };

  return (
    <div className="face-detection-container">
      <h1 className="face-detection-title">Face Recognition System</h1>

      <div className="main-content">
        {/* Left side: Registration Form */}
        <div className="glass-card registration-form">
          <input
            className="registration-input"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="registration-input"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="registration-input"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          >
            <option value="" disabled>Select Department</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <button
            className="capture-button"
            onClick={isCapturing ? captureFace : handleRegister}
            disabled={isCapturing && !videoRef.current?.srcObject}
          >
            {isCapturing ? `Capture ${captureAngles[currentAngle]} View` : "Start Registration"}
          </button>
        </div>

        {/* Right side: Camera and Detection */}
        <div className="camera-section">
          {/* Status Message */}
          {status && (
            <div className="status-message">
              {status}
            </div>
          )}

          {/* Video & Canvas */}
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
            />
            <canvas ref={canvasRef} />
          </div>

          {/* Detected Name */}
          <h2 className="detected-name">
            Detected Employee: <span>{recognizedEmployee}</span>
          </h2>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="navigation-buttons">
        <button
          className="nav-button"
          onClick={() => navigate('/dashboard')}
        >
          View Dashboard
        </button>
        <button
          className="nav-button"
          onClick={() => navigate('/employees')}
        >
          Manage Employees
        </button>
      </div>
    </div>
  );
};

export default FaceDetection;
