
from pathlib import Path
from datetime import datetime, timedelta
import json, urllib.parse, urllib.request
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE = Path(__file__).resolve().parent
app = FastAPI(title="SpaceScope V3", version="3.0.0")
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")
templates = Jinja2Templates(directory=BASE / "templates")

objects = json.loads((BASE / "data" / "objects.json").read_text(encoding="utf-8"))
technology_taxonomy = json.loads((BASE / "data" / "technology_taxonomy.json").read_text(encoding="utf-8"))
records = json.loads((BASE / "data" / "records.json").read_text(encoding="utf-8"))
live_cards = json.loads((BASE / "data" / "live_cards.json").read_text(encoding="utf-8"))

def get_obj(slug):
    return next((o for o in objects if o["slug"] == slug), None)

SAT_GROUPS = {
    "active":"active",
    "stations":"stations",
    "weather":"weather",
    "noaa":"noaa",
    "goes":"goes",
    "resource":"resource",
    "science":"science",
    "geo":"geo",
    "starlink":"starlink",
    "oneweb":"oneweb",
    "iridium":"iridium-NEXT",
    "globalstar":"globalstar",
    "orbcomm":"orbcomm",
    "gps":"gps-ops",
    "galileo":"galileo",
    "beidou":"beidou",
    "glonass":"glo-ops",
    "amateur":"amateur",
    "cubesat":"cubesat",
}

_cache = {}

