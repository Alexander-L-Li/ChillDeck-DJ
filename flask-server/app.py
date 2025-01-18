from flask import Flask, send_file, jsonify, request
from flask_cors import CORS
import os
import re
from urllib.parse import quote

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Directory containing processed audio files - using relative path
AUDIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "src", "assets", "processed"))
print(f"Audio directory: {AUDIO_DIR}")

<<<<<<< HEAD
def format_track_name(track_id):
    """Format track ID into a display name"""
    # Remove prefix if exists
    if track_id.startswith("NCS_"):
        name = track_id[4:]
    else:
        name = track_id
=======
app.config['UPLOAD_FOLDER'] = '../client/src/assets/uploads/'
app.config['PROCESSED_FOLDER'] = '../client/src/assets/processed/'

# Ensure folders exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)

# @app.route('/')
# def index():
#     return render_template('/client/index.html')
# =======

# @app.route('/api/flaskwhoami', methods=['GET'])
# def flaskwhoami():
#     # Mock user data
#     user = {"_id": "12345", "name": "Test User"}
#     return jsonify(user)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "Backend and frontend are connected!"})

# @app.route("/dj")
# def dj():
#     return "hi"
    # return render_template('/client/index.html')

# @app.route('/upload', methods=['POST'])
# def upload():
#     file = request.files['file']
#     if file:
#         filename = file.filename
#         filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#         file.save(filepath)

#         # Process audio
#         process_audio(filepath, filename.split('.')[0])

#         return redirect(url_for('player', filename=filename.split('.')[0]))
#     return redirect(url_for('index'))

# @app.route('/player/<filename>')
# def player(filename):
#     processed_folder = os.path.join(app.config['PROCESSED_FOLDER'], filename)
#     stems = [f"/processed/{filename}/{stem}.wav" for stem in ['vocals', 'bass', 'drums', 'melody']]
#     return render_template('player.html', stems=stems)

# @app.route('/processed/<path:filepath>')
# def serve_processed_file(filepath):
#     return send_from_directory(app.config['PROCESSED_FOLDER'], filepath)

# def process_audio(filepath, output_name):
#     output_dir = os.path.join(app.config['PROCESSED_FOLDER'], output_name)
#     os.makedirs(output_dir, exist_ok=True)

#     # Load audio and get the sample rate
#     audio, rate = torchaudio.load(filepath)

#     # Perform separation using the default umxl model
#     estimates = predict.separate(audio=audio, rate=rate, targets=["vocals", "bass", "drums", "other"])

#     for stem, audio_tensor in estimates.items():
#         # Map "other" to "melody" for clarity
#         stem_name = "melody" if stem == "other" else stem

#         # Ensure the tensor is 2D: [channels, samples]
#         if audio_tensor.ndim == 3:
#             audio_tensor = audio_tensor.squeeze(0)

#         output_file = os.path.join(output_dir, f"{stem_name}.wav")
>>>>>>> 22dae3b16f6bd4375981ccb782c9d694b2a8464b
        
    # Replace underscores with spaces and capitalize words
    name = name.replace("_", " ")
    name = " ".join(word.capitalize() for word in name.split())
    return name

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Range,Accept-Ranges,Content-Range')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Expose-Headers', 'Content-Range,Accept-Ranges,Content-Length')
    return response

