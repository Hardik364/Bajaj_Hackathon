import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { X, Activity, Lightbulb, ChevronLeft, Trophy, Play, RefreshCw } from 'lucide-react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const EXERCISE_TYPES = [
  {
    id: 'pushup',
    name: 'Push-ups',
    description: 'Upper body strength exercise',
    points: 100,
    instructions: 'Keep your back straight and lower your chest until your elbows form 90 degrees',
    targetAngles: {
      elbow: { min: 60, max: 130 },
      back: { min: 150, max: 210 }
    },
    keypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist']
  },
  {
    id: 'squat',
    name: 'Squats',
    description: 'Lower body strength exercise',
    points: 150,
    instructions: 'Keep your back straight and lower your body until thighs are parallel to ground',
    targetAngles: {
      knee: { min: 70, max: 120 },
      hip: { min: 60, max: 120 }
    },
    keypoints: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle']
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'Lower body and balance exercise',
    points: 120,
    instructions: 'Step forward and lower your back knee towards the ground',
    targetAngles: {
      frontKnee: { min: 80, max: 110 },
      backKnee: { min: 80, max: 110 },
      torso: { min: 155, max: 205 }
    },
    keypoints: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle']
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'Core strength and stability exercise',
    points: 50,
    instructions: 'Maintain a straight line from head to heels',
    targetAngles: {
      elbow: { min: 80, max: 100 },
      back: { min: 165, max: 195 }
    },
    keypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist', 'left_hip', 'right_hip', 'left_ankle', 'right_ankle']
  }
];

