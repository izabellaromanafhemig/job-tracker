# Job Tracker

A small web app for keeping track of your job search: the jobs you applied to, where each one stands, and the follow-up tasks for each application. Every user has a private account and sees only their own data.

Built on the official [Next.js + Supabase starter](https://github.com/vercel/next.js/tree/canary/examples/with-supabase).

## Features

- **Accounts**: sign up, log in, log out and reset your password (email + password, handled by Supabase Auth). Logged-in users go straight to their applications. The home page is only for logged-out visitors.
- **Applications**: add, view, edit and delete job applications with company, position, status (`applied`, `interviewing`, `offer`, `rejected`), application date and notes.
- **Tasks**: each application can have tasks with a title, an optional due date and a done/not-done state. Add them on the application's page. The **Tasks** page lists all of them, and you can mark them done, edit them and delete them there.
- **Import**: add many applications at once from a `.csv` or `.xlsx` file (see [Importing applications](#importing-applications)).
- **Export**: download all your applications as CSV, Excel (XLSX) or PDF. Excel and PDF files use the site's current color scale.
- **Appearance**: light, dark or system theme, plus six color scales (Neutral, Blue, Green, Rose, Violet, Orange). Your choice is remembered in the browser.
- **Clear feedback**: every form shows a message when something is saved or when it fails.
- **Private data**: Postgres Row Level Security makes sure a user can only read and write their own rows, even when calling the database directly.

## Tech stack

| Area | Tools |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router, Server Components, Server Actions), React 19, TypeScript |
| Backend | [Supabase](https://supabase.com): Postgres database, Auth and Row Level Security, accessed with `@supabase/ssr` and `@supabase/supabase-js` |
| UI | [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) components (Radix UI), `lucide-react` icons, `next-themes` for light/dark mode |
| Files | [`exceljs`](https://github.com/exceljs/exceljs) (read/write Excel), [`jspdf`](https://github.com/parallax/jsPDF) + [`jspdf-autotable`](https://github.com/simonbengtsson/jsPDF-AutoTable) (PDF) |

## Getting started

### 1. Requirements

- [Node.js](https://nodejs.org) 20 or newer (LTS recommended), which includes `npm`
- A free [Supabase](https://supabase.com) account

### 2. Get the code and install dependencies

```bash
git clone <your-repository-url> job-tracker
cd job-tracker
npm install
```

> **Windows / PowerShell:** if `npm` fails with "running scripts is disabled on this system", use `npm.cmd` instead (for example `npm.cmd install`). You can also allow local scripts for your user with `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### 3. Create a Supabase project

1. In the [Supabase dashboard](https://supabase.com/dashboard), create a new project.
2. Wait until it has finished setting up.

### 4. Set the environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

(On Windows: `copy .env.example .env.local`.)

Then fill in `.env.local` with the values from your Supabase project. Open the dashboard's **Connect** button, or **Project Settings → API**:

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL, like `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The project's **publishable** key (or the legacy **anon** key) |

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

These are the only two variables the app needs.

- The publishable key is meant to be used in the browser. Your data stays protected by Row Level Security.
- **Never** put the `service_role` / secret key in this app.
- `.env.local` is listed in `.gitignore`. Do not commit it.

### 5. Create the database tables (run the SQL migration)

The schema is in [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql). It creates:

- `applications` and `tasks` tables (a task belongs to one application; deleting an application deletes its tasks),
- Row Level Security policies, so each user can only select, insert, update and delete their own rows,
- a database rule that a task can only point to an application owned by the same user.

To run it:

1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Paste the **entire** contents of `supabase/migrations/001_initial_schema.sql`.
3. Click **Run**. You should see "Success. No rows returned".
4. Check **Table Editor**: the `applications` and `tasks` tables should now exist.

Run it only once. Running it again fails because the tables already exist.

<details>
<summary>Alternative: Supabase CLI</summary>

If you use the [Supabase CLI](https://supabase.com/docs/guides/cli) and have linked this folder to your project (`supabase link`), you can apply the migration with:

```bash
supabase db push
```

</details>

### 6. Check the Auth URL settings

Sign-up sends a confirmation email whose link must point back to your app. In the dashboard, open **Authentication → URL Configuration**:

- set **Site URL** to `http://localhost:3000`
- add `http://localhost:3000/**` to **Redirect URLs**

### 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Sign up**, confirm your email, then log in. You'll land on **Applications**.

## Using the app

| Page | What you can do |
|---|---|
| `/applications` | Add an application, import or export, and see your list (newest application date first) |
| `/applications/[id]` | Edit or delete an application; add tasks to it |
| `/tasks` | All your tasks: mark done / not done, edit, delete |

All of these pages require login. Logged-out visitors are sent to `/auth/login`.

### Importing applications

On **Applications → Import / export**, choose a `.csv` or `.xlsx` file (max 1 MB, 500 rows) with these columns:

| Column | Required | Accepted values |
|---|---|---|
| `company` | yes | text |
| `position` | yes | text |
| `status` | no | `applied`, `interviewing`, `offer`, `rejected` (any capitalization). Empty means `applied` |
| `applied_on` | yes | `2026-10-02`, `02/10/2026` (day/month/year) or an Excel date |
| `notes` | no | text |

- Imported rows always belong to the logged-in user. Any `user_id` column in the file is ignored.
- CSV files separated by `;` (how Excel saves CSV in some languages, such as Portuguese) are accepted.
- **If any row is invalid, nothing is imported**, and the message lists every problem by row number. This avoids half-imported files and duplicates when you retry.
- A file exported from the app can be imported again.

Sample files for testing are in [`supabase/sample-data/`](supabase/sample-data):

- `import-test.csv`: 8 valid applications covering the different formats.
- `import-test-with-errors.csv`: should be rejected with 4 row errors.
- `applications.csv`: 10 sample applications. Its `user_id` column is only needed for the Supabase dashboard's own CSV import, and the app ignores it.

Edit CSV files in a text editor rather than Excel, which may change the separators when saving.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server at http://localhost:3000 |
| `npm run build` | Build for production (also type-checks) |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint. Note: the template's config also scans the generated `.next` folder. To check only the source code, run `npx eslint app components lib proxy.ts` |

## Project structure

```
app/
  (app)/                       # Logged-in area, shares the navigation bar layout
    applications/              # List page, server actions (create/update/delete/import)
      [id]/                    # Application detail page
      export/route.ts          # GET /applications/export?format=csv|xlsx|pdf
    tasks/                     # Tasks page and task server actions
  auth/                        # Login, sign-up, password reset (from the starter)
  protected/                   # Redirects to /applications (the starter's post-login page)
  page.tsx                     # Home page (logged-out visitors only)
components/                    # Forms, task list item, theme and color pickers, shadcn/ui
lib/
  supabase/                    # Supabase clients (browser, server) and session proxy
  import-applications.ts       # CSV/XLSX parsing and validation
  export-applications.ts       # CSV/XLSX/PDF generation
  palette.ts                   # Color scales
  types.ts                     # Shared types and status list
proxy.ts                       # Runs on each request: refreshes the session, protects pages
supabase/
  migrations/001_initial_schema.sql
  sample-data/                 # CSV files for testing the import
```

## Troubleshooting

- **"Could not save…" / "Could not load…" on every page**: the SQL migration probably hasn't been run in this Supabase project. Check that the tables exist (step 5).
- **The app shows a warning about environment variables**: `.env.local` is missing or the dev server was started before you created it. Fix the file and restart `npm run dev`.
- **"Email not confirmed" when logging in**: click the link in the confirmation email first, and check the URL settings in step 6.
- **A "script tag" warning in the browser console during development**: it comes from `next-themes` with React 19 and is harmless.