def fetch_celestrak_group(group):
    if group not in SAT_GROUPS:
        raise HTTPException(400, "Unknown satellite group")
    now = datetime.utcnow()
    cached = _cache.get(group)
    if cached and now - cached["time"] < timedelta(hours=2):
        return cached["data"]
    cgroup = SAT_GROUPS[group]
    url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=" + urllib.parse.quote(cgroup) + "&FORMAT=json"
    req = urllib.request.Request(url, headers={"User-Agent":"SpaceScope-V3/1.0 educational space explorer"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
        _cache[group] = {"time":now,"data":data}
        return data
    except Exception as exc:
        if cached:
            return cached["data"]
        raise HTTPException(503, f"Live orbital source unavailable: {exc}")

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    day_index = datetime.utcnow().timetuple().tm_yday % len(objects)
    mission_of_day = objects[day_index]
    return templates.TemplateResponse("index.html", {
        "request":request, "objects":objects, "tech":technology_taxonomy,
        "records":records, "live_cards":live_cards, "mission_of_day":mission_of_day
    })

@app.get("/explore", response_class=HTMLResponse)
def explore(request: Request):
    return templates.TemplateResponse("explore.html", {
        "request":request, "objects":objects
    })

@app.get("/database", response_class=HTMLResponse)
def database(request: Request):
    return templates.TemplateResponse("database.html", {
        "request":request, "objects":objects,
        "categories":sorted({o["category"] for o in objects}),
        "destinations":sorted({o["destination"] for o in objects})
    })

@app.get("/object/{slug}", response_class=HTMLResponse)
def object_detail(request: Request, slug: str):
    obj = get_obj(slug)
    if not obj:
        raise HTTPException(404, "Object not found")
    related = [o for o in objects if o["slug"] != slug and (o["destination"] == obj["destination"] or o["category"] == obj["category"])][:6]
    return templates.TemplateResponse("object.html", {
        "request":request, "obj":obj, "related":related
    })

@app.get("/technologies", response_class=HTMLResponse)
def technologies(request: Request):
    return templates.TemplateResponse("technologies.html", {
        "request":request, "tech":technology_taxonomy
    })


@app.get("/live", response_class=HTMLResponse)
def live_page(request: Request):
    return templates.TemplateResponse("live.html", {
        "request":request, "live_cards":live_cards, "objects":objects
    })

@app.get("/timeline", response_class=HTMLResponse)
def timeline_page(request: Request):
    timeline=[]
    for o in objects:
        year=str(o.get("launch_date",""))[:4]
        if year.isdigit():
            timeline.append({"year":int(year),"name":o["name"],"slug":o["slug"],"kind":o["kind"],"destination":o["destination"]})
    timeline=sorted(timeline,key=lambda x:x["year"])
    return templates.TemplateResponse("timeline.html", {"request":request,"timeline":timeline})

@app.get("/records", response_class=HTMLResponse)
def records_page(request: Request):
    return templates.TemplateResponse("records.html", {"request":request,"records":records})

@app.get("/where", response_class=HTMLResponse)
def where_page(request: Request):
    groups={}
    for o in objects:
        groups.setdefault(o["destination"],[]).append(o)
    return templates.TemplateResponse("where.html", {"request":request,"groups":groups})

@app.get("/compare", response_class=HTMLResponse)
def compare_page(request: Request, a: str="perseverance", b: str="curiosity"):
    aa=get_obj(a) or objects[0]
    bb=get_obj(b) or objects[1]
    return templates.TemplateResponse("compare.html", {"request":request,"objects":objects,"a":aa,"b":bb})


@app.get("/signals", response_class=HTMLResponse)
def signals_page(request: Request):
    signal_rows = [
        {"name":"Moon","distance":"384,400 km","delay":"~1.3 seconds","note":"Nearly real-time compared with planetary missions."},
        {"name":"Mars","distance":"Variable","delay":"~3–22 minutes","note":"Distance changes dramatically as Earth and Mars orbit the Sun."},
        {"name":"Jupiter","distance":"Hundreds of millions of km","delay":"~35–52 minutes","note":"Commands and science data require long operational planning."},
        {"name":"Saturn","distance":"Over 1 billion km","delay":"~67–84 minutes","note":"Deep-space operations depend on autonomy and scheduled command sequences."},
        {"name":"Voyager 1","distance":"Interstellar space","delay":"~23 hours one way","note":"A reply takes nearly two days at current distance."}
    ]
    return templates.TemplateResponse("signals.html", {"request":request,"signal_rows":signal_rows})

@app.get("/api/objects")
def api_objects(q: str=""):
    result = objects
    if q:
        n=q.lower()
        def text(o):
            return " ".join([
                o["name"],o["kind"],o["category"],o["agency"],o["destination"],
                o["summary"],o["purpose"]," ".join(o["instruments"])," ".join(o["technologies"])
            ]).lower()
        result=[o for o in result if n in text(o)]
    return JSONResponse(result)

@app.get("/api/tech")
def api_tech(q: str=""):
    rows=[]
    for family, items in technology_taxonomy.items():
        for item in items:
            rows.append({"family":family,"name":item})
    if q:
        n=q.lower()
        rows=[r for r in rows if n in (r["family"]+" "+r["name"]).lower()]
    return JSONResponse(rows)

@app.get("/api/satellites")
def api_satellites(
    group: str=Query("active"),
    limit: int=Query(2500, ge=1, le=5000)
):
    data = fetch_celestrak_group(group)
    out=[]
    for row in data[:limit]:
        out.append({
            "OBJECT_NAME":row.get("OBJECT_NAME"),
            "OBJECT_ID":row.get("OBJECT_ID"),
            "NORAD_CAT_ID":row.get("NORAD_CAT_ID"),
            "EPOCH":row.get("EPOCH"),
            "MEAN_MOTION":row.get("MEAN_MOTION"),
            "ECCENTRICITY":row.get("ECCENTRICITY"),
            "INCLINATION":row.get("INCLINATION"),
            "RA_OF_ASC_NODE":row.get("RA_OF_ASC_NODE"),
            "ARG_OF_PERICENTER":row.get("ARG_OF_PERICENTER"),
            "MEAN_ANOMALY":row.get("MEAN_ANOMALY"),
            "BSTAR":row.get("BSTAR"),
            "SEMIMAJOR_AXIS":row.get("SEMIMAJOR_AXIS"),
            "PERIOD":row.get("PERIOD"),
            "APOAPSIS":row.get("APOAPSIS"),
            "PERIAPSIS":row.get("PERIAPSIS"),
        })
    return JSONResponse({"group":group,"count":len(out),"objects":out})

@app.get("/api/scene")
def api_scene():
    return JSONResponse({
        "objects":[{
            "slug":o["slug"],"name":o["name"],"kind":o["kind"],"category":o["category"],
            "destination":o["destination"],"status":o["status"],
            "x":o.get("x",0),"y":o.get("y",0),"z":o.get("z",0)
        } for o in objects]
    })
