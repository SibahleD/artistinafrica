import sqlite3

def create_tables():
    conn = sqlite3.connect('artistinafrica.db')
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            user_type TEXT NOT NULL CHECK(user_type IN ('artist', 'studio_owner', 'service_provider')),
            avatar_url TEXT,
            contact TEXT,
            country TEXT,
            city TEXT
        )
    ''')

    # Artist Profiles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS artist_profiles (
            artist_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            user_title TEXT,
            user_bio TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS artist_pricing (
            pricing_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tier TEXT CHECK(tier IN ('Beat Lease', 'Unlimited Use', 'Exclusive Lease')),
            price REAL NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS artist_portfolio (
            file_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            file_type TEXT CHECK(file_type IN ('audio', 'image')),
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS artist_socials (
            social_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            username TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS artist_skills (
            skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            skill TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    # Studio Owner Profiles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS studio_profiles (
            studio_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            studio_name TEXT NOT NULL,
            studio_location TEXT,
            studio_bio TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS studio_equipment (
            equipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            equipment_name TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS studio_pricing (
            pricing_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            service_type TEXT CHECK(service_type IN ('Hourly Recording', 'Full Day Rental', 'Mixing and Mastering')),
            price REAL NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS studio_gallery (
            image_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            caption TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    # Service Provider Profiles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS service_provider_profiles (
            provider_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            service_provided TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS provider_skills (
            skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            skill TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS provider_pricing (
            pricing_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            price_description TEXT NOT NULL,
            price_range TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS provider_portfolio (
            portfolio_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            media_type TEXT CHECK(media_type IN ('audio', 'image', 'video', 'document')),
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    ''')

    # Messaging System
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message_body TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT 0,
            FOREIGN KEY(sender_id) REFERENCES users(user_id),
            FOREIGN KEY(receiver_id) REFERENCES users(user_id)
        )
    ''')

    # Studio Booking System
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS studio_bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            studio_owner_id INTEGER NOT NULL,
            service_type TEXT,
            booking_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            status TEXT CHECK(status IN ('pending', 'confirmed', 'cancelled', 'rescheduled')) DEFAULT 'pending',
            notes TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id),
            FOREIGN KEY(studio_owner_id) REFERENCES users(user_id)
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ All tables created successfully.")

if __name__ == '__main__':
    create_tables()
