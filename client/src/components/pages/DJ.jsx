import React, { useState, useEffect, useRef, useCallback } from "react";
import WaveSurfer from "wavesurfer.js/dist/wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.js";
import NavBar from "../modules/NavBar";
import "./DJ.css";

const AVAILABLE_TRACKS = [
  {
    id: 1,
    name: "Fall to Light - NCS",
    path: "NCS_Fall_to_Light",
    bpm: 85,
    key: "1B",
  },
  {
    id: 2,
    name: "On & On - NCS",
    path: "NCS_On&On",
    bpm: 85,
    key: "1B",
  },
  {
    id: 3,
    name: "Chill Guy Remix - 류서진",
    path: "chill-guy-remix",
    bpm: 80,
    key: "4B",
  },
];

const STEM_TYPES = ["bass", "drums", "melody", "vocals"];

const createWaveSurfer = (container, options = {}) => {
  const timeline = TimelinePlugin.create({
    height: 20,
    timeInterval: 0.1,
    primaryLabelInterval: 1,
    style: {
      fontSize: "10px",
      color: "#ffffff",
    },
  });

  const wavesurfer = WaveSurfer.create({
    container,
    waveColor: options.waveColor || "rgba(255, 255, 255, 0.5)",
    progressColor: options.progressColor || "#fff",
    cursorColor: "#ffffff",
    height: 70,
    responsive: true,
    normalize: true,
    minPxPerSec: 100,
    fillParent: true,
    scrollParent: true,
    autoCenter: true,
    hideScrollbar: true,
    plugins: [timeline],
    backend: "MediaElement", // Change to MediaElement for better pitch preservation
    mediaControls: false,
    interact: true,
    dragToSeek: true,
    pixelRatio: 1,
  });

  // Create and configure the media element
  const audio = document.createElement("audio");
  audio.preservesPitch = true; // Enable pitch preservation by default
  wavesurfer.setMediaElement(audio);

  return wavesurfer;
};

