from flask import Flask, redirect, url_for, session, request, jsonify, render_template
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key")  # Change this for production

CORS(app)
oauth = OAuth(app)

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

@app.route('/artist-profile')
def artist_profile():
    return render_template('artist-profile.html')

@app.route('/studio-profile')
def studio_profile():
    return render_template('studio-profile.html')

@app.route('/dashboard-artist')
def dashboard_artist():
    return render_template('dashboard-artist.html')


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    bio = data.get('bio', '')
    location = data.get('location', '')

    if not all([username, email, password, role]):
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO users (username, email, password, role, bio, location)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, email, hashed_password, role, bio, location))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists'}), 409
    finally:
        conn.close()

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['user_id']
        session['role'] = user['role']
        return jsonify({'message': 'Login successful'})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

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
