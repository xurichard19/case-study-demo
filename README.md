# Dispatch Case Study

This is a demo implementation of 


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

Our demo implementation focusus on implementing the four explicitly requested user needs, namely (5) assign severity to each exception note, (6) handle status inquiries, (8) build weekly reports, and (4) driver matching.