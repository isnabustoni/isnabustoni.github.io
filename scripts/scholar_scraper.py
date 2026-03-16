from scholarly import scholarly
import json

# Replace with your Google Scholar ID
SCHOLAR_ID = "DyrzFsUAAAAJ"

author = scholarly.search_author_id(SCHOLAR_ID)
author = scholarly.fill(author)

publications = []

for pub in author['publications']:
    pub_filled = scholarly.fill(pub)

    publications.append({
        "title": pub_filled['bib'].get('title',""),
        "authors": pub_filled['bib'].get('author',""),
        "year": pub_filled['bib'].get('pub_year',""),
        "venue": pub_filled['bib'].get('venue',""),
        "link": pub_filled.get('pub_url',"")
    })

with open("data/publications.json","w") as f:
    json.dump(publications,f,indent=2)

print("Publications updated.")
