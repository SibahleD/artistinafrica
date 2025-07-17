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
            role TEXT NOT NULL CHECK(role IN ('artist', 'studio_owner', 'service_provider')),
            bio TEXT,
            location TEXT
        )
    ''')

    # Social Media Profiles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS social_media_profiles (
            profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            handle TEXT NOT NULL,
            url TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')

    # Studio Galleries
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS studio_galleries (
            image_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            image_url TEXT NOT NULL,
            caption TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')

    # Studio Equipment
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS studio_equipment (
            equipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')

    # Studio Features
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS studio_features (
            feature_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')

    # Services (recording, mixing, mastering, rental)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS services (
            service_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            service_type TEXT NOT NULL CHECK(service_type IN ('recording', 'mixing', 'mastering', 'rental')),
            pricing_model TEXT NOT NULL CHECK(pricing_model IN ('hourly', 'daily', 'flat')),
            price REAL NOT NULL,
            comments TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')

    # Beat Lease Pricing
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS beat_lease_pricing (
            lease_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tier_name TEXT NOT NULL,
            price REAL NOT NULL,
            details TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')

    # Quick Info (service provider short pitch)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quick_info (
            user_id INTEGER PRIMARY KEY,
            info TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')

    # Placements (streaming links)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS placements (
            placement_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            platform TEXT NOT NULL,
            link TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ All tables created successfully.")

if __name__ == '__main__':
    create_tables()
