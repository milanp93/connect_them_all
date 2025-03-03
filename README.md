# Connect Them All

https://github.com/user-attachments/assets/b3b58b75-1dec-4650-abf3-a24d4a5b0c2c


**Connect Them All** is an interactive Next.js application designed for public sector connectivity planning. This project integrates diverse data sources and AI-driven recommendations to identify the best connectivity solutions for schools in underserved regions. By combining geographic data, elevation profiles, population density (extracted from a local GeoTIFF), and AI-generated recommendations via an external API, the application offers actionable insights on the optimal solution for each school.

## Project Overview

Modern connectivity planning faces several challenges:

- **Mapping the Gap:** Identifying which schools are unconnected or under-connected.
- **Cost Efficiency:** Determining the best solution (fiber, wireless, satellite) based on the distance from a school to the nearest tower, the tower's range, and local terrain conditions.
- **Impact Estimation:** Incorporating population density to estimate potential benefits (or cost per capita) for each connection.
- **AI-Driven Recommendations:** Leveraging an external AI API to analyze input data (distance, tower range, elevation profile, population density) and return recommendations along with estimated costs and alternatives.

The app reads merged CSV data containing fields such as:

- School and tower locations
- Distance from school to tower
- Elevation profile (sampled at 10 points along the line from school to tower)
- Population density (extracted from a local GeoTIFF)
- AI-generated recommendations and impact scores

It then displays this information on an interactive Google Map with:

- Markers for schools and towers
- Polylines connecting each school to its nearest tower (clickable to show distance)
- InfoWindows with detailed data when markers are clicked
- A sidebar listing the top 5 schools (by impact score) for quick navigation

## Features

- **CSV Data Integration:** Loads a CSV containing connectivity and demographic data.
- **Elevation & Population Density Extraction:**
  - Uses a local GeoTIFF and [geotiff.js](https://www.npmjs.com/package/geotiff) to extract population density.
  - Integrates elevation profile data (sampled along the school-to-tower line) to understand terrain challenges.
- **AI Recommendations:**
  - Sends key input data to an external AI API (aimlapi.com) to obtain recommendations for connectivity solutions along with cost estimates and alternatives.
- **Interactive Google Maps Display:**
  - Displays markers for schools and towers.
  - Draws polylines connecting schools to their nearest towers, with clickable elements that reveal distance information.
  - A sidebar lists the top 5 schools (by impact score) and allows panning to a selected school.
- **TypeScript & Next.js:** The project is built with TypeScript and leverages Next.js for both the API routes and the frontend.

## Project Structure

```
/connect-them-all
├── app
│   ├── api
│   │   ├── addElevationProfile
│   │   │   └── route.ts
│   │   ├── getRecommendations
│   │   │   └── route.ts
│   │   ├── getSchools
│   │   │   └── route.ts
│   │   ├── getTowers
│   │   │   └── route.ts
│   │   ├── getPopulationDensity
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── ConnectivityMap.tsx
├── data
│   ├── merged.csv
│   ├── output_with_recommendations.csv
│   └── pop_density.tif
├── public
│   ├── data
│   ├── school-icon.png
│   └── tower-icon.png
├── styles
│   └── globals.css
├── .env.local
├── package.json
├── README.md
└── tsconfig.json

```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- A valid Google Maps API key (set as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`)
- An API key for aimlapi.com (set as `AIMLAPI_KEY` in `.env.local`)

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/milanp93/connect_them_all.git
   cd connect_them_all
   ```

2. **Install Dependencies:**
   ```
   npm install
   # or
   yarn install
   ```
3. **Configure Environment Variables:**

   Create a .env.local file in the project root with the following content:

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   AIMLAPI_KEY=your_aimlapi_key_here
   ```

### Running the Development Server

    Start the development server with

    ```
    npm run dev
    # or
    yarn dev
    ```

Open http://localhost:3000 in your browser to see the application.

### Deployment

The project can be deployed to Vercel for a seamless [Next.js deployment experience](https://nextjs.org/docs/app/building-your-application/deploying). See Next.js deployment documentation for details.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Milan Popovic - [LinkedIn](https://www.linkedin.com/in/milan-popovic-42b73095) - milan.popovic.93@gmail.com

Project Link: [https://github.com/milanp93/connect_them_all](https://github.com/milanp93/connect_them_all)
