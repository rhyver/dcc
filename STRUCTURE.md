# Project Structure Documentation

This document provides an overview of the project structure, including applications and packages in this monorepo.

## Overview

The project is a monorepo built with **pnpm workspaces** and **TurboRepo**. It consists of an Electron application (`core`) that serves two React frontends (`campaign` and `document`), supported by several shared packages.

### Technologies
- **Runtime:** Electron, Node.js
- **Frontend:** React, Vite, Tailwind CSS
- **Language:** TypeScript
- **State/Data:** TanStack Query, ORPC (Object RPC), Zod
- **DCS Integration:** Lua table parsing, Mission file (.miz) generation

## Directory Structure

### Apps (`apps/`)

Applications are the entry points of the system.

#### 1. `@dcc/core` (`apps/core`)
The main Electron backend process.
- **Role:** Orchestrates the application window, handles OS-level operations, and serves as the RPC server.
- **Key Responsibilities:**
  - Spawns the main window (loading `@dcc/campaign`).
  - Spawns secondary windows (loading `@dcc/document`).
  - Implements backend logic for mission generation (`@dcc/generate-miz`).
  - Exposes API endpoints via ORPC.
- **Dependencies:** `@dcc/contracts`, `@dcc/data`, `@dcc/generate-miz`.

#### 2. `@dcc/campaign` (`apps/campaign`)
The primary user interface for the campaign manager.
- **Role:** Main frontend application running inside the Electron window.
- **Tech Stack:** React, Vite, MapLibre (for maps), Tailwind CSS.
- **Key Features:**
  - Interactive map.
  - Campaign management UI.
  - Communicates with Core via ORPC client.
- **Dependencies:** `@dcc/contracts`, `@dcc/data`.

#### 3. `@dcc/document` (`apps/document`)
A secondary frontend application.
- **Role:** Dedicated UI for documentation or specific document views.
- **Tech Stack:** React, Vite, Tailwind CSS.
- **Dependencies:** Uses ORPC client for backend communication.

### Packages (`packages/`)

Shared libraries used across applications to ensure type safety and code reuse.

#### 1. `@dcc/contracts` (`packages/contracts`)
Defines the API contract between the frontend (Client) and backend (Server).
- **Role:** Shared type definitions and RPC contracts.
- **Usage:** Imported by both `apps/campaign` (client) and `apps/core` (server) to ensure type-safe communication.
- **Tech:** ORPC, Zod.

#### 2. `@dcc/data` (`packages/data`)
Contains static data and definitions for the DCS world.
- **Role:** Single source of truth for game data.
- **Content:**
  - Aircraft definitions (`src/aircrafts/`)
  - Faction templates (`src/factions/`)
  - Theatre/Map data (`src/theatres/`)
  - Scenario definitions (`src/scenarios/`)
- **Usage:** Used by `apps/campaign` for UI display and `apps/core` for logic.

#### 3. `@dcc/generate-miz` (`packages/generate-miz`)
Logic for creating DCS mission files.
- **Role:** Handles the assembly of `.miz` files (which are ZIP archives containing Lua scripts and resources).
- **Key Logic:**
  - Converts TypeScript objects to Lua tables.
  - Packages mission data into the correct ZIP structure.
- **Dependencies:** `@dcc/lua-table`.

#### 4. `@dcc/lua-table` (`packages/lua-table`)
Utility library for handling Lua data structures.
- **Role:** Parses and stringifies Lua tables.
- **Usage:** Essential for interacting with DCS mission files which rely heavily on Lua configuration.

## Development Workflow

### Build System
- **TurboRepo** manages the build pipeline.
- **Development (`pnpm dev`):**
  - Starts all applications in parallel.
  - `apps/core` runs the Electron main process.
  - `apps/campaign` is served at `http://localhost:5173`.
  - `apps/document` is served at `http://localhost:5174`.
  - These URLs are injected into Core via environment variables (`CAMPAIGN_URL`, `DOCUMENT_URL`).
- **Production (`pnpm build`):**
  1. `apps/campaign` and `apps/document` are built using Vite, outputting to their respective `dist/` folders.
  2. `apps/core` is built using Electron Vite.
  3. **Packaging:** `electron-builder` packages the Electron app and copies the `dist/` folders of the frontend apps into the application's resources directory (`renderer/campaign` and `renderer/document`).

### Data Flow
1. **Frontend (`campaign`):** User requests an action (e.g., "Start Campaign").
2. **RPC (`contracts`):** The request is typed via shared contracts.
3. **Backend (`core`):** Receives the request.
4. **Logic:**
   - Uses `@dcc/data` to retrieve necessary game assets.
   - Uses `@dcc/generate-miz` to compile the mission file.
   - Uses `@dcc/lua-table` to format data for DCS.
5. **Response:** Returns the result to the frontend.

