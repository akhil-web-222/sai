from pytrends.request import TrendReq
import pandas as pd
import time
import random

def get_trending_tags():
    # Connect to Google
    pytrends = TrendReq(hl='en-IN', tz=330)

    # Expanded Keyword List - covering 5+ Years of data
    # 5 keywords per batch max
    keyword_batches = [
        # Kitchens
        ["Modular Kitchen", "PVC Kitchen", "Acrylic Kitchen", "Kitchen Cabinets", "Kitchen Interior"],
        # Bedroom & Wardrobes
        ["Wardrobe Design", "Sliding Wardrobe", "Bedroom Interior", "Cupboard Design", "Dressing Table"],
        # Living Room & General
        ["Living Room Design", "TV Unit Design", "Sofa Set Design", "False Ceiling", "Wall Paneling"],
        # Wood Materials
        ["Teak Wood", "Plywood Price", "Marine Plywood", "Wood Veneer", "Solid Wood"],
        # Doors & Windows
        ["Main Door Design", "Teak Wood Door", "Wooden Window", "Door Frame", "Flush Door"],
        # Flooring & Services
        ["Wooden Flooring", "Wood Polishing", "Carpenter Work", "Home Renovation", "Custom Furniture"],
         # Traditional / Specific Items
        ["Pooja Room Design", "Dining Table Set", "Double Bed Design", "Shoe Rack Design", "Office Furniture"]
    ]
    
    print("Fetching 5-YEAR trends for EXTENSIVE service lists in India (IN)...\n")
    
    for kw_list in keyword_batches:
        print(f"--> Batch: {kw_list}")
        try:
            # Add longer sleep to avoid rate limits with this many requests
            time.sleep(random.randint(5, 10))
            
            # Changed timeframe to 'today 5-y' for 5 years of data
            pytrends.build_payload(kw_list, cat=0, timeframe='today 5-y', geo='IN', gprop='')
            
            # Get Related Queries
            related_queries = pytrends.related_queries()
            
            print("\n   === TOP RELATED KEYWORDS (Last 5 Years) ===")
            for kw in kw_list:
                if related_queries.get(kw) and related_queries[kw]['top'] is not None:
                    print(f"   [ {kw} ]")
                    print(related_queries[kw]['top'].head(3).to_string(index=False, header=False))
                else:
                    print(f"   [ {kw} ] - No top data.")

            print("\n   === RISING / BREAKOUT TRENDS ===")
            for kw in kw_list:
                if related_queries.get(kw) and related_queries[kw]['rising'] is not None:
                    print(f"   [ {kw} ]")
                    print(related_queries[kw]['rising'].head(3).to_string(index=False, header=False))
                else:
                    print(f"   [ {kw} ] - No rising trend data.")
            
            print("\n" + "="*40 + "\n")

        except Exception as e:
            print(f"Skipping batch {kw_list} due to error: {e}")
            if "429" in str(e):
                print("Rate limit hit. Google is blocking requests. Try again later.")
                break

if __name__ == "__main__":
    get_trending_tags()
