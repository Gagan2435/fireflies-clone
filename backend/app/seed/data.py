"""Seed meetings. Transcripts are condensed (timestamps jump) but fully realistic.
Chapters/overview are curated by hand; key points, keywords and action items are generated
by the same notes engine that serves uploaded transcripts."""

PEOPLE = {
    "Alex Rivers": "alex.rivers@acme-demo.com", "Maya Chen": "maya.chen@acme-demo.com",
    "Liam Smith": "liam.smith@acme-demo.com", "Jordan Bell": "jordan.bell@acme-demo.com",
    "Priya Patel": "priya.patel@acme-demo.com", "Sarah Jenkins": "sarah@northwind-demo.com",
    "David Ross": "david@northwind-demo.com", "Chloe Dubois": "chloe.dubois@acme-demo.com",
    "Rachel Vance": "rachel.vance@acme-demo.com", "Carlos Gomez": "carlos.gomez@acme-demo.com",
    "Hannah Lee": "hannah.lee@acme-demo.com", "Sam Ortiz": "sam.ortiz@acme-demo.com",
}

MEETINGS = [
    dict(
        title="Q3 Product Strategy & AI Copilot Roadmap", days_ago=1, hour=10, platform="zoom",
        tags=["product", "roadmap", "ai"],
        overview=("The product team aligned on the Q3 AI Copilot roadmap. Latency is the headline win: speculative decoding cut "
                  "time-to-first-token from 820ms to 240ms with no quality loss. Enterprise pilots flagged speaker diarization "
                  "when people talk over each other, so a beamforming fix goes to staging next week. The group agreed on a "
                  "July 30 code freeze ahead of the August 15 beta."),
        chapters=[(0, "Q3 priorities", "Three themes for the quarter: latency, diarization and live meeting queries."),
                  (19, "Latency benchmarks", "Speculative decoding cut time-to-first-token from 820ms to 240ms."),
                  (112, "Pilot user feedback", "Citation pills in the Ask Fred panel raised user confidence."),
                  (144, "Diarization issues", "Overlapping speech gets merged; PyAnnote plus beamforming is the fix."),
                  (292, "Release timeline", "Code freeze July 30, beta rollout August 15; accuracy and latency are the risks.")],
        transcript="""[00:00] Alex Rivers: Welcome everyone. Today we are aligning on our Q3 AI Copilot roadmap. We have three main items: latency reduction, speaker diarization enhancements, and live meeting query capabilities.
[00:19] Maya Chen: Thanks Alex. On the model latency side, we benchmarked our speculative decoding pipeline. We reduced time-to-first-token from 820 milliseconds down to 240 milliseconds on our primary GPU cluster.
[00:49] Jordan Bell: That is a huge improvement Maya. Are we seeing any degradation in summary coherence or factuality with the smaller draft model?
[01:16] Maya Chen: Zero degradation. Our verification pass ensures full token fidelity. We validated this across 1,500 synthetic meeting transcripts with standard ROUGE and BERT scores.
[01:52] Liam Smith: From the UX side, users in our pilot said the instant response feels like magic. In the new Ask Fred panel, showing citation pills next to answers gave them much higher confidence.
[02:24] Alex Rivers: What about the enterprise feedback on diarization? Northwind noted that when two speakers talk over each other, voice segments sometimes get merged.
[03:00] Maya Chen: Yes, we are integrating PyAnnote with custom beamforming heuristics for multi-mic conference rooms. I will deploy that to the staging cluster by next Tuesday.
[03:42] Jordan Bell: I will make sure our QA team has automated regression suites running against the 40-speaker stress test benchmark by Friday.
[04:18] Liam Smith: I also finalized the soundbite selector. Users can highlight any transcript segment and generate a shareable audio clip with one click.
[04:52] Alex Rivers: Liam, can you write up the share modal specs by Thursday? We need to hit the July 30th code freeze so we are ready for the August 15th beta rollout.
[05:30] Liam Smith: Sure. Diarization accuracy and latency are the two risks I would flag for the beta launch.
[06:05] Jordan Bell: Agreed. I will also draft the rollback plan if the staging benchmark regresses.
[06:40] Alex Rivers: Fantastic progress everyone. Thanks all, talk next week.""",
        comments=[(1, "Great number to quote in the launch blog post."), (6, "Need to confirm staging capacity before Tuesday.")],
        soundbites=[(1, "Latency drops to 240ms")], done_actions=[0],
    ),
    dict(
        title="Enterprise Discovery Call: Northwind Implementation", days_ago=2, hour=15, platform="meet",
        tags=["sales", "customer", "enterprise"],
        overview=("Discovery call with Northwind's ops team about rolling out the notetaker to 400 seats. Their blockers are SSO "
                  "through Okta, a 90-day retention policy and a security questionnaire. They want a two-week pilot with the support "
                  "team first. Sarah will share the questionnaire and Priya will prepare a pilot plan and pricing."),
        chapters=[(0, "Goals and context", "Northwind wants consistent notes across 400 customer-facing seats."),
                  (95, "Security and SSO", "Okta SSO, SOC 2 report and a 90-day retention policy are required."),
                  (210, "Pilot scope", "Two-week pilot with the support team before a wider rollout."),
                  (330, "Pricing and next steps", "Pricing proposal, questionnaire and kickoff date to follow.")],
        transcript="""[00:00] Priya Patel: Thanks for joining, Sarah and David. I would love to start with what success looks like for Northwind in the first quarter.
[00:22] Sarah Jenkins: Our goal is consistent meeting notes across four hundred customer-facing seats. Right now every manager writes recaps in a different format and half of them never get written.
[00:58] David Ross: The bigger issue is follow-ups. Commitments made on calls disappear, and we only find out when a customer escalates.
[01:35] Priya Patel: That is exactly what action item extraction is designed for. Every task is linked to the transcript line where it was promised, so nobody has to guess.
[02:10] Sarah Jenkins: Security will have questions. We require Okta single sign-on, a SOC 2 report, and a retention policy of ninety days for recordings.
[02:48] Priya Patel: All supported on the enterprise plan. I will send over our SOC 2 Type 2 report and the SSO setup guide by Friday.
[03:25] David Ross: Our security team also has a vendor questionnaire. I can forward it to you tomorrow so legal is not a blocker.
[04:05] Sarah Jenkins: Can we start smaller? I would like to pilot with the support team for two weeks before rolling out to sales.
[04:40] Priya Patel: A two week pilot with about thirty seats works well. I will put together a pilot plan with success metrics and share it next Monday.
[05:20] David Ross: We would measure recap completion rate and the time managers spend writing notes.
[05:55] Sarah Jenkins: And pricing? We need a number for budget approval at the end of the month.
[06:25] Priya Patel: I will send a pricing proposal covering the pilot and the full four hundred seats by Wednesday.
[06:58] Sarah Jenkins: Perfect. Let us plan a kickoff in two weeks, assuming security signs off.
[07:20] Priya Patel: Sounds good. Thank you both, this was very helpful.""",
        comments=[(5, "Okta SSO + SOC 2 are the hard requirements.")], soundbites=[(1, "Why Northwind needs this")], done_actions=[],
    ),
    dict(
        title="Weekly Engineering Standup & Incident Review", days_ago=3, hour=9, platform="teams",
        tags=["engineering", "standup", "incident"],
        overview=("Standup covered progress on the search index migration and a Monday incident where export jobs timed out for "
                  "long meetings. The root cause was a missing queue limit; a hotfix is live and a retry mechanism is next. Jordan "
                  "owns the postmortem, Priya the dashboard alerts, and Maya finishes the index migration by Thursday."),
        chapters=[(0, "Search index migration", "Migration is 70% done; cutover planned for Thursday."),
                  (150, "Export incident review", "Long meetings timed out because the queue had no concurrency limit."),
                  (300, "Alerting and follow-ups", "Add alerts for queue depth and write the postmortem."),
                  (420, "Blockers", "Waiting on staging credentials; otherwise no blockers.")],
        transcript="""[00:00] Jordan Bell: Morning everyone. Quick round robin, then we spend most of the time on Monday's export incident. Maya, you first.
[00:18] Maya Chen: The search index migration is about seventy percent done. Backfill is running, and I will finish the cutover by Thursday if the staging credentials come through.
[00:52] Priya Patel: I am blocked on those credentials too. I asked the platform team yesterday but have not heard back.
[01:20] Jordan Bell: I will ping them directly after this call. Anything else on the migration?
[01:44] Maya Chen: One risk is the old index and new index drifting during the cutover window, so I will add a consistency check script.
[02:30] Jordan Bell: Good. Now the incident. Priya, can you walk us through the timeline?
[02:48] Priya Patel: On Monday around two in the afternoon, export jobs for meetings over an hour started timing out. Support saw about sixty tickets before we noticed.
[03:35] Maya Chen: The root cause was that the export queue had no concurrency limit, so a few huge jobs starved everything else.
[04:10] Priya Patel: The hotfix capped workers at four and moved long exports to a separate queue. Timeouts dropped to zero within ten minutes.
[05:00] Jordan Bell: We need alerts on queue depth so we catch this before customers do. Priya, can you set that up by Wednesday?
[05:25] Priya Patel: Yes, I will add queue depth and job age alerts to the dashboard by Wednesday.
[06:10] Maya Chen: I can also add automatic retries with backoff so failed exports recover without a ticket.
[06:45] Jordan Bell: I will write the postmortem and share it with the team by Friday. Any other blockers before we wrap up?
[07:10] Priya Patel: No other blockers on my side.
[07:25] Maya Chen: Same here. Thanks Jordan.""",
        comments=[(8, "Linking this to the Monday incident ticket.")], soundbites=[(7, "Root cause: no queue limit")], done_actions=[0, 1],
    ),
    dict(
        title="UI/UX Design Sprint: Mobile App Redesign", days_ago=5, hour=13, platform="meet",
        tags=["design", "mobile", "sprint"],
        overview=("Design sprint review of the mobile app redesign. The team agreed that the bottom navigation should reduce to four "
                  "tabs, with Ask Fred promoted to the center. Onboarding user tests showed people missed the upload button, so it "
                  "moves into the primary action. Chloe will deliver revised flows and Liam will run another round of testing."),
        chapters=[(0, "Navigation redesign", "Four bottom tabs with Ask Fred centered."),
                  (140, "Onboarding test results", "Five of eight testers missed the upload button."),
                  (290, "Visual direction", "Dark mode first with a purple accent; keep contrast at AA."),
                  (400, "Next steps", "Revised flows, another test round and a handoff to engineering.")],
        transcript="""[00:00] Chloe Dubois: Thanks for joining the sprint review. I want to show the new navigation first, then the user testing results.
[00:25] Liam Smith: The old bar had six tabs and people kept confusing Tasks with Meetings. What did you change?
[00:48] Chloe Dubois: We reduced it to four tabs: Home, Meetings, Ask Fred in the center, and Tasks. Settings moves into the profile menu.
[01:30] Alex Rivers: I like promoting Ask Fred. Our analytics show it is the most engaged feature on mobile.
[02:20] Chloe Dubois: Now the onboarding tests. We ran eight sessions and five people could not find the upload button on the first try.
[03:05] Liam Smith: That matches what support hears. The upload action is buried in a menu on the top right.
[03:45] Chloe Dubois: So the proposal is a floating capture button with upload, record and join live meeting actions.
[04:50] Alex Rivers: What about accessibility? I want contrast to stay at AA across both themes.
[05:30] Chloe Dubois: We are dark mode first with a purple accent. I checked contrast ratios and the muted text needs a slightly lighter grey to pass.
[06:15] Liam Smith: I will update the design tokens in the shared library by Wednesday so engineering sees the same colors.
[06:55] Alex Rivers: Can you share the revised flows with engineering before the next sprint planning?
[07:20] Chloe Dubois: Yes, I will publish the revised flows in Figma by Thursday and walk engineering through them on Friday.
[08:05] Liam Smith: I will also run another round of five usability tests next week to validate the floating button.
[08:40] Alex Rivers: Great work everyone. Let us reconvene after the tests.""",
        comments=[], soundbites=[(4, "5 of 8 testers missed upload")], done_actions=[],
    ),
    dict(
        title="Executive Briefing: H1 Revenue & Growth", days_ago=8, hour=11, platform="zoom",
        tags=["executive", "finance", "growth"],
        overview=("Leadership reviewed H1 results. Revenue grew 38% year over year to 12.4 million dollars, driven by enterprise "
                  "expansion. Churn improved to 2.1%, but sales cycles lengthened. The plan for H2 is to hire four enterprise reps, "
                  "launch partner integrations and tighten the forecast process. Carlos will finalize hiring and Rachel will present the budget."),
        chapters=[(0, "H1 results", "Revenue up 38% year over year to 12.4 million dollars."),
                  (170, "Churn and retention", "Churn fell to 2.1%; onboarding improvements were the main driver."),
                  (330, "Sales cycle risk", "Enterprise cycles lengthened by about three weeks."),
                  (480, "H2 plan and budget", "Four enterprise hires, partner integrations and a tighter forecast.")],
        transcript="""[00:00] Rachel Vance: Thank you all. Let us walk through the H1 numbers and then decide how we invest in the second half.
[00:30] Carlos Gomez: Revenue closed at twelve point four million dollars, up thirty eight percent year over year. Enterprise accounted for sixty percent of the growth.
[01:20] Alex Rivers: That is ahead of the plan we set in January. What drove the beat?
[01:55] Carlos Gomez: Expansion within existing accounts, mostly seat growth after successful pilots, plus two large new logos in financial services.
[02:50] Rachel Vance: Retention was the second headline. Churn improved from three point four percent to two point one percent.
[03:30] Alex Rivers: Onboarding improvements and the new action item workflows were the main reasons customers told us they stayed.
[04:15] Carlos Gomez: The risk is sales cycle length. Enterprise deals now take about three weeks longer because of security reviews.
[05:00] Rachel Vance: We need to get ahead of that. Can you build a security review kit, including the SOC 2 report and the standard questionnaire answers?
[05:40] Carlos Gomez: Yes, I will have the security kit ready for the sales team by the end of the month.
[06:25] Alex Rivers: For H2 I propose hiring four enterprise reps and launching partner integrations with the major CRMs.
[07:10] Rachel Vance: I agree with the direction. I will present the revised budget to the board on the fifteenth, including the hiring plan.
[07:55] Carlos Gomez: I will finalize the job descriptions and open the four roles by next Monday.
[08:30] Rachel Vance: Excellent. We also need a tighter forecast process so the board is never surprised. Alex, can you own that?
[09:05] Alex Rivers: I will set up a weekly forecast review starting next week.
[09:35] Rachel Vance: Thank you everyone. Strong half, let us keep the momentum.""",
        comments=[(1, "Share this slide in the all-hands.")], soundbites=[(1, "Revenue up 38% YoY")], done_actions=[0, 1],
    ),
]

