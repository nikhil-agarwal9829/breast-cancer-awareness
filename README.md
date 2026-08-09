# Breast Cancer Awareness Website

A comprehensive website dedicated to breast cancer awareness, education, and support. The website includes information about breast cancer, early detection methods, treatment options, and community support features.

## Features

- Informative sections about breast cancer types and symptoms
- Interactive FAQ chat system
- Real-time notifications for diet, medicine, and community updates
- Contact form for inquiries
- Responsive design for all devices
- Community support features
- Interactive map for finding nearby support centers
- Diet and exercise recommendations
- Medicine reminders
- Community support group information
- User-friendly navigation
- Mobile-responsive design
- Accessibility features

## Technologies Used

- HTML5, CSS3, JavaScript (no framework/bundler)
- Supabase Postgres (database)
- Supabase Edge Functions (Deno — server-side AI proxying)
- Supabase Auth (admin dashboard login)
- Supabase Realtime (live admin dashboard updates)
- Gemini AI (primary — `gemini-1.5-flash` / `gemini-1.5-pro`)
- OpenAI (fallback only — `gpt-4o-mini`)
- Font Awesome Icons, Google Fonts
- AOS, Animate.css, Chart.js, jsPDF

## Project Structure

```
breast-cancer-awareness/
├── index.html              # Landing page
├── medical.html            # Medical help — risk assessment + AI chat
├── about.html              # About + NGO partner contact
├── donate.html             # Donation page
├── campaign.html           # Campaign creation form
├── community.html          # Community join form
├── contact.html            # Contact form
├── chat.html               # Standalone chat page
├── admin-dashboard.html    # Admin dashboard (auth-gated)
├── css/
│   ├── styles.css          # Main styles
│   ├── chat.css            # Chat widget styles
│   ├── admin.css           # Admin dashboard styles
│   └── login.css           # Login page styles
├── js/
│   ├── supabase-config.js  # Public Supabase URL + anon key + API_BASE
│   ├── supabase-client.js  # Browser Supabase client + insert helpers
│   ├── api-config.js       # AI endpoint routing + session ID
│   ├── chat.js             # Chat widget with history tracking
│   ├── gemini-api.js       # Legacy chat API wrapper
│   ├── admin.js            # Admin dashboard (auth + realtime + data)
│   ├── main.js             # Shared utilities
│   └── login.js            # Login page logic
├── supabase/
│   ├── functions/
│   │   ├── ai-chat/index.ts   # Chat Edge Function (Gemini + OpenAI fallback)
│   │   ├── ai-risk/index.ts   # Risk assessment Edge Function
│   │   └── .env               # Edge Function secrets (gitignored)
│   └── migrations/
│       └── 20260809_*.sql     # faq_cache, risk_assessments, donations tables
├── images/                 # Site images
├── .env                    # Root env secrets (gitignored)
├── .gitignore
├── README.md
└── LICENSE
```

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/nikhil-agarwal9829/breast-cancer-awareness.git
cd breast-cancer-awareness
```

2. **Supabase setup** (database + auth):
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL migrations from `supabase/migrations/` in the SQL Editor
   - Copy your Project URL and anon key into `js/supabase-config.js`
   - Create an admin user in Supabase Auth (email/password)

3. **Local Edge Functions** (AI chat + risk assessment):
   - Install Supabase CLI: `npm install -g supabase`
   - Copy real keys into `supabase/functions/.env`
   - `supabase start` (requires Docker)
   - `supabase functions serve ai-chat --env-file supabase/functions/.env`
   - `supabase functions serve ai-risk --env-file supabase/functions/.env`

4. **Security model**:
   - `js/supabase-config.js` is committed — it contains only the publishable/anon key (browser-safe by design)
   - RLS policies protect data, not key secrecy
   - Secret keys (service_role, AI API keys) live only in `.env` files (gitignored) and Supabase Edge Function secrets

Script order on form pages: Supabase CDN → `supabase-config.js` → `supabase-client.js`.

## Live Demo

Visit the live website at: https://nikhil-agarwal9829.github.io/breast-cancer-awareness

## Features in Detail

### 1. Information Section
- Comprehensive information about breast cancer
- Types and symptoms
- Risk factors and prevention
- Treatment options
- Early detection methods
- Screening guidelines

### 2. Interactive Chat
- 24/7 support through AI-powered chat
- Quick responses to common questions
- Personalized information delivery
- Multi-language support
- Context-aware responses

### 3. Notification System
- Diet reminders
- Medicine schedules
- Community updates
- Exercise recommendations
- Customizable notification preferences
- Priority-based alerts

### 4. Community Support
- Support group information
- Community events
- Success stories
- Resource sharing
- Peer support network
- Expert consultation

### 5. User Interface
- Clean and intuitive design
- Easy navigation
- Mobile-first approach
- Accessibility features
- Dark/Light mode support
- Responsive layout

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

- Email: nikhilagarwal9785@gmail.com
- Phone: +91 9785836544
- GitHub: [nikhil-agarwal9829](https://github.com/nikhil-agarwal9829)

## Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- All contributors and supporters
- Healthcare professionals for medical accuracy
- Community members for feedback and suggestions 