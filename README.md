# Flyarr

A tool to search award seats on all transfer partners for a given set of loyalty programs.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) and Docker Compose

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/EricKarschner37/flyarr.git
   cd flyarr
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

   This sets up the database connection URL. The default configuration works with the included Docker Compose setup:
   ```
   DATABASE_URL=postgresql://flyarr:flyarr@localhost:5433/flyarr
   ```

4. Start the PostgreSQL database:
   ```bash
   docker-compose up -d
   ```

5. Push the database schema:
   ```bash
   yarn db:push
   ```

6. Seed the database with initial data:
   ```bash
   yarn db:seed
   ```

7. Start the development server:
   ```bash
   yarn dev
   ```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start the development server |
| `yarn build` | Build for production |
| `yarn start` | Start the production server |
| `yarn db:push` | Push schema changes to the database |
| `yarn db:seed` | Seed the database with initial data |
| `yarn db:studio` | Open Drizzle Studio to browse the database |
| `yarn test` | Run tests in watch mode |
| `yarn test:run` | Run tests once |
