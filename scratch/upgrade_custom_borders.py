import os
import re

REPLACEMENTS = {
    "border border-(--border)": "border-2 border-border",
    "border-t border-(--border)": "border-t-2 border-border",
    "border-b border-(--border)": "border-b-2 border-border",
    "border-l border-(--border)": "border-l-2 border-border",
    "border-r border-(--border)": "border-r-2 border-border",
    
    "border border-border": "border-2 border-border",
    "border-t border-border": "border-t-2 border-border",
    "border-b border-border": "border-b-2 border-border",
    "border-l border-border": "border-l-2 border-border",
    "border-r border-border": "border-r-2 border-border",
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    modified = False
    
    for old, new in REPLACEMENTS.items():
        if old in new_content:
            new_content = new_content.replace(old, new)
            modified = True
            
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
        return True
    return False

def main():
    root_dirs = [
        "/Users/thienpham/Documents/english_learning_app/apps/web/app",
        "/Users/thienpham/Documents/english_learning_app/apps/web/components"
    ]
    
    updated_count = 0
    for root_dir in root_dirs:
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                if file.endswith(('.tsx', '.ts')):
                    filepath = os.path.join(root, file)
                    if process_file(filepath):
                        updated_count += 1
                        
    print(f"\nTotal files updated: {updated_count}")

if __name__ == "__main__":
    main()
