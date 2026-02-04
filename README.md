# Flyarr

A tool to search award seats on all transfer partners for a given set of loyalty programs.

## Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start the database:
   ```bash
   docker-compose up -d
   ```

3. Push the database schema:
   ```bash
   yarn db:push
   ```

4. Seed the database:
   ```bash
   yarn db:seed
   ```

5. Start the development server:
   ```bash
   yarn dev
   ```
