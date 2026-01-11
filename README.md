<div align="center">

  <h1>GitLife <img src="public/favicon.svg" alt="GitLife" width="24" height="24" style="vertical-align: middle;" /></h1>

  <p>
    <strong>Commit to a better version of yourself.</strong>
  </p>

  <p>
    <a href="#-the-concept">The Concept</a> •
    <a href="#-how-it-works">How It Works</a> •
    <a href="#-the-algorithm">The Algorithm</a> •
    <a href="#️-getting-started">Getting Started</a> •
    <a href="#-contributing">Contributing</a> •
  </p>

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)

</div>

<br />

![GitLife Cover](cover.png)

<br />

## 🚀 The Concept

As developers, we are obsessed with keeping our GitHub contribution graph populated. We hate breaking streaks. **GitLife** applies that same psychological "streak" mechanic to your physical and mental health.

Instead of the standard GitHub Green, GitLife uses a **Burning Orange** heatmap to represent your daily intensity.

> "You wouldn't leave your main branch unmaintained. Don't do it to your body."

## 🕹 How It Works

Every day, you create a **"Commit"** by logging three core metrics. Instead of lines of code, you are measuring effort on a scale of **1 to 5**:

1.  💪 **Workout:** Did you move your body? (Intensity/Duration)
2.  🥗 **Nutrition:** Did you eat clean? (Quality/Adherence)
3.  📚 **Reading:** Did you expand your mind? (Pages/Time)

## 📊 The Algorithm

The app calculates a **Daily Commit Score** (Total: 0–15) to determine the color intensity of that day's square on your calendar.

$$Score = Workout_{(1-5)} + Nutrition_{(1-5)} + Reading_{(1-5)}$$

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or bun package manager
- Supabase account (for authentication)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/GitLife.git
   cd GitLife
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   or if using bun:

   ```bash
   bun install
   ```

3. Set up Supabase:

- Create a new project on [Supabase](https://supabase.com/)
- Copy your Supabase URL and Anon Key
- Create a `.env` file from the template:

  ```bash
  cp .env.template .env
  ```

- Edit the `.env` file with your Supabase credentials:

  ```env
  VITE_SUPABASE_URL=your-supabase-project-url
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
  ```

4. Enable Email/Password authentication in Supabase:
   - Go to your Supabase project dashboard
   - Navigate to Authentication → Providers
   - Enable Email/Password authentication
   - Configure your SMTP settings for email verification

### Running the App

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Other Available Commands

- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run the linter

## 🤝 Contributing

Contributions are always welcome! Please create a PR to merge your changes.

1.  Fork the Project
2.  Open issue
3.  Create your Feature Branch from the issue (`git checkout -b feature/AmazingFeature`)
4.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
5.  Push to the Branch (`git push origin feature/AmazingFeature`)
6.  Open a Pull Request and assign 2 reviewer

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
