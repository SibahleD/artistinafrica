from flask import Flask, redirect, url_for, session, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "default-secret-key")  # secure this
CORS(app, supports_credentials=True)  # allow cookies for session
DATABASE = 'artistinafrica.db'
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'upload')
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'jpg', 'jpeg', 'png'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)



CORS(app)
oauth = OAuth(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Configure Google OAuth2
oauth.register(
    name='google',
    client_id='YOUR_GOOGLE_CLIENT_ID',
    client_secret='YOUR_GOOGLE_CLIENT_SECRET',
    access_token_url='https://oauth2.googleapis.com/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params={'access_type': 'offline'},
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://www.googleapis.com/oauth2/v1/userinfo',  # optional
    client_kwargs={'scope': 'openid email profile'}
)

# SQLite Connection
def get_db_connection():
    conn = sqlite3.connect('artistinafrica.db')
    conn.row_factory = sqlite3.Row
    return conn

# ---------------- ROUTES ----------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/studio-view')
def studio_view():
    return render_template('studio-view.html')

@app.route('/sign-in')
def sign_in():
    return render_template('sign-in.html')

@app.route('/sign-up')
def sign_up():
    return render_template('sign-up.html')

@app.route('/sign-up-artist')
def sign_up_artist():
    return render_template('sign-up-artist.html')

@app.route('/sign-up-studio')
def sign_up_studio():
    return render_template('sign-up-studio.html')

@app.route('/sign-up-service')
def sign_up_service():
    return render_template('sign-up-service.html')

@app.route('/artist-profile')
def artist_profile():
    return render_template('artist-profile.html')

@app.route('/studio-profile')
def studio_profile():
    return render_template('studio-profile.html')


# -------------- PAGES ---------------
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('sign_in'))  # redirect to your login page route

    user_type = session.get('user_type')

    if user_type == 'artist':
        return redirect(url_for('artist_dashboard'))
    elif user_type == 'studio_owner':
        return redirect(url_for('studio_dashboard'))
    elif user_type == 'service_provider':
        return redirect(url_for('service_provider_dashboard'))
    else:
        session.clear()
        return redirect(url_for('login_page'))
    
@app.route('/dashboard-artist')
def artist_dashboard():
    return render_template('dashboard-artist.html')

@app.route('/dashboard-studio')
def studio_dashboard():
    return render_template('dashboard-studio.html')

@app.route('/dashboard-service')
def service_provider_dashboard():
    return render_template('dashboard-service.html')

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# --------------- ACCOUNT MANAGEMENT -------------

@app.route('/register/artist', methods=['POST'])
def register_artist():
    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    country = data.get('country', '')
    city = data.get('city', '')

    if not all([username, email, password]):
        return jsonify({'error': 'Username, email, and password are required.'}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, email, password, user_type, country, city)
            VALUES (?, ?, ?, 'artist', ?, ?)
        ''', (username, email, hashed_password, country, city))
        
        conn.commit()
        user_id = cursor.lastrowid

        # Optional: Create a blank artist profile row now (can be updated later)
        cursor.execute('''
            INSERT INTO artist_profiles (user_id) VALUES (?)
        ''', (user_id,))
        conn.commit()

        return jsonify({'message': 'Artist registered successfully', 'user_id': user_id}), 201

    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists.'}), 409

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()


@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({'error': 'Both fields are required.'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT user_id, username, email, password, user_type FROM users
            WHERE email = ?
        ''', (email,))
        user = cursor.fetchone()

        if user and check_password_hash(user[3], password):
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['email'] = user[2]
            session['user_type'] = user[4]

            return jsonify({
                'message': 'Login successful',
                'user_id': user[0],
                'user_type': user[4]
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()


@app.route('/api/artist/<int:user_id>', methods=['GET'])
def get_artist_dashboard(user_id):
    try:
        conn = get_db()
        cursor = conn.cursor()

        # Get user info
        cursor.execute('''
            SELECT username, avatar_url, country, city
            FROM users WHERE user_id = ?
        ''', (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        username, avatar_url, country, city = user

        # Get artist profile
        cursor.execute('''
            SELECT user_title, user_bio FROM artist_profiles
            WHERE user_id = ?
        ''', (user_id,))
        profile = cursor.fetchone() or ('', '')

        user_title, user_bio = profile

        # Get socials
        cursor.execute('''
            SELECT platform, username FROM artist_socials
            WHERE user_id = ?
        ''', (user_id,))
        socials = cursor.fetchall()

        # Get pricing
        cursor.execute('''
            SELECT tier, price FROM artist_pricing
            WHERE user_id = ?
        ''', (user_id,))
        pricing = cursor.fetchall()

        # Get portfolio
        cursor.execute('''
            SELECT file_name, file_type FROM artist_portfolio
            WHERE user_id = ?
        ''', (user_id,))
        portfolio = cursor.fetchall()

        return jsonify({
            'username': username,
            'avatar_url': avatar_url,
            'location': f"{city}, {country}",
            'user_title': user_title,
            'user_bio': user_bio,
            'socials': [{'platform': s[0], 'username': s[1]} for s in socials],
            'pricing': [{'tier': p[0], 'price': p[1]} for p in pricing],
            'portfolio': [{'file_name': f[0], 'file_type': f[1]} for f in portfolio],
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---------------- UPLOAD-MANAGEMENT ------------



@app.route('/upload-beat', methods=['POST'])
def upload_beat_file():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    try:
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        file_type = get_file_type(ext)
        if not file_type:
            return jsonify({'error': 'Unsupported file type'}), 400

        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO artist_portfolio (user_id, file_name, file_type)
            VALUES (?, ?, ?)
        ''', (session['user_id'], filename, file_type))
        conn.commit()

        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'file_type': file_type
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()


@app.route('/upload/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=False)

def get_file_type(extension):
    audio_exts = {'mp3', 'wav', 'ogg'}
    image_exts = {'jpg', 'jpeg', 'png'}

    if extension in audio_exts:
        return 'audio'
    elif extension in image_exts:
        return 'image'
    else:
        return None



# ---------------- GOOGLE OAUTH ----------------

@app.route('/login/google')
def login_google():
    redirect_uri = url_for('authorize_google', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route('/authorize/google')
def authorize_google():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.parse_id_token(token)

    if not user_info:
        return jsonify({'error': 'Google login failed'}), 401

    email = user_info['email']
    name = user_info.get('name', email.split('@')[0])

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

    if not user:
        # Register a new user
        conn.execute('''
            INSERT INTO users (username, email, password, role, bio, location)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, email, '', 'artist', '', ''))
        conn.commit()
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

    conn.close()

    session['user_id'] = user['user_id']
    session['role'] = user['role']
    return redirect('/')  # Change this to frontend dashboard URL

# ---------------- USER DATA ----------------

@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    users = conn.execute('SELECT * FROM users').fetchall()
    conn.close()
    return jsonify([dict(user) for user in users])

# ---------------------------------------------

if __name__ == '__main__':
    app.run(debug=True)
