# Dispatch Case Study

This is a demo implementation of the case study that uses a FastAPI + React/Vite stack with Supabase, Postgres, and Docker for lightweight scalable data analytics.
I focus on four high-impact workflows from the case study: exception severity triage, customer status, automated weekly reporting, and driver matching support. I use deterministic analytics to produce metrics and recommendations, and use the OpenAI API for natural language reports. Codex 5.5 was my tool of choice for rapid feature shipping, but I manually planned and designed the architecture of this application.

Before implementation, I first identified key user needs and map each to a potential solution, then prioritized based on explicit requests and operational impact.

It should be noted that the exception triage and live status reports are not totally feasible to implement due to the lack of live exception data and GPS pings in the given CSV. However, we can simulate live exception info with the provided CSV and implement the base status report infrastructure.

Additionally, driver matching could not be implemented due to a lack of information surrounding Sam's personal knowledge about the driver and client relationships but I propose a solution later.

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

Our demo implementation focuses on implementing the four explicitly requested user needs, namely (5) assign severity to each exception note, (6) handle status inquiries, (8) automatic weekly reports, and (4) driver matching. We additionally include some implicitly requested features like daily checkins and driver flagging.

---

### Configuring the Demo

This demo requires you to compose a Docker image for the backend and create a new Supabase DB. You can run the migration script in the SQL Editor to instantiate the tables before running the seed script to populate using the CSV data.

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

Seed Supabase from the CSV:

```bash
docker compose run --rm backend python scripts/seed_from_csv.py
```

---

### Demo

https://github.com/user-attachments/assets/ce69411b-faed-467e-9695-e82997c81b71

---

### Implementation Details

Our frontend stays intentionally thin while we handle most of the analytics in the backend. I calculated exception severity by first using an LLM to score the note then combining this score with service priority and delay time into a weighted equation to produce a final severity score. I then sorted each order into exception tiers with score thresholds. This way, we can minimize our token size when it comes to API calls and keep the bulk of the logic in our code.

Driver availability and flagging are computed in the backend. The dispatcher drivers page separates drivers currently delivering orders as of the demo date from drivers who are unavailable or need review. Driver metrics use exception rate and tardiness rate and we flag drivers with poor performance.

The daily briefing page makes one weather/traffic report per Boston business day and stores it in Supabase until the next report window. We pull weather data from the Open-Meteo API and traffic data from the TomTom API and combine these into a natural language summary with GPT40 mini.

Although I could not fully implement driver matching with the provided data, I do have ideas surrounding how we could build out an improved suggestion algorithm. A potential solution is to calculate driver performance (tardiness/exception rate) with each individual client and provide those statistics as context to GPT to make matchings at its own discretion. We could have Sam share his insights on client specific performance for each driver to incorporate in the system prompt. GPT would rank the best drivers for the order, thus if one driver drops out we can simply suggest the next on the rank. This way, we keep our API calls to one per order.
