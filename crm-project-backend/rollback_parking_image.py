"""
Script to rollback parking product image field migration
Run this to remove the image column from database
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.db import connection

def rollback_image_field():
    """Remove image field from parking_products table"""
    try:
        with connection.cursor() as cursor:
            print("Checking if 'image' column exists...")
            
            # Check if column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'parking_products' 
                AND COLUMN_NAME = 'image'
            """)
            
            exists = cursor.fetchone()[0]
            
            if exists:
                print("Dropping 'image' column from parking_products table...")
                cursor.execute("ALTER TABLE parking_products DROP COLUMN image;")
                print("✅ Successfully removed 'image' column")
            else:
                print("⚠️  'image' column does not exist, nothing to remove")
            
            # Verify image_url column still exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'parking_products' 
                AND COLUMN_NAME = 'image_url'
            """)
            
            image_url_exists = cursor.fetchone()[0]
            if image_url_exists:
                print("✅ 'image_url' column still exists (as expected)")
            else:
                print("⚠️  'image_url' column missing!")
                
        print("\n✅ Rollback completed successfully!")
        print("\nNext steps:")
        print("1. Delete any uploaded images from media/parking_products/ folder")
        print("2. Run: python manage.py showmigrations parking_products")
        print("3. Run: python manage.py migrate parking_products 0001")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("Rolling back Parking Product Image Field")
    print("=" * 60)
    rollback_image_field()
