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

@app.route('/synchat')
def synchat():
    return render_template('synchat.html')

@app.route('/booking-artist')
def booking_artist():
    return render_template('booking-artist.html')

@app.route('/booking-service')
def booking_service():
    return render_template('booking-service.html')

@app.route('/booking-studio')
def booking_studio():
    return render_template('booking-studio.html')

@app.route('/user-settings')
def user_settings():
    return render_template('user-settings.html')

@app.route('/results')
def results():
    return render_template('results.html')

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

@app.route('/register/studio', methods=['POST'])
def register_studio():
    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    country = data.get('country', '')
    city = data.get('city', '')
    studio_name = data.get('studio_name', '')

    if not all([username, email, password, studio_name]):
        return jsonify({'error': 'Username, email, password, and studio name are required.'}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Insert into users table
        cursor.execute('''
            INSERT INTO users (username, email, password, user_type, country, city)
            VALUES (?, ?, ?, 'studio_owner', ?, ?)
        ''', (username, email, hashed_password, country, city))
        
        conn.commit()
        user_id = cursor.lastrowid

        # Create studio profile
        cursor.execute('''
            INSERT INTO studio_profiles (user_id, studio_name, studio_location)
            VALUES (?, ?, ?)
        ''', (user_id, studio_name, f"{city}, {country}"))
        
        conn.commit()

        return jsonify({
            'message': 'Studio owner registered successfully', 
            'user_id': user_id
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists.'}), 409

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()

# --------------- LOGIN MANAGEMENT -------------

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

@app.route('/api/studio/<int:user_id>', methods=['GET'])
def get_studio_dashboard(user_id):
    try:
        conn = get_db()
        cursor = conn.cursor()

        # 1. Get basic studio info
        cursor.execute('''
            SELECT 
                u.username, u.avatar_url, u.country, u.city,
                s.studio_name, s.studio_location, s.studio_bio
            FROM users u
            JOIN studio_profiles s ON u.user_id = s.user_id
            WHERE u.user_id = ?
        ''', (user_id,))
        studio = cursor.fetchone()

        if not studio:
            return jsonify({'error': 'Studio not found'}), 404

        # 2. Get equipment list
        cursor.execute('''
            SELECT equipment_name FROM studio_equipment
            WHERE user_id = ?
            ORDER BY equipment_id
        ''', (user_id,))
        equipment = [row[0] for row in cursor.fetchall()]

        # 3. Get pricing/services
        cursor.execute('''
            SELECT service_type, price FROM studio_pricing
            WHERE user_id = ?
            ORDER BY pricing_id
        ''', (user_id,))
        pricing = [{'service': row[0], 'price': row[1]} 
                 for row in cursor.fetchall()]

        # 4. Get social links (using artist_socials table as per schema)
        cursor.execute('''
            SELECT platform, username FROM artist_socials
            WHERE user_id = ?
        ''', (user_id,))
        socials = [{'platform': row[0], 'username': row[1]} 
                 for row in cursor.fetchall()]

        # 5. Get gallery images
        cursor.execute('''
            SELECT file_name, caption FROM studio_gallery
            WHERE user_id = ?
            ORDER BY image_id
        ''', (user_id,))
        gallery = [{'url': f"/upload/{row[0]}", 'caption': row[1]} 
                 for row in cursor.fetchall()]

        # 6. Get upcoming bookings
        cursor.execute('''
            SELECT 
                b.booking_id, 
                b.booking_date, 
                b.time_slot,
                b.status,
                b.service_type,
                u.username as client_name
            FROM studio_bookings b
            JOIN users u ON b.user_id = u.user_id
            WHERE b.studio_owner_id = ? 
            AND b.booking_date >= date('now')
            AND b.status != 'cancelled'
            ORDER BY b.booking_date, b.time_slot
        ''', (user_id,))
        bookings = [{
            'id': row[0],
            'date': row[1],
            'time_slot': row[2],
            'status': row[3],
            'service_type': row[4],
            'client_name': row[5]
        } for row in cursor.fetchall()]

        return jsonify({
            'studio_name': studio['studio_name'],
            'owner_name': studio['username'],
            'location': studio['studio_location'] or f"{studio['city']}, {studio['country']}",
            'avatar_url': studio['avatar_url'],
            'bio': studio['studio_bio'],
            'equipment': equipment,
            'pricing': pricing,
            'socials': socials,
            'gallery': gallery,
            'bookings': bookings
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()

@app.route('/api/bookings/<int:booking_id>/confirm', methods=['POST'])
def confirm_booking(booking_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Verify the booking belongs to this studio
        cursor.execute('''
            SELECT studio_owner_id FROM studio_bookings
            WHERE booking_id = ?
        ''', (booking_id,))
        booking = cursor.fetchone()

        if not booking or booking[0] != session['user_id']:
            return jsonify({'error': 'Booking not found or unauthorized'}), 404

        # Update booking status
        cursor.execute('''
            UPDATE studio_bookings SET status = 'confirmed'
            WHERE booking_id = ?
        ''', (booking_id,))
        conn.commit()

        return jsonify({'message': 'Booking confirmed successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()

@app.route('/api/bookings/<int:booking_id>/<action>', methods=['POST'])
def manage_booking(booking_id, action):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    if action not in ['cancel', 'decline']:
        return jsonify({'error': 'Invalid action'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Verify the booking belongs to this studio
        cursor.execute('''
            SELECT studio_owner_id FROM studio_bookings
            WHERE booking_id = ?
        ''', (booking_id,))
        booking = cursor.fetchone()

        if not booking or booking[0] != session['user_id']:
            return jsonify({'error': 'Booking not found or unauthorized'}), 404

        # Update booking status
        new_status = 'cancelled'
        cursor.execute(f'''
            UPDATE studio_bookings SET status = ?
            WHERE booking_id = ?
        ''', (new_status, booking_id))
        conn.commit()

        return jsonify({'message': f'Booking {new_status} successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()

@app.route('/upload-gallery', methods=['POST'])
def upload_gallery_images():

    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    if 'gallery' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400

    files = request.files.getlist('gallery')
    if not files:
        return jsonify({'error': 'No files selected'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        uploaded_files = []

        for file in files:
            if file.filename == '':
                continue

            if not allowed_file(file.filename):
                continue

            filename = secure_filename(file.filename)
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)

            # Get caption from form data
            caption = request.form.get(f'caption_{filename}', '')

            cursor.execute('''
                INSERT INTO studio_gallery (user_id, file_name, caption)
                VALUES (?, ?, ?)
            ''', (session['user_id'], filename, caption))
            
            uploaded_files.append({
                'filename': filename,
                'caption': caption
            })

        conn.commit()
        return jsonify({
            'message': f'{len(uploaded_files)} files uploaded successfully',
            'files': uploaded_files
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()

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

# ---------------- Data-MANAGEMENT ------------

@app.route('/api/studio/<int:user_id>/pricing', methods=['GET'])
def get_studio_pricing(user_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT service_type, price FROM studio_pricing
            WHERE user_id = ?
            ORDER BY pricing_id
        ''', (user_id,))
        
        pricing = [{'service_type': row[0], 'price': row[1]} 
                  for row in cursor.fetchall()]
        
        return jsonify({'pricing': pricing}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio/update', methods=['POST'])
def update_studio_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    user_id = session['user_id']

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Update basic studio info
        cursor.execute('''
            UPDATE studio_profiles
            SET studio_name = ?, studio_location = ?, studio_bio = ?
            WHERE user_id = ?
        ''', (data.get('studio_name'), data.get('studio_location'), 
              data.get('studio_bio'), user_id))

        # Update equipment - first delete existing, then insert new
        cursor.execute('DELETE FROM studio_equipment WHERE user_id = ?', (user_id,))
        if 'equipment' in data and isinstance(data['equipment'], list):
            for item in data['equipment']:
                cursor.execute('''
                    INSERT INTO studio_equipment (user_id, equipment_name)
                    VALUES (?, ?)
                ''', (user_id, item))

        # Update pricing - first delete existing, then insert new
        cursor.execute('DELETE FROM studio_pricing WHERE user_id = ?', (user_id,))
        if 'pricing' in data and isinstance(data['pricing'], list):
            for price in data['pricing']:
                cursor.execute('''
                    INSERT INTO studio_pricing (user_id, service_type, price)
                    VALUES (?, ?, ?)
                ''', (user_id, price['service_type'], price['price']))

        conn.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

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
    app.run(host='0.0.0.0', port=10000, debug=True)
