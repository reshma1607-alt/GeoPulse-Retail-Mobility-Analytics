# GeoPulse: Hyper-Local Retail Mobility Analytics

## Project Overview

GeoPulse is a data analytics and geospatial mobility project designed to understand how people move through retail areas and how customer footfall changes throughout the day.

The project uses synthetic anonymized mobile GPS data to analyze retail store traffic, visitor patterns, store catchment areas, and possible store cannibalization.

## Problem Statement

Retail businesses often depend on static information when deciding where to open new stores.

Static data may not accurately represent how people actually move through a city during different times of the day.

GeoPulse analyzes mobility data to provide dynamic insights into:

- Retail footfall
- Customer movement
- Store catchment areas
- Hourly visitor patterns
- Store-to-store visitor overlap
- Store cannibalization

## Project Objective

The main objective of GeoPulse is to build a geospatial analytics pipeline that processes mobile GPS movement data and converts it into actionable retail intelligence.

The final system will provide an interactive map-based dashboard for exploring retail mobility patterns.

## Project Architecture

Synthetic GPS Data Generator
        |
        v
Raw Mobility Data
        |
        v
Snowflake
        |
        v
PySpark + Apache Sedona
        |
        v
Spatial Processing
        |
        v
dbt
        |
        v
Analytics Tables
        |
        v
React + Kepler.gl
        |
        v
Interactive Dashboard

## Technology Stack

### Data Generation

- Python
- Pandas
- NumPy

### Data Storage

- Snowflake

### Data Engineering

- PySpark
- Apache Sedona

### Data Transformation

- dbt

### Visualization

- Kepler.gl

### Frontend

- React

## Key Analytics

### 1. Footfall Analysis

Measure the number of visitors around retail locations during different hours of the day.

### 2. Catchment Area Analysis

Analyze GPS devices within defined geographic areas around stores.

### 3. Visitor Overlap

Identify devices that visit multiple retail locations.

### 4. Store Cannibalization

Analyze whether a new store location could take traffic away from an existing store.

### 5. Mobility Analysis

Visualize how movement patterns change across locations and time.

## Dashboard

The final dashboard will provide:

- Interactive geographic visualization
- Store locations
- Footfall heatmaps
- Mobility patterns
- Hourly traffic analysis
- Store comparison
- Cannibalization metrics
- Time-based exploration

## Project Structure

GeoPulse-Retail-Mobility-Analytics/
|
|-- README.md
|-- requirements.txt
|-- .gitignore
|
|-- data/
|   |-- sample/
|       |-- stores.csv
|
|-- config/
|   |-- config.yaml
|
|-- src/
|   |-- data_generation/
|   |-- validation/
|   |-- spark/
|   |-- analytics/
|
|-- snowflake/
|-- dbt/
|-- dashboard/
|-- notebooks/
|
|-- docs/
    |-- data_dictionary.md

## Development Plan

### Phase 1 - Data Generation and Storage

- Generate synthetic anonymized mobile GPS data
- Create realistic city mobility patterns
- Store raw mobility data in Snowflake

### Phase 2 - Spatial Processing

- Process GPS data using PySpark
- Perform spatial operations using Apache Sedona
- Create store catchment areas
- Perform GPS-to-store spatial joins
- Create analytics models using dbt

### Phase 3 - Mobility Analytics

- Calculate hourly footfall
- Analyze unique visitors
- Analyze visitor overlap between stores
- Implement store cannibalization analysis
- Build the initial mobility map

### Phase 4 - Dashboard and Final Integration

- Integrate React with the analytics output
- Add Kepler.gl visualization
- Add H3-based geographic visualization
- Add time-based mobility analysis
- Integrate the complete GeoPulse pipeline

## Expected Outcome

GeoPulse will transform raw mobility data into actionable retail location intelligence.

The final system will help analyze:

- Where customers move
- When footfall occurs
- How visitor traffic changes throughout the day
- How stores share visitors
- Whether potential store locations may affect existing stores

## Initial Store Locations

The project will initially use five sample retail locations for testing the geospatial analytics pipeline.

| Store ID | Store Name |
|----------|------------|
| S001 | GeoPulse Store A |
| S002 | GeoPulse Store B |
| S003 | GeoPulse Store C |
| S004 | GeoPulse Store D |
| S005 | GeoPulse Store E |

## Core Business Questions

GeoPulse will answer questions such as:

1. Which retail locations receive the highest footfall?
2. What are the busiest hours for each store?
3. How does customer movement change throughout the day?
4. Which stores share the same visitors?
5. What percentage of visitors visit multiple stores?
6. Could a potential new store location cannibalize an existing store?
7. Which geographic areas show strong retail mobility?

## Planned Metrics

The dashboard will include:

- Total unique devices
- Total GPS observations
- Unique visitors per store
- Hourly footfall
- Peak traffic hour
- Store visitor overlap
- Visitor overlap percentage
- Catchment-area traffic
- Potential cannibalization percentage

## Data Strategy

The project will use synthetic anonymized mobility data for development and demonstration.

Each GPS observation will contain:

- DeviceID
- Latitude
- Longitude
- Timestamp

The data generator will create realistic movement patterns representing different periods of the day.

No real personal location data will be used in the project.

## 20-Day Development Timeline

| Day | Development Stage |
|-----|-------------------|
| Day 1 | Project setup and data design |
| Day 2 | GPS data generation |
| Day 3 | Mobility pattern generation |
| Day 4 | Dataset expansion |
| Day 5 | Data validation |
| Day 6 | Snowflake schema |
| Day 7 | Snowflake data loading |
| Day 8 | PySpark setup |
| Day 9 | Spatial processing |
| Day 10 | Catchment-area analysis |
| Day 11 | Spatial joins |
| Day 12 | dbt setup |
| Day 13 | Hourly footfall model |
| Day 14 | Unique visitor analysis |
| Day 15 | Cannibalization analysis |
| Day 16 | Kepler.gl visualization |
| Day 17 | React dashboard |
| Day 18 | H3 and time-based visualization |
| Day 19 | Complete pipeline integration |
| Day 20 | Final testing and documentation |

## Project Status

Day 1 - Project setup and documentation

Development in progress.

## Final Goal

The final GeoPulse system will provide an interactive geospatial analytics platform that transforms mobility data into retail location intelligence.

The system will combine data engineering, geospatial processing, analytics, and interactive visualization to support retail location decisions.

Project: GeoPulse - Hyper-Local Retail Mobility Analytics

Status: Development in Progress