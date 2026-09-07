# SpaceScope
**Live site:** (https://spacescope-5737.onrender.com/)
SpaceScope is an interactive web application for exploring spacecraft, space missions, orbital objects, and spacecraft engineering in one place.

It combines live orbital data, mission profiles, NASA visualizations, spacecraft system explanations, comparison tools, historical timelines, and signal-delay information into a single educational interface.

## What SpaceScope Does

SpaceScope helps users understand both **where spacecraft are** and **how they work**.

Users can:

- Explore spacecraft and missions across the Solar System
- View NASA Eyes visualizations for planets, satellites, asteroids, and missions
- Browse live orbital objects using CelesTrak data
- Open detailed spacecraft profiles with mission facts, instruments, engineering systems, timelines, and image galleries
- Compare spacecraft and missions
- Explore major spacecraft systems including propulsion, power, communications, navigation, robotics, thermal control, structures, and scientific instruments
- Browse mission records and historical milestones
- Explore signal delay between Earth and destinations across the Solar System

## Who It Is For

SpaceScope is designed for:

- Students learning about space science and engineering
- People curious about spacecraft and missions
- Educators looking for an interactive way to explain space technology
- Developers interested in working with public space data
- Anyone who wants a more organized way to explore spacecraft, satellites, and missions

The goal is to make complex space systems easier to understand without requiring an aerospace engineering background.

## What I Learned

Building SpaceScope helped me learn how to turn a large technical idea into a complete web application.

Some of the main things I learned include:

- Building a backend with FastAPI
- Connecting Python backend logic to frontend templates with Jinja
- Structuring a larger web application into templates, static files, data files, and backend routes
- Working with external public data sources
- Using CelesTrak orbital data instead of manually maintaining thousands of satellites
- Integrating NASA Eyes experiences into a larger application
- Designing data structures for spacecraft, missions, engineering systems, and records
- Building reusable pages for many different spacecraft
- Creating interactive interfaces with JavaScript
- Debugging browser, data-loading, styling, and routing issues
- Improving a project through multiple design and architecture iterations
- Using Git and GitHub for version control and publishing code

One of the biggest lessons from this project was learning when to use live data, when to use curated data, and how to combine both into one product.

## Tech Stack

### Backend

- Python
- FastAPI
- Jinja2

### Frontend

- HTML
- CSS
- JavaScript

### Data and Space Resources

- CelesTrak orbital data
- NASA Eyes
- NASA mission imagery and public resources
- Wikimedia Commons for selected mission imagery

## Main Features

### Interactive Space Exploration

SpaceScope includes embedded NASA Eyes experiences for exploring destinations, satellites, asteroids, and spacecraft.

### Live Orbital Catalog

The application retrieves orbital data from CelesTrak for groups such as:

- Active satellites
- Space stations
- Weather satellites
- Science satellites
- Starlink
- OneWeb
- GPS
- Galileo
- BeiDou
- GLONASS
- CubeSats

This allows SpaceScope to display changing orbital data without storing thousands of satellites manually.

### Spacecraft Profiles

Major spacecraft have deeper profiles containing information such as:

- Operator
- Manufacturer
- Mission purpose
- Mass
- Power
- Propulsion
- Communications
- Instruments
- Technology
- Mission timeline
- Engineering systems

### Spacecraft Systems

SpaceScope explains the major engineering problems spacecraft need to solve, including:

- Propulsion
- Power
- Communications
- Navigation and control
- Robotics
- Imaging
- Scientific instruments
- Thermal systems
- Structures and materials
- Computing and autonomy
- Human spaceflight systems
- Entry, descent, and landing

### Compare

Users can compare different spacecraft and missions side by side.

### Timeline and Records

SpaceScope includes major historical milestones, mission records, and notable firsts in space exploration.

### Signal Delay

Users can explore how long communication takes between Earth and destinations across the Solar System.

## Project Structure

```text
SpaceScope/
├── app/
│   ├── data/
│   │   ├── live_cards.json
│   │   ├── objects.json
│   │   ├── records.json
│   │   └── technology_taxonomy.json
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   ├── templates/
│   └── main.py
├── requirements.txt
├── run_windows.bat
├── .gitignore
└── README.md
