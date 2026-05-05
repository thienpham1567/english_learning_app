#!/usr/bin/env python3
"""
Scrape free TOEIC exams from toeic.tienganhthayquy.com API.
Only fetches exams where member_only=False.
Saves each exam as a JSON file.
"""

import json
import urllib.request
import os
import sys

API_BASE = "https://apiquanlytest.tienganhthayquy.com/api"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def fetch_json(url: str):
    """Fetch JSON from URL."""
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_all_exams():
    """Get list of all exams across all pages."""
    all_exams = []
    for page in range(1, 10):
        url = f"{API_BASE}/exams?page={page}&limit=10"
        data = fetch_json(url)
        rows = data.get("data", {}).get("rows", [])
        if not rows:
            break
        all_exams.extend(rows)
        total_pages = data.get("data", {}).get("totalPage", 1)
        print(f"  Page {page}/{total_pages}: {len(rows)} exams")
        if page >= total_pages:
            break
    return all_exams

def get_exam_detail(exam_id: str):
    """Get full exam with all questions."""
    url = f"{API_BASE}/exams/{exam_id}"
    data = fetch_json(url)
    return data.get("data", {})

def main():
    print("=== Fetching exam list ===")
    all_exams = get_all_exams()
    print(f"\nTotal exams found: {len(all_exams)}")

    # Filter free exams only
    free_exams = [e for e in all_exams if not e.get("member_only", True)]
    print(f"Free exams (member_only=False): {len(free_exams)}")
    
    if not free_exams:
        print("No free exams found!")
        sys.exit(1)

    # Download each free exam
    for exam in free_exams:
        exam_id = exam["id"]
        exam_name = exam["exam_name"]
        safe_name = exam_name.lower().replace(" ", "_").replace("/", "_")
        
        print(f"\n--- Downloading: {exam_name} ({exam_id}) ---")
        detail = get_exam_detail(exam_id)
        
        if not detail or not detail.get("questions"):
            print(f"  ⚠ No questions found, skipping")
            continue
        
        questions = detail["questions"]
        
        # Group by part
        parts = {}
        for q in questions:
            part = q.get("question_part", "?")
            parts.setdefault(part, []).append(q)
        
        print(f"  ✓ {len(questions)} questions across {len(parts)} parts")
        for p in sorted(parts.keys(), key=lambda x: int(x) if x.isdigit() else 999):
            print(f"    Part {p}: {len(parts[p])} questions")
        
        # Save to file
        output_file = os.path.join(OUTPUT_DIR, f"{safe_name}.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(detail, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Saved to {safe_name}.json")
    
    # Create index file
    index = {
        "source": "toeic.tienganhthayquy.com",
        "scraped_at": __import__("datetime").datetime.now().isoformat(),
        "exams": [
            {
                "id": e["id"],
                "name": e["exam_name"],
                "book": e.get("book", {}).get("book_name", ""),
                "file": e["exam_name"].lower().replace(" ", "_").replace("/", "_") + ".json",
            }
            for e in free_exams
        ]
    }
    with open(os.path.join(OUTPUT_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== Done! {len(free_exams)} exams saved ===")

if __name__ == "__main__":
    main()
