export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-track-ojt-hours-philippines",
    title: "How to Track OJT Hours as a Philippine College Student (The Easy Way)",
    description: "Tired of manually counting your OJT hours on a spreadsheet or losing your DTR? Here's the easiest way to track your internship hours as a Filipino college student, plus how to make sure they're always accurate.",
    date: "June 10, 2026",
    readTime: "5 min read",
    category: "For Students",
    content: `
## Why Tracking OJT Hours Is So Stressful (And Shouldn't Be)

If you've ever had to reconstruct a week's worth of OJT hours from memory because you forgot to fill in your DTR, you're not alone. Almost every Filipino college student going through their On-the-Job Training faces the same problem.

The traditional system looks like this: a paper DTR you print at the start of the month, a supervisor who signs it at the end of the week (if you remember to bring it), and a final tally you compute by hand before submission. One missed signature and you're chasing your supervisor for days.

There's a better way.

## What You Actually Need to Track

Before picking a method, it helps to know what you're tracking:

- Daily time-in and time-out: the foundation of your DTR
- Total hours per day: usually computed as (time out minus time in) minus lunch break
- Cumulative hours: your running total toward your required OJT hours (typically 200 to 500 hours depending on your program)
- Supervisor sign-off: proof that your hours were verified

Most schools also require a daily journal or scrum report alongside the DTR. It's a short write-up of what you did that day.

## Method 1: The Old Way (Spreadsheet or Paper)

Many students still use Google Sheets or a printed DTR form. This works, but it has real problems:

- Easy to forget to update daily
- No automatic totals unless you build formulas yourself
- Paper gets lost, wet, or crumpled
- Supervisor has to be physically present to sign

If you're going this route, at least use a Google Sheet so your data isn't on a single piece of paper that can disappear.

## Method 2: OJTask, Built Specifically for Philippine OJT

OJTask is a free platform built for Philippine college students doing their OJT. Here's how the hour tracking works:

1. You log your time-in and time-out each day directly from your phone or laptop. No paper needed.
2. Your supervisor gets notified and approves your entry with one click.
3. Your cumulative hours update automatically. You can check your total at any time.
4. At the end of your OJT, you export a complete DTR with all approved hours, properly formatted.

The biggest advantage over spreadsheets: your supervisor approves entries digitally, so there's a verified record that satisfies most school requirements.

## Tips to Make Sure Your Hours Are Always Accurate

1. Log the same day. Don't let entries pile up. It takes 30 seconds while you're still at your desk.
2. Note your actual times, not rounded ones. If you arrived at 8:04, write 8:04. Supervisors notice when every entry is suspiciously round.
3. Track your running total weekly. Don't wait until week 8 to discover you're 40 hours short.
4. Keep a backup. Whether you use OJTask or a spreadsheet, always have a second copy. Cloud storage counts.
5. Know your required hours. Check your school's OJT manual. Requirements differ by program (IT, Business, Engineering, etc.) and by school.

## What to Do If You Missed Days

It happens. If you missed logging a day, here's how to handle it:

- If you were actually present, talk to your supervisor. Most will approve a retroactive entry if you can recall the correct times.
- If you were absent but have an approved leave, make sure that's noted separately since it typically doesn't count toward your required hours.
- If you're using OJTask, you can add past entries with a note explaining the delay.

## Final Thought

Your OJT is supposed to be a learning experience, not an administrative nightmare. The less time you spend managing paperwork, the more time you have to actually learn from your internship. Pick a system that works, stick to it daily, and make sure your supervisor is aligned with how you're logging hours.

If you want to try OJTask, it's free and takes about two minutes to set up. Your supervisor creates a space, shares a code, and you're in.
    `.trim(),
  },
  {
    slug: "what-is-daily-scrum-ojt",
    title: "What Is a Daily Scrum in OJT? A Simple Guide for Filipino Interns",
    description: "Your supervisor or school might be asking you to submit a 'daily scrum' during your OJT. Here's exactly what it is, what to write, and why it actually makes your internship easier.",
    date: "June 12, 2026",
    readTime: "4 min read",
    category: "For Students",
    content: `
## "What's a Daily Scrum?" The Question Almost Every OJT Intern Asks

If your supervisor or school coordinator told you to submit a daily scrum report and you Googled it, you probably got results about software development teams. That's because the daily scrum originally comes from Agile, a way of working used in tech companies.

But in the context of Philippine OJT, it means something simpler: a short daily update about your internship.

## What a Daily Scrum Report Actually Is

A daily scrum is a structured, brief summary of three things:

1. What did you do today? Write a short description of the tasks you worked on during your OJT hours.
2. What will you do tomorrow? Write what you plan to work on next.
3. Is anything blocking you? List any problem, question, or resource you need that's preventing you from making progress.

That's it. Most daily scrum reports for OJT take two to three minutes to write. The goal isn't to write an essay. Just give your supervisor a clear picture of your day without needing a meeting.

## Why Schools and Companies Ask for Daily Scrum Reports

There are a few reasons this has become common in Philippine OJT programs:

For supervisors: Instead of asking you "so what did you do today?" every afternoon, they can read your scrum report whenever they have time. It creates a written record of your activities and makes it easier to guide your learning.

For school coordinators: A daily scrum gives them proof that you're actively working and learning, not just sitting in an office. It's also useful documentation if there are any disputes about your OJT activities.

For you: Writing a daily scrum forces you to reflect on what you actually accomplished. Over time, you can look back and see your own progress. It also makes writing your final OJT report or terminal report much easier because you already have a day-by-day record.

## How to Write a Good Daily Scrum Report for OJT

Here's a simple format you can follow:

---

Date: [Date]
OJT Hours Today: [e.g., 8:00 AM to 5:00 PM]

What I did today:
I assisted in [task/project], specifically working on [specific activity]. I also attended a [meeting/training/orientation] about [topic].

What I plan to do tomorrow:
Continue working on [task]. I will also start [next task] as instructed by my supervisor.

Blockers / Concerns:
None today. / I need access to [tool/system] to continue with [task]. I'll ask my supervisor tomorrow morning.

---

Keep it factual and specific. "I helped with documents" is vague. "I organized and filed the client contracts from Q1 2026 into the company's document management system" is useful.

## Common Mistakes to Avoid

Writing the same thing every day. If your scrum says "I helped the team with tasks" five days in a row, it raises questions. Be specific about what changed each day.

Skipping the blockers section. Even if you have no blockers, write "None". Don't leave it blank. It shows you actually thought about it.

Writing it at the end of the week from memory. Daily scrums are meant to be written daily. Writing five at once on Friday means the details are fuzzy and the timestamp is wrong.

Making it too long. Three to five sentences per section is enough. This is a status update, not a journal entry.

## Submitting Your Daily Scrum in OJTask

If your OJT uses OJTask, submitting your daily scrum is built right into the platform. After logging your hours for the day, you fill in the three fields (what you did, what's next, any blockers) and submit. Your supervisor sees it immediately and can approve or leave a comment.

No email threads. No WhatsApp messages. No wondering if they saw it.

## The Bigger Picture

The daily scrum habit you build during OJT is the same habit used by professional teams at every tech company in the Philippines and abroad. Learning to communicate your work clearly and concisely (what you did, what's next, what's blocking you) is one of the most transferable skills you can pick up during your internship.

The form is simple. The discipline is what matters.
    `.trim(),
  },
  {
    slug: "ojt-requirements-checklist-philippines",
    title: "Complete OJT Requirements Checklist for Philippine College Students (2026)",
    description: "A comprehensive checklist of every document, form, and requirement you'll need to complete your OJT as a Philippine college student, plus tips for keeping them all organized.",
    date: "June 14, 2026",
    readTime: "6 min read",
    category: "For Students",
    content: `
## The Complete OJT Requirements Checklist

One of the most stressful parts of On-the-Job Training in the Philippines isn't the work itself. It's keeping track of all the paperwork. Requirements vary slightly by school and program, but the core documents are consistent across most universities and colleges.

Use this checklist to make sure you have everything covered.

---

## Before Your OJT Starts

These are the documents you need to prepare and submit before your internship officially begins:

- [ ] Endorsement Letter: A letter from your school officially endorsing you to your host company. Usually issued by your department or OJT coordinator.
- [ ] Application Letter: A letter you write yourself to apply to the company where you want to do your OJT.
- [ ] Resume / CV: Your updated resume, often required by the company before they accept you.
- [ ] Parent/Guardian Consent Form: Some schools require parental consent, especially for students doing OJT far from home.
- [ ] Medical Certificate: Proof that you're medically fit for work. Some companies require this.
- [ ] NBI Clearance or Police Clearance: Increasingly required by companies, especially in finance, healthcare, and government.
- [ ] PhilHealth / SSS / Pag-IBIG Forms: Some companies require student OJT workers to be registered.
- [ ] OJT Acceptance Letter from Company: The company's written confirmation that they are accepting you as an intern.
- [ ] Memorandum of Agreement (MOA): A formal agreement between your school and the host company outlining the terms of your OJT. Usually signed by both your department head and the company's authorized representative.

---

## During Your OJT

These are the documents and records you maintain while you're actively doing your internship:

- [ ] Daily Time Record (DTR): Your daily log of time-in and time-out. This is the most important document for proving your completed hours. Must be signed by your supervisor.
- [ ] Daily Journal / Weekly Report: A written record of your daily or weekly activities. Many schools call this a "practicum journal" or "OJT report."
- [ ] Daily Scrum Reports: Required by many companies and schools as a structured daily update (what you did, what's next, any blockers).
- [ ] Task Completion Records: Some schools require a list of specific tasks accomplished during the OJT.
- [ ] Supervisor Evaluation Form (Mid-term): A mid-internship evaluation filled out by your company supervisor.

---

## At the End of Your OJT

These documents wrap up your internship and are submitted to your school:

- [ ] Certificate of Completion: Issued by the host company confirming you completed your OJT. Signed by your supervisor or HR.
- [ ] Final Supervisor Evaluation Form: A comprehensive evaluation of your performance, filled out by your company supervisor.
- [ ] Terminal Report / Final OJT Report: A detailed written report summarizing your entire OJT experience, learnings, and accomplishments. Usually 10 to 30 pages depending on your school's format.
- [ ] Final DTR (Signed and Notarized): Your complete daily time record covering the entire internship period. Some schools require notarization.
- [ ] Self-Evaluation Form: Some schools ask you to evaluate your own performance and learning.
- [ ] Student Clearance from Host Company: Confirmation that you returned all borrowed equipment and completed all obligations.

---

## Document Tips for Staying Organized

Go digital from day one. Scan or photograph every paper document as soon as you have it. Store copies in Google Drive or your OJTask Document Hub. Paper gets lost. Digital copies don't.

Label everything with dates. "MOA.pdf" is useless three months later. "MOA_CompanyName_June2026.pdf" makes sense.

Know your school's exact requirements. Every school has slightly different requirements. Download your school's OJT manual and go through it with your OJT coordinator before you start, not after.

Track your MOA status. The MOA needs signatures from multiple people (your department head, the company, sometimes a notary). Start this process early. It can take weeks.

Keep a physical backup. Even if you go digital, keep one set of physical copies in a folder. Some schools still require originals.

---

## How OJTask Helps with Document Management

OJTask's Document Hub is designed specifically for the documents listed above. You can upload, organize, and share files with your supervisor and school coordinator directly in the platform. When your coordinator needs to check your MOA or endorsement letter, they can access it themselves without you having to resend it every time.

Combined with the OJT hours tracker and daily scrum reports, it covers the full documentation lifecycle of your internship in one place.

---

## One Last Thing

Requirements change. Always double-check the current requirements with your school's OJT office at the start of every semester. Schools update their forms and processes regularly, and using an outdated template can cause unnecessary delays.

Good luck with your OJT. 🇵🇭
    `.trim(),
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
