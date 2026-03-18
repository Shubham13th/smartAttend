import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import axios from "axios";
import "./RegisterFace.css";

const BACKEND = "https://smartattend-backend.vercel.app";

const captureAngles = ["Front", "Left", "Right", "Up", "Down"];

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
  "Technical Support Engineer",
];

const RegisterFace = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [accumulatedEncodings, setAccumulatedEncodings] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");

  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info"); // 'info' | 'success' | 'error'
  const [faceDetected, setFaceDetected] = useState(false);

  // Load models & start video
  useEffect(() => {
    const init = async () => {
      try {
        setStatus("Loading face AI models...");
        setStatusType("info");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        setIsModelLoaded(true);
        setStatus("Camera ready. Please fill in the details below.");
        startCamera();
      } catch {
        setStatus("Error loading models. Please refresh the page.");
        setStatusType("error");
      }
    };
    init();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setStatus("Cannot access camera. Please allow camera permission.");
        setStatusType("error");
      });
  };

  // Continuous face preview on canvas (just box, no recognition)
  useEffect(() => {
    if (!isModelLoaded) return;
    const interval = setInterval(async () => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        videoRef.current.paused ||
        videoRef.current.videoWidth === 0
      )
        return;

      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      canvasRef.current.width = vw;
      canvasRef.current.height = vh;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      setFaceDetected(detections.length > 0);

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, vw, vh);

      const displaySize = { width: vw, height: vh };
      const resized = faceapi.resizeResults(detections, displaySize);

      resized.forEach((det) => {
        const box = det.detection.box;
        // Mirror x so the box lines up with the CSS-mirrored video
        const mx = vw - box.x - box.width;
        drawFaceBox(ctx, mx, box.y, box.width, box.height, isCapturing);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isModelLoaded, isCapturing]);

  const drawFaceBox = (ctx, x, y, w, h, scanning) => {
    const color = scanning ? "#facc15" : "#34d399";
    const cornerLen = 20;
    const lw = 3;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Draw 4 corner brackets
    const corners = [
      [x, y, 1, 1],
      [x + w, y, -1, 1],
      [x, y + h, 1, -1],
      [x + w, y + h, -1, -1],
    ];
    corners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * cornerLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * cornerLen, cy);
      ctx.stroke();
    });

    // Scanning line animation
    if (scanning) {
      const progress = (Date.now() % 1500) / 1500;
      const scanY = y + h * progress;
      ctx.save();
      const grad = ctx.createLinearGradient(x, scanY - 10, x, scanY + 10);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, "#facc1580");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(x, scanY - 10, w, 20);
      ctx.restore();
    }

    ctx.restore();
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !department) {
      setStatus("Please fill in Name, Email, and Department.");
      setStatusType("error");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("Please login first.");
      setStatusType("error");
      return;
    }
    setIsCapturing(true);
    setCurrentAngle(0);
    setAccumulatedEncodings([]);
    setStatus(`Step 1 / ${captureAngles.length}: Look FRONT at the camera.`);
    setStatusType("info");
  };

  const captureFace = async () => {
    if (!isModelLoaded || !videoRef.current?.srcObject) return;
    if (videoRef.current.readyState < 2) {
      setStatus("Camera not ready yet, please wait...");
      return;
    }

    setStatus("Scanning face...");
    const det = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!det || !det.descriptor) {
      setStatus("No face detected. Make sure your face is clearly visible.");
      setStatusType("error");
      return;
    }

    const newEncodings = [...accumulatedEncodings, Array.from(det.descriptor)];
    setAccumulatedEncodings(newEncodings);

    if (currentAngle < captureAngles.length - 1) {
      const next = currentAngle + 1;
      setCurrentAngle(next);
      setStatus(
        `Step ${next + 1} / ${captureAngles.length}: Now look ${captureAngles[next].toUpperCase()}.`
      );
      setStatusType("info");
    } else {
      // Submit
      await submitRegistration(newEncodings);
    }
  };

  const submitRegistration = async (encodings) => {
    setStatus("Finalizing registration...");
    setStatusType("info");
    const token = localStorage.getItem("token");

    try {
      const payload = {
        name,
        email,
        department,
        encoding: encodings[0],
        angle: "All",
      };
      const userDataStr = localStorage.getItem("userData");
      if (userDataStr) {
        try {
          const ud = JSON.parse(userDataStr);
          if (ud.companyId) payload.companyId = ud.companyId;
        } catch (_) {}
      }

      const res = await axios.post(`${BACKEND}/api/employees/register`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200 || res.status === 201) {
        setStatus(`✓ ${name} registered successfully!`);
        setStatusType("success");
        setIsCapturing(false);
        setCurrentAngle(0);
        setAccumulatedEncodings([]);
        setName("");
        setEmail("");
        setDepartment("");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error;
      if (err.response?.status === 409) {
        setStatus("An employee with this email already exists.");
      } else {
        setStatus(`Error: ${msg || err.message}`);
      }
      setStatusType("error");
      setIsCapturing(false);
      setCurrentAngle(0);
      setAccumulatedEncodings([]);
    }
  };

  const progressPct = isCapturing
    ? Math.round((currentAngle / captureAngles.length) * 100)
    : 0;

  return (
    <div className="rf-page">
      {/* Header */}
      <div className="rf-header">
        <div className="rf-header-icon">👤</div>
        <h1>Register Employee Face</h1>
        <p>Capture multiple angles to ensure accurate recognition</p>
      </div>

      <div className="rf-layout">
        {/* Left: Form */}
        <div className="rf-form-card">
          <h2>Employee Details</h2>

          <div className="rf-field">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCapturing}
            />
          </div>
          <div className="rf-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isCapturing}
            />
          </div>
          <div className="rf-field">
            <label>Department / Role</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isCapturing}
            >
              <option value="">Select a role...</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Angle steps */}
          {isCapturing && (
            <div className="rf-angles">
              {captureAngles.map((angle, i) => (
                <div
                  key={angle}
                  className={`rf-angle-step ${
                    i < currentAngle
                      ? "done"
                      : i === currentAngle
                      ? "active"
                      : ""
                  }`}
                >
                  {i < currentAngle ? "✓" : i + 1}
                  <span>{angle}</span>
                </div>
              ))}
            </div>
          )}

          {isCapturing && (
            <div className="rf-progress-bar">
              <div className="rf-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          )}

          {!isCapturing ? (
            <button className="rf-btn rf-btn-primary" onClick={handleRegister}>
              Start Registration
            </button>
          ) : (
            <button className="rf-btn rf-btn-capture" onClick={captureFace}>
              📸 Capture — {captureAngles[currentAngle]} Angle
            </button>
          )}

          <button
            className="rf-btn rf-btn-secondary"
            onClick={() => navigate("/mark-attendance")}
          >
            Go to Mark Attendance →
          </button>
          <button
            className="rf-btn rf-btn-ghost"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        {/* Right: Camera */}
        <div className="rf-camera-card">
          <div className="rf-camera-label">
            <span className={`rf-dot ${faceDetected ? "active" : ""}`} />
            {faceDetected ? "Face Detected" : "No Face Detected"}
          </div>

          <div className="rf-video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="rf-video"
            />
            <canvas ref={canvasRef} className="rf-canvas" />
          </div>

          {/* Status message */}
          {status && (
            <div className={`rf-status rf-status-${statusType}`}>{status}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterFace;
