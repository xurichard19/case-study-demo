# Dispatch Case Study

This is a demo implementation of the case study that uses a FastAPI + React/Vite stack with Supabase/PostgreSQL, Docker, and Pandas for lightweight data analytics.
I focus on four high-impact workflows from the case study: exception severity triage, customer status, automated weekly reporting, and driver matching support. I use deterministic analytics to produce metrics and recommendations, and use the OpenAI API for natural language reports. Codex 5.5 was my tool of choice for rapid feature shipping, but I manually planned and designed the architecture of this application.

Before implementation, I first identified key user needs and map each to a potential solution, then prioritized based on explicit requests and operational impact.

It should be noted that the exception triage and live status reports are not totally feasible to implement due to the lack of live exception data and GPS pings in the given CSV. However, we can simulate live exception info with the provided CSV and implement the base status report infrastructure.

---

Some user needs and possible solutions:

| | User Need/Issue |  Solution  |
|-|-|-|
|1| TMS lookup to find drivers | Improve dispatch dashboard with priority sorting, unassigned order alerts, driver availability filters, and suggested driver ranking |
|2| Streamline driver availability confirmation | Implement a database/clock-in page for drivers, automatically factor in available drivers to dashboard suggestions |
|3| Automate weather/traffic/hospital announcements | Integrate weather/traffic APIs and scrape hospital announcements |
|4| TMS driver suggestions are overridden 60% of the time | Improve suggestion algorithm, incorporate LLM, allow lead dispatcher to input his own knowledge to the system prompt? |
|5| Assign severity to each exception note | Implement LLM-based exception triage, sort into three severities, push notify severe issues, recommend actions |
|6| Dealing with status calls | Build customer portal, integrate live GPS information and ETA |
|7| Reallocating trips is high pressure | Add reallocation workflow, use suggestion LLM but incorporate context (which drivers are available) |
|8| Automate weekly report | Summarize key metrics like on-time rate by service, by client, by driver, redelivery rate, and exception volume using Python/SQL, generate insights with LLM |
|9| Driver onboarding documentation is outdated | Update documentation and build dedicated onboarding center |
|10| Automated driver flagging | Automatically flag drivers based on exception rate and tardiness |
|11| Pulling up client report takes time | Build dedicated client database, suggest compensation based on metrics |

---

Our demo implementation focusus on implementing the four explicitly requested user needs, namely (5) assign severity to each exception note, (6) handle status inquiries, (8) automatic weekly reports, and (4) driver matching.

---

### Configuring the Demo

Change directories to /frontend and run the following for the frontend server:

```bash
cd frontend
npm run dev
```

Run the following commands to create a Docker image from the backend and run the API server:

```bash
docker compose build backend
docker compose up -d backend
```

Verify the backend is running:

```bash
curl http://127.0.0.1:8000/health
```

Seed Supabase from the CSV:

```bash
docker compose run --rm backend python scripts/seed_from_csv.py
```

View logs or stop the backend:

```bash
docker compose logs -f backend
docker compose down
```