# A raw WebVTT file, pasted as-is, to demonstrate the transcript-file import path.
VTT_MEETING = dict(
    title="Customer Support Retro", days_ago=11, hour=16, platform="upload", tags=["support", "retro", "uploaded"],
    chapters=None, overview=None, comments=[], soundbites=[], done_actions=[],
    transcript="""WEBVTT

1
00:00:00.000 --> 00:00:14.000
<v Hannah Lee>We handled about nine hundred tickets last month, and I want to look at what went well and what hurt.</v>

2
00:00:15.000 --> 00:00:40.000
<v Sam Ortiz>Average first response time dropped from four hours to ninety minutes, which is the best result we have had.</v>

3
00:00:41.000 --> 00:01:10.000
<v Priya Patel>The pain point was PDF exports failing for long meetings. We had sixty tickets about it and every one needed an engineer.</v>

4
00:01:11.000 --> 00:01:40.000
<v Hannah Lee>Priya, can you file a bug with reproduction steps by Tuesday so engineering can prioritize it?</v>

5
00:01:41.000 --> 00:02:05.000
<v Priya Patel>Yes, I will file it today. Sam, can you write a help center article with a workaround in the meantime?</v>

6
00:02:06.000 --> 00:02:30.000
<v Sam Ortiz>I will publish the workaround article by Thursday.</v>

7
00:02:31.000 --> 00:03:00.000
<v Hannah Lee>Another theme was onboarding questions. A short setup checklist inside the app would remove maybe half of those tickets.</v>

8
00:03:01.000 --> 00:03:30.000
<v Priya Patel>I will propose the checklist to the product team at next week's planning.</v>

9
00:03:31.000 --> 00:04:00.000
<v Sam Ortiz>Weekend coverage is thin and the response time on Sundays is over eight hours, so I can take every other Sunday if we get a day off in lieu.</v>

10
00:04:01.000 --> 00:04:25.000
<v Hannah Lee>That works. Thanks everyone, good retro.</v>
""",
)
