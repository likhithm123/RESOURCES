# HR and Behavioural Interviews - Introduce Yourself, Common Questions and Model Answers
Technical skill gets you shortlisted; the HR and behavioural rounds decide the offer. This notebook shows exactly how to introduce yourself, answer the 60 most common HR questions with model answers you can adapt, use the STAR method for behavioural questions, handle salary and tricky questions, and what to do before, during and after the interview. Every answer here is a template: replace the details with your own true story.
## How Interviewers Think
- HR and managers are checking five things: **Can you communicate clearly? Will you fit the team? Are you reliable and honest? Do you really want this job? Will you grow and stay?**
- They remember **stories and numbers**, not adjectives. "I am hardworking" is weak; "I built the attendance app in 3 weeks while taking 6 courses, and 400 students use it" is strong.
| Do | Do not |
|---|---|
| prepare 6-8 real stories from projects, internships, college, sports, clubs | memorise word for word (it sounds robotic) |
| answer in 60-120 seconds, structured | ramble for 5 minutes |
| be honest; say "I don't know, but here is how I would find out" | lie or exaggerate (they will ask follow-ups) |
| research the company and role | ask "What does your company do?" |
| stay positive about past teams / college | blame teammates, professors or companies |
| ask 2-3 thoughtful questions at the end | say "No questions" |
## "Tell Me About Yourself" - The Most Important 90 Seconds
### The formula: Present -> Past -> Future (+ why this company)
@flow (Present: who you are now - degree, college, focus area) | Past: 2-3 highlights - projects, internship, achievements with numbers | Skills: the tech that matches THIS job | (Future: why this role / company and what you want to do next) :: Self-introduction structure (60-90 seconds)
### Template
```txt
Good morning. My name is <Name>. I am a final-year B.Tech student in <branch> at <college>,
with a CGPA of <x>. I enjoy <area: building backend systems / working with data / AI applications>.

Over the last two years I have <highlight 1: built project X using A, B, C that solves Y - result with a number>.
I also <highlight 2: interned at Z where I did ... / led the web team of our IEEE chapter / solved 400+ DSA problems>.

My strongest skills are <3-4 skills that match the job description>.

I am applying to <company> because <specific reason: your product, scale, tech, mission>,
and I would love to <what you want to do in this role and how you will add value>.
```
### Sample 1: Software Development Engineer (fresher)
```txt
Good morning. I'm Likhith, a final-year Computer Science student at VIT Vellore with an 8.6 CGPA.
I enjoy building reliable back-end systems that real people use.

As the full-stack developer of our IEEE chapter's web team, I built the chapter website and an events
portal with an admin dashboard, login with email verification and a recruitment module. More than
1,500 students used it during recruitments, and I cut page load time by about 60% by caching and
image optimisation. I have also solved over 400 data structures problems in C++ and Python.

My core skills are Java and Spring Boot, React, SQL and system design basics, and I deploy with Docker
and GitHub Actions.

I'm applying to Amazon because I like building services at large scale where performance and customer
experience matter, and I'd love to grow as a back-end engineer on a team that owns its services end to end.
```
### Sample 2: AI / ML Engineer
```txt
Hi, I'm Asha, a final-year AI and Data Science student at XYZ College. I like turning machine learning
models into products people can actually use.

My main project is a "chat with your college notes" assistant: it uses retrieval-augmented generation
with hybrid search and a reranker, and I raised answer accuracy on my 120-question test set from 61% to
87%. I deployed it with FastAPI and Docker on Cloud Run. During my internship at ABC Analytics I built a
churn prediction model that the sales team now uses weekly.

I work mainly with Python, PyTorch, LangGraph, SQL and Docker.

I'm excited about this AI Engineer role because your team is building LLM features for millions of users,
and I want to work where evaluation and reliability matter as much as the model itself.
```
### Sample 3: Career gap / switching branch
```txt
I'm Ravi. I studied Mechanical Engineering and graduated in 2024. During my final year I discovered
programming through a CAD automation project and realised I enjoy software far more. Since then I've
completed a full-stack course, built three projects - the most complete is an expense-sharing app with
4,000 lines of TypeScript, tests and CI - and solved 300 LeetCode problems. I'm now looking for a
software engineer role where my problem-solving from mechanical engineering and my new coding skills
can both help.
```
### Mistakes to avoid
- Repeating your resume line by line, family details ("my father is a..."), hobbies first, "I am a quick learner and team player" without proof, going over 2 minutes, a weak ending. End with **why you are here**, so the interviewer has a natural next question.
## The STAR Method for Behavioural Questions
- Behavioural questions start with "Tell me about a time when...". Answer with **STAR**:
| Letter | Meaning | Share of the answer |
|---|---|---|
| S - Situation | the context: where, when, what was going on | 10% |
| T - Task | your responsibility / the goal | 10% |
| A - Action | what YOU did, step by step ("I", not "we") | 60% |
| R - Result | the outcome with numbers + what you learned | 20% |
@chain Situation -> Task -> Action (most detail) -> Result (numbers) -> Learning :: STAR answer structure
### STAR example: a difficult technical problem
```txt
S: Two days before our college fest, the registration site slowed to 8-second page loads when 2,000
   students tried to register at once.
T: I was the back-end lead and had to make it usable before registrations opened again the next morning.
A: I checked the server logs and found every request was running the same heavy database query.
   I added an index on the email column, cached the event list in Redis for 60 seconds, and moved the
   confirmation email to a background queue so the request returned immediately. I load-tested it with
   k6 at 3,000 virtual users before going live.
R: Page load dropped to under 400 ms, we handled 5,200 registrations without a crash, and I learned
   to load-test before launch instead of after - I now add that step to every project.
```
### Build your story bank (prepare these 8 stories)
| Story about | Can answer |
|---|---|
| your best project | proudest achievement, technical challenge, ownership |
| a team conflict / disagreement | conflict, teamwork, communication |
| a failure or mistake | failure, learning from mistakes, weakness |
| a tight deadline | pressure, prioritisation, time management |
| leading or helping others | leadership, mentoring, initiative |
| learning something new fast | adaptability, learning ability |
| going beyond what was asked | ownership, initiative, customer focus |
| handling feedback / criticism | growth mindset, maturity |
## Common HR Questions with Model Answers
Q: Why do you want to work for our company?
A: Mention something specific: the product, the scale, the engineering culture, the mission. "I use Razorpay's checkout in my own projects, and I've read your engineering blog on handling UPI spikes. I want to work on payment systems where reliability really matters, and your team builds exactly that at national scale."
Q: Why should we hire you?
A: Match three of your strengths to the job's needs with proof. "You need someone who can build back-end APIs, work with data and learn quickly. I've built and deployed three APIs used by real users, I'm comfortable with SQL and caching, and I picked up Kafka in two weeks for my last project. I'll be productive quickly and keep improving."
Q: What are your strengths?
A: Pick 2-3 relevant ones, each with a short example. "I'm persistent with hard problems - I spent a weekend tracking down a race condition in our booking feature and fixed it with an atomic update. I also explain technical ideas simply; I run DSA sessions for 60 juniors."
Q: What is your greatest weakness?
A: A real but non-critical weakness plus what you are doing about it. "I used to spend too long polishing code before asking for feedback. Now I share a working draft early and set myself a time-box, which has made my work faster and better." Avoid fake weaknesses ("I'm a perfectionist") and job-critical ones.
Q: Where do you see yourself in five years?
A: Growth in the field, connected to the company. "I see myself as a strong back-end engineer who owns important services end to end, mentoring newer engineers, and possibly leading a small team. I'd like that growth to happen here."
Q: Tell me about a time you failed.
A: STAR with an honest failure and a clear lesson. "In my first hackathon I tried to build too many features and our demo crashed. I learned to agree on a minimum version first; in the next hackathon we shipped a smaller, polished product and won second place."
Q: Describe a conflict with a teammate and how you resolved it.
A: Show listening and a solution, not blame. "My teammate wanted MongoDB, I wanted PostgreSQL. Instead of arguing, we listed our data and queries, saw we needed transactions and joins, chose PostgreSQL, and used JSONB for the flexible part. We both felt heard and the decision was based on facts."
Q: How do you handle pressure or tight deadlines?
A: "I break the work into small tasks, do the most important first, and tell people early if something is at risk. During exam week I still delivered the fest website by cutting two nice-to-have features after agreeing with the coordinator."
Q: Are you a team player or do you prefer working alone?
A: "Both. I like focused time to solve problems, but I enjoy code reviews and pair debugging because the result is better. In my last project I reviewed every pull request and others reviewed mine."
Q: What motivates you?
A: "Seeing people use what I build. When 1,500 students used our recruitment portal, the bugs they reported motivated me more than any grade."
Q: Tell me about your final-year project.
A: Problem -> your role -> tech -> challenges -> results. Be ready for deep follow-ups on any technology you mention.
Q: Why did you choose this branch / career?
A: An honest, short story of what got you interested and what keeps you going.
Q: How do you keep your skills up to date?
A: Name concrete habits: "I read the engineering blogs of companies I admire, solve two DSA problems a day, and build a small project whenever I learn something new - most recently a RAG app to learn LangGraph."
Q: What do you know about our company?
A: Product lines, customers, recent news, competitors, tech stack (from their blog / job post), values. One or two specific facts are enough.
Q: Do you have any other offers?
A: Be honest and positive. "I'm in the final rounds with two other companies, but this role is my first choice because..." Never invent offers.
Q: Are you willing to relocate / work in shifts / travel?
A: Answer honestly. If yes, say so clearly; if you have a constraint, state it politely with any flexibility you can offer.
Q: What are your salary expectations?
A: For freshers, campus roles usually have fixed packages: "I'm comfortable with the standard package for this role." Off-campus: research the range (Glassdoor, AmbitionBox, Levels.fyi, seniors) and give a range: "Based on my research, roles like this pay between X and Y; I'd expect something in that range, but I'm flexible for the right opportunity and learning."
Q: Why is there a gap in your education / career?
A: Brief and honest, focused on what you did and learned. "I took a year to prepare for GATE and help with family responsibilities. During that time I also learned web development and built two projects."
Q: Why did you leave your last job / internship? (experienced)
A: Positive and forward-looking: growth, scope, learning. Never criticise the old employer.
Q: How do you handle criticism?
A: "I listen fully, ask questions to understand, and act on it. My mentor once said my pull requests were too large; I now split them into smaller ones and reviews are faster."
Q: Describe your ideal work environment.
A: Align with the company: collaborative, ownership, learning, clear goals, code reviews.
Q: What is your biggest achievement?
A: One STAR story with a number.
Q: How would your friends / teammates describe you?
A: Two or three traits with a quick proof: "Dependable - they come to me when something must be done by tomorrow."
Q: What will you do if you don't get this job?
A: "I'll ask for feedback, improve those areas and keep applying; I'd love to try again here."
Q: Do you prefer a startup or a big company?
A: Tailor it: big company - scale, mentorship, processes; startup - ownership, speed, breadth. Show you understand the trade-offs.
Q: Can you work on weekends / under deadlines?
A: "When there is a real deadline or a production issue, yes. I also plan my work so that it is the exception, not the rule."
Q: Tell me about a time you showed leadership.
A: Leadership without a title counts: organising a study group, leading a project module, mentoring juniors.
Q: Tell me about a time you learned something quickly.
A: "Our internship project needed Kafka, which I had never used. I read the docs, built a toy producer / consumer the first evening, and had our order-events pipeline running in four days."
Q: Tell me about a time you disagreed with your manager / professor.
A: Show respect, data and acceptance of the final decision.
Q: What would you do if you saw a teammate cutting corners or behaving unethically?
A: "I'd first talk to them privately to understand; if it's serious, like skipping security checks or copying code with an incompatible license, I'd raise it with the lead. Integrity matters more than speed."
Q: What would you do if you made a mistake that caused a production bug?
A: "Tell the team immediately, help fix or roll back first, then find the root cause, add a test so it can't repeat, and write a short blameless postmortem."
Q: Any questions for us?
A: Always yes (see below).
## Questions to Ask the Interviewer
- What does a typical day or week look like for someone in this role?
- What would success look like in the first 3-6 months?
- What technologies does the team use, and how do you decide when to adopt new ones?
- How are new graduates mentored and how is code reviewed?
- What is the biggest challenge the team is working on right now?
- What do you personally enjoy most about working here?
- What are the next steps in the process?
> Avoid asking first about salary, leave or work-from-home in an early round; ask in the HR / offer stage.
## Company Values Rounds (Amazon Leadership Principles and similar)
- Many companies test values with behavioural questions. Amazon's 16 Leadership Principles are the most famous: Customer Obsession, Ownership, Invent and Simplify, Are Right A Lot, Learn and Be Curious, Hire and Develop the Best, Insist on the Highest Standards, Think Big, Bias for Action, Frugality, Earn Trust, Dive Deep, Have Backbone; Disagree and Commit, Deliver Results, Strive to be Earth's Best Employer, Success and Scale Bring Broad Responsibility.
| Principle | Typical question |
|---|---|
| Customer Obsession | Tell me about a time you went out of your way for a user / customer. |
| Ownership | Tell me about a time you took on something outside your responsibility. |
| Dive Deep | Describe a problem you solved by digging into the details / data. |
| Bias for Action | Tell me about a decision you made quickly without complete information. |
| Have Backbone; Disagree and Commit | Tell me about a time you disagreed with a decision. |
| Deliver Results | Tell me about a time you delivered under a tight deadline. |
| Learn and Be Curious | What is something new you learned recently and how? |
- Prepare 1-2 STAR stories per principle; one story can cover several principles. Google looks for "Googleyness" (comfort with ambiguity, collaboration, humility); Microsoft for growth mindset; startups for ownership and speed.
## Group Discussion (GD) Tips (campus placements)
- Listen first, then enter with a clear point; bring facts and examples; build on others' points ("Adding to what Priya said..."); invite quiet members; never shout or interrupt repeatedly; summarise at the end if you can.
- Common topics: AI and jobs, work from home vs office, UPI and digital India, social media and youth, EVs, startups vs MNCs, online education.
## Before, During and After the Interview
### Before
- Read the job description and match your stories and skills to it. Research the company (website, product, news, engineering blog, Glassdoor reviews).
- Revise your own resume: be ready to explain **every** line and technology in depth.
- Practise your introduction aloud and record yourself; do 2-3 mock interviews with friends.
- Online interviews: test camera, mic and internet; quiet room, neutral background, good light at your face; laptop charged; resume and a notebook nearby; join 5 minutes early.
- Dress: smart formal or business casual (clean, ironed); for campus, formals are safest.
### During
- Greet politely, smile, sit straight, make eye contact (look at the camera online).
- Listen to the full question; it is fine to take 5 seconds to think or to ask to clarify.
- Think aloud in technical rounds; say what you are trying.
- If you don't know: "I haven't worked with that yet, but my understanding is... and I would verify by..."
- Keep answers structured and to the point; watch the interviewer's reactions.
- Be honest about your resume; never claim a skill you cannot defend.
### After
- Send a short thank-you email within 24 hours (optional in campus drives).
- Write down the questions you were asked and how you answered - improve for the next one.
- If rejected, politely ask for feedback; keep applying.
```txt
Subject: Thank you - Software Engineer interview

Dear <Interviewer name>,
Thank you for taking the time to speak with me today about the Software Engineer role.
I enjoyed learning about <specific thing discussed>, and I'm even more excited about
contributing to <team / product>. Please let me know if you need anything else from me.
Best regards,
<Your name>
<Phone> | <LinkedIn>
```
## Body Language and Communication
| Good | Avoid |
|---|---|
| steady eye contact, natural smile | looking at the floor, constant glancing away |
| open posture, hands visible | crossed arms, fidgeting with pens |
| moderate pace, clear voice, pauses | speaking very fast, filler words (umm, like, basically) |
| nodding while listening | interrupting the interviewer |
| "I" for your actions, "we" for team results | taking credit for the whole team, or hiding your role |
- Simple English is better than complex words. Short sentences. One idea at a time.
## Resume Tips (the resume decides if you get the interview)
- One page for freshers. Order: name and links (LinkedIn, GitHub, portfolio) -> education -> skills -> projects -> experience / internships -> achievements and positions of responsibility.
- Each bullet: **action verb + what + how (tech) + result (number)**: "Built a seat-booking API with FastAPI and PostgreSQL handling 1,000 concurrent bookings without double booking using atomic updates."
- Match keywords from the job description (ATS systems scan for them); no photos, no long objectives, no skills you cannot defend; PDF format; consistent fonts and dates.
- Projects for every role and how to present them are in notebook 30.
## The Offer Stage
- Read the offer letter fully: CTC breakdown (fixed vs variable vs joining bonus vs stocks / RSUs and their vesting), role and level, location, joining date, bond / service agreement, notice period, background verification, probation.
- **CTC is not in-hand salary**: in-hand = fixed monthly pay after PF, professional tax and income tax.
- Negotiation (mostly off-campus): be polite, use data or a competing offer, negotiate on the total package (joining bonus, stocks, relocation), get the final terms in writing.
- Accept or decline professionally and on time; do not "ghost" companies.
## Last-Minute HR Checklist
- 90-second introduction practised aloud.
- 8 STAR stories ready (project, conflict, failure, pressure, leadership, learning, initiative, feedback).
- 3 reasons why this company + 3 reasons why you, with proof.
- One honest weakness with improvement steps.
- Salary answer ready (campus: standard package; off-campus: researched range).
- 3 questions to ask the interviewer.
- Resume: every line explainable; projects ready to draw on a whiteboard.
- Device, internet, room, dress and documents ready the night before.
