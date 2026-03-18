import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import axios from "axios";
import "./MarkAttendance.css";

const BACKEND = "https://smartattend-backend.vercel.app";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const MarkAttendance = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [registeredEmployees, setRegisteredEmployees] = useState([]);

  const [status, setStatus] = useState("Initializing...");
  const [statusType, setStatusType] = useState("info");
  const [recognizedName, setRecognizedName] = useState(null);
  const [overlayState, setOverlayState] = useState(null); // 'success' | 'already' | null
  const [lastAttendance, setLastAttendance] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayRecords, setTodayRecords] = useState([]);

  // Load models, camera, and employees
  useEffect(() => {
    const init = async () => {
      try {
        setStatus("Loading face recognition AI...");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        setIsModelLoaded(true);
        setStatus("Loading employee data...");
        await fetchEmployees();
        startCamera();
      } catch {
        setStatus("Failed to initialize. Please refresh.");
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
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setStatus("Camera not accessible. Allow camera permissions.");
        setStatusType("error");
      });
  };

  const fetchEmployees = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("Please login first.");
      setStatusType("error");
      return;
    }
    try {
      const res = await axios.get(`${BACKEND}/api/employees/with-encodings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const valid = (res.data || []).filter(
        (e) => e.encoding && e.encoding.length === 128
      );
      setRegisteredEmployees(valid);
      if (valid.length === 0) {
        setStatus("No registered employees found. Please register faces first.");
        setStatusType("error");
      }
    } catch {
      setStatus("Error loading employees. Please refresh.");
      setStatusType("error");
    }
  };

  // Build face matcher whenever employees are loaded
  useEffect(() => {
    if (!isModelLoaded || registeredEmployees.length === 0) return;
    const descriptors = registeredEmployees.map(
      (e) =>
        new faceapi.LabeledFaceDescriptors(e.name, [new Float32Array(e.encoding)])
    );
    setFaceMatcher(new faceapi.FaceMatcher(descriptors, 0.55));
    setStatus("Ready — point your face at the camera.");
    setStatusType("info");
  }, [isModelLoaded, registeredEmployees]);
  // Keep refs so the detection loop can always read the latest values
  // without needing to restart when they change
  const faceMatcherRef = useRef(null);
  const registeredEmployeesRef = useRef([]);
  const isProcessingRef = useRef(false);
  const lastAttendanceRef = useRef({});

  // Sync refs whenever state changes
  useEffect(() => { faceMatcherRef.current = faceMatcher; }, [faceMatcher]);
  useEffect(() => { registeredEmployeesRef.current = registeredEmployees; }, [registeredEmployees]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { lastAttendanceRef.current = lastAttendance; }, [lastAttendance]);

  // Face detection loop — starts as soon as models are ready
  useEffect(() => {
    if (!isModelLoaded) return;
    let animFrameId;

    const detect = async () => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        videoRef.current.paused ||
        videoRef.current.videoWidth === 0
      ) {
        animFrameId = setTimeout(detect, 300);
        return;
      }

      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      canvasRef.current.width = vw;
      canvasRef.current.height = vh;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, vw, vh);

      if (detections.length === 0) {
        setRecognizedName(null);
        animFrameId = setTimeout(detect, 300);
        return;
      }

      const resized = faceapi.resizeResults(detections, { width: vw, height: vh });

      resized.forEach((det, i) => {
        const raw = detections[i];
        const box = det.detection.box;
        const mx = vw - box.x - box.width; // mirror x to match CSS-mirrored video

        const matcher = faceMatcherRef.current;

        if (matcher && raw.descriptor) {
          // We have registered employees — try to match
          const best = matcher.findBestMatch(raw.descriptor);
          const recognized = best.label !== "unknown";
          drawSmartBox(ctx, mx, box.y, box.width, box.height, best.label, recognized);

          if (recognized && !isProcessingRef.current) {
            setRecognizedName(best.label);
            handleAttendance(best.label);
          } else if (!recognized) {
            setRecognizedName(null);
          }
        } else {
          // No matcher yet — still draw a neutral "detected" box
          drawSmartBox(ctx, mx, box.y, box.width, box.height, null, null);
        }
      });

      animFrameId = setTimeout(detect, 300);
    };

    const onPlay = () => { animFrameId = setTimeout(detect, 300); };

    if (videoRef.current) {
      videoRef.current.addEventListener("play", onPlay);
      if (!videoRef.current.paused) onPlay();
    }

    return () => {
      clearTimeout(animFrameId);
      if (videoRef.current) {
        videoRef.current.removeEventListener("play", onPlay);
      }
    };
  }, [isModelLoaded]); // Only depends on isModelLoaded — refs handle the rest


  const drawSmartBox = (ctx, x, y, w, h, label, recognized) => {
    const color = recognized ? "#34d399" : recognized === false ? "#f87171" : "#a3a3a3"; // Neutral gray if recognized is null
    const cornerLen = Math.min(w, h) * 0.2;
    const lw = 3;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;

    // Corner brackets
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

    // Scanning line
    const progress = (Date.now() % 1800) / 1800;
    const scanY = y + h * progress;
    const grad = ctx.createLinearGradient(x, scanY - 15, x, scanY + 15);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, `${color}60`);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(x, scanY - 15, w, 30);

    // Name label
    if (recognized) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillText(label, x + 4, y - 8);
    }

    ctx.restore();
  };

  const handleAttendance = useCallback(
    async (empName) => {
      // Use refs for the latest values — avoids stale closures from the detection loop
      const employees = registeredEmployeesRef.current;
      const employee = employees.find((e) => e.name === empName);
      if (!employee) return;

      const now = Date.now();
      const lastMark = lastAttendanceRef.current[employee._id] || 0;
      if (now - lastMark < COOLDOWN_MS) {
        setOverlayState("already");
        setStatus(`${empName}'s attendance is already marked for today.`);
        setStatusType("info");
        setTimeout(() => setOverlayState(null), 3000);
        return;
      }

      setIsProcessing(true);
      const token = localStorage.getItem("token");
      try {
        const res = await axios.post(
          `${BACKEND}/api/attendance`,
          { employeeId: employee._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 201 || res.status === 200) {
          setLastAttendance((p) => ({ ...p, [employee._id]: now }));
          setTodayRecords((p) => [
            { name: empName, time: new Date().toLocaleTimeString() },
            ...p,
          ]);
          setOverlayState("success");
          setStatus(`✓ ${empName} — Attendance marked!`);
          setStatusType("success");
          localStorage.setItem("dashboardRefresh", Date.now().toString());
          setTimeout(() => setOverlayState(null), 3000);
        }
      } catch (err) {
        if (err.response?.status === 400) {
          setLastAttendance((p) => ({ ...p, [employee._id]: now }));
          setOverlayState("already");
          setStatus(`${empName}'s attendance already marked for today.`);
          setTimeout(() => setOverlayState(null), 3000);
        } else {
          setStatus("Error marking attendance. Please try again.");
          setStatusType("error");
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [] // No deps needed — everything is read from refs
  );

  return (
    <div className="ma-page">
      {/* Overlay feedback */}
      {overlayState && (
        <div className={`ma-overlay ma-overlay-${overlayState}`}>
          <div className="ma-overlay-icon">
            {overlayState === "success" ? "✓" : "ℹ"}
          </div>
          <div className="ma-overlay-text">
            {overlayState === "success"
              ? `${recognizedName} — Attendance Marked!`
              : `Already marked for today`}
          </div>
        </div>
      )}

      <div className="ma-layout">
        {/* Left: Camera */}
        <div className="ma-camera-section">
          <div className="ma-cam-header">
            <div className="ma-live-badge">
              <span className="ma-live-dot" /> LIVE
            </div>
            <h1>Mark Attendance</h1>
          </div>

          <div className="ma-video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="ma-video"
            />
            <canvas ref={canvasRef} className="ma-canvas" />
          </div>

          <div className={`ma-status ma-status-${statusType}`}>{status}</div>
        </div>

        {/* Right: Info Panel */}
        <div className="ma-panel">
          <div className="ma-panel-recognized">
            <div className="ma-panel-icon">
              {recognizedName ? "🟢" : "⚪"}
            </div>
            <div>
              <div className="ma-panel-label">Detected</div>
              <div className="ma-panel-name">
                {recognizedName || "Scanning..."}
              </div>
            </div>
          </div>

          <div className="ma-panel-stats">
            <div className="ma-stat">
              <span className="ma-stat-value">{registeredEmployees.length}</span>
              <span className="ma-stat-label">Registered</span>
            </div>
            <div className="ma-stat">
              <span className="ma-stat-value">{todayRecords.length}</span>
              <span className="ma-stat-label">Marked Today</span>
            </div>
          </div>

          {/* Today's log */}
          <div className="ma-log">
            <h3>Today's Log</h3>
            {todayRecords.length === 0 ? (
              <p className="ma-log-empty">No attendance marked yet in this session.</p>
            ) : (
              <ul>
                {todayRecords.map((r, i) => (
                  <li key={i}>
                    <span className="ma-log-name">{r.name}</span>
                    <span className="ma-log-time">{r.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            className="ma-btn ma-btn-secondary"
            onClick={() => navigate("/register-face")}
          >
            Register New Employee →
          </button>
          <button
            className="ma-btn ma-btn-ghost"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
