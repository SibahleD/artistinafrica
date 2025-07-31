from flask import Flask, redirect, url_for, session, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import datetime
import json
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

@app.route('/profile-artist')
def artist_profile():
    return render_template('profile-artist.html')

@app.route('/profile-studio')
def studio_profile():
    return render_template('profile-studio.html')

@app.route('/synchat')
def synchat():
    return render_template('synchat.html')

@app.route('/booking-artist')
def booking_artist():
    return render_template('booking-artist.html')


@app.route('/booking-manager')
def booking_manager():
    return render_template('booking-manager.html')

@app.route('/user-settings')
def user_settings():
    return render_template('user-settings.html')

@app.route('/results')
def results():
    return render_template('results.html')

# -------------- DASHBOARD PAGES ---------------
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('sign_in')) 

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


# ----------------------------------------------------------------------------------------

@app.route('/api/trending-studios')
def get_trending_studios():
    try:
        conn = get_db()
        cursor = conn.cursor()

        # Get trending studios (you can modify the query to implement your trending logic)
        cursor.execute('''
            SELECT 
                s.studio_id,
                s.studio_name,
                s.studio_location,
                u.city,
                u.country
            FROM studio_profiles s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN studio_gallery g ON s.user_id = g.user_id
            GROUP BY s.studio_id
            ORDER BY RANDOM()
            LIMIT 5
        ''')
        
        studios = []
        print(f'Studios: {studios}')
        
        for row in cursor.fetchall():
            studio = dict(row)
            studio['image_url'] = '/static/images/default-studio.jpg'
            studios.append(studio)
        
        return jsonify(studios)

    except Exception as e:
        
        print("Error in /api/studio-data:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/profile-studio/<int:studio_id>')
def studio_profile_page(studio_id):
    return render_template('profile-studio.html', studio_id=studio_id)

# @app.route('/api/studio/<int:studio_id>')
def get_current_studio_data(studio_id):
    conn = get_db()
    cursor = conn.cursor()

    # Basic studio info
    cursor.execute('''
        SELECT s.studio_id, s.studio_name, s.studio_location, u.city, u.country, u.username
        FROM studio_profiles s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.studio_id = ?
    ''', (studio_id,))
    studio = cursor.fetchone()
    if not studio:
        return jsonify({'error': 'Studio not found'}), 404

    studio_data = {
        'studio_id': studio[0],
        'studio_name': studio[1],
        'studio_location': studio[2],
        'city': studio[3],
        'country': studio[4],
        'owner_name': studio[5],
    }

    # Optionally: Gallery images
    cursor.execute('''
        SELECT file_name FROM studio_gallery WHERE user_id = (
            SELECT user_id FROM studio_profiles WHERE studio_id = ?
        )
    ''', (studio_id,))
    images = [f'/upload/{row[0]}' for row in cursor.fetchall()]
    studio_data['gallery'] = images

    return jsonify(studio_data)


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

            print(f'Username: {user[1]}')


            return jsonify({
                'message': 'Login successful',
                'user_id': user[0],
                'username': user[1],
                'email': user[2],
                'user_type': user[4]
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

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

# --------------------------
# Studio API Endpoints
# --------------------------

@app.route('/api/studio-data')
def get_studio_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    
    try:
        conn = get_db()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get basic studio info
        cursor.execute('''
            SELECT s.studio_name, s.studio_location, s.studio_bio, 
                   u.username, u.avatar_url
            FROM studio_profiles s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.user_id = ?
        ''', (user_id,))
        studio_data = cursor.fetchone()

        if not studio_data:
            return jsonify({'error': 'Studio not found'}), 404

        # Get studio pricing
        cursor.execute('''
            SELECT service_type, price 
            FROM studio_pricing
            WHERE user_id = ?
        ''', (user_id,))
        pricing = [dict(row) for row in cursor.fetchall()]

        # Get studio equipment
        cursor.execute('''
            SELECT equipment_id, equipment_name
            FROM studio_equipment
            WHERE user_id = ?
        ''', (user_id,))
        equipment = [dict(row) for row in cursor.fetchall()]

        # Get studio gallery
        cursor.execute('''
            SELECT image_id, file_name, caption
            FROM studio_gallery
            WHERE user_id = ?
        ''', (user_id,))
        gallery = [dict(row) for row in cursor.fetchall()]


        return jsonify({
            'studio_name': studio_data['studio_name'],
            'studio_location': studio_data['studio_location'],
            'studio_bio': studio_data['studio_bio'],
            'username': studio_data['username'],
            'avatar_url': studio_data['avatar_url'],
            'pricing': pricing,
            'equipment': equipment,
            'gallery': gallery
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio/<int:studio_id>')
def get_public_studio_profile(studio_id):
    try:
        conn = get_db()
        cursor = conn.cursor()

        # Get basic studio info
        cursor.execute('''
            SELECT s.studio_name, s.studio_location, s.studio_bio, 
                   u.username, u.avatar_url, u.country, u.city
            FROM studio_profiles s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.studio_id = ?
        ''', (studio_id,))
        studio_data = cursor.fetchone()

        if not studio_data:
            return jsonify({'error': 'Studio not found'}), 404

        # Get studio pricing
        cursor.execute('''
            SELECT service_type, price 
            FROM studio_pricing
            WHERE user_id = (SELECT user_id FROM studio_profiles WHERE studio_id = ?)
        ''', (studio_id,))
        pricing = [dict(row) for row in cursor.fetchall()]

        # Get studio equipment (only names for public view)
        cursor.execute('''
            SELECT equipment_name
            FROM studio_equipment
            WHERE user_id = (SELECT user_id FROM studio_profiles WHERE studio_id = ?)
        ''', (studio_id,))
        equipment = [row['equipment_name'] for row in cursor.fetchall()]

        # Get studio gallery (only approved images)
        cursor.execute('''
            SELECT file_name, caption
            FROM studio_gallery
            WHERE user_id = (SELECT user_id FROM studio_profiles WHERE studio_id = ?)
        ''', (studio_id,))
        gallery = [dict(row) for row in cursor.fetchall()]

        return jsonify({
            'studio_name': studio_data['studio_name'],
            'studio_location': studio_data['studio_location'],
            'studio_bio': studio_data['studio_bio'],
            'username': studio_data['username'],
            'avatar_url': studio_data['avatar_url'],
            'country': studio_data['country'],
            'city': studio_data['city'],
            'pricing': pricing,
            'amenities': equipment,  # Using equipment as amenities for public view
            'gallery': gallery
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio-equipment')
def get_studio_equipment():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT equipment_id, equipment_name
            FROM studio_equipment
            WHERE user_id = ?
        ''', (user_id,))
        equipment = [dict(row) for row in cursor.fetchall()]

        return jsonify(equipment)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio-gallery')
def get_studio_gallery():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT image_id, file_name, caption
            FROM studio_gallery
            WHERE user_id = ?
        ''', (user_id,))
        gallery = [dict(row) for row in cursor.fetchall()]

        return jsonify(gallery)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/upload-studio-file', methods=['POST'])
def upload_studio_file():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    upload_type = request.form.get('upload_type')
    if not upload_type or upload_type not in ['studio-image', 'equipment']:
        return jsonify({'error': 'Invalid upload type'}), 400

    try:
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        conn = get_db()
        cursor = conn.cursor()

        if upload_type == 'studio-image':
            caption = request.form.get('caption', '')
            cursor.execute('''
                INSERT INTO studio_gallery (user_id, file_name, caption)
                VALUES (?, ?, ?)
            ''', (session['user_id'], filename, caption))
        elif upload_type == 'equipment':
            equipment_name = request.form.get('equipment_name', 'New Equipment')
            cursor.execute('''
                INSERT INTO studio_equipment (user_id, equipment_name, file_name)
                VALUES (?, ?, ?)
            ''', (session['user_id'], equipment_name, filename))

        conn.commit()

        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'type': upload_type
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio-equipment/<int:equipment_id>', methods=['DELETE'])
def delete_equipment(equipment_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Verify ownership
        cursor.execute('''
            SELECT file_name FROM studio_equipment
            WHERE equipment_id = ? AND user_id = ?
        ''', (equipment_id, session['user_id']))
        equipment = cursor.fetchone()

        if not equipment:
            return jsonify({'error': 'Equipment not found or unauthorized'}), 404

        # Delete file from filesystem
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], equipment['file_name'])
        if os.path.exists(file_path):
            os.remove(file_path)

        # Delete from database
        cursor.execute('''
            DELETE FROM studio_equipment
            WHERE equipment_id = ?
        ''', (equipment_id,))
        conn.commit()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio-gallery/<int:image_id>', methods=['DELETE'])
def delete_gallery_image(image_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Verify ownership
        cursor.execute('''
            SELECT file_name FROM studio_gallery
            WHERE image_id = ? AND user_id = ?
        ''', (image_id, session['user_id']))
        image = cursor.fetchone()

        if not image:
            return jsonify({'error': 'Image not found or unauthorized'}), 404

        # Delete file from filesystem
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], image['file_name'])
        if os.path.exists(file_path):
            os.remove(file_path)

        # Delete from database
        cursor.execute('''
            DELETE FROM studio_gallery
            WHERE image_id = ?
        ''', (image_id,))
        conn.commit()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio/<int:user_id>/update', methods=['POST'])
def update_studio_profile(user_id):
    if 'user_id' not in session or session['user_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Update studio information - only update fields that were provided
        updates = []
        params = []
        
        studio_name = request.form.get('studio_name')
        if studio_name and studio_name.strip():
            updates.append("studio_name = ?")
            params.append(studio_name.strip())
            print(f"Sent Studio name:{studio_name}")

        studio_location = request.form.get('studio_location')
        if studio_location and studio_location.strip():
            updates.append("studio_location = ?")
            params.append(studio_location.strip())
            print(f"Sent Studio location:{studio_location}")
        
        studio_bio = request.form.get('studio_bio')
        if studio_bio and studio_bio.strip():
            updates.append("studio_bio = ?")
            params.append(studio_bio.strip())
            print(f"Sent Studio name:{studio_bio}")
        
        # Only execute update if there are fields to update
        if updates:
            query = "UPDATE studio_profiles SET " + ", ".join(updates) + " WHERE user_id = ?"
            params.append(user_id)
            cursor.execute(query, params)
        
        # Update equipment - only if provided
        if 'equipment' in request.form:
            equipment = json.loads(request.form.get('equipment'))
            if equipment:  # Only process if array is not empty
                cursor.execute('DELETE FROM studio_equipment WHERE user_id = ?', (user_id,))
                for item in equipment:
                    if item.strip():  # Only insert non-empty items
                        cursor.execute('''
                            INSERT INTO studio_equipment (user_id, equipment_name)
                            VALUES (?, ?)
                        ''', (user_id, item.strip()))
        
        # Update pricing - only if provided
        if 'pricing' in request.form:
            pricing = json.loads(request.form.get('pricing'))
            if pricing:  # Only process if array is not empty
                cursor.execute('DELETE FROM studio_pricing WHERE user_id = ?', (user_id,))
                for item in pricing:
                    if item.get('service_type', '').strip() and isinstance(item.get('price'), (int, float)):
                        cursor.execute('''
                            INSERT INTO studio_pricing (user_id, service_type, price)
                            VALUES (?, ?, ?)
                        ''', (user_id, item['service_type'].strip(), float(item['price'])))
        
        # Handle gallery uploads - only if files were uploaded
        if 'gallery_files' in request.files:
            gallery_files = request.files.getlist('gallery_files')
            gallery_captions = json.loads(request.form.get('gallery_captions', '[]'))
            
            for i, file in enumerate(gallery_files):
                if file and file.filename and allowed_file(file.filename) and file.content_length > 0:
                    filename = secure_filename(file.filename)
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    caption = gallery_captions[i].strip() if i < len(gallery_captions) and gallery_captions[i] else ''
                    cursor.execute('''
                        INSERT INTO studio_gallery (user_id, file_name, caption)
                        VALUES (?, ?, ?)
                    ''', (user_id, filename, caption))
        
        conn.commit()
        return jsonify({'message': 'Studio profile updated successfully'}), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# --------------------------
# Studio Booking Endpoints
# --------------------------

@app.route('/api/studio-availability')
def get_studio_availability():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Get all bookings for the studio
        cursor.execute('''
            SELECT booking_date, time_slot
            FROM studio_bookings
            WHERE studio_owner_id = ? 
            AND status IN ('confirmed', 'pending')
            AND booking_date >= date('now')
        ''', (session['user_id'],))
        bookings = cursor.fetchall()

        # Generate available dates (next 30 days)
        available_dates = []
        today = datetime.date.today()
        for i in range(30):
            date = today + datetime.timedelta(days=i)
            available_dates.append(date.strftime('%Y-%m-%d'))

        return jsonify({
            'available_dates': available_dates,
            'bookings': [dict(row) for row in bookings]
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio-availability/<string:date>')
def get_availability_for_date(date):
    # Get studio_id from query parameters
    studio_id = request.args.get('studio_id')
    if not studio_id:
        return jsonify({'error': 'studio_id parameter is required'}), 400

    try:
        # Validate date format
        datetime.datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Get studio owner ID from studio_id
        cursor.execute('''
            SELECT user_id FROM studio_profiles WHERE studio_id = ?
        ''', (studio_id,))
        studio_owner = cursor.fetchone()
        
        if not studio_owner:
            return jsonify({'error': 'Studio not found'}), 404

        # Get bookings for the specific date
        cursor.execute('''
            SELECT time_slot
            FROM studio_bookings
            WHERE studio_owner_id = ?
            AND booking_date = ?
            AND status IN ('confirmed', 'pending')
        ''', (studio_owner['user_id'], date))
        booked_slots = [row['time_slot'] for row in cursor.fetchall()]

        # Generate all possible time slots (9AM to 9PM, hourly)
        all_slots = []
        for hour in range(9, 21):
            slot = f"{hour:02d}:00 - {hour+1:02d}:00"
            if slot not in booked_slots:
                all_slots.append(slot)

        return jsonify({
            'available_slots': all_slots,
            'booked_slots': booked_slots,
            'date': date,
            'studio_id': studio_id
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio-bookings')
def get_studio_bookings():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Get bookings for this studio
        cursor.execute('''
            SELECT b.booking_id, b.service_type, b.booking_date, b.time_slot, 
                   b.status, b.notes, u.username as client_name
            FROM studio_bookings b
            JOIN users u ON b.user_id = u.user_id
            WHERE b.studio_owner_id = ?
            AND b.booking_date >= date('now')
            ORDER BY b.booking_date, b.time_slot
        ''', (session['user_id'],))
        bookings = [dict(row) for row in cursor.fetchall()]

        return jsonify(bookings)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/create-booking', methods=['POST'])
def create_booking():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # Ensure the request is JSON and parse it
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 415

    try:
        data = request.get_json()
    except:
        return jsonify({'error': 'Invalid JSON'}), 400

    # Validate required fields
    required_fields = ['studio_id', 'service_type', 'booking_date', 'time_slot']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Verify studio exists
        cursor.execute('SELECT user_id FROM studio_profiles WHERE studio_id = ?', 
                      (data['studio_id'],))
        studio_owner = cursor.fetchone()
        
        if not studio_owner:
            return jsonify({'error': 'Studio not found'}), 404

        # Check slot availability
        cursor.execute('''
            SELECT 1 FROM studio_bookings
            WHERE studio_owner_id = ?
            AND booking_date = ?
            AND time_slot = ?
            AND status IN ('confirmed', 'pending')
        ''', (studio_owner['user_id'], data['booking_date'], data['time_slot']))
        
        if cursor.fetchone():
            return jsonify({'error': 'Time slot already booked'}), 400

        # Create booking
        cursor.execute('''
            INSERT INTO studio_bookings (
                user_id, studio_owner_id, service_type,
                booking_date, time_slot, status, notes
            ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
        ''', (
            session['user_id'],
            studio_owner['user_id'],
            data['service_type'],
            data['booking_date'],
            data['time_slot'],
            data.get('notes', '')
        ))
        conn.commit()

        return jsonify({
            'success': True,
            'booking_id': cursor.lastrowid
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/studio-bookings/<int:booking_id>', methods=['PATCH'])
def update_booking_status(booking_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    if 'status' not in data or data['status'] not in ['confirmed', 'cancelled', 'rescheduled']:
        return jsonify({'error': 'Invalid status'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Verify ownership
        cursor.execute('''
            SELECT 1 FROM studio_bookings
            WHERE booking_id = ? AND studio_owner_id = ?
        ''', (booking_id, session['user_id']))
        if not cursor.fetchone():
            return jsonify({'error': 'Booking not found or unauthorized'}), 404

        # Update status
        cursor.execute('''
            UPDATE studio_bookings
            SET status = ?
            WHERE booking_id = ?
        ''', (data['status'], booking_id))
        conn.commit()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/studio-bookings/<int:booking_id>/reschedule', methods=['PATCH'])
def reschedule_booking(booking_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    required_fields = ['new_date', 'new_time_slot']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Verify ownership
        cursor.execute('''
            SELECT studio_owner_id FROM studio_bookings
            WHERE booking_id = ?
        ''', (booking_id,))
        booking = cursor.fetchone()

        if not booking or booking['studio_owner_id'] != session['user_id']:
            return jsonify({'error': 'Booking not found or unauthorized'}), 404

        # Check new slot availability
        cursor.execute('''
            SELECT 1 FROM studio_bookings
            WHERE studio_owner_id = ?
            AND booking_date = ?
            AND time_slot = ?
            AND status IN ('confirmed', 'pending')
            AND booking_id != ?
        ''', (session['user_id'], data['new_date'], data['new_time_slot'], booking_id))
        if cursor.fetchone():
            return jsonify({'error': 'New time slot already booked'}), 400

        # Update booking
        cursor.execute('''
            UPDATE studio_bookings
            SET booking_date = ?, time_slot = ?, status = 'rescheduled'
            WHERE booking_id = ?
        ''', (data['new_date'], data['new_time_slot'], booking_id))
        conn.commit()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ========== ARTIST PROFILE ENDPOINTS ==========

@app.route('/api/artist-profile', methods=['GET'])
def get_artist_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get basic user info
        cursor.execute('''
            SELECT u.username, u.country, u.city , u.avatar_url, ap.user_title, ap.user_bio
            FROM users u
            LEFT JOIN artist_profiles ap ON u.user_id = ap.user_id
            WHERE u.user_id = ?
        ''', (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Get skills
        cursor.execute('SELECT skill FROM artist_skills WHERE user_id = ?', (user_id,))
        skills = [row[0] for row in cursor.fetchall()]
        
        # Get pricing
        cursor.execute('SELECT tier, price FROM artist_pricing WHERE user_id = ?', (user_id,))
        pricing = [{'tier': row[0], 'price': row[1]} for row in cursor.fetchall()]
        
        # Get social links
        cursor.execute('SELECT platform, username FROM artist_socials WHERE user_id = ?', (user_id,))
        socials = [{'platform': row[0], 'url': f"https://{row[0]}.com/{row[1]}"} for row in cursor.fetchall()]
        
        # Get portfolio files
        cursor.execute('SELECT file_name FROM artist_portfolio WHERE user_id = ? AND file_type = "audio"', (user_id,))
        files = [{'filename': row[0], 'name': os.path.splitext(row[0])[0]} for row in cursor.fetchall()]


        print(user_data['user_title'])
        print(user_data['user_bio'])


        return jsonify({
            'username': user_data['username'],
            'user_title': user_data['user_title'],
            'country': user_data['country'],
            'city': user_data['city'],
            'user_bio': user_data['user_bio'],
            'avatar_url': user_data['avatar_url'],
            'skills': skills,
            'pricing': pricing,
            'socials': socials,
            'files': files
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/artist/<artist_id>', methods=['GET'])
def get_artist_public_profile(artist_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get basic user info
        cursor.execute('''
            SELECT u.username, u.country, u.city, ap.user_title, ap.user_bio
            FROM users u
            LEFT JOIN artist_profiles ap ON u.user_id = ap.user_id
            WHERE u.user_id = ?
        ''', (artist_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({'error': 'Artist not found'}), 404
        
        # Get skills
        cursor.execute('SELECT skill FROM artist_skills WHERE user_id = ?', (artist_id,))
        skills = [row[0] for row in cursor.fetchall()]
        
        # Get pricing
        cursor.execute('SELECT tier, price FROM artist_pricing WHERE user_id = ?', (artist_id,))
        pricing = [{'tier': row[0], 'price': row[1]} for row in cursor.fetchall()]
        
        # Get social links
        cursor.execute('SELECT platform, username FROM artist_socials WHERE user_id = ?', (artist_id,))
        socials = [{'platform': row[0], 'url': f"https://{row[0]}.com/{row[1]}"} for row in cursor.fetchall()]
        
        # Get portfolio files
        cursor.execute('SELECT file_name FROM artist_portfolio WHERE user_id = ? AND file_type = "audio"', (artist_id,))
        portfolio = [{'filename': row[0], 'name': os.path.splitext(row[0])[0]} for row in cursor.fetchall()]
        return jsonify({
            'username': user_data['username'],
            'user_title': user_data['user_title'],
            'country': user_data['country'],
            'city': user_data['city'],
            'user_bio': user_data['user_bio'],
            'skills': skills,
            'pricing': pricing,
            'socials': socials,
            'portfolio': portfolio
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ========== BOOKING ENDPOINTS ==========

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get bookings where user is either the client or the studio owner
        cursor.execute('''
            SELECT 
                b.booking_id as id,
                b.service_type,
                b.booking_date,
                b.time_slot,
                b.status,
                u.username as artist_name,
                s.studio_name
            FROM studio_bookings b
            LEFT JOIN users u ON b.user_id = u.user_id
            LEFT JOIN studio_profiles s ON b.studio_owner_id = s.user_id
            WHERE b.user_id = ? OR b.studio_owner_id = ?
            ORDER BY b.booking_date DESC
        ''', (user_id, user_id))
        
        bookings = []
        for row in cursor.fetchall():
            booking = dict(row)
            bookings.append(booking)
        
        return jsonify(bookings), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/update-booking', methods=['POST'])
def update_booking():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    booking_id = data.get('booking_id')
    status = data.get('status')
    
    if not booking_id or not status:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify the user has permission to update this booking
        cursor.execute('''
            SELECT user_id, studio_owner_id FROM studio_bookings 
            WHERE booking_id = ?
        ''', (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
            
        if session['user_id'] not in [booking['user_id'], booking['studio_owner_id']]:
            return jsonify({'error': 'Unauthorized to update this booking'}), 403
        
        # Update the booking status
        cursor.execute('''
            UPDATE studio_bookings 
            SET status = ? 
            WHERE booking_id = ?
        ''', (status, booking_id))
        conn.commit()
        
        return jsonify({'message': 'Booking updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ========== USER SETTINGS ENDPOINTS ==========

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user_data(user_id):
    if 'user_id' not in session or session['user_id'] != int(user_id):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get basic user info
        cursor.execute('''
            SELECT username, email, country, city, avatar_url
            FROM users 
            WHERE user_id = ?
        ''', (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Get artist profile if exists
        cursor.execute('''
            SELECT user_title, user_bio
            FROM artist_profiles
            WHERE user_id = ?
        ''', (user_id,))
        artist_profile = cursor.fetchone()
        
        # Get skills
        cursor.execute('SELECT skill_id, skill FROM artist_skills WHERE user_id = ?', (user_id,))
        skills = [{'id': row[0], 'skill_name': row[1]} for row in cursor.fetchall()]
        
        # Get pricing
        cursor.execute('SELECT pricing_id as id, tier, price FROM artist_pricing WHERE user_id = ?', (user_id,))
        pricing = [dict(row) for row in cursor.fetchall()]
        
        # Get social links
        cursor.execute('SELECT platform, username FROM artist_socials WHERE user_id = ?', (user_id,))
        socials = [{'platform': row[0], 'url': row[1]} for row in cursor.fetchall()]
        
        return jsonify({
            'username': user_data['username'],
            'email': user_data['email'],
            'country': user_data['country'],
            'city': user_data['city'],
            'avatar_url': user_data['avatar_url'],
            'user_title': artist_profile['user_title'] if artist_profile else '',
            'user_bio': artist_profile['user_bio'] if artist_profile else '',
            'skills': skills,
            'pricing': pricing,
            'socials': socials
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    print(f'User Id: {user_id}')
    conn = None  # Ensure it's defined
    try:
        # === Handle Avatar Upload ===
        if 'avatar' in request.files:
            file = request.files['avatar']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

                conn = get_db()
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE users 
                    SET avatar_url = ? 
                    WHERE user_id = ?
                ''', (f"/upload/{filename}", user_id))
                conn.commit()

                return jsonify({
                    'message': 'Avatar updated successfully',
                    'avatar_url': f"/upload/{filename}"
                }), 200

        # === Handle JSON form data ===

        print("Raw Form Keys:", request.form.keys())
        print("Raw Form Data:", request.form.get('data'))
        data = json.loads(request.form.get('data', '{}'))

        section = data.get('section')
        print(f"Section: {section}\nData: {data}")
        conn = get_db()
        cursor = conn.cursor()

        if section == 'general':
            cursor.execute('''
                UPDATE users 
                SET username = ?, country = ?, city = ? 
                WHERE user_id = ?
            ''', (data['username'], data['country'], data['city'], user_id))

            cursor.execute('''
                INSERT OR REPLACE INTO artist_profiles (user_id, user_title, user_bio)
                VALUES (?, ?, ?)
            ''', (user_id, data['user_title'], data['user_bio']))

        elif section == 'socials':
            for platform, username in data['socials'].items():
                cursor.execute('''
                    INSERT OR REPLACE INTO artist_socials (user_id, platform, username)
                    VALUES (?, ?, ?)
                ''', (user_id, platform, username))

        elif section == 'booking':
            for tier, price in data['bookings'].items():
                cursor.execute('''
                    INSERT OR REPLACE INTO artist_pricing (user_id, tier, price)
                    VALUES (?, ?, ?)
                ''', (user_id, tier, price))

        conn.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200

    except Exception as e:
        print(f"Error occurred: {str(e)}")  # Helpful for debugging
        return jsonify({'error': str(e)}), 500

    finally:
        if conn:
            conn.close()

@app.route('/api/add-skill', methods=['POST'])
def add_skill():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    skill = data.get('skill')
    
    if not skill:
        return jsonify({'error': 'Skill is required'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO artist_skills (user_id, skill)
            VALUES (?, ?)
        ''', (session['user_id'], skill))
        conn.commit()
        
        return jsonify({
            'message': 'Skill added successfully',
            'skill_id': cursor.lastrowid
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/update-skill', methods=['POST'])
def update_skill():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    skill_id = data.get('skill_id')
    new_skill = data.get('new_skill')
    
    if not skill_id or not new_skill:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify the skill belongs to the user
        cursor.execute('''
            SELECT user_id FROM artist_skills 
            WHERE skill_id = ?
        ''', (skill_id,))
        skill = cursor.fetchone()
        
        if not skill or skill['user_id'] != session['user_id']:
            return jsonify({'error': 'Unauthorized to update this skill'}), 403
        
        cursor.execute('''
            UPDATE artist_skills 
            SET skill = ? 
            WHERE skill_id = ?
        ''', (new_skill, skill_id))
        conn.commit()
        
        return jsonify({'message': 'Skill updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/delete-skill', methods=['POST'])
def delete_skill():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    skill_id = data.get('skill_id')
    
    if not skill_id:
        return jsonify({'error': 'Skill ID is required'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify the skill belongs to the user
        cursor.execute('''
            SELECT user_id FROM artist_skills 
            WHERE skill_id = ?
        ''', (skill_id,))
        skill = cursor.fetchone()
        
        if not skill or skill['user_id'] != session['user_id']:
            return jsonify({'error': 'Unauthorized to delete this skill'}), 403
        
        cursor.execute('DELETE FROM artist_skills WHERE skill_id = ?', (skill_id,))
        conn.commit()
        
        return jsonify({'message': 'Skill deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/add-pricing', methods=['POST'])
def add_pricing():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    tier = data.get('tier')
    price = data.get('price')
    
    if not tier or not price:
        return jsonify({'error': 'Tier and price are required'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO artist_pricing (user_id, tier, price)
            VALUES (?, ?, ?)
        ''', (session['user_id'], tier, price))
        conn.commit()
        
        return jsonify({
            'message': 'Pricing tier added successfully',
            'pricing_id': cursor.lastrowid
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/delete-pricing', methods=['POST'])
def delete_pricing():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    price_id = data.get('price_id')
    
    if not price_id:
        return jsonify({'error': 'Price ID is required'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify the pricing belongs to the user
        cursor.execute('''
            SELECT user_id FROM artist_pricing 
            WHERE pricing_id = ?
        ''', (price_id,))
        pricing = cursor.fetchone()
        
        if not pricing or pricing['user_id'] != session['user_id']:
            return jsonify({'error': 'Unauthorized to delete this pricing'}), 403
        
        cursor.execute('DELETE FROM artist_pricing WHERE pricing_id = ?', (price_id,))
        conn.commit()
        
        return jsonify({'message': 'Pricing tier deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ========== PORTFOLIO ENDPOINTS ==========

@app.route('/api/artist-portfolio', methods=['GET'])
def get_artist_portfolio():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT file_id, file_name 
            FROM artist_portfolio 
            WHERE user_id = ? AND file_type = 'audio'
            ORDER BY file_id DESC
        ''', (user_id,))
        
        files = [{'id': row[0], 'filename': row[1]} for row in cursor.fetchall()]
        
        return jsonify({'files': files}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/delete-portfolio-item', methods=['POST'])
def delete_portfolio_item():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    file_id = data.get('file_id')
    
    if not file_id:
        return jsonify({'error': 'File ID is required'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify the file belongs to the user
        cursor.execute('''
            SELECT user_id, file_name FROM artist_portfolio 
            WHERE file_id = ?
        ''', (file_id,))
        file_data = cursor.fetchone()
        
        if not file_data or file_data['user_id'] != session['user_id']:
            return jsonify({'error': 'Unauthorized to delete this file'}), 403
        
        # Delete the file from filesystem
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_data['file_name'])
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete from database
        cursor.execute('DELETE FROM artist_portfolio WHERE file_id = ?', (file_id,))
        conn.commit()
        
        return jsonify({'message': 'File deleted successfully'}), 200
        
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
