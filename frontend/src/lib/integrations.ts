export type IntegrationCategory = 'Audio recording' | 'Applicant tracking system' | 'CRM' | 'MCP' | 'Calendaring' | 'Project management' | 'Storage' | 'Note taking' | 'Video conferencing';
export interface Integration { name: string; by: string; desc: string; category: IntegrationCategory; color: string }

/** Static catalogue. Real third-party integrations are a placeholder in the assignment, so none of these connect. */
export const INTEGRATIONS: Integration[] = [
  { name: 'ActiveCampaign', by: 'Fireflies', desc: 'Sync Fireflies meeting notes to ActiveCampaign CRM and keep your contacts and companies automatically updated.', category: 'CRM', color: '#356ae6' },
  { name: 'Affinity', by: 'Fireflies', desc: 'Automatically sync meeting data and tasks to the relevant people and companies in Affinity.', category: 'CRM', color: '#2a5cff' },
  { name: 'Attio', by: 'Fireflies', desc: 'Automatically push meeting notes and action items from Fireflies into your Attio CRM.', category: 'CRM', color: '#4b5563' },
  { name: 'HubSpot', by: 'Fireflies', desc: 'Log meeting notes and tasks on the right HubSpot contacts and deals.', category: 'CRM', color: '#ff7a59' },
  { name: 'Zoom Connector', by: 'Fireflies', desc: 'Automatic transcripts and notes for Zoom calls. Fireflies.ai Notetaker joins your meeting as a participant.', category: 'Audio recording', color: '#2d8cff' },
  { name: 'Aircall', by: 'Fireflies', desc: 'Automatically capture, transcribe, and generate meeting notes for calls made through Aircall.', category: 'Audio recording', color: '#00b388' },
  { name: 'Allo', by: 'Fireflies', desc: 'Automatically capture, transcribe, and generate meeting notes for calls made and recorded through Allo.', category: 'Audio recording', color: '#f5c518' },
  { name: 'Ashby', by: 'Fireflies', desc: 'Automatically create new candidate records from meeting participants not yet in Ashby.', category: 'Applicant tracking system', color: '#4f46e5' },
  { name: 'BambooHR', by: 'Fireflies', desc: 'Transcripts, recordings, and notes from your meetings will be seamlessly sent to BambooHR.', category: 'Applicant tracking system', color: '#73ac2c' },
  { name: 'Greenhouse', by: 'Fireflies', desc: 'AI-powered notes for seamless recruiting.', category: 'Applicant tracking system', color: '#24a47f' },
  { name: 'Lever', by: 'Fireflies', desc: 'AI-powered notes for seamless recruiting.', category: 'Applicant tracking system', color: '#9ca3af' },
  { name: 'Atlassian', by: 'Fireflies', desc: 'Let AskFred work with Jira issues and Confluence pages.', category: 'MCP', color: '#2684ff' },
  { name: 'Canva', by: 'Fireflies', desc: 'Let AskFred find and create Canva designs.', category: 'MCP', color: '#7d2ae8' },
  { name: 'Figma', by: 'Fireflies', desc: 'Turn your Fireflies meetings into Figma designs: query any conversation and bring ideas straight to the canvas.', category: 'MCP', color: '#f24e1e' },
  { name: 'Lovable', by: 'Fireflies', desc: 'Turn your Fireflies meetings into working apps: query any conversation and build it on Lovable.', category: 'MCP', color: '#ff5a8a' },
  { name: 'Google Calendar', by: 'Fireflies', desc: 'Invite the notetaker to calendar events so meetings are recorded and summarized.', category: 'Calendaring', color: '#4285f4' },
  { name: 'Microsoft Outlook', by: 'Fireflies', desc: 'Sync Outlook calendar events with Fireflies.', category: 'Calendaring', color: '#0078d4' },
  { name: 'Asana', by: 'Fireflies', desc: 'Create Asana tasks from meeting action items.', category: 'Project management', color: '#f06a6a' },
  { name: 'ClickUp', by: 'Fireflies', desc: 'Create ClickUp tasks from meeting action items.', category: 'Project management', color: '#7b68ee' },
  { name: 'Google Drive', by: 'Fireflies', desc: 'Automatically save Fireflies meeting notes to Drive.', category: 'Storage', color: '#34a853' },
  { name: 'Dropbox', by: 'Fireflies', desc: 'Automatically save transcripts and recordings to Dropbox.', category: 'Storage', color: '#0061ff' },
  { name: 'Notion', by: 'Fireflies', desc: 'Send meeting notes to Notion pages.', category: 'Note taking', color: '#9ca3af' },
  { name: 'Google Meet', by: 'Fireflies', desc: 'Capture Google Meet calls with the Fireflies notetaker.', category: 'Video conferencing', color: '#00897b' },
  { name: 'Microsoft Teams', by: 'Fireflies', desc: 'Capture Microsoft Teams meetings with the Fireflies notetaker.', category: 'Video conferencing', color: '#5059c9' },
];
export const PRIMARY_FILTERS = ['All', 'Audio recording', 'Applicant tracking system', 'CRM', 'MCP'] as const;
export const MORE_FILTERS = ['Calendaring', 'Note taking', 'Project management', 'Storage', 'Video conferencing'] as const;
