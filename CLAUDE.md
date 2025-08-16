# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application bootstrapped with `create-next-app`, using React 19, TypeScript, and Tailwind CSS. The project is set up as a starter template for building modern web applications.

## Development Commands

- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Architecture

This application follows the Next.js App Router architecture:

- `app/` - Contains all routes and layout components using the App Router
  - `layout.tsx` - Root layout with font configuration (Geist fonts)
  - `page.tsx` - Homepage component
  - `globals.css` - Global CSS styles
- `public/` - Static assets (SVG icons and images)

## Configuration

- **TypeScript**: Configured with strict mode and absolute imports using `@/*` path mapping
- **ESLint**: Uses Next.js core web vitals and TypeScript rules
- **Tailwind CSS**: Version 4 with PostCSS integration
- **Fonts**: Uses Next.js font optimization with Geist Sans and Geist Mono

## Development Notes

- The project uses Turbopack for faster development builds
- Hot reload is enabled - changes to `app/page.tsx` will be reflected immediately
- TypeScript is configured with strict mode for better type safety
- The app uses CSS variables for theming support (light/dark mode ready)