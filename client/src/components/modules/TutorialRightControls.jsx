import "../pages/DJ.css";
import { Popover, Text } from "@mantine/core";

const TutorialRightControls = () => {
  const STEM_TYPES = ["bass", "drums", "melody", "vocals"];

  return (
    <div className="deck right-deck">
      <Popover width={300} position="top" closeOnClickOutside={false} withArrow>
        <Popover.Target>
          <div className="turntable">
            <img className="turntable-image" src="/assets/chill-guy-head.webp" alt="Chill Guy DJ" />
          </div>
        </Popover.Target>
        <Popover.Dropdown>
          <Text ta="center">turntable that syncs with right track's bpm</Text>
        </Popover.Dropdown>
      </Popover>

      <Popover width={215} position="top" closeOnClickOutside={false} withArrow>
        <Popover.Target>
          <div className="bpm-slider-container-right">
            <input
              type="range"
              className="bpm-slider bpm-slider-right"
              min="60"
              max="180"
              // value={rightTrack.bpm}
              // onChange={(e) => handleBPMChange("right", parseInt(e.target.value))}
            />
            <div className="bpm-display bpm-display-right"> BPM</div>
          </div>
        </Popover.Target>
        <Popover.Dropdown>
          <Text ta="center">
            allows for users to change the beats per minute (bpm) of the right imported song (range:
            60-180 bpm)
          </Text>
        </Popover.Dropdown>
      </Popover>

      <div className="deck-row right-deck-row">
        <Popover width={175} position="right" closeOnClickOutside={false} withArrow>
          <Popover.Target>
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
                      className="effect-btn"
                      //   onClick={() => handleEffectToggle("right", effect)}
                    />
                    <span className="effect-label">{effect}</span>
                  </div>
                );
              })}
            </div>
          </Popover.Target>
          <Popover.Dropdown>
            <Text ta="center">
              controls the 4 stems of the right track. pressing on the button or the hotkey toggles
              the mute / unmute
            </Text>
          </Popover.Dropdown>
        </Popover>

        <div className="playback-section">
          <div className="playback-controls">
            <Popover width={350} position="top" closeOnClickOutside={false} withArrow>
              <Popover.Target>
                <button className="cue-btn cue-btn-right">
                  <span className="cue-symbol">CUE</span>
                </button>
              </Popover.Target>
              <Popover.Dropdown>
                <Text ta="center">
                  allows users to come back to a certain part of the right track. press the button
                  to set a cue point, then when pressed again, the left track will jump back to
                  marked location.
                </Text>
              </Popover.Dropdown>
            </Popover>
            <Popover width={200} position="right" closeOnClickOutside={false} withArrow>
              <Popover.Target>
                <button className="play-btn play-btn-right">
                  <span className="play-symbol">▶</span>
                </button>
              </Popover.Target>
              <Popover.Dropdown>
                <Text ta="center">play / pause toggle for the right track!</Text>
              </Popover.Dropdown>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TutorialRightControls;