function ExerciseDetection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Get exercise info from location state
  const exerciseType = location.state?.exerciseType;
  const challengeId = location.state?.challengeId;
  const targetReps = location.state?.targetReps;

  // Find the exercise configuration
  const currentExercise = EXERCISE_TYPES.find(ex => ex.id === exerciseType);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [isExerciseStarted, setIsExerciseStarted] = useState(false);
  const [exerciseStats, setExerciseStats] = useState({
    count: 0,
    accuracy: 0,
    feedback: '',
    score: 0
  });
  const [lastPoseState, setLastPoseState] = useState(null);
  const [stateConfidence, setStateConfidence] = useState(0);
  const detectionRef = useRef(null);
  const confidenceThreshold = 1.5;
  const lastValidPoseTime = useRef(Date.now());
  const MIN_POSE_INTERVAL = 250;

  const [challengeCompleted, setChallengeCompleted] = useState(false);

  // Initialize detector
  useEffect(() => {
    async function initializeDetector() {
      try {
        await tf.ready();
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
        };
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        setDetector(detector);
      } catch (error) {
        console.error('Error initializing detector:', error);
      }
    }
    initializeDetector();

    return () => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
    };
  }, []);

  // Set up webcam
  useEffect(() => {
    async function setupCamera() {
      if (!isExerciseStarted) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isExerciseStarted]);

  // Exercise setup effect
  useEffect(() => {
    if (exerciseType) {
      console.log('Setting up exercise:', exerciseType);
      setExerciseStats({
        count: 0,
        accuracy: 0,
        feedback: '',
        score: 0
      });
      setIsExerciseStarted(false);
    }
  }, [exerciseType]);

  // Pose detection effect
  useEffect(() => {
    async function detectPose() {
      if (!detector || !videoRef.current || !canvasRef.current || !isExerciseStarted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === 4) {
        try {
          const poses = await detector.estimatePoses(video);
          
          // Clear and draw video frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (poses.length > 0) {
            const pose = poses[0];
            
            // Draw skeleton
            drawPose(pose, ctx);
            
            // Calculate and check form
            const formCheck = checkExerciseForm(pose);
            
            if (formCheck) {
              // Draw form guidelines
              drawFormGuidelines(ctx, pose, currentExercise);
              
              // Draw angle measurements
              const angles = calculateExerciseAngles(pose, currentExercise);
              drawAngleMeasurements(ctx, pose, angles);
              
              // State management with accuracy threshold
              if (formCheck.state && formCheck.isValidPose && formCheck.accuracy > 40) {
                if (formCheck.state === lastPoseState) {
                  setStateConfidence(prev => Math.min(prev + 1.5, confidenceThreshold));
                } else {
                  if (Date.now() - lastValidPoseTime.current > MIN_POSE_INTERVAL) {
                    setStateConfidence(0);
                  }
                }

                // Count rep with accuracy threshold
                if (
                  (stateConfidence >= confidenceThreshold - 1.5 || 
                   Date.now() - lastValidPoseTime.current > MIN_POSE_INTERVAL) &&
                  formCheck.state !== lastPoseState
                ) {
                  if (formCheck.state === 'up' && lastPoseState === 'down') {
                    setExerciseStats(prev => ({
                      ...prev,
                      count: prev.count + 1,
                      score: (prev.count + 1) * Math.max(formCheck.accuracy, 60)
                    }));
                    lastValidPoseTime.current = Date.now();
                  }
                  setLastPoseState(formCheck.state);
                }
              } else {
                // Reset state confidence if accuracy is too low
                setStateConfidence(0);
              }

              // Update stats regardless of accuracy
              setExerciseStats(prev => ({
                ...prev,
                accuracy: formCheck.accuracy,
                feedback: formCheck.accuracy <= 50 
                  ? "Improve your form to count reps" 
                  : formCheck.feedback
              }));
            }
          }
        } catch (error) {
          console.error('Error in pose detection:', error);
        }
      }

      detectionRef.current = requestAnimationFrame(detectPose);
    }

    if (isExerciseStarted) {
      detectPose();
    }

    return () => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
    };
  }, [detector, isExerciseStarted, lastPoseState, currentExercise, stateConfidence]);

  // Modify the pose detection effect to check for completion
  useEffect(() => {
    if (challengeId && exerciseStats.count >= targetReps && !challengeCompleted) {
      // Only record and show completion for challenges
      recordExercise();
    }
  }, [exerciseStats.count, targetReps, challengeCompleted, challengeId]);

  // Improved angle calculation with confidence threshold
  const calculateAngle = (pointA, pointB, pointC, confidenceThreshold = 0.2) => {
    if (!pointA?.score || !pointB?.score || !pointC?.score) return null;
    if (pointA.score < confidenceThreshold || pointB.score < confidenceThreshold || pointC.score < confidenceThreshold) return null;

    const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                   Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  // Add a function to validate required keypoints
  const validateKeypoints = (pose, requiredKeypoints, confidenceThreshold = 0.2) => {
    if (!pose?.keypoints) return false;
    
    const minimumKeypoints = Math.floor(requiredKeypoints.length * 0.7);
    
    const validKeypoints = requiredKeypoints.filter(keypointName => {
      const keypoint = pose.keypoints.find(kp => kp.name === keypointName);
      return keypoint && keypoint.score >= confidenceThreshold;
    });

    return validKeypoints.length >= minimumKeypoints;
  };

  // Add a function to calculate exercise-specific angles
  const calculateExerciseAngles = (pose, exercise) => {
    const angles = {};
    
    switch (exercise.id) {
      case 'pushup':
        const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
        const leftElbow = pose.keypoints.find(kp => kp.name === 'left_elbow');
        const leftWrist = pose.keypoints.find(kp => kp.name === 'left_wrist');
        const rightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');
        const rightElbow = pose.keypoints.find(kp => kp.name === 'right_elbow');
        const rightWrist = pose.keypoints.find(kp => kp.name === 'right_wrist');
  
        angles.leftElbow = calculateAngle(leftShoulder, leftElbow, leftWrist);
        angles.rightElbow = calculateAngle(rightShoulder, rightElbow, rightWrist);
        break;
  
      case 'squat':
        const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
        const leftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
        const leftAnkle = pose.keypoints.find(kp => kp.name === 'left_ankle');
        const rightHip = pose.keypoints.find(kp => kp.name === 'right_hip');
        const rightKnee = pose.keypoints.find(kp => kp.name === 'right_knee');
        const rightAnkle = pose.keypoints.find(kp => kp.name === 'right_ankle');
  
        angles.leftKnee = calculateAngle(leftHip, leftKnee, leftAnkle);
        angles.rightKnee = calculateAngle(rightHip, rightKnee, rightAnkle);
        break;
  
      case 'lunges':
        const lungLeftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
        const lungLeftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
        const lungLeftAnkle = pose.keypoints.find(kp => kp.name === 'left_ankle');
        const lungRightHip = pose.keypoints.find(kp => kp.name === 'right_hip');
        const lungRightKnee = pose.keypoints.find(kp => kp.name === 'right_knee');
        const lungRightAnkle = pose.keypoints.find(kp => kp.name === 'right_ankle');
  
        angles.frontKnee = calculateAngle(lungLeftHip, lungLeftKnee, lungLeftAnkle);
        angles.backKnee = calculateAngle(lungRightHip, lungRightKnee, lungRightAnkle);
        break;
  
      case 'plank':
        const plankLeftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
        const plankLeftElbow = pose.keypoints.find(kp => kp.name === 'left_elbow');
        const plankLeftWrist = pose.keypoints.find(kp => kp.name === 'left_wrist');
        const plankRightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');
        const plankRightElbow = pose.keypoints.find(kp => kp.name === 'right_elbow');
        const plankRightWrist = pose.keypoints.find(kp => kp.name === 'right_wrist');
  
        angles.leftElbow = calculateAngle(plankLeftShoulder, plankLeftElbow, plankLeftWrist);
        angles.rightElbow = calculateAngle(plankRightShoulder, plankRightElbow, plankRightWrist);
        break;
    }
  
    return angles;
  };
  
  const determineExerciseState = (angles, exercise) => {
    let state = null;
    let feedback = '';
    let accuracy = 100;
  
    switch (exercise.id) {
      case 'pushup':
        const elbowAngle = angles.leftElbow || angles.rightElbow;
        const backAngle = angles.back;

        if (elbowAngle) {
          if (elbowAngle < exercise.targetAngles.elbow.min + 10) {
            state = 'down';
            feedback = 'Good, now push up';
          } else if (elbowAngle > exercise.targetAngles.elbow.max - 10) {
            state = 'up';
            feedback = 'Good, now go down slowly';
          }

          if (backAngle && (backAngle < exercise.targetAngles.back.min || backAngle > exercise.targetAngles.back.max)) {
            feedback = 'Try to keep your back straight';
            accuracy -= 20;
          }
        }
        break;
  
      case 'squat':
        const kneeAngle = angles.leftKnee || angles.rightKnee;
        const hipAngle = angles.leftHip || angles.rightHip;

        if (kneeAngle) {
          if (kneeAngle < exercise.targetAngles.knee.min + 10) {
            state = 'down';
            feedback = 'Good depth, now stand up';
          } else if (kneeAngle > exercise.targetAngles.knee.max - 10) {
            state = 'up';
            feedback = 'Good, now squat down';
          }

          if (hipAngle && (hipAngle < exercise.targetAngles.hip.min || hipAngle > exercise.targetAngles.hip.max)) {
            feedback = 'Try to keep your back straight';
            accuracy -= 20;
          }
        }
        break;
  
      case 'lunges':
        const frontKneeAngle = angles.frontKnee;
        const backKneeAngle = angles.backKnee;
        if (frontKneeAngle && backKneeAngle) {
          if (frontKneeAngle < exercise.targetAngles.frontKnee.min || 
              backKneeAngle < exercise.targetAngles.backKnee.min) {
            state = 'down';
            feedback = 'Good depth! Push back up';
          } else if (frontKneeAngle > exercise.targetAngles.frontKnee.max || 
                     backKneeAngle > exercise.targetAngles.backKnee.max) {
            state = 'up';
            feedback = 'Lunge deeper';
            accuracy -= 15;
          } else {
            state = 'transition';
            feedback = 'Good form! Keep going';
          }
        }
        break;
  
      case 'plank':
        const plankElbowAngle = angles.leftElbow || angles.rightElbow;
        if (plankElbowAngle) {
          if (plankElbowAngle < exercise.targetAngles.elbow.min) {
            state = 'incorrect';
            feedback = 'Raise your body slightly';
            accuracy -= 15;
          } else if (plankElbowAngle > exercise.targetAngles.elbow.max) {
            state = 'incorrect';
            feedback = 'Lower your body slightly';
            accuracy -= 15;
          } else {
            state = 'correct';
            feedback = 'Great plank form! Keep holding';
          }
        }
        break;
    }
  
    return { state, feedback, accuracy };
  };

  // Check exercise state and form with confidence tracking
  const checkExerciseForm = (pose) => {
    if (!currentExercise || !pose.keypoints) return null;

    // Validate required keypoints are visible
    const isValidPose = validateKeypoints(pose, currentExercise.keypoints);
    if (!isValidPose) {
      return {
        state: null,
        feedback: 'Please ensure your full body is visible',
        accuracy: 0,
        isValidPose: false
      };
    }

    // Calculate angles for the current exercise
    const angles = calculateExerciseAngles(pose, currentExercise);
    
    // Determine exercise state and feedback
    const { state, feedback, accuracy } = determineExerciseState(angles, currentExercise);

    return {
      state,
      feedback,
      accuracy,
      isValidPose: true
    };
  };

  // Add this function after your other helper functions
  const drawFormGuidelines = (ctx, pose, exercise) => {
    if (!pose || !exercise) return;

    // Set drawing styles for guidelines
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;

    // Draw exercise-specific guidelines
    switch (exercise.id) {
      case 'pushup':
        // Draw back alignment line
        const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
        const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
        if (leftShoulder?.score > 0.3 && leftHip?.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(leftShoulder.x, leftShoulder.y);
          ctx.lineTo(leftHip.x, leftHip.y);
          ctx.stroke();
        }
        break;

      case 'squat':
        // Draw depth line
        const leftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
        if (leftKnee?.score > 0.3) {
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, leftKnee.y);
          ctx.lineTo(ctx.canvas.width, leftKnee.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
    }
  };

  // Add this function to draw angle measurements
  const drawAngleMeasurements = (ctx, pose, angles) => {
    if (!pose || !angles) return;

    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;

    Object.entries(angles).forEach(([angleName, angle]) => {
      if (angle) {
        // Find appropriate keypoint to place text
        const keypoint = pose.keypoints.find(kp => kp.name.includes(angleName.toLowerCase()));
        if (keypoint?.score > 0.3) {
          const text = `${Math.round(angle)}°`;
          ctx.strokeText(text, keypoint.x + 10, keypoint.y + 10);
          ctx.fillText(text, keypoint.x + 10, keypoint.y + 10);
        }
      }
    });
  };

  // Rest of the component (drawPose and return statement) remains the same...
  const drawPose = (pose, ctx) => {
    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
      }
    });

    // Draw skeleton
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle']
    ];

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    connections.forEach(([first, second]) => {
      const firstPoint = pose.keypoints.find(kp => kp.name === first);
      const secondPoint = pose.keypoints.find(kp => kp.name === second);

      if (firstPoint?.score > 0.3 && secondPoint?.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(firstPoint.x, firstPoint.y);
        ctx.lineTo(secondPoint.x, secondPoint.y);
        ctx.stroke();
      }
    });
  };

  // Add this component for the exercise info overlay
  const ExerciseInfoOverlay = ({ exercise, stats, onEnd }) => {
    return (
      <div className="absolute top-4 left-4 bg-white/90 p-4 rounded-lg shadow-lg max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xl">{exercise.name}</h3>
          <button
            onClick={() => {
              // Cancel animation frame before ending
              if (detectionRef.current) {
                cancelAnimationFrame(detectionRef.current);
                detectionRef.current = null;
              }
              onEnd();
            }}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold text-blue-600">
            Reps: {stats.count}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-lg">Accuracy:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 rounded-full h-4 transition-all duration-300"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <span className="text-lg">{stats.accuracy}%</span>
          </div>
          <p className="text-lg">Score: {stats.score}</p>
          {stats.feedback && (
            <div className={`p-2 rounded ${
              stats.feedback.includes('Good') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {stats.feedback}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add this component for exercise instructions
  const ExerciseInstructions = ({ exercise }) => {
    const getTips = () => {
      switch (exercise.id) {
        case 'pushup':
          return "Keep your core tight and body straight throughout the movement";
        case 'squat':
          return "Keep your chest up, knees aligned with toes, and maintain proper depth";
        case 'plank':
          return "Maintain a straight line from head to heels, engage your core";
        case 'lunges':
          return "Keep your upper body straight, step forward with control";
        default:
          return "";
      }
    };

    return (
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg">
        <h4 className="font-semibold mb-2">{exercise.name} Instructions:</h4>
        <p>{exercise.instructions}</p>
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Tips: </span>
          {getTips()}
        </div>
      </div>
    );
  };

  // Add function to mark challenge as completed
  const markChallengeCompleted = async () => {
    try {
      const token = await currentUser.getIdToken();
      const exerciseConfig = EXERCISE_TYPES.find(ex => ex.id === exerciseType);
      const pointsEarned = exerciseConfig ? exerciseConfig.points : 0;

      await axios.put(
        `http://localhost:5001/challenges/${challengeId}/complete`,
        {
          completedReps: exerciseStats.count,
          accuracy: exerciseStats.accuracy,
          score: exerciseStats.score,
          points: pointsEarned
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setChallengeCompleted(true);
    } catch (error) {
      console.error('Error marking challenge as completed:', error);
    }
  };

  // Update the CompletionOverlay component
  const CompletionOverlay = () => {
    const exerciseConfig = EXERCISE_TYPES.find(ex => ex.id === exerciseType);
    const pointsEarned = exerciseConfig ? exerciseConfig.points : 0;

    const handleBackToChallenges = () => {
      // First stop the webcam
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      // Cancel any ongoing animation frame
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
      
      // Clean up state
      setIsExerciseStarted(false);
      setChallengeCompleted(false);
      
      // Navigate to challenges page
      navigate('/challenges');
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center max-w-md w-full mx-4 shadow-xl border dark:border-gray-700">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            Challenge Completed! 🎉
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-lg text-black dark:text-white">
              You've reached the target of {targetReps} reps!
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{pointsEarned} Points Earned!
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleBackToChallenges}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Challenges
            </button>
            <button
              onClick={() => {
                setIsExerciseStarted(false);
                setChallengeCompleted(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <RefreshCw className="h-5 w-5" />
              Continue Exercising
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Update the exercise selection UI
  const ExerciseSelection = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Choose Your Exercise</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EXERCISE_TYPES.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => {
              navigate('/exercise', {
                state: { 
                  exerciseType: exercise.id,
                  challengeId: null,
                  targetReps: null
                }
              });
            }}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:scale-105 border dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-black dark:text-white">{exercise.name}</h3>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-black dark:text-white mb-4">{exercise.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-400">{exercise.points} points</span>
              <span className="text-green-600 dark:text-green-400">Start Exercise →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Update the recordExercise function
  const recordExercise = async () => {
    try {
      const token = await currentUser.getIdToken();
      
      // Always record the exercise
      await axios.post(
        'http://localhost:5001/routes/exercise/complete',
        {
          exerciseType,
          reps: exerciseStats.count,
          accuracy: exerciseStats.accuracy,
          score: exerciseStats.score
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Only complete challenge and show overlay if this is part of a challenge
      if (challengeId) {
        await axios.put(
          `http://localhost:5001/challenges/${challengeId}/complete`,
          {
            completedReps: exerciseStats.count,
            accuracy: exerciseStats.accuracy,
            score: exerciseStats.score
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setChallengeCompleted(true);
      }
    } catch (error) {
      console.error('Error recording exercise:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          {!currentExercise ? (
            <ExerciseSelection />
          ) : (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
                  <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  {currentExercise.name}
                </h1>
                <p className="text-black dark:text-white mt-2">{currentExercise.description}</p>
              </div>

              {!isExerciseStarted ? (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
                    Ready to start {currentExercise.name}?
                  </h2>
                  <button
                    onClick={() => setIsExerciseStarted(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 mx-auto transform hover:scale-105 transition-all duration-200"
                  >
                    <Play className="h-5 w-5" />
                    Start Exercise
                  </button>
                </div>
              ) : (
                <div className="relative max-w-4xl mx-auto">
                  <video
                    ref={videoRef}
                    className="hidden"
                    autoPlay
                    playsInline
                    width="640"
                    height="480"
                  />
                  <canvas
                    ref={canvasRef}
                    className="w-full rounded-2xl shadow-xl border dark:border-gray-700"
                    width="640"
                    height="480"
                  />
                  
                  {/* Exercise Info Overlay */}
                  <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-sm border dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-black dark:text-white">{currentExercise.name}</h2>
                      <button
                        onClick={() => {
                          if (videoRef.current?.srcObject) {
                            const tracks = videoRef.current.srcObject.getTracks();
                            tracks.forEach(track => track.stop());
                          }
                          setIsExerciseStarted(false);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Reps</span>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{exerciseStats.count}</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{exerciseStats.score}</p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy</span>
                          <span className="text-sm font-medium text-black dark:text-white">{exerciseStats.accuracy}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 transition-all duration-300"
                            style={{ width: `${exerciseStats.accuracy}%` }}
                          />
                        </div>
                      </div>
                      
                      {exerciseStats.feedback && (
                        <div className={`p-4 rounded-lg ${
                          exerciseStats.feedback.includes('Good')
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {exerciseStats.feedback}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ExerciseInstructions exercise={currentExercise} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Only show completion overlay if this is a challenge */}
      {challengeId && challengeCompleted && <CompletionOverlay />}
    </div>
  );
}

export default ExerciseDetection;