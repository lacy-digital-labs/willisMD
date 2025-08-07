# Data Schema for willisMD

This document describes the core data models and payload formats used in willisMD.

## Markdown Document
- **Fields:**
  - `id` (string): Unique identifier
  - `title` (string): Document title
  - `content` (string): Markdown content
  - `createdAt` (ISO string): Creation timestamp
  - `updatedAt` (ISO string): Last update timestamp

## User Preferences
- **Fields:**
  - `theme` (string): UI theme (e.g., light, dark)
  - `fontSize` (number): Editor font size
  - `exportFormats` (array): Enabled export formats

## Export Payload
- **Fields:**
  - `format` (string): Export format (pdf, html, md)
  - `data` (string): Content to export

> Update this schema as new features or data models are introduced.
