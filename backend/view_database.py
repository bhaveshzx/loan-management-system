"""
Database Viewer Script
Run this script to view all tables and data in the database.
"""
import sqlite3
import os

def view_database():
    """View all tables and data in the SQLite database"""
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'loan_management.db')
    
    if not os.path.exists(db_path):
        print(f"Database file not found at: {db_path}")
        print("Make sure the Flask server has been run at least once to create the database.")
        return
    
    print("="*60)
    print("DATABASE VIEWER - Loan Management System")
    print("="*60)
    print(f"Database: {db_path}")
    print("="*60)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("No tables found in the database.")
            return
        
        print(f"\nFound {len(tables)} table(s):\n")
        
        for table in tables:
            table_name = table[0]
            print(f"\n{'='*60}")
            print(f"TABLE: {table_name}")
            print('='*60)
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            if columns:
                print("\nColumns:")
                for col in columns:
                    col_name = col[1]
                    col_type = col[2]
                    nullable = "NULL" if col[3] == 0 else "NOT NULL"
                    print(f"  - {col_name}: {col_type} ({nullable})")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            print(f"\nTotal rows: {row_count}")
            
            if row_count > 0:
                # Get all data
                cursor.execute(f"SELECT * FROM {table_name}")
                rows = cursor.fetchall()
                
                # Get column names
                column_names = [description[0] for description in cursor.description]
                
                # Display data in a table format
                print(f"\nData:")
                # Format column headers
                col_widths = [max(len(str(col)), 15) for col in column_names]
                header = " | ".join(str(col).ljust(col_widths[i]) for i, col in enumerate(column_names))
                print("  " + header)
                print("  " + "-" * len(header))
                
                # Format rows
                for row in rows:
                    formatted_row = " | ".join(
                        (str(val) if val is not None else "NULL").ljust(col_widths[i])[:col_widths[i]]
                        for i, val in enumerate(row)
                    )
                    print("  " + formatted_row)
            else:
                print("\n(No data in this table)")
            
            print()
        
        conn.close()
        print("="*60)
        print("Database viewing complete!")
        print("="*60)
        
    except sqlite3.Error as e:
        print(f"Error accessing database: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    view_database()

