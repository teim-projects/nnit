import MySQLdb
import sys

try:
    # Connect to database
    db = MySQLdb.connect(
        host="localhost",
        user="root",
        password="",
        database="nnit_db"
    )
    cursor = db.cursor()
    
    # Drop old table
    print("Dropping old product_requirements table...")
    cursor.execute("DROP TABLE IF EXISTS `product_requirements`")
    print("✓ Table dropped")
    
    # Delete old migrations
    print("Deleting old migration records...")
    cursor.execute("DELETE FROM `django_migrations` WHERE `app` = 'product_requirements'")
    print("✓ Migration records deleted")
    
    # Commit changes
    db.commit()
    print("\n✅ SUCCESS! Now run: python manage.py migrate")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    sys.exit(1)
finally:
    if 'db' in locals():
        db.close()
