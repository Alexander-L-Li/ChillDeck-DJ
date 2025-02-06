import React, { useState, useEffect } from "react";
import useRequireLogin from "../../hooks/useRequireLogin";
import LoginOverlay from "../modules/LoginOverlay";
import NavBar from "../modules/NavBar";
import TutorialImportAndWaveforms from "../modules/TutorialImportAndWaveforms";
import TutorialLeftControls from "../modules/TutorialLeftControls";
import TutorialRightControls from "../modules/TutorialRightControls";
import TutorialCentralControls from "../modules/TutorialCentralControls";
import HelpText, { walkthroughSteps } from "../modules/HelpText";
import Walkthrough from "../modules/Walkthrough";
import "../pages/DJ.css";
import "../../components/pages/Tutorial.css";

const Tutorial = () => {
  const isLoggedIn = useRequireLogin();
  const [isWalkthrough, setIsWalkthrough] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightPosition, setSpotlightPosition] = useState(null);
  const [hasTransition, setHasTransition] = useState(false);

  // States for hover popovers
  const [cueOpened, setCueOpened] = useState(false);
  const [playOpened, setPlayOpened] = useState(false);
  const [bpmOpened, setBpmOpened] = useState(false);
  const [turntableOpened, setTurntableOpened] = useState(false);
  const [volumeOpened, setVolumeOpened] = useState(false);
  const [effectsOpened, setEffectsOpened] = useState(false);
  const [rightCueOpened, setRightCueOpened] = useState(false);
  const [rightPlayOpened, setRightPlayOpened] = useState(false);
  const [rightBpmOpened, setRightBpmOpened] = useState(false);
  const [rightTurntableOpened, setRightTurntableOpened] = useState(false);
  const [rightVolumeOpened, setRightVolumeOpened] = useState(false);
  const [rightEffectsOpened, setRightEffectsOpened] = useState(false);
  const [syncOpened, setSyncOpened] = useState(false);
  const [resetOpened, setResetOpened] = useState(false);

  // Add keybind states
  const [pressedKey, setPressedKey] = useState(null);

  const updateSpotlightPosition = () => {
    const element = document.querySelector(walkthroughSteps[currentStep].selector);

    if (element) {
      const elementRect = element.getBoundingClientRect();

      // Special handling for different types of controls
      const isBpmSlider =
        element.classList.contains("bpm-slider-container-left") ||
        element.classList.contains("bpm-slider-container-right");
      const isVolumeSlider = element.classList.contains("volume-slider");
      const isImportBtn = element.classList.contains("import-btn");

      const padding = 5;
      let width = elementRect.width;
      let height = elementRect.height;
      let leftOffset = 0;
      let topOffset = 0;

      if (isBpmSlider) {
        width = elementRect.width * 0.15;
        leftOffset = (elementRect.width - width) / 2;
      } else if (isVolumeSlider) {
        width = elementRect.width * 5; // 5x width
        height = elementRect.height * 1.1; // Keep the shorter height (1.1x)
        leftOffset = elementRect.width / 2 - width / 2;
      } else if (isImportBtn) {
        height = elementRect.height * 1.5; // Make import buttons 1.5x height
        leftOffset = elementRect.width / 2 - width / 2;
        topOffset = elementRect.height * 0.08; // Keep the vertical offset
      }

      setSpotlightPosition({
        top: elementRect.top - padding + topOffset,
        left: elementRect.left - padding + leftOffset,
        width: width + padding * 2,
        height: height + padding * 2,
      });
    }
  };

  useEffect(() => {
    if (isWalkthrough) {
      setCurrentStep(0);
      setHasTransition(false); // Start without transition
      updateSpotlightPosition();
    } else {
      setSpotlightPosition(null);
    }
  }, [isWalkthrough]);

  useEffect(() => {
    if (isWalkthrough) {
      updateSpotlightPosition();
      // Update position on scroll and resize
      window.addEventListener("resize", updateSpotlightPosition);
      window.addEventListener("scroll", updateSpotlightPosition);
      const interval = setInterval(updateSpotlightPosition, 100);
      return () => {
        window.removeEventListener("resize", updateSpotlightPosition);
        window.removeEventListener("scroll", updateSpotlightPosition);
        clearInterval(interval);
      };
    }
  }, [isWalkthrough, currentStep]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.repeat) return; // Prevent key repeat

      if (isWalkthrough) {
        if (e.key === "Escape") {
          setIsWalkthrough(false);
        } else if (
          (e.key === "ArrowRight" || e.key === "ArrowDown") &&
          currentStep < walkthroughSteps.length - 1
        ) {
          setCurrentStep(currentStep + 1);
        } else if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && currentStep > 0) {
          setCurrentStep(currentStep - 1);
        }
      } else {
        // Normal mode keybinds - matching DJ component
        const key = e.key.toLowerCase();

        // Left deck controls
        if (key === "t") {
          setCueOpened(true);
        } else if (key === "g") {
          setPlayOpened(true);
        }

        // Effect buttons
        if (key === "q") {
          setEffectsOpened(true); // Bass
        } else if (key === "w") {
          setEffectsOpened(true); // Drums
        } else if (key === "e") {
          setEffectsOpened(true); // Melody
        } else if (key === "r") {
          setEffectsOpened(true); // Vocals
        }

        // Right deck controls
        if (key === "y") {
          setRightCueOpened(true);
        } else if (key === "h") {
          setRightPlayOpened(true);
        }

        // Right effect buttons
        if (key === "u") {
          setRightEffectsOpened(true); // Bass
        } else if (key === "i") {
          setRightEffectsOpened(true); // Drums
        } else if (key === "o") {
          setRightEffectsOpened(true); // Melody
        } else if (key === "p") {
          setRightEffectsOpened(true); // Vocals
        }

        // Center controls
        if (key === "s") {
          setSyncOpened(true);
        } else if (key === "k") {
          setResetOpened(true);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.target.tagName === "INPUT") return;

      if (!isWalkthrough) {
        const key = e.key.toLowerCase();

        // Left deck controls
        if (key === "t") {
          setCueOpened(false);
        } else if (key === "g") {
          setPlayOpened(false);
        }

        // Effect buttons
        if (key === "q" || key === "w" || key === "e" || key === "r") {
          setEffectsOpened(false);
        }

        // Right deck controls
        if (key === "y") {
          setRightCueOpened(false);
        } else if (key === "h") {
          setRightPlayOpened(false);
        }

        // Right effect buttons
        if (key === "u" || key === "i" || key === "o" || key === "p") {
          setRightEffectsOpened(false);
        }

        // Center controls
        if (key === "s") {
          setSyncOpened(false);
        } else if (key === "k") {
          setResetOpened(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isWalkthrough, currentStep, walkthroughSteps.length]);

  const handleNext = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setHasTransition(true); // Enable transition for step changes
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSpotlightClick = (e) => {
    if (!spotlightPosition) return;
    handleNext();
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setHasTransition(true); // Enable transition for step changes
      setCurrentStep(currentStep - 1);
    }
  };

  const handleToggleWalkthrough = () => {
    if (!isWalkthrough) {
      setCurrentStep(0);
    }
    setIsWalkthrough(!isWalkthrough);
  };

  return (
    <>
      {!isLoggedIn ? (
        <LoginOverlay />
      ) : (
        <div className="dj-page">
          <NavBar />
          {isWalkthrough && (
            <>
              <div className="walkthrough-overlay" onClick={handleSpotlightClick} />
              {spotlightPosition && (
                <div className="spotlight-container" onClick={handleSpotlightClick}>
                  <div
                    className={`walkthrough-spotlight ${hasTransition ? "with-transition" : ""}`}
                    style={{
                      top: spotlightPosition.top,
                      left: spotlightPosition.left,
                      width: spotlightPosition.width,
                      height: spotlightPosition.height,
                    }}
                  />
                </div>
              )}
            </>
          )}
          <div className="dj-container">
            <TutorialImportAndWaveforms />
            <div className="decks-container">
              <TutorialLeftControls
                enableHover={!isWalkthrough}
                cueOpened={cueOpened}
                setCueOpened={setCueOpened}
                playOpened={playOpened}
                setPlayOpened={setPlayOpened}
                bpmOpened={bpmOpened}
                setBpmOpened={setBpmOpened}
                turntableOpened={turntableOpened}
                setTurntableOpened={setTurntableOpened}
                volumeOpened={volumeOpened}
                setVolumeOpened={setVolumeOpened}
                effectsOpened={effectsOpened}
                setEffectsOpened={setEffectsOpened}
                pressedKey={pressedKey}
              />
              <TutorialCentralControls
                enableHover={!isWalkthrough}
                syncOpened={syncOpened}
                setSyncOpened={setSyncOpened}
                resetOpened={resetOpened}
                setResetOpened={setResetOpened}
                pressedKey={pressedKey}
              />
              <TutorialRightControls
                enableHover={!isWalkthrough}
                cueOpened={rightCueOpened}
                setCueOpened={setRightCueOpened}
                playOpened={rightPlayOpened}
                setPlayOpened={setRightPlayOpened}
                bpmOpened={rightBpmOpened}
                setBpmOpened={setRightBpmOpened}
                turntableOpened={rightTurntableOpened}
                setTurntableOpened={setRightTurntableOpened}
                volumeOpened={rightVolumeOpened}
                setVolumeOpened={setRightVolumeOpened}
                effectsOpened={rightEffectsOpened}
                setEffectsOpened={setRightEffectsOpened}
                pressedKey={pressedKey}
              />
            </div>
          </div>
          <HelpText
            isWalkthrough={isWalkthrough}
            currentStep={currentStep}
            onNext={handleNext}
            onPrev={handlePrev}
            onToggleWalkthrough={handleToggleWalkthrough}
          />
        </div>
      )}
    </>
  );
};

export default Tutorial;
