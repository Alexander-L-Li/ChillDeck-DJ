import React, { useState, useEffect, useRef, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.js";
import { useNavigate, useLocation } from "react-router-dom";
import "./DJ.css";
import NavBar from "../modules/NavBar";
import { Popover, Text } from "@mantine/core";
import TutorialImportAndWaveforms from "../modules/TutorialImportAndWaveforms";
import TutorialLeftControls from "../modules/TutorialLeftControls";
import TutorialRightControls from "../modules/TutorialRightControls";
import TutorialCentralControls from "../modules/TutorialCentralControls";

const AVAILABLE_TRACKS = [
  {
    id: 1,
    name: "Fall to Light - NCS",
    path: "NCS_Fall_to_Light",
    bpm: 87,
    key: "1B",
  },
  {
    id: 2,
    name: "On & On - NCS",
    path: "NCS_On&On",
    bpm: 86,
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

  return WaveSurfer.create({
    container,
    waveColor: options.waveColor || {
      progressive: "#4a9eff",
      gradient: ["#4a9eff", "#1e4976"],
    },
    progressColor: options.progressColor || "#1e4976",
    cursorColor: "#ffffff",
    barWidth: 2,
    barRadius: 3,
    barGap: 3,
    height: 70,
    responsive: true,
    normalize: true,
    minPxPerSec: 100,
    fillParent: true,
    scrollParent: true,
    autoCenter: true,
    hideScrollbar: true,
    plugins: [timeline],
    backend: "MediaElement",
    media: document.createElement("audio"),
    mediaControls: false,
    volume: 0,
    interact: true,
    dragToSeek: true,
    pixelRatio: 1,
  });
};

const Tutorial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tracks, setTracks] = useState(AVAILABLE_TRACKS);
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

  const handleEffectToggle = useCallback(
    (deck, effect) => {
      const trackState = deck === "left" ? leftTrack : rightTrack;
      const setTrackState = deck === "left" ? setLeftTrack : setRightTrack;
      const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;

      if (!trackState.name) return;

      setTrackState((prev) => {
        const newEffectsEnabled = {
          ...prev.effectsEnabled,
          [effect]: !prev.effectsEnabled[effect],
        };

        // Just toggle mute without changing time
        if (trackState.audioElements && trackState.audioElements[effect]) {
          trackState.audioElements[effect].muted = !newEffectsEnabled[effect];
        }

        // Update waveform color
        if (wavesurfers.current && wavesurfers.current[effect]) {
          const isEnabled = newEffectsEnabled[effect];
          const colors = {
            bass: {
              waveColor: "rgba(0, 0, 0, 0.9)",
              progressColor: "rgba(0, 0, 0, 1)",
              disabledColor: "rgba(128, 128, 128, 0.2)",
            },
            drums: {
              waveColor: "rgba(255, 202, 58, 0.9)",
              progressColor: "rgba(255, 202, 58, 1)",
              disabledColor: "rgba(128, 128, 128, 0.2)",
            },
            melody: {
              waveColor: "rgba(138, 201, 38, 0.9)",
              progressColor: "rgba(138, 201, 38, 1)",
              disabledColor: "rgba(128, 128, 128, 0.2)",
            },
            vocals: {
              waveColor: "rgba(255, 89, 94, 0.9)",
              progressColor: "rgba(255, 89, 94, 1)",
              disabledColor: "rgba(128, 128, 128, 0.2)",
            },
          };

          wavesurfers.current[effect].setOptions({
            waveColor: isEnabled ? colors[effect].waveColor : colors[effect].disabledColor,
            progressColor: isEnabled ? colors[effect].progressColor : colors[effect].disabledColor,
          });
        }

        return {
          ...prev,
          effectsEnabled: newEffectsEnabled,
        };
      });
    },
    [leftTrack, rightTrack]
  );

  const handleKeyPress = useCallback(
    (event) => {
      const key = event.key.toLowerCase();

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
    },
    [handleEffectToggle, leftTrack.name, rightTrack.name]
  );

  useEffect(() => {
    const initializeWaveSurfers = async (containerRef, wavesurfersRef) => {
      if (!containerRef.current) return;

      // First clear any existing content
      containerRef.current.innerHTML = "";

      const stemColors = {
        bass: {
          waveColor: "rgba(0, 0, 0, 0.9)",
          progressColor: "rgba(0, 0, 0, 1)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        drums: {
          waveColor: "rgba(255, 202, 58, 0.9)",
          progressColor: "rgba(255, 202, 58, 1)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        melody: {
          waveColor: "rgba(138, 201, 38, 0.9)",
          progressColor: "rgba(138, 201, 38, 1)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
        vocals: {
          waveColor: "rgba(255, 89, 94, 0.9)",
          progressColor: "rgba(255, 89, 94, 1)",
          disabledColor: "rgba(128, 128, 128, 0.2)",
        },
      };

      // Style the main container
      containerRef.current.style.position = "relative";
      containerRef.current.style.height = "70px";
      containerRef.current.style.width = "100%";
      containerRef.current.style.pointerEvents = "none";
      containerRef.current.style.zIndex = "1";
      containerRef.current.classList.add("waveform-container");

      // Create waveforms for each stem
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

    // Initialize both decks
    initializeWaveSurfers(leftContainerRef, leftWavesurfers);
    initializeWaveSurfers(rightContainerRef, rightWavesurfers);

    return () => {
      // Cleanup waveforms
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
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    // Cleanup function that runs when component unmounts or when location changes
    return () => {
      // Pause all audio elements
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

      // Pause all waveforms
      Object.values(leftWavesurfers.current || {}).forEach((wavesurfer) => {
        if (wavesurfer) wavesurfer.pause();
      });
      Object.values(rightWavesurfers.current || {}).forEach((wavesurfer) => {
        if (wavesurfer) wavesurfer.pause();
      });

      // Reset play state
      setPlaying({ left: false, right: false });

      // Reset turntable animations
      const leftTurntable = document.querySelector(".left-deck .turntable");
      const rightTurntable = document.querySelector(".right-deck .turntable");
      if (leftTurntable) leftTurntable.classList.remove("playing");
      if (rightTurntable) rightTurntable.classList.remove("playing");
    };
  }, [location.pathname, leftTrack.audioElements, rightTrack.audioElements]);

  const handleImportSong = (deck) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [deck]: !prev[deck],
    }));
  };

  const handleTrackSelect = async (deck, track) => {
    const audioElements = {};
    const trackState = deck === "left" ? leftTrack : rightTrack;
    const setTrackState = deck === "left" ? setLeftTrack : setRightTrack;
    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;

    // Reset play state
    setPlaying((prev) => ({ ...prev, [deck]: false }));
    const turntable = document.querySelector(`.${deck}-deck .turntable`);
    if (turntable) {
      turntable.classList.remove("playing");
    }

    if (trackState.audioElements) {
      Object.values(trackState.audioElements).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }

    Object.values(wavesurfers.current || {}).forEach((wavesurfer) => {
      if (wavesurfer) {
        wavesurfer.pause();
        wavesurfer.seekTo(0);
      }
    });

    // Calculate initial playback rate if BPM is different from original
    const currentBPM = trackState.bpm || track.bpm;
    const newRate = currentBPM / track.bpm;

    for (const stem of STEM_TYPES) {
      const audio = new Audio();
      audio.src = `/assets/processed/${track.path}/${track.path}_${stem}.mp3`;
      audio.volume = 1;
      audio.muted = trackState.effectsEnabled ? !trackState.effectsEnabled[stem] : false;
      audio.playbackRate = newRate; // Set initial playback rate
      audioElements[stem] = audio;

      const loadPromise = new Promise((resolve) => {
        audio.addEventListener("loadeddata", () => resolve());
      });
      await loadPromise;
    }

    try {
      if (Object.keys(wavesurfers.current).length > 0) {
        console.log("Loading waveforms for track:", track.path);
        const loadPromises = STEM_TYPES.map(async (stem) => {
          const url = `/assets/processed/${track.path}/${track.path}_${stem}.mp3`;
          console.log(`Loading waveform for ${stem} from ${url}`);
          try {
            await wavesurfers.current[stem].load(url);
            wavesurfers.current[stem].setVolume(0);
            wavesurfers.current[stem].setPlaybackRate(newRate); // Set initial playback rate
            const mediaElement = wavesurfers.current[stem].getMediaElement();
            if (mediaElement) {
              mediaElement.volume = 0;
              mediaElement.muted = true;
              mediaElement.playbackRate = newRate; // Set initial playback rate for media element
            }
            console.log(`Successfully loaded waveform for ${stem}`);
          } catch (error) {
            console.error(`Error loading waveform for ${stem}:`, error);
          }
        });
        await Promise.all(loadPromises);
        console.log("All waveforms loaded");
      }
    } catch (error) {
      console.error("Error loading waveforms:", error);
    }

    const stems = Object.entries(audioElements);
    stems.forEach(([stem, audio], index) => {
      if (index === 0) {
        audio.addEventListener("timeupdate", () => {
          stems.slice(1).forEach(([_, otherAudio]) => {
            if (Math.abs(otherAudio.currentTime - audio.currentTime) > 0.1) {
              otherAudio.currentTime = audio.currentTime;
            }
          });
        });
      }
    });

    setTrackState((prev) => ({
      ...prev,
      name: track.name,
      key: track.key,
      bpm: currentBPM, // Maintain current BPM instead of resetting to track.bpm
      audioElements,
      effectsEnabled: {
        bass: true,
        drums: true,
        melody: true,
        vocals: true,
      },
    }));

    setDropdownOpen((prev) => ({ ...prev, [deck]: false }));
  };

  const handlePlayPause = (deck) => {
    const trackState = deck === "left" ? leftTrack : rightTrack;
    const wavesurfers = deck === "left" ? leftWavesurfers : rightWavesurfers;

    if (!trackState.name || Object.keys(wavesurfers.current).length === 0) return;

    setPlaying((prev) => {
      const newPlaying = !prev[deck];

      const turntable = document.querySelector(`.${deck}-deck .turntable`);
      if (turntable) {
        turntable.classList.toggle("playing", newPlaying);
      }

      if (newPlaying) {
        const currentTime = wavesurfers.current.bass.getCurrentTime();

        // Play all audio elements together
        const playPromises = Object.entries(trackState.audioElements || {}).map(([stem, audio]) => {
          if (audio) {
            audio.currentTime = currentTime;
            audio.muted = trackState.effectsEnabled ? !trackState.effectsEnabled[stem] : false;
            return audio.play();
          }
          return Promise.resolve();
        });

        // Wait for all audio to start playing before starting waveforms
        Promise.all(playPromises)
          .then(() => {
            Object.values(wavesurfers.current).forEach((wavesurfer) => {
              wavesurfer.setVolume(0);
              const mediaElement = wavesurfer.getMediaElement();
              if (mediaElement) {
                mediaElement.volume = 0;
                mediaElement.muted = true;
              }
              wavesurfer.play(currentTime);
            });
          })
          .catch((e) => console.error("Error playing audio:", e));
      } else {
        Object.values(trackState.audioElements || {}).forEach((audio) => {
          if (audio) {
            audio.pause();
          }
        });

        Object.values(wavesurfers.current).forEach((wavesurfer) => {
          wavesurfer.pause();
        });
      }

      return { ...prev, [deck]: newPlaying };
    });
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

    Object.values(wavesurfers.current).forEach((wavesurfer) => {
      wavesurfer.setPlaybackRate(newRate);
    });
    Object.values(trackState.audioElements || {}).forEach((audio) => {
      if (audio) {
        audio.playbackRate = newRate;
      }
    });

    setTrackState((prev) => ({
      ...prev,
      bpm: value,
    }));
  };

  return (
    <>
      <NavBar />
      <div
        className="dj-page"
        onClick={(e) => {
          if (!e.target.closest(".import-container")) {
            setDropdownOpen({ left: false, right: false });
          }
        }}
      >
        <TutorialImportAndWaveforms />

        <div className="decks-container">
          <TutorialLeftControls />

          <TutorialCentralControls />

          <TutorialRightControls />
        </div>
      </div>
    </>
  );
};

export default Tutorial;