const DJ = () => {
  const [tracks] = useState(AVAILABLE_TRACKS);
  const [leftTrack, setLeftTrack] = useState({
    name: "",
    key: "",
    bpm: "",
    effectsEnabled: {
      bass: true,
      drums: true,
      melody: true,
      vocals: true,
    },
  });

  const [rightTrack, setRightTrack] = useState({
    name: "",
    key: "",
    bpm: "",
    effectsEnabled: {
      bass: true,
      drums: true,
      melody: true,
      vocals: true,
    },
  });

  const [dropdownOpen, setDropdownOpen] = useState({
    left: false,
    right: false,
  });

  const [playing, setPlaying] = useState({
    left: false,
    right: false,
  });

  const [timeInfo, setTimeInfo] = useState({
    left: { current: 0, total: 0 },
    right: { current: 0, total: 0 },
  });

  const [cuePoints, setCuePoints] = useState({ left: 0, right: 0 });
  const [isCueing, setIsCueing] = useState({ left: false, right: false });
  const [cueActive, setCueActive] = useState({ left: false, right: false });
  const [playButtonPressed, setPlayButtonPressed] = useState({ left: false, right: false });
  const [cueKeyPressed, setCueKeyPressed] = useState({ left: false, right: false });

  const [volume, setVolume] = useState({ left: 1, right: 1 });

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const leftWaveformRef = useRef(null);
  const rightWaveformRef = useRef(null);
  const leftWavesurfers = useRef({});
  const rightWavesurfers = useRef({});

  const syncWavesurfers = useCallback((deck) => {
    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;
    if (!wavesurfers.current) return;

    // Get the first wavesurfer as reference
    const stems = Object.keys(wavesurfers.current);
    if (stems.length === 0) return;

    const referenceWavesurfer = wavesurfers.current[stems[0]];
    const referenceTime = referenceWavesurfer.getCurrentTime();

    // Sync all other wavesurfers to the reference time
    stems.forEach((stem) => {
      if (stem === stems[0]) return; // Skip reference wavesurfer
      const wavesurfer = wavesurfers.current[stem];
      const currentTime = wavesurfer.getCurrentTime();

      // Only adjust if drift is more than 10ms
      if (Math.abs(currentTime - referenceTime) > 0.01) {
        wavesurfer.setTime(referenceTime);
      }
    });
  }, []);

  useEffect(() => {
    let syncInterval;

    if (playing.left || playing.right) {
      // Check sync every 1 second
      syncInterval = setInterval(() => {
        if (playing.left) syncWavesurfers("left");
        if (playing.right) syncWavesurfers("right");
      }, 1000);
    }

    return () => {
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [playing, syncWavesurfers]);

  const handlePlay = (deck) => {
    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;
    if (!wavesurfers.current) return;

    // Sync before playing
    syncWavesurfers(deck);

    Object.values(wavesurfers.current).forEach((wavesurfer) => {
      if (wavesurfer) {
        wavesurfer.play();
      }
    });

    setPlaying((prev) => ({
      ...prev,
      [deck]: true,
    }));
  };

  const handlePause = (deck) => {
    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;
    if (!wavesurfers.current) return;

    Object.values(wavesurfers.current).forEach((wavesurfer) => {
      if (wavesurfer) {
        wavesurfer.pause();
      }
    });

    // Get turntable element and remove playing class
    const turntable = document.querySelector(`.${deck}-deck .turntable`);
    if (turntable) turntable.classList.remove("playing");

    setPlaying((prev) => ({
      ...prev,
      [deck]: false,
    }));
  };

  const handlePlayDown = useCallback(
    (deck) => {
      const trackState = deck === "left" ? leftTrack : rightTrack;
      if (!trackState.name || playButtonPressed[deck]) return; // Return if no track or button already pressed
      setPlayButtonPressed((prev) => ({ ...prev, [deck]: true }));
      if (playing[deck]) {
        handlePause(deck);
      } else {
        syncWavesurfers(deck);
        handlePlay(deck);
      }
    },
    [playButtonPressed, playing, handlePause, handlePlay, leftTrack, rightTrack, syncWavesurfers]
  );

  const handlePlayUp = useCallback((deck) => {
    setPlayButtonPressed((prev) => ({ ...prev, [deck]: false }));
  }, []);

  const handleCueDown = useCallback(
    (deck) => {
      const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;
      const trackState = deck === "left" ? leftTrack : rightTrack;
      const isPlaying = deck === "left" ? playing.left : playing.right;

      if (!trackState.name || !wavesurfers.current) return;

      // Store current position as cue point
      const currentTime = Object.values(wavesurfers.current)[0].getCurrentTime();
      setCuePoints((prev) => ({ ...prev, [deck]: currentTime }));

      // If not already playing, start playing from current position
      if (!isPlaying) {
        // Ensure all wavesurfers are at the same position
        Object.values(wavesurfers.current).forEach((wavesurfer) => {
          wavesurfer.setTime(currentTime);
          wavesurfer.play();
        });
      }

      setIsCueing((prev) => ({ ...prev, [deck]: true }));
      setCueActive((prev) => ({ ...prev, [deck]: true }));
    },
    [leftTrack, rightTrack, playing, leftWavesurfers, rightWavesurfers]
  );

  const handleCueUp = useCallback(
    (deck) => {
      const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;
      const trackState = deck === "left" ? leftTrack : rightTrack;
      const isPlaying = deck === "left" ? playing.left : playing.right;

      if (!trackState.name || !wavesurfers.current) return;

      setIsCueing((prev) => ({ ...prev, [deck]: false }));

      // Only pause and seek if we're not in regular playback mode
      if (!isPlaying) {
        const storedCuePoint = cuePoints[deck];
        // First pause everything
        Object.values(wavesurfers.current).forEach((wavesurfer) => {
          wavesurfer.pause();
        });

        // Then set all times to the stored cue point
        Object.values(wavesurfers.current).forEach((wavesurfer) => {
          wavesurfer.setTime(storedCuePoint);
        });
        setCueActive((prev) => ({ ...prev, [deck]: false }));
      }
    },
    [leftTrack, rightTrack, playing, leftWavesurfers, rightWavesurfers, cuePoints]
  );

  const handleEffectToggle = (deck, effect) => {
    const trackState = deck === "left" ? leftTrack : rightTrack;
    const setTrackState = deck === "left" ? setLeftTrack : setRightTrack;
    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;

    if (!wavesurfers.current || !trackState.name) return;

    const newEffectsEnabled = {
      ...trackState.effectsEnabled,
      [effect]: !trackState.effectsEnabled[effect],
    };

    // Update wavesurfer colors and volume
    if (wavesurfers.current && wavesurfers.current[effect]) {
      const isEnabled = newEffectsEnabled[effect];
      const colors = {
        bass: {
          waveColor: "rgba(255, 49, 140, 0.5)", // Hot Pink
          progressColor: "rgba(255, 49, 140, 0.4)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        drums: {
          waveColor: "rgba(56, 255, 130, 0.5)", // Neon Green
          progressColor: "rgba(56, 255, 130, 0.4)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        melody: {
          waveColor: "rgba(255, 247, 32, 0.5)", // Neon Yellow
          progressColor: "rgba(255, 247, 32, 0.4)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        vocals: {
          waveColor: "rgba(70, 237, 255, 0.5)", // Cyan
          progressColor: "rgba(70, 237, 255, 0.4)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
      };

      // Update waveform colors
      wavesurfers.current[effect].setOptions({
        waveColor: isEnabled ? colors[effect].waveColor : colors[effect].disabledColor,
        progressColor: isEnabled ? colors[effect].progressColor : colors[effect].disabledColor,
      });

      // Set volume based on effect state
      wavesurfers.current[effect].setVolume(isEnabled ? 1 : 0);
    }

    setTrackState((prev) => ({
      ...prev,
      effectsEnabled: newEffectsEnabled,
    }));
  };

  const handleBPMChange = (deck, value) => {
    const trackState = deck === "left" ? leftTrack : rightTrack;
    const setTrackState = deck === "left" ? setLeftTrack : setRightTrack;
    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;

    if (!wavesurfers.current || !trackState.name) return;

    const originalBPM = trackState.name
      ? tracks.find((t) => t.name === trackState.name)?.bpm || 120
      : 120;
    const newRate = value / originalBPM;

    // Update wavesurfer playback rate
    Object.values(wavesurfers.current).forEach((wavesurfer) => {
      // Store current time before changing rate
      const currentTime = wavesurfer.getCurrentTime();

      // Get the media element and ensure pitch preservation is enabled
      const mediaElement = wavesurfer.getMediaElement();
      if (mediaElement) {
        mediaElement.preservesPitch = true;
        mediaElement.playbackRate = newRate;
      }

      // Restore the current time
      wavesurfer.setTime(currentTime);
    });

    setTrackState((prev) => ({
      ...prev,
      bpm: value,
    }));
  };

  const handleVolumeChange = (deck, value) => {
    const normalizedValue = value / 100; // Convert percentage to decimal
    setVolume((prev) => ({ ...prev, [deck]: normalizedValue }));

    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;
    if (wavesurfers.current) {
      Object.values(wavesurfers.current).forEach((wavesurfer) => {
        if (wavesurfer) {
          wavesurfer.setVolume(normalizedValue);
        }
      });
    }
  };

  const handleSync = () => {
    // Don't sync if either track is not loaded
    if (!leftTrack.name || !rightTrack.name) return;

    // Get the current BPM of both tracks
    const leftBPM = leftTrack.bpm;
    const rightBPM = rightTrack.bpm;

    // Use the left track's BPM as the sync target
    handleBPMChange("right", leftBPM);
  };

  const handleReset = () => {
    // Stop any playing audio and reset wavesurfers
    Object.values(leftWavesurfers.current || {}).forEach((wavesurfer) => {
      if (wavesurfer) {
        wavesurfer.pause();
        wavesurfer.seekTo(0);
        wavesurfer.empty(); // Clear the waveform
      }
    });
    Object.values(rightWavesurfers.current || {}).forEach((wavesurfer) => {
      if (wavesurfer) {
        wavesurfer.pause();
        wavesurfer.seekTo(0);
        wavesurfer.empty(); // Clear the waveform
      }
    });

    // Reset turntable animations
    const leftTurntable = document.querySelector(".left-deck .turntable");
    const rightTurntable = document.querySelector(".right-deck .turntable");
    if (leftTurntable) leftTurntable.classList.remove("playing");
    if (rightTurntable) rightTurntable.classList.remove("playing");

    // Reset all state to initial values
    setLeftTrack({
      name: "",
      key: "",
      bpm: 120,
      audioElements: null,
      effectsEnabled: {
        bass: true,
        drums: true,
        melody: true,
        vocals: true,
      },
    });
    setRightTrack({
      name: "",
      key: "",
      bpm: 120,
      audioElements: null,
      effectsEnabled: {
        bass: true,
        drums: true,
        melody: true,
        vocals: true,
      },
    });

    // Clear audio elements
    if (leftTrack.audioElements) {
      Object.values(leftTrack.audioElements).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
          audio.load();
        }
      });
    }
    if (rightTrack.audioElements) {
      Object.values(rightTrack.audioElements).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
          audio.load();
        }
      });
    }

    setPlaying({ left: false, right: false });
    setCueActive({ left: false, right: false });
    setIsCueing({ left: false, right: false });
    setDropdownOpen({ left: false, right: false });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === "INPUT") return;
      if (event.repeat) return; // Prevent key repeat

      const key = event.key.toLowerCase();

      // Play/Pause controls
      if (key === "g") {
        handlePlayDown("left");
      } else if (key === "h") {
        handlePlayDown("right");
      }

      // Cue controls
      if (key === "t") {
        event.preventDefault();
        handleCueDown("left");
      } else if (key === "y") {
        event.preventDefault();
        handleCueDown("right");
      }

      // Effect toggles
      if (key === "q" && leftTrack.name) {
        event.preventDefault();
        handleEffectToggle("left", "bass");
      }
      if (key === "w" && leftTrack.name) {
        event.preventDefault();
        handleEffectToggle("left", "drums");
      }
      if (key === "e" && leftTrack.name) {
        event.preventDefault();
        handleEffectToggle("left", "melody");
      }
      if (key === "r" && leftTrack.name) {
        event.preventDefault();
        handleEffectToggle("left", "vocals");
      }

      // Right deck effect toggles
      if (key === "u" && rightTrack.name) {
        event.preventDefault();
        handleEffectToggle("right", "bass");
      }
      if (key === "i" && rightTrack.name) {
        event.preventDefault();
        handleEffectToggle("right", "drums");
      }
      if (key === "o" && rightTrack.name) {
        event.preventDefault();
        handleEffectToggle("right", "melody");
      }
      if (key === "p" && rightTrack.name) {
        event.preventDefault();
        handleEffectToggle("right", "vocals");
      }

      // Sync
      if (key === "s") {
        event.preventDefault();
        handleSync();
      }

      // Reset
      if (key === "k") {
        event.preventDefault();
        handleReset();
      }
    };

    const handleKeyUp = (event) => {
      if (event.target.tagName === "INPUT") return;

      const key = event.key.toLowerCase();

      // Play button release
      if (key === "g") {
        handlePlayUp("left");
      } else if (key === "h") {
        handlePlayUp("right");
      }

      // Cue controls
      if (key === "t") {
        event.preventDefault();
        handleCueUp("left");
      } else if (key === "y") {
        event.preventDefault();
        handleCueUp("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    handlePlayDown,
    handlePlayUp,
    handleCueDown,
    handleCueUp,
    handleEffectToggle,
    handleSync,
    handleReset,
    leftTrack.name,
    rightTrack.name,
  ]);

  useEffect(() => {
    const initializeWaveSurfers = async (containerRef, wavesurfersRef) => {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = "";

      const stemColors = {
        bass: {
          waveColor: "rgba(255, 49, 140, 0.5)", // Hot Pink
          progressColor: "rgba(255, 49, 140, 0.5)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        drums: {
          waveColor: "rgba(56, 255, 130, 0.5)", // Neon Green
          progressColor: "rgba(56, 255, 130, 0.5)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        melody: {
          waveColor: "rgba(255, 247, 32, 0.5)", // Neon Yellow
          progressColor: "rgba(255, 247, 32, 0.5)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        vocals: {
          waveColor: "rgba(70, 237, 255, 0.5)", // Cyan
          progressColor: "rgba(70, 237, 255, 0.5)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
      };

      containerRef.current.style.position = "relative";
      containerRef.current.style.height = "70px";
      containerRef.current.style.width = "100%";
      containerRef.current.style.pointerEvents = "none";
      containerRef.current.style.zIndex = "1";
      containerRef.current.classList.add("waveform-container");

      for (const [stem, colors] of Object.entries(stemColors)) {
        const stemContainer = document.createElement("div");
        stemContainer.style.position = "absolute";
        stemContainer.style.left = "0";
        stemContainer.style.right = "0";
        stemContainer.style.top = "0";
        stemContainer.style.height = "100%";
        stemContainer.style.pointerEvents = "none";
        stemContainer.style.zIndex = "1";
        containerRef.current.appendChild(stemContainer);

        wavesurfersRef.current[stem] = createWaveSurfer(stemContainer, {
          waveColor: colors.waveColor,
          progressColor: colors.progressColor,
          height: 70,
          cursorColor: "transparent",
          interact: false,
        });
      }
    };

    initializeWaveSurfers(leftContainerRef, leftWavesurfers);
    initializeWaveSurfers(rightContainerRef, rightWavesurfers);

    return () => {
      Object.values(leftWavesurfers.current).forEach((wavesurfer) => {
        if (wavesurfer) wavesurfer.destroy();
      });
      Object.values(rightWavesurfers.current).forEach((wavesurfer) => {
        if (wavesurfer) wavesurfer.destroy();
      });
      leftWavesurfers.current = {};
      rightWavesurfers.current = {};
    };
  }, []);

  useEffect(() => {
    return () => {
      if (leftTrack.audioElements) {
        Object.values(leftTrack.audioElements).forEach((audio) => {
          if (audio) audio.pause();
        });
      }
      if (rightTrack.audioElements) {
        Object.values(rightTrack.audioElements).forEach((audio) => {
          if (audio) audio.pause();
        });
      }

      Object.values(leftWavesurfers.current || {}).forEach((wavesurfer) => {
        if (wavesurfer) wavesurfer.pause();
      });
      Object.values(rightWavesurfers.current || {}).forEach((wavesurfer) => {
        if (wavesurfer) wavesurfer.pause();
      });

      setPlaying({ left: false, right: false });

      const leftTurntable = document.querySelector(".left-deck .turntable");
      const rightTurntable = document.querySelector(".right-deck .turntable");
      if (leftTurntable) leftTurntable.classList.remove("playing");
      if (rightTurntable) rightTurntable.classList.remove("playing");
    };
  }, [leftTrack.audioElements, rightTrack.audioElements]);

  const handleImportSong = (deck) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [deck]: !prev[deck],
    }));
  };

  const handleTrackSelect = async (track, deck) => {
    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;
    const setTrackState = deck === "left" ? setLeftTrack : setRightTrack;
    const trackState = deck === "left" ? leftTrack : rightTrack;

    // Only affect the turntable of the current deck
    const turntable = document.querySelector(`.${deck}-deck .turntable`);
    if (turntable) turntable.classList.remove("playing");

    // Only pause audio elements of the current deck
    if (trackState.audioElements) {
      Object.values(trackState.audioElements).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }

    // Only pause wavesurfers of the current deck
    Object.values(wavesurfers.current || {}).forEach((wavesurfer) => {
      if (wavesurfer) {
        wavesurfer.pause();
        wavesurfer.seekTo(0);
      }
    });

    // Set playing state for the current deck to false
    setPlaying((prev) => ({
      ...prev,
      [deck]: false,
    }));

    // Always use the new track's original BPM
    const newRate = 1.0; // Reset playback rate to original speed
    const audioElements = {};

    // Load waveforms first
    if (Object.keys(wavesurfers.current).length > 0) {
      const loadPromises = STEM_TYPES.map(async (stem) => {
        const url = `/assets/processed/${track.path}/${track.path}_${stem}.mp3`;
        try {
          await wavesurfers.current[stem].load(url);
          wavesurfers.current[stem].setVolume(1); // Set initial volume to 1
          wavesurfers.current[stem].setPlaybackRate(newRate);
        } catch (error) {
          console.error(`Error loading waveform for ${stem}:`, error);
        }
      });
      await Promise.all(loadPromises);
    }

    // Create audio elements for monitoring only
    for (const stem of STEM_TYPES) {
      const audio = new Audio();
      audio.src = `/assets/processed/${track.path}/${track.path}_${stem}.mp3`;
      audio.volume = 0; // Set volume to 0 since we'll use wavesurfer for playback
      audio.muted = true;
      audio.playbackRate = newRate;
      audioElements[stem] = audio;
      await new Promise((resolve) => audio.addEventListener("loadeddata", resolve));
    }

    setTrackState((prev) => ({
      ...prev,
      name: track.name,
      key: track.key,
      bpm: track.bpm,
      audioElements,
      effectsEnabled: {
        bass: true,
        drums: true,
        melody: true,
        vocals: true,
      },
    }));

    setDropdownOpen((prev) => ({
      ...prev,
      [deck]: false,
    }));
  };

  return (
    <>
      <div
        className="dj-page"
        onClick={(e) => {
          if (!e.target.closest(".import-container")) {
            setDropdownOpen({ left: false, right: false });
          }
        }}
      >
        <NavBar />
        <div className="top-bar">
          <div className="import-containers">
            <div className="import-container">
              <button
                className="import-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImportSong("left");
                }}
              >
                IMPORT SONG ▼
              </button>
              {dropdownOpen.left && (
                <div className="import-dropdown">
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackSelect(track, "left");
                      }}
                    >
                      <div className="song-info">
                        <span className="song-name">{track.name}</span>
                        <span className="song-details">
                          {track.bpm} BPM • {track.key}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="track-info">
                {leftTrack.name ? (
                  <>
                    <div className="track-name-left">{leftTrack.name}</div>
                    <div className="track-details-left">
                      {leftTrack.bpm + " BPM • " + leftTrack.key}
                    </div>
                  </>
                ) : (
                  <div className="no-track-left">NO TRACK LOADED</div>
                )}
              </div>
            </div>

            <div className="import-container">
              <button
                className="import-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImportSong("right");
                }}
              >
                IMPORT SONG ▼
              </button>
              {dropdownOpen.right && (
                <div className="import-dropdown">
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackSelect(track, "right");
                      }}
                    >
                      <div className="song-info">
                        <span className="song-name">{track.name}</span>
                        <span className="song-details">
                          {track.bpm} BPM • {track.key}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}{" "}
              <div className="track-info">
                {rightTrack.name ? (
                  <>
                    <div className="track-name-right">{rightTrack.name}</div>
                    <div className="track-details-right">
                      {rightTrack.bpm + " BPM • " + rightTrack.key}
                    </div>
                  </>
                ) : (
                  <div className="no-track-right">NO TRACK LOADED</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="waveforms-section">
          <div className="waveform-container left" ref={leftContainerRef}></div>
          <div className="waveform-container right" ref={rightContainerRef}></div>
        </div>

        <div className="decks-container">
          <div className="deck left-deck">
            <div className="deck-top">
              <div className="bpm-slider-container-left">
                <input
                  type="range"
                  className="bpm-slider"
                  min="60"
                  max="180"
                  value={leftTrack.bpm}
                  onChange={(e) => handleBPMChange("left", parseInt(e.target.value))}
                />
                <div className="bpm-display">{leftTrack.bpm} BPM</div>
              </div>
              <div className="turntable">
                <img
                  className="turntable-image"
                  src="/assets/chill-guy-head.webp"
                  alt="Chill Guy DJ"
                />
              </div>
              <div className="volume-slider-container-left">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume.left * 100}
                  className="volume-slider"
                  onChange={(e) => handleVolumeChange("left", e.target.value)}
                />
                <div className="volume-display">VOL</div>
              </div>
            </div>

            <div className="deck-row left-deck-row">
              <div className="playback-section">
                <div className="playback-controls">
                  <button
                    className={`cue-btn cue-btn-left ${isCueing.left ? "active" : ""} ${
                      !leftTrack.name ? "disabled" : ""
                    }`}
                    onMouseDown={() => handleCueDown("left")}
                    onMouseUp={() => handleCueUp("left")}
                    onMouseLeave={() => isCueing.left && handleCueUp("left")}
                    disabled={!leftTrack.name}
                  >
                    <span className="cue-symbol">CUE</span>
                  </button>
                  <button
                    className={`play-btn play-btn-left ${playing.left ? "playing" : ""} ${
                      !leftTrack.name ? "disabled" : ""
                    }`}
                    onMouseDown={() => handlePlayDown("left")}
                    onMouseUp={() => handlePlayUp("left")}
                    disabled={!leftTrack.name}
                  >
                    {playing.left ? (
                      <span className="pause-symbol">❚❚</span>
                    ) : (
                      <span className="play-symbol">▶</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="effect-buttons">
                {STEM_TYPES.map((effect, index) => {
                  const hotkey = {
                    left: { bass: "Q", drums: "W", melody: "E", vocals: "R" },
                    right: { bass: "U", drums: "I", melody: "O", vocals: "P" },
                  };
                  return (
                    <div key={effect} className="effect-button-container">
                      <div className="hotkey-indicator hotkey">
                        <span className="hotkey-text">{hotkey.left[effect]}</span>
                      </div>
                      <button
                        className={`effect-btn ${
                          leftTrack.effectsEnabled?.[effect] ? "active" : ""
                        }`}
                        onClick={() => handleEffectToggle("left", effect)}
                        data-effect={effect}
                      >
                        <div className="effect-content"></div>
                      </button>
                      <span className="effect-label">{effect}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="deck-controls">
            <button
              className="sync-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSync();
              }}
              disabled={!leftTrack.name || !rightTrack.name}
            >
              <span className="sync-text">SYNC</span>
            </button>
            <button
              className="reset-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              <span className="reset-text">RESET</span>
            </button>
          </div>

          <div className="deck right-deck">
            <div className="deck-top">
              <div className="volume-slider-container-right">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume.right * 100}
                  className="volume-slider"
                  onChange={(e) => handleVolumeChange("right", e.target.value)}
                />
                <div className="volume-display">VOL</div>
              </div>
              <div className="turntable">
                <img
                  className="turntable-image"
                  src="/assets/chill-guy-head.webp"
                  alt="Chill Guy DJ"
                />
              </div>
              <div className="bpm-slider-container-right">
                <input
                  type="range"
                  className="bpm-slider"
                  min="60"
                  max="180"
                  value={rightTrack.bpm}
                  onChange={(e) => handleBPMChange("right", parseInt(e.target.value))}
                />
                <div className="bpm-display">{rightTrack.bpm} BPM</div>
              </div>
            </div>

            <div className="deck-row right-deck-row">
              <div className="effect-buttons">
                {STEM_TYPES.map((effect, index) => {
                  const hotkey = {
                    left: { bass: "Q", drums: "W", melody: "E", vocals: "R" },
                    right: { bass: "U", drums: "I", melody: "O", vocals: "P" },
                  };
                  return (
                    <div key={effect} className="effect-button-container">
                      <div className="hotkey-indicator">
                        <span className="hotkey-text">{hotkey.right[effect]}</span>
                      </div>
                      <button
                        className={`effect-btn ${
                          rightTrack.effectsEnabled?.[effect] ? "active" : ""
                        }`}
                        onClick={() => handleEffectToggle("right", effect)}
                        data-effect={effect}
                      >
                        <div className="effect-content"></div>
                      </button>
                      <span className="effect-label">{effect}</span>
                    </div>
                  );
                })}
              </div>

              <div className="playback-section">
                <div className="playback-controls">
                  <button
                    className={`cue-btn cue-btn-right ${isCueing.right ? "active" : ""} ${
                      !rightTrack.name ? "disabled" : ""
                    }`}
                    onMouseDown={() => handleCueDown("right")}
                    onMouseUp={() => handleCueUp("right")}
                    onMouseLeave={() => isCueing.right && handleCueUp("right")}
                    disabled={!rightTrack.name}
                  >
                    <span className="cue-symbol">CUE</span>
                  </button>
                  <button
                    className={`play-btn play-btn-right ${playing.right ? "playing" : ""} ${
                      !rightTrack.name ? "disabled" : ""
                    }`}
                    onMouseDown={() => handlePlayDown("right")}
                    onMouseUp={() => handlePlayUp("right")}
                    disabled={!rightTrack.name}
                  >
                    {playing.right ? (
                      <span className="pause-symbol">❚❚</span>
                    ) : (
                      <span className="play-symbol">▶</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DJ;