@app.route("/api/tracks", methods=["GET"])
def get_tracks():
    """Get list of available tracks"""
    try:
        tracks = []
        # List all directories in the processed folder
        for track_dir in os.listdir(AUDIO_DIR):
            track_path = os.path.join(AUDIO_DIR, track_dir)
            
            # Skip hidden files and non-directories
            if not os.path.isdir(track_path) or track_dir.startswith('.'):
                continue
                
            # Check for all required stems
            stem_files = {
                "bass": os.path.join(track_path, f"{track_dir}_bass.mp3"),
                "drums": os.path.join(track_path, f"{track_dir}_drums.mp3"),
                "melody": os.path.join(track_path, f"{track_dir}_other.mp3"),
                "vocals": os.path.join(track_path, f"{track_dir}_vocals.mp3")
            }
            
            # Verify all stem files exist
            if all(os.path.exists(stem_file) for stem_file in stem_files.values()):
                # URL encode the track directory name for the API endpoints
                encoded_track_dir = quote(track_dir)
                track_info = {
                    "id": track_dir,
                    "name": format_track_name(track_dir),
                    "stems": {
                        "bass": f"/api/audio/{encoded_track_dir}/bass",
                        "drums": f"/api/audio/{encoded_track_dir}/drums",
                        "melody": f"/api/audio/{encoded_track_dir}/other",
                        "vocals": f"/api/audio/{encoded_track_dir}/vocals"
                    }
                }
                tracks.append(track_info)
                print(f"Added track: {track_info['name']}")
            else:
                print(f"Skipping {track_dir}: missing stems")
                missing_stems = [stem for stem, path in stem_files.items() if not os.path.exists(path)]
                print(f"Missing stems: {missing_stems}")
                
        print(f"Found {len(tracks)} valid tracks")
        return jsonify({"tracks": tracks})
    except Exception as e:
        print(f"Error getting tracks: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/audio/<track_id>/<stem_type>")
def get_audio(track_id, stem_type):
    """Stream audio file with support for range requests"""
    try:
        # Map stem_type to filename suffix
        stem_map = {
            "bass": "bass",
            "drums": "drums",
            "other": "other",  # for melody
            "vocals": "vocals"
        }
        
        if stem_type not in stem_map:
            print(f"Invalid stem type: {stem_type}")
            return jsonify({"error": "Invalid stem type"}), 400
            
        # Construct the full file path using the track_id as directory name
        track_dir = track_id  # e.g., "NCS_Fall_to_Light"
        filename = f"{track_id}_{stem_map[stem_type]}.mp3"  # e.g., "NCS_Fall_to_Light_bass.mp3"
        file_path = os.path.join(AUDIO_DIR, track_dir, filename)
        
        print(f"Attempting to serve audio file: {file_path}")
        print(f"File exists: {os.path.exists(file_path)}")
        print(f"Directory contents: {os.listdir(os.path.dirname(file_path))}")
        
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return jsonify({"error": "Audio file not found"}), 404

        file_size = os.path.getsize(file_path)
        print(f"File size: {file_size} bytes")
        
        # Handle range request
        range_header = request.headers.get('Range', None)
        if range_header:
            byte1, byte2 = 0, None
            match = re.search(r'(\d+)-(\d*)', range_header)
            if match:
                groups = match.groups()
                if groups[0]: byte1 = int(groups[0])
                if groups[1]: byte2 = int(groups[1])
                
                if byte2 is None:
                    byte2 = file_size - 1
                
                length = byte2 - byte1 + 1
                
                resp = send_file(
                    file_path,
                    mimetype="audio/mpeg",
                    conditional=True
                )
                
                resp.headers.add('Content-Range', f'bytes {byte1}-{byte2}/{file_size}')
                resp.headers.add('Accept-Ranges', 'bytes')
                resp.headers.add('Content-Length', str(length))
                return resp, 206
        
        # Full file download
        print(f"Sending full file: {file_path}")
        resp = send_file(
            file_path,
            mimetype="audio/mpeg",
            conditional=True
        )
        resp.headers.add('Accept-Ranges', 'bytes')
        resp.headers.add('Content-Length', str(file_size))
        return resp
            
    except Exception as e:
        import traceback
        print(f"Error serving audio: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Print available tracks on startup
    with app.app_context():
        tracks = get_tracks().json
        print("\nAvailable tracks:")
        for track in tracks['tracks']:
            print(f"- {track['name']}")
    
    app.run(debug=True, port=5001)